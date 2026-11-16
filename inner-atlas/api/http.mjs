import {
  createSubmissionStore,
  answerCSV,
  authenticateArchiveReport,
} from "./submissions.mjs";
import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import { generateChat, prepareChat } from "./chat.mjs";
import { generateAnalysis } from "./deepseek.mjs";
import {
  serverConfiguration,
  collectionConfiguration,
  DEEPSEEK_MODELS,
} from "./config.mjs";
import { AnalysisError } from "../src/ai-contract.js";
import { prepareAnalysis } from "./analysis.mjs";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};
const hash = (value) => createHash("sha256").update(value).digest();
function readJSON(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    let size = 0,
      oversized = false;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > maxBytes) {
        oversized = true;
        chunks.length = 0;
      } else if (!oversized) chunks.push(c);
    });
    req.on("end", () => {
      if (oversized)
        return reject(new AnalysisError("TOO_LARGE", "分析资料过大。", 413));
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new AnalysisError("INVALID_JSON", "请求不是有效 JSON。"));
      }
    });
    req.on("error", () =>
      reject(new AnalysisError("INVALID_REQUEST", "请求读取失败。")),
    );
  });
}
export function createApp({
  root = resolve("."),
  env = process.env,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  const allowed = new Set(
    (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const { access, apiKey, model, review, configured } =
    serverConfiguration(env);
  const publicAnalysis = env.PUBLIC_ANALYSIS === "true";
  const { enabled: collectionEnabled, ownerToken } =
    collectionConfiguration(env);
  const submissions = createSubmissionStore(
    env.SUBMISSIONS_DIR || resolve("private-data"),
    { reportKey: ownerToken },
  );
  const maxHourly = Math.max(
    1,
    Math.min(100, Number(env.AI_REQUESTS_PER_HOUR) || 6),
  );
  const maxChatHourly = Math.max(
    1,
    Math.min(100, Number(env.AI_CHAT_REQUESTS_PER_HOUR) || 24),
  );
  let usedChat = 0;
  let windowStart = now(),
    used = 0,
    inflight = 0;
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    let path;
    try {
      path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    const json = (status, body) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(body));
    };
    if (path.startsWith("/api/")) {
      const origin = req.headers.origin,
        ownOrigin =
          (req.socket.encrypted ? "https" : "http") + "://" + req.headers.host;
      if (origin && origin !== ownOrigin && !allowed.has(origin))
        return json(403, {
          code: "ORIGIN_NOT_ALLOWED",
          message: "此网页来源尚未获后端允许。",
        });
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      if (req.method === "OPTIONS") {
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, DELETE, OPTIONS",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Analysis-Keepalive",
        );
        res.writeHead(204);
        res.end();
        return;
      }
      if (path === "/api/submissions/status" && req.method === "GET")
        return json(200, { enabled: collectionEnabled });
      if (
        path.startsWith("/api/submissions") ||
        path.startsWith("/api/owner/")
      ) {
        if (!collectionEnabled)
          return json(503, {
            code: "COLLECTION_DISABLED",
            message: "本站未开启集中保存。",
          });
        const isOwner = path.startsWith("/api/owner/");
        if (
          isOwner &&
          !timingSafeEqual(
            hash(req.headers.authorization || ""),
            hash("Bearer " + ownerToken),
          )
        )
          return json(401, {
            code: "OWNER_REQUIRED",
            message: "需要创建者查看密钥。",
          });
        try {
          if (
            req.method === "POST" &&
            !/^application\/json(?:;|$)/i.test(
              req.headers["content-type"] || "",
            )
          )
            return json(415, {
              code: "JSON_REQUIRED",
              message: "仅接受JSON请求。",
            });
          if (path === "/api/submissions" && req.method === "POST")
            return json(
              200,
              await submissions.save(await readJSON(req, 393216)),
            );
          if (path === "/api/submissions/revoke" && req.method === "POST") {
            const body = await readJSON(req);
            if (
              typeof body.editToken !== "string" ||
              body.editToken.length !== 64
            )
              throw new AnalysisError(
                "INVALID_RECEIPT",
                "撤回凭据不完整。",
                422,
              );
            await submissions.remove(body.id, body.editToken);
            return json(200, { removed: true });
          }
          if (isOwner && req.method === "GET") {
            if (path === "/api/owner/submissions")
              return json(200, { records: await submissions.list() });
            if (path === "/api/owner/export")
              return json(200, {
                schemaVersion: "1.0",
                exportedAt: new Date().toISOString(),
                records: await submissions.all(),
              });
            const match =
              /^\/api\/owner\/submissions\/([^/]+)(?:\/(answers.csv))?$/.exec(
                path,
              );
            if (match) {
              const record = await submissions.get(match[1]);
              if (match[2]) {
                res.writeHead(200, {
                  "Content-Type": "text/csv; charset=utf-8",
                  "Cache-Control": "no-store",
                  "Content-Disposition": "attachment; filename=answers.csv",
                });
                res.end(answerCSV(record));
                return;
              }
              return json(200, record);
            }
          }
          if (isOwner && req.method === "DELETE") {
            const match = /^\/api\/owner\/submissions\/([^/]+)$/.exec(path);
            if (match) {
              await submissions.remove(match[1]);
              return json(200, { removed: true });
            }
          }
          return json(404, { code: "NOT_FOUND", message: "接口不存在。" });
        } catch (error) {
          return json(error instanceof AnalysisError ? error.status : 500, {
            code: error instanceof AnalysisError ? error.code : "SAVE_FAILED",
            message:
              error instanceof AnalysisError
                ? error.message
                : "保存暂未成功，请重试或下载本机备份。",
          });
        }
      }
      if (path === "/api/status" && req.method === "GET")
        return json(200, {
          configured,
          provider: "DeepSeek",
          reviewEnabled: review,
          model: DEEPSEEK_MODELS.includes(model) ? model : null,
          accessRequired: !publicAnalysis,
        });
      const isChat = path === "/api/chat";
      if (
        !["/api/analyze", "/api/chat"].includes(path) ||
        req.method !== "POST"
      )
        return json(404, { code: "NOT_FOUND", message: "接口不存在。" });
      if (!configured)
        return json(503, {
          code: "AI_NOT_CONFIGURED",
          message: "DeepSeek 后端尚未配置完成，普通结果仍可使用。",
        });
      const auth = req.headers.authorization || "";
      if (
        !publicAnalysis &&
        !timingSafeEqual(hash(auth), hash("Bearer " + access))
      )
        return json(401, {
          code: "ACCESS_REQUIRED",
          message: "分析口令不正确，或此站点尚未提供访问权限。",
        });
      if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || ""))
        return json(415, {
          code: "JSON_REQUIRED",
          message: "仅接受 JSON 请求。",
        });
      if (now() - windowStart >= 3600000) {
        windowStart = now();
        used = 0;
        usedChat = 0;
      }
      if (
        inflight >= 1 ||
        (isChat ? usedChat >= maxChatHourly : used >= maxHourly)
      ) {
        res.setHeader(
          "Retry-After",
          inflight
            ? "30"
            : String(
                Math.max(1, Math.ceil((windowStart + 3600000 - now()) / 1000)),
              ),
        );
        return json(429, {
          code: "RATE_LIMIT",
          message: inflight
            ? "已有分析正在生成，请稍后再试。"
            : isChat
              ? "此站点本小时追问额度已用完，请稍后再试。"
              : "此站点本小时分析额度已用完，请稍后再试。",
        });
      }
      inflight++;
      const controller = new AbortController();
      let heartbeat;
      res.on("close", () => {
        if (!res.writableEnded) controller.abort();
      });
      try {
        const input = await readJSON(req, isChat ? 393216 : 65536);
        if (req.headers["x-analysis-keepalive"] === "1") {
          if (isChat) prepareChat(input);
          else prepareAnalysis(input);
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store, no-transform",
            "X-Accel-Buffering": "no",
          });
          // Leading JSON whitespace keeps free proxies from idling out during two model passes.
          res.write("\n");
          heartbeat = setInterval(() => {
            if (!res.destroyed) res.write("\n");
          }, 10000);
          heartbeat.unref();
        }
        if (isChat) usedChat++;
        else used++;
        const output = await (isChat ? generateChat : generateAnalysis)(input, {
          apiKey,
          model,
          review,
          fetchImpl,
          signal: controller.signal,
        });
        const result =
          !isChat && collectionEnabled
            ? authenticateArchiveReport(output, ownerToken)
            : output;
        if (!res.destroyed) {
          if (res.headersSent) res.end(JSON.stringify(result));
          else json(200, result);
        }
      } catch (error) {
        if (!res.destroyed) {
          const body = {
            code:
              error instanceof AnalysisError ? error.code : "ANALYSIS_FAILED",
            message:
              error instanceof AnalysisError
                ? error.message
                : "分析暂时失败，未生成有效报告。",
          };
          if (res.headersSent) res.end(JSON.stringify(body));
          else json(error instanceof AnalysisError ? error.status : 500, body);
        }
      } finally {
        clearInterval(heartbeat);
        inflight--;
      }
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    // Explicit static allowlist: source prompts, API code and .env never leave this server.
    if (
      !(
        path === "/" ||
        path === "/index.html" ||
        path === "/favicon.svg" ||
        /^\/src\/[a-zA-Z0-9_-]+\.(?:js|css)$/.test(path) ||
        /^\/docs\/[a-zA-Z0-9_-]+\.md$/.test(path)
      )
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    try {
      const actualRoot = await realpath(root),
        file = await realpath(
          resolve(root, path === "/" ? "index.html" : "." + path),
        );
      if (!file.startsWith(actualRoot + sep)) throw Error();
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
}
