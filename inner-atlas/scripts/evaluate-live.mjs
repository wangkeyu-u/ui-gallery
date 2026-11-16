// Explicitly invokes the real paid provider, sequentially, with synthetic cases only.
// Never run as part of npm test or CI. Never records request headers or reasoning_content.
import { loadEnvFile } from "node:process";
import { once } from "node:events";
import { request } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../api/http.mjs";
import { serverConfiguration } from "../api/config.mjs";
import { prepareAnalysis } from "../api/analysis.mjs";
import { qualitativeCases } from "../tests/fixtures/qualitative.mjs";

try {
  loadEnvFile(".env");
} catch (e) {
  if (e.code !== "ENOENT")
    throw new Error("Private configuration cannot be loaded");
}
const config = serverConfiguration(process.env);
if (!config.configured)
  throw new Error(
    "Configure backend credentials locally before a live evaluation; no values are printed.",
  );
const out = resolve(
  process.env.LIVE_EVAL_DIR || `${tmpdir()}/inner-atlas-live-${Date.now()}`,
);
await mkdir(out, { recursive: true, mode: 0o700 });
const save = (name, value) =>
  writeFile(resolve(out, name), JSON.stringify(value, null, 2) + "\n", {
    mode: 0o600,
  });
let current,
  started,
  stages = [];
const fetchImpl = async (url, init) => {
  const stage = JSON.parse(init.body).messages[0].content.includes("第二轮编辑")
    ? "review"
    : "synthesis";
  console.log(JSON.stringify({ case: current.id, stage, event: "started" }));
  const t = Date.now();
  const response = await fetch(url, init);
  const raw = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const stageInfo = {
    stage,
    http: response.status,
    elapsedSeconds: Math.round((Date.now() - t) / 100) / 10,
    finishReason: parsed.choices?.[0]?.finish_reason,
    usage: parsed.usage,
  };
  stages.push(stageInfo);
  if (response.ok) {
    // Only the user-facing JSON text, not hidden reasoning or provider headers.
    await save(`${current.id}-${stage}.json`, {
      ...stageInfo,
      content: parsed.choices?.[0]?.message?.content,
    });
  }
  console.log(
    JSON.stringify({ case: current.id, ...stageInfo, usage: undefined }),
  );
  return new Response(raw, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};
const app = createApp({ env: process.env, fetchImpl });
app.listen(0, "127.0.0.1");
await once(app, "listening");
const results = [];
const cases = qualitativeCases().filter(
  (c) =>
    !process.env.LIVE_EVAL_CASE ||
    process.env.LIVE_EVAL_CASE.split(",").includes(c.id),
);
if (!cases.length) throw new Error("Unknown synthetic case");
try {
  for (current of cases) {
    stages = [];
    started = Date.now();
    await save(`${current.id}-input.json`, current);
    const prepared = prepareAnalysis(current.request);
    await save(`${current.id}-evidence.json`, {
      evidence: prepared.evidence,
      frame: prepared.packet.assessment_frame,
    });
    const body = JSON.stringify(current.request);
    const response = await new Promise((resolve, reject) => {
      const req = request(
        {
          hostname: "127.0.0.1",
          port: app.address().port,
          path: "/api/analyze",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            Authorization: "Bearer " + config.access,
            Origin: "https://wangkeyu-u.github.io",
          },
        },
        (res) => {
          let text = "";
          res.setEncoding("utf8");
          res.on("data", (part) => (text += part));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, value: JSON.parse(text) });
            } catch {
              reject(new Error("Invalid local response"));
            }
          });
        },
      );
      req.on("error", () =>
        reject(new Error("Local evaluation request failed")),
      );
      req.end(body);
    });
    const result = {
      id: current.id,
      label: current.label,
      http: response.status,
      elapsedSeconds: Math.round((Date.now() - started) / 100) / 10,
      stages,
      review: response.value.review,
      usage: response.value.usage,
      sections: response.value.report?.sections.map(({ id, status }) => ({
        id,
        status,
      })),
      error: response.status === 200 ? undefined : response.value,
    };
    await save(`${current.id}-result.json`, response.value);
    results.push(result);
    await save("summary.json", {
      model: config.model,
      realProvider: true,
      clinicalValidation: false,
      generatedAt: new Date().toISOString(),
      results,
    });
    console.log(
      JSON.stringify({
        case: current.id,
        status: response.status,
        seconds: result.elapsedSeconds,
        review: result.review,
        error: result.error,
      }),
    );
  }
} finally {
  app.closeAllConnections();
  app.close();
}
console.log(
  JSON.stringify({
    outputDirectory: out,
    cases: results.length,
    completed: results.filter((r) => r.http === 200).length,
    clinicalValidation: false,
  }),
);
process.exitCode = results.some((r) => r.http !== 200) ? 1 : 0;
