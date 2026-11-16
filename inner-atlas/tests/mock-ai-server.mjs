// Test-only provider double. No real DeepSeek request is made.
import { createApp } from "../api/http.mjs";
import { fixtureCompletion } from "./fixtures/ai.mjs";
const env = {
  DEEPSEEK_API_KEY: "test-only-not-a-real-provider-key",
  ANALYSIS_ACCESS_TOKEN: "ui-test-access-code-1234567890",
  AI_REQUESTS_PER_HOUR: "30",
};
createApp({
  env,
  fetchImpl: async (url, init) => {
    await new Promise((r) => setTimeout(r, 100));
    return new Response(
      JSON.stringify({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify(fixtureCompletion(init)),
              reasoning_content: "do not expose internal reasoning",
            },
          },
        ],
      }),
    );
  },
}).listen(4175, "127.0.0.1", () =>
  console.log("Mock provider UI test server: http://127.0.0.1:4175"),
);
