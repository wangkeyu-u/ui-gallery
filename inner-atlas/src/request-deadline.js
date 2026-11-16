// AbortController is available in older Safari versions that lack the static helpers.
// Keep the deadline active until callers have read the response body.
export function requestDeadline(ms, parent) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (parent?.aborted) cancel();
  else parent?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(
    () => controller.abort(new DOMException("请求超时", "TimeoutError")),
    ms,
  );
  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", cancel);
    },
  };
}
