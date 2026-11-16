import { httpServerHandler } from "cloudflare:node";
import { env } from "cloudflare:workers";
import { createApp } from "./api/http.mjs";

const api = httpServerHandler(
  createApp({ env: { ...env, COLLECT_SUBMISSIONS: "false" } }),
);

export default {
  fetch(request, bindings, context) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return bindings.ASSETS.fetch(request);

    // Same-origin browser POSTs send Origin even though CORS is not needed.
    // The Node adapter sees a synthetic HTTP socket in the Worker.
    if (request.headers.get("Origin") === url.origin) {
      request = new Request(request);
      request.headers.delete("Origin");
    }
    return api.fetch(request, bindings, context);
  },
};
