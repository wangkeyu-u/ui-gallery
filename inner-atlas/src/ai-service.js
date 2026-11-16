import { requestDeadline } from "./request-deadline.js";

// Connection checks only read service metadata. They never send answers or access codes.
export class ServiceCheckError extends Error {}
export function analysisEndpoint(value, baseUrl) {
  let url;
  try {
    url = new URL(value || "/api/analyze", baseUrl);
  } catch {
    throw new ServiceCheckError("分析服务地址格式不正确。");
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !(
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    )
  )
    throw new ServiceCheckError(
      "分析服务需使用 HTTPS；本机开发可使用 localhost。请勿在地址中放密钥或口令。",
    );
  url.pathname = url.pathname.replace(/\/$/, "");
  if (!url.pathname.endsWith("/api/analyze"))
    throw new ServiceCheckError("请填写分析接口地址，以 /api/analyze 结尾。");
  return url.href;
}
export async function probeAnalysisService(
  value,
  { baseUrl, fetchImpl = fetch, signal, timeoutMs = 8000 } = {},
) {
  const endpoint = analysisEndpoint(value, baseUrl),
    statusUrl = new URL(endpoint);
  statusUrl.pathname = statusUrl.pathname.replace(/\/analyze$/, "/status");
  const deadline = requestDeadline(timeoutMs, signal);
  let status;
  try {
    let response;
    try {
      response = await fetchImpl(statusUrl.href, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: deadline.signal,
      });
    } catch {
      throw new ServiceCheckError(
        "暂时无法读取分析服务状态，请检查地址、网络与跨域配置后重试。",
      );
    }
    if (!response.ok)
      throw new ServiceCheckError(
        response.status === 404
          ? "此地址没有分析服务。GitHub Pages 需先填写独立后端的 /api/analyze 地址。"
          : "分析服务暂时不可用，请稍后重试。",
      );
    try {
      status = await response.json();
    } catch {
      throw new ServiceCheckError("此地址没有返回分析服务状态，请检查后端地址。");
    }
  } finally {
    deadline.clear();
  }
  if (
    status?.provider !== "DeepSeek" ||
    typeof status.configured !== "boolean" ||
    (status.configured &&
      !["deepseek-flash", "deepseek-v4-pro"].includes(status.model))
  )
    throw new ServiceCheckError(
      "返回的服务状态不兼容，请连接见己的 DeepSeek 后端。",
    );
  return {
    endpoint,
    state: status.configured ? "ready" : "unconfigured",
    model: status.configured ? status.model : null,
    reviewEnabled: status.reviewEnabled === true,
    accessRequired: status.accessRequired !== false,
    message: status.configured
      ? "分析服务已配置，可在确认发送范围后提交。"
      : "分析服务尚未完成配置，暂不能生成 AI 综合报告。本地计分结果仍可查看。",
  };
}
