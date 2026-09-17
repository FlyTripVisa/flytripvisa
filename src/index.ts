import { handleChat } from "./ai/provider";
import { dispatchTool, getResource } from "./mcp/server";
import { getAccessIdentityFromJwt, getAccessIdentityNative } from "./access";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ─── CORS ───
    const corsHeaders = {
      "access-control-allow-origin": env.APP_URL || "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type, authorization, cf-access-jwt-assertion, x-bridge-api-key",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ─── Cloudflare Access 身份解析（非强制，公开端点也解析） ───
    let userEmail: string | null = null;
    let userIdp: string | null = null;

    // 方式 B: ctx.access 原生绑定
    if (ctx.access) {
      const identity = await ctx.access.getIdentity().catch(() => null);
      if (identity?.email) {
        userEmail = identity.email;
        userIdp = identity.idp || null;
      }
    }

    // 方式 A fallback: jose JWT 验证
    if (!userEmail) {
      const jwtIdentity = await getAccessIdentityFromJwt(request, env);
      if (jwtIdentity?.email) {
        userEmail = jwtIdentity.email;
        userIdp = jwtIdentity.idp || null;
      }
    }

    // ─── GET /getwae — 状态端点（公开，无 Access 要求） ───
    if (path === "/getwae" && request.method === "GET") {
      return Response.json({
        app: "FlyTripVisa",
        environment: env.ENVIRONMENT || "unknown",
        provider: env.AI_PROVIDER || "cloudflare",
        ai_gateway: env.AI_GATEWAY_NAME ? "configured" : "disabled",
        cloudflare_api: env.CLOUDFLARE_API_TOKEN ? "configured" : "missing",
        ai_binding: !!env.AI,
        d1: !!env.DB ? "configured" : "disabled",
        kv: !!env.KV ? "configured" : "disabled",
        r2: !!env.MEDIA ? "configured" : "disabled",
        android_bridge: env.ANDROID_BRIDGE_URL ? "configured" : "disabled",
        mcp_tools: ["visa-application", "cloudflare_management"],
        authenticated: !!userEmail,
        user: userEmail || null,
      }, { headers: corsHeaders });
    }

    // ─── POST /api/chat — AI Chat（生产环境需 Access） ───
    if (path === "/api/chat" && request.method === "POST") {
      if (!userEmail && env.ENVIRONMENT === "production") {
        return new Response("Unauthorized: Cloudflare Access required", { status: 401, headers: corsHeaders });
      }
      const res = await handleChat(request, env);
      if (userEmail) res.headers.set("x-authenticated-as", userEmail);
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // ─── POST /mcp — MCP Tool Bridge（生产环境需 Access） ───
    if (path === "/mcp" && request.method === "POST") {
      if (!userEmail && env.ENVIRONMENT === "production") {
        return new Response("Unauthorized: Cloudflare Access required", { status: 401, headers: corsHeaders });
      }
      let body: any;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
      }
      if (body.tool) {
        const res = await dispatchTool(env, body.tool, body.args || {});
        if (userEmail) res.headers.set("x-authenticated-as", userEmail);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      if (body.resource) {
        const res = await getResource(env, body.resource);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      return Response.json({ error: "Invalid MCP request. Provide {tool, args} or {resource}" }, { status: 400, headers: corsHeaders });
    }

    // ─── GET /mcp/app — MCP App UI ───
    if (path === "/mcp/app" && request.method === "GET") {
      if (env.ASSETS) {
        const assetReq = new Request(`${url.origin}/mcp-app.html`);
        const assetRes = await env.ASSETS.fetch(assetReq);
        if (assetRes.ok) return assetRes;
      }
      return Response.redirect(`${url.origin}/mcp/dist/mcp-app.html`, 302);
    }

    // ─── GET /health ───
    if (path === "/health" && request.method === "GET") {
      return Response.json({
        status: "ok",
        app: "FlyTripVisa",
        timestamp: new Date().toISOString(),
        authenticated: !!userEmail,
      }, { headers: corsHeaders });
    }

    // ─── 404 ───
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
} satisfies ExportedHandler<Env>;
