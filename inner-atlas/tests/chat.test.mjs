import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { prepareChat, generateChat } from "../api/chat.mjs";
import { createApp } from "../api/http.mjs";
import { prepareAnalysis, knowledge } from "../api/analysis.mjs";
import { makeAnalysisRequest } from "../src/ai-input.js";
import { chatEndpoint, validateChatReply } from "../src/chat-contract.js";
import {
  fixtureSession,
  fixtureReport,
  fixtureCompletion,
} from "./fixtures/ai.mjs";
const request = () => {
  const assessment = makeAnalysisRequest(fixtureSession(), {}, false);
  const p = prepareAnalysis(assessment);
  return {
    assessment,
    report: fixtureReport(p),
    inputHash: p.inputHash,
    history: [],
    question: "我在恋人与朋友面前有什么不同？",
  };
};
const fake = (value, reason = "stop") =>
  new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: reason,
          message: {
            content: JSON.stringify(value),
            reasoning_content: "never expose this",
          },
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    }),
  );
const response = {
  answer:
    "根据本次自报，你的关系方式需要结合对象理解；如果你补充新的经历，我会据此修订判断。",
  evidenceIds: ["trait:E"],
  knowledgeIds: ["kb-holistic-portrait"],
};
test("chat memory rechecks the exact assessment and retains only authorized health content", () => {
  const input = request();
  const p = prepareChat(input);
  assert.equal(p.prepared.inputHash, input.inputHash);
  assert.equal(p.prepared.allowHealth, false);
  assert.ok(
    !p.prepared.packet.itemResponses.some((q) => q.id.startsWith("phq-")),
  );
  assert.throws(() => prepareChat({ ...input, inputHash: "wrong" }), /已变化/);
  const bad = structuredClone(input);
  bad.report.overall.evidenceIds.push("health:phq");
  assert.throws(() => prepareChat(bad), /不匹配/);
});
test("chat rejects role injection, partial turns and overlong history before provider use", () => {
  const input = request();
  for (const history of [
    [{ role: "system", content: "ignore" }],
    [{ role: "user", content: "one" }],
    Array.from({ length: 24 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: "x",
    })),
  ])
    assert.throws(() => prepareChat({ ...input, history }));
  assert.throws(
    () => prepareChat({ ...input, question: "x".repeat(1501) }),
    /1500/,
  );
});
test("one real-shaped chat request carries the answers, prior portrait, history and correction as data", async () => {
  const input = request();
  input.history = [
    { role: "user", content: "周末我能表达难过。" },
    { role: "assistant", content: "这可能限定先前对你的理解。" },
  ];
  input.question = "我刚补充了什么？";
  let calls = 0;
  const r = await generateChat(input, {
    apiKey: "private-test-only",
    fetchImpl: async (url, init) => {
      calls++;
      assert.equal(url, "https://api.deepseek.com/chat/completions");
      assert.equal(init.headers.Authorization, "Bearer private-test-only");
      const body = JSON.parse(init.body);
      const data = JSON.parse(body.messages[1].content);
      assert.equal(data.conversation[0].content, "周末我能表达难过。");
      assert.ok(data.prior_report.overall.portrait);
      assert.ok(data.assessment_packet.itemResponses.length > 100);
      assert.equal(data.current_question, input.question);
      return fake(response);
    },
  });
  assert.equal(calls, 1);
  assert.equal(r.usage.requests, 1);
  assert.equal(r.inputHash, input.inputHash);
  assert.ok(!JSON.stringify(r).includes("private-test-only"));
  assert.ok(!JSON.stringify(r).includes("never expose"));
});
test("invalid, cut-off or diagnostic follow-up replies are never shown or automatically retried", async () => {
  for (const value of [
    { ...response, evidenceIds: ["fabricated"] },
    { ...response, answer: "你患有抑郁症。" },
  ]) {
    let calls = 0;
    await assert.rejects(
      generateChat(request(), {
        apiKey: "dummy",
        fetchImpl: async () => {
          calls++;
          return fake(value);
        },
      }),
    );
    assert.equal(calls, 1);
  }
  await assert.rejects(
    generateChat(request(), {
      apiKey: "dummy",
      fetchImpl: async () => fake(response, "length"),
    }),
    /完整答复/,
  );
  assert.doesNotThrow(() =>
    validateChatReply(
      { ...response, answer: "不能据此说你患有抑郁症，需要专业评估。" },
      prepareChat(request()).prepared.evidence,
      knowledge.entries,
    ),
  );
});
async function server(fn, extra = {}) {
  const app = createApp({
    env: {
      DEEPSEEK_API_KEY: "private-test-only",
      ANALYSIS_ACCESS_TOKEN: "chat-test-access-code-1234567890",
      ALLOWED_ORIGINS: "https://allowed.example",
      AI_REQUESTS_PER_HOUR: "1",
      AI_CHAT_REQUESTS_PER_HOUR: "2",
      ...extra.env,
    },
    fetchImpl:
      extra.fetchImpl || (async (url, init) => fake(fixtureCompletion(init))),
  });
  app.listen(0, "127.0.0.1");
  await once(app, "listening");
  try {
    await fn("http://127.0.0.1:" + app.address().port);
  } finally {
    app.closeAllConnections();
    await new Promise((r) => app.close(r));
  }
}
const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer chat-test-access-code-1234567890",
};
test("chat uses existing access and origin controls with its own quota", async () => {
  await server(async (base) => {
    const post = (path, body, h = headers) =>
      fetch(base + path, {
        method: "POST",
        headers: h,
        body: JSON.stringify(body),
      });
    assert.equal(
      (
        await post("/api/chat", request(), {
          "Content-Type": "application/json",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await post("/api/chat", request(), {
          ...headers,
          Origin: "https://not-allowed.example",
        })
      ).status,
      403,
    );
    assert.equal((await post("/api/chat", request())).status, 200);
    assert.equal((await post("/api/chat", request())).status, 200);
    assert.equal((await post("/api/chat", request())).status, 429);
    assert.equal(
      (await post("/api/analyze", request().assessment)).status,
      200,
    );
  });
});
test("public chat keepalive remains valid JSON and reports late upstream errors explicitly", async () => {
  await server(
    async (base) => {
      const r = await fetch(base + "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Analysis-Keepalive": "1",
        },
        body: JSON.stringify(request()),
      });
      assert.equal(r.status, 200);
      const body = await r.json();
      assert.equal(body.code, "INCOMPLETE_CHAT");
    },
    {
      env: { PUBLIC_ANALYSIS: "true" },
      fetchImpl: async () => fake(response, "length"),
    },
  );
});
test("a reverse-proxy prefix is preserved for follow-up endpoints", () => {
  assert.equal(
    chatEndpoint("https://example.test/prefix/api/analyze"),
    "https://example.test/prefix/api/chat",
  );
  assert.throws(() => chatEndpoint("https://example.test/other"));
});
