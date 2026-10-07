export interface Env {
  ASSETS: Fetcher;
  MUSE_API_URL?: string;
  MUSE_API_KEY?: string;
  MUSE_MODEL?: string;
  MUSE_API_STYLE?: string;
  ALLOWED_ORIGIN?: string;
  MCP_ENABLED?: string;
  MCP_SERVER_URL?: string;
  MCP_AUTH_TOKEN?: string;
}

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | unknown[];
};

function corsHeaders(request: Request, env: Env): Headers {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "*";
  const allowOrigin = allowed === "*" || allowed === origin ? origin || "*" : allowed;

  return new Headers({
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  });
}

function json(data: unknown, status = 200, request?: Request, env?: Env) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  if (request && env) {
    for (const [k, v] of corsHeaders(request, env)) headers.set(k, v);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function isConfigured(env: Env) {
  return Boolean(env.MUSE_API_URL && env.MUSE_API_KEY);
}

function buildMuseRequest(messages: ChatMessage[], env: Env) {
  const style = (env.MUSE_API_STYLE || "openai").toLowerCase();

  if (style === "openai") {
    return {
      model: env.MUSE_MODEL || "default",
      messages,
      stream: true
    };
  }

  // Generic chat shape for simple Muse-compatible APIs.
  return {
    model: env.MUSE_MODEL || "default",
    messages,
    stream: true
  };
}

function extractText(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj.text === "string") return obj.text;
  if (typeof obj.content === "string") return obj.content;
  if (typeof obj.delta === "string") return obj.delta;
  if (typeof obj.output_text === "string") return obj.output_text;
  if (typeof obj.message?.content === "string") return obj.message.content;
  if (typeof obj.choices?.[0]?.delta?.content === "string") return obj.choices[0].delta.content;
  if (typeof obj.choices?.[0]?.message?.content === "string") return obj.choices[0].message.content;
  if (typeof obj.choices?.[0]?.text === "string") return obj.choices[0].text;
  return "";
}

function sseHeaders(request: Request, env: Env) {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  headers.set("X-Accel-Buffering", "no");
  return headers;
}

async function proxyMuse(request: Request, env: Env): Promise<Response> {
  if (!isConfigured(env)) {
    return json(
      { error: "Muse is not configured. Set MUSE_API_URL and MUSE_API_KEY." },
      503,
      request,
      env
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, request, env);
  }

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return json({ error: "messages must be a non-empty array." }, 400, request, env);
  }

  const messages = body.messages.map((m: any) => ({
    role: ["system", "user", "assistant", "tool"].includes(m?.role) ? m.role : "user",
    content: typeof m?.content === "string" ? m.content : JSON.stringify(m?.content ?? "")
  })) as ChatMessage[];

  const upstream = await fetch(env.MUSE_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream, application/json, text/plain",
      "Authorization": `Bearer ${env.MUSE_API_KEY}`
    },
    body: JSON.stringify(buildMuseRequest(messages, env))
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return json(
      {
        error: "Muse API returned an error.",
        status: upstream.status,
        detail: detail.slice(0, 4000)
      },
      502,
      request,
      env
    );
  }

  const contentType = upstream.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream")) {
    const headers = sseHeaders(request, env);
    return new Response(upstream.body, { status: 200, headers });
  }

  // Convert JSON/plain Muse responses into a normalized SSE stream.
  const raw = await upstream.text();
  let text = raw;

  try {
    const parsed = JSON.parse(raw);
    text = extractText(parsed) || raw;
  } catch {
    // Keep plain text.
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    }
  });

  return new Response(stream, { status: 200, headers: sseHeaders(request, env) });
}

async function proxyMcp(request: Request, env: Env): Promise<Response> {
  if (env.MCP_ENABLED !== "true" || !env.MCP_SERVER_URL) {
    return json(
      { error: "MCP proxy is disabled or MCP_SERVER_URL is missing." },
      404,
      request,
      env
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(env.MCP_SERVER_URL);
  target.pathname = new URL(incoming.pathname.replace(/^\/api\/mcp/, ""), target).pathname;
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.delete("Host");
  if (env.MCP_AUTH_TOKEN) {
    headers.set("Authorization", `Bearer ${env.MCP_AUTH_TOKEN}`);
  }

  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body
  });

  const responseHeaders = new Headers(upstream.headers);
  for (const [k, v] of corsHeaders(request, env)) responseHeaders.set(k, v);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "FlyTripVisa MCP Chat UI",
        museConfigured: isConfigured(env),
        mcpEnabled: env.MCP_ENABLED === "true",
        time: new Date().toISOString()
      }, 200, request, env);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return proxyMuse(request, env);
    }

    if (url.pathname.startsWith("/api/mcp")) {
      return proxyMcp(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
