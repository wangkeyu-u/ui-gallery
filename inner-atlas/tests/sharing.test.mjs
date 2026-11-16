import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../api/http.mjs";
import { fixtureSession, fixtureCompletion } from "./fixtures/ai.mjs";
import { makeAnalysisRequest } from "../src/ai-input.js";
const input = () => makeAnalysisRequest(fixtureSession(), {}, false);
const env = {
  DEEPSEEK_API_KEY: "private-test-key",
  ANALYSIS_ACCESS_TOKEN: "private-test-access-1234567890",
  PUBLIC_ANALYSIS: "true",
};
async function serve(fetchImpl, fn) {
  const app = createApp({ env, fetchImpl });
  app.listen(0, "127.0.0.1");
  await once(app, "listening");
  try {
    await fn(`http://127.0.0.1:${app.address().port}`);
  } finally {
    app.closeAllConnections();
    await new Promise((r) => app.close(r));
  }
}
test("friend mode needs no access setup and starts a valid JSON response before a delayed two-pass provider finishes", async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  let calls = 0;
  await serve(
    async (url, init) => {
      if (++calls === 1) await gate;
      return new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify(fixtureCompletion(init)) },
            },
          ],
        }),
      );
    },
    async (base) => {
      const metadata = await (await fetch(base + "/api/status")).json();
      assert.equal(metadata.accessRequired, false);
      const response = await fetch(base + "/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Analysis-Keepalive": "1",
        },
        body: JSON.stringify(input()),
      });
      const reader = response.body.getReader();
      const first = await reader.read();
      assert.equal(new TextDecoder().decode(first.value), "\n");
      release();
      let text = "";
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        text += new TextDecoder().decode(part.value);
      }
      const report = JSON.parse(text);
      assert.equal(report.report.sections.length, 12);
      assert.equal(calls, 2);
      assert.ok(!text.includes(env.DEEPSEEK_API_KEY));
    },
  );
});
test("keepalive errors remain explicit JSON errors and never become a fabricated report", async () => {
  await serve(
    async () => new Response("private upstream error", { status: 401 }),
    async (base) => {
      const r = await fetch(base + "/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Analysis-Keepalive": "1",
        },
        body: JSON.stringify(input()),
      });
      const data = await r.json();
      assert.equal(data.code, "PROVIDER_CONFIGURATION");
      assert.ok(!data.report);
      assert.ok(!JSON.stringify(data).includes("private upstream"));
    },
  );
});
test("public friend mode still checks coverage and origins before beginning the response", async () => {
  let called = false;
  await serve(
    async () => {
      called = true;
      throw Error();
    },
    async (base) => {
      const bad = input();
      bad.session.answers = {};
      const r = await fetch(base + "/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Analysis-Keepalive": "1",
        },
        body: JSON.stringify(bad),
      });
      assert.equal(r.status, 422);
      assert.equal(called, false);
      assert.equal(
        (
          await fetch(base + "/api/status", {
            headers: { Origin: "https://other.example" },
          })
        ).status,
        403,
      );
    },
  );
});
