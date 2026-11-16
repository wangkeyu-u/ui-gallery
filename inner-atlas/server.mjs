import { loadEnvFile } from "node:process";
import { resolve } from "node:path";
import { createApp } from "./api/http.mjs";
try {
  loadEnvFile(".env");
} catch (error) {
  if (error.code !== "ENOENT")
    throw new Error("Cannot load .env configuration");
}
const port = Number(process.env.PORT || 4173);
createApp({ root: resolve(process.env.SERVE_DIR || ".") }).listen(
  port,
  process.env.HOST || "0.0.0.0",
  () =>
    console.log(
      "见己: http://localhost:" +
        port +
        " · DeepSeek credentials remain on the server",
    ),
);
