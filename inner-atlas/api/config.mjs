export const DEEPSEEK_MODELS = ["deepseek-flash", "deepseek-v4-pro"];
export function serverConfiguration(env = {}) {
  const apiKey = env.DEEPSEEK_API_KEY || "",
    access = env.ANALYSIS_ACCESS_TOKEN || "",
    model = env.DEEPSEEK_MODEL || "deepseek-flash",
    review = !["0", "false"].includes(
      (env.DEEPSEEK_REVIEW || "true").toLowerCase(),
    );
  return {
    apiKey,
    access,
    model,
    review,
    configured:
      apiKey.trim().length > 0 &&
      access.trim().length >= 24 &&
      DEEPSEEK_MODELS.includes(model),
  };
}
// A separate whitelist makes diagnostics safe to serialize; never serialize the server configuration.
export function configurationReport(env = {}) {
  const config = serverConfiguration(env),
    checks = [
      {
        id: "deepseek_key",
        ok: config.apiKey.trim().length > 0,
        message: "后端 DeepSeek API 密钥",
      },
      {
        id: "access_code",
        ok: config.access.trim().length >= 24,
        message: "至少24字符的独立站点访问口令",
      },
      {
        id: "model",
        ok: DEEPSEEK_MODELS.includes(config.model),
        message: "受支持的 DeepSeek 模型",
      },
    ];
  const reviewSetting = (env.DEEPSEEK_REVIEW || "true").toLowerCase();
  checks.push({
    id: "review",
    ok: ["true", "false", "0", "1"].includes(reviewSetting),
    message: "复核模式 true／false／1／0",
  });
  const origins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const validOrigins = origins.every((value) => {
    try {
      const u = new URL(value);
      return (
        u.origin === value &&
        !u.username &&
        !u.password &&
        (u.protocol === "https:" ||
          (u.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)))
      );
    } catch {
      return false;
    }
  });
  checks.push({
    id: "origins",
    ok: validOrigins,
    message: "跨域来源应只填写 origin，不含路径、账号或参数",
  });
  const hourly = Number(env.AI_REQUESTS_PER_HOUR || 6);
  checks.push({
    id: "hourly_limit",
    ok: Number.isInteger(hourly) && hourly >= 1 && hourly <= 100,
    message: "每小时分析尝试额度为1–100的整数",
  });
  const chatHourly = Number(env.AI_CHAT_REQUESTS_PER_HOUR || 24);
  checks.push({
    id: "chat_hourly_limit",
    ok: Number.isInteger(chatHourly) && chatHourly >= 1 && chatHourly <= 100,
    message: "每小时追问尝试额度为1–100的整数",
  });
  return {
    configured: config.configured,
    ready: checks.every((c) => c.ok),
    provider: "DeepSeek",
    model: DEEPSEEK_MODELS.includes(config.model) ? config.model : null,
    reviewEnabled: config.review,
    checks,
    notes: [
      ...(origins.length
        ? []
        : [
            "未设置跨域来源：只适合同源或本机访问；GitHub Pages 前端需设置 ALLOWED_ORIGINS。",
          ]),
      "检查仅确认配置格式，不验证供应商密钥、余额或真实模型质量。",
    ],
  };
}
