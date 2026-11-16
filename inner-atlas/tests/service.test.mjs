import test from "node:test";
import assert from "node:assert/strict";
import { analysisEndpoint, probeAnalysisService } from "../src/ai-service.js";
import { configurationReport, serverConfiguration } from "../api/config.mjs";
const base = "https://frontend.example/app/";
test("the shared site uses its published AI backend and lets the user override it", () => {
  const pages = "https://wangkeyu-u.github.io/ui-gallery/inner-atlas/#/setup";
  assert.match(
    analysisEndpoint("", pages),
    /^https:\/\/[^/]+\.hostc\.app\/api\/analyze$/,
  );
  assert.equal(
    analysisEndpoint("https://backend.example/api/analyze", pages),
    "https://backend.example/api/analyze",
  );
  assert.equal(
    analysisEndpoint("", "https://wangkeyu-u.github.io/ui-gallery/"),
    "https://wangkeyu-u.github.io/api/analyze",
  );
});
test("service URLs retain a reverse-proxy prefix and reject credentials, query secrets and unsafe protocols", () => {
  assert.equal(
    analysisEndpoint("", base),
    "https://frontend.example/api/analyze",
  );
  assert.equal(
    analysisEndpoint("https://backend.example/prefix/api/analyze/", base),
    "https://backend.example/prefix/api/analyze",
  );
  for (const value of [
    "http://public.example/api/analyze",
    "https://secret@backend.example/api/analyze",
    "https://backend.example/api/analyze?key=hidden",
    "https://backend.example/api/analyze#hidden",
    "javascript:alert(1)",
    "https://backend.example/not-an-analysis-api",
  ])
    assert.throws(() => analysisEndpoint(value, base));
  assert.equal(
    analysisEndpoint("http://localhost:4173/api/analyze", base),
    "http://localhost:4173/api/analyze",
  );
});
test("metadata checks never upload answers or access codes and preserve the expected status path", async () => {
  let call;
  const status = await probeAnalysisService(
    "https://backend.example/prefix/api/analyze",
    {
      baseUrl: base,
      fetchImpl: async (url, init) => {
        call = { url, init };
        return new Response(
          JSON.stringify({
            provider: "DeepSeek",
            configured: true,
            model: "deepseek-flash",
            reviewEnabled: true,
          }),
        );
      },
    },
  );
  assert.equal(call.url, "https://backend.example/prefix/api/status");
  assert.equal(call.init.method, "GET");
  assert.ok(!call.init.body);
  assert.ok(!call.init.headers);
  assert.equal(call.init.credentials, "omit");
  assert.equal(status.state, "ready");
  assert.equal(status.reviewEnabled, true);
});
test("unconfigured, missing, invalid and unreachable services produce truthful connection states", async () => {
  const unconfigured = await probeAnalysisService("", {
    baseUrl: base,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          provider: "DeepSeek",
          configured: false,
          model: "deepseek-flash",
          reviewEnabled: true,
        }),
      ),
  });
  assert.equal(unconfigured.state, "unconfigured");
  for (const response of [
    new Response("not found", { status: 404 }),
    new Response("<html>not JSON</html>"),
    new Response(JSON.stringify({ provider: "Other", configured: true })),
    new Response(
      JSON.stringify({
        provider: "DeepSeek",
        configured: true,
        model: "unexpected-model",
      }),
    ),
  ])
    await assert.rejects(
      probeAnalysisService("", {
        baseUrl: base,
        fetchImpl: async () => response,
      }),
    );
  await assert.rejects(
    probeAnalysisService("", {
      baseUrl: base,
      fetchImpl: async () => {
        throw Error("private diagnostic details");
      },
    }),
    (e) => !e.message.includes("private diagnostic"),
  );
});
test("deployment diagnostics identify blockers without serializing provider keys or access codes", () => {
  const secret = "sensitive-private-test-key",
    code = "sensitive-access-code-1234567890";
  const env = {
    DEEPSEEK_API_KEY: secret,
    ANALYSIS_ACCESS_TOKEN: code,
    ALLOWED_ORIGINS: "https://frontend.example",
    DEEPSEEK_REVIEW: "true",
    AI_REQUESTS_PER_HOUR: "6",
  };
  const good = configurationReport(env);
  assert.equal(good.ready, true);
  assert.equal(good.configured, true);
  assert.equal(serverConfiguration(env).configured, true);
  assert.ok(!JSON.stringify(good).includes(secret));
  assert.ok(!JSON.stringify(good).includes(code));
  const empty = configurationReport({});
  assert.equal(empty.ready, false);
  assert.equal(empty.configured, false);
  assert.deepEqual(
    empty.checks.filter((c) => !c.ok).map((c) => c.id),
    ["deepseek_key", "access_code"],
  );
  const malformed = configurationReport({
    ...env,
    ALLOWED_ORIGINS: "https://frontend.example/repo/",
    AI_REQUESTS_PER_HOUR: "0",
    DEEPSEEK_REVIEW: "unexpected",
  });
  assert.equal(malformed.ready, false);
  assert.deepEqual(
    malformed.checks.filter((c) => !c.ok).map((c) => c.id),
    ["review", "origins", "hourly_limit"],
  );
  assert.equal(
    configurationReport({ ...env, DEEPSEEK_API_KEY: "  " }).configured,
    false,
  );
});
