import { camelCaseToKebabCase, isInternalJsStubProp } from "./utils.js";
//#region src/sub-routing.ts
/**
* Sub-agent routing primitives — external addressability for facets.
*
* The public surface:
*   - `routeSubAgentRequest(req, parent, options?)` — the sub-agent
*     analog of `routeAgentRequest`. Use in custom fetch handlers.
*   - `getSubAgentByName(parent, Cls, name)` — the sub-agent analog
*     of `getAgentByName`. Returns a typed RPC stub that proxies
*     method calls through the parent. No `.fetch()` support —
*     external HTTP/WS routing goes through `routeSubAgentRequest`.
*
* Internal:
*   - `parseSubAgentPath(url)` — URL → `{ childClass, childName, remainingPath }`.
*   - `forwardToFacet(req, parent, match)` — resolves `ctx.facets.get(...)`
*     on the parent and returns `facetStub.fetch(rewrittenReq)`.
*
* @experimental The API surface may change before stabilizing.
*/
/**
* URL segment marking a parent↔child boundary.
*
* Exposed as a constant so callers can build URLs symbolically, but
* not configurable — the routing layer matches on the literal `sub`
* token everywhere (parent fetch, client, helpers).
*/
const SUB_PREFIX = "sub";
function validateLeafPath(leafPath) {
	const normalized = leafPath.startsWith("/") ? leafPath : `/${leafPath}`;
	const parsed = new URL(normalized, "https://agents.invalid");
	if (normalized.includes("//") || normalized.length > 1 && normalized.endsWith("/") || parsed.pathname !== normalized || parsed.search || parsed.hash) throw new Error(`Cannot build an Agent path for leaf path ${JSON.stringify(leafPath)} because it is not a stable pathname.`);
	return normalized;
}
function validateRoutingPrefix(prefix) {
	const prefixParts = prefix.split("/");
	const rawPath = `/${prefix}/leaf`;
	const parsed = new URL(rawPath, "https://agents.invalid");
	if (prefixParts.some((part) => !part || part === "." || part === ".." || part === "sub") || parsed.pathname !== rawPath || parsed.search || parsed.hash) throw new Error(`Cannot build an Agent path for routing prefix ${JSON.stringify(prefix)} because it is not externally routable.`);
	return prefix;
}
function encodeAgentClassName(className) {
	const segment = camelCaseToKebabCase(className);
	if (segment === "sub") throw new Error(`Cannot build an Agent path for Agent class name ${JSON.stringify(className)} because ${JSON.stringify("sub")} is reserved.`);
	const rawPath = `/root/${segment}/leaf`;
	const parsed = new URL(rawPath, "https://agents.invalid");
	const parts = parsed.pathname.split("/");
	if (!segment || parsed.pathname !== rawPath || parsed.search || parsed.hash || parts.length !== 4 || parts[2] !== segment) throw new Error(`Cannot build an Agent path for Agent class name ${JSON.stringify(className)} because it is not externally routable.`);
	return segment;
}
function encodeChildAgentName(name) {
	if (!name || name === "." || name === ".." || name.includes("\0")) throw new Error(`Cannot build an Agent path for child Agent name ${JSON.stringify(name)} because it is not externally routable.`);
	try {
		return encodeURIComponent(name);
	} catch {
		throw new Error(`Cannot build an Agent path for child Agent name ${JSON.stringify(name)} because it is not valid Unicode.`);
	}
}
function validateRootAgentName(name) {
	if (name === "sub") throw new Error(`Cannot build an Agent path for root Agent name ${JSON.stringify(name)} because ${JSON.stringify("sub")} is reserved.`);
	const rawPath = `/root/${name}/leaf`;
	const parsed = new URL(rawPath, "https://agents.invalid");
	const parts = parsed.pathname.split("/");
	if (!name || parsed.pathname !== rawPath || parsed.search || parsed.hash || parts.length !== 4 || parts[2] !== name) throw new Error(`Cannot build an Agent path for root Agent name ${JSON.stringify(name)} because it is not externally routable.`);
	return name;
}
function serializeSubAgentPath(path, leafPath, validate) {
	if (path.length === 0) return leafPath ?? "";
	const subPath = path.flatMap((child) => [
		"sub",
		validate ? encodeAgentClassName(child.className) : camelCaseToKebabCase(child.className),
		validate ? encodeChildAgentName(child.name) : encodeURIComponent(child.name)
	]).join("/");
	if (!leafPath) return subPath;
	return `${subPath}${leafPath.startsWith("/") ? leafPath : `/${leafPath}`}`;
}
/** @internal Build the strictly validated path tail for sub-agent routing. */
function buildSubAgentPath(path, leafPath) {
	return serializeSubAgentPath(path, leafPath, true);
}
/** @internal Preserve React's tolerant path composition for disabled placeholders. */
function buildSubAgentPathUnchecked(path, leafPath) {
	return serializeSubAgentPath(path, leafPath, false);
}
/**
* Build the canonical pathname for a root Agent or nested sub-agent.
*
* The address is root-first and accepts `Agent#selfPath`. Pass
* `rootBinding` when the root Durable Object binding and class names differ.
*/
function buildAgentPath(path, options = {}) {
	const [root, ...children] = path;
	if (!root) throw new Error("Agent path must contain at least one step.");
	const rootPath = [
		validateRoutingPrefix(options.prefix ?? "agents"),
		encodeAgentClassName(options.rootBinding ?? root.className),
		validateRootAgentName(root.name)
	].join("/");
	const leafPath = options.leafPath ? validateLeafPath(options.leafPath) : void 0;
	if (children.length === 0) return `/${rootPath}${leafPath ?? ""}`;
	return `/${rootPath}/${buildSubAgentPath(children, leafPath)}`;
}
/** Build an absolute URL for a root Agent or nested sub-agent. */
function buildAgentUrl(origin, path, options = {}) {
	let base;
	try {
		base = new URL(origin.toString());
	} catch {
		throw new Error(`Invalid Agent URL origin ${JSON.stringify(origin)}.`);
	}
	if (![
		"http:",
		"https:",
		"ws:",
		"wss:"
	].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) throw new Error(`Invalid Agent URL origin ${JSON.stringify(origin.toString())}. Pass an HTTP(S) or WS(S) origin without credentials, a pathname, query, or fragment.`);
	return new URL(buildAgentPath(path, options), base);
}
/**
* Parse a URL and extract the first `/sub/{class}/{name}` segment,
* if any. Recursive nesting is handled naturally: callers parse one
* level at a time; the child then parses its own URL (which still
* contains any deeper `/sub/...` markers).
*
* Names are URL-decoded. Classes are kebab-to-CamelCase converted
* via a best-effort match against a provided lookup — pass
* `ctx.exports` keys to get exact CamelCase; pass `undefined` for
* a tolerant conversion without validation.
*
* Returns `null` when the URL doesn't contain the marker at a
* recognized position, or when the marker has no following
* class+name pair.
*/
function parseSubAgentPath(url, options) {
	const parts = new URL(url).pathname.split("/").filter(Boolean);
	for (let i = 0; i < parts.length; i++) {
		if (parts[i] !== "sub") continue;
		if (i + 2 >= parts.length) continue;
		const classSegment = parts[i + 1];
		const nameSegment = parts[i + 2];
		const childClass = resolveClassName(classSegment, options?.knownClasses);
		if (!childClass) continue;
		let childName;
		try {
			childName = decodeURIComponent(nameSegment);
		} catch {
			continue;
		}
		const remainingParts = parts.slice(i + 3);
		const remainingPath = remainingParts.length > 0 ? "/" + remainingParts.join("/") : "/";
		return {
			childClass,
			childName,
			remainingPath
		};
	}
	return null;
}
/**
* Best-effort kebab-to-CamelCase match. If `knownClasses` is
* provided, returns the matching CamelCase entry (or null if no
* match). If not, performs a naive kebab→CamelCase conversion.
*/
function resolveClassName(segment, knownClasses) {
	if (knownClasses) return knownClasses.find((name) => camelCaseToKebabCase(name) === segment) ?? null;
	return segment.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}
/**
* Route a request into a sub-agent via its parent DO.
*
* Use this in a custom fetch handler when your URL shape doesn't
* match the `/agents/{class}/{name}` default — you identify and
* fetch the parent yourself, then let this helper parse the
* `/sub/{child}/...` tail and forward it.
*
* Runs `onBeforeSubAgent` on the parent DO (authorization / request
* mutation / short-circuit response).
*
* For the default `/agents/...` URL shape, use `routeAgentRequest`
* instead — it handles the parent lookup and this dispatch in one
* call.
*
* @example
* ```ts
* export default {
*   async fetch(req, env) {
*     const { parentName, rest } = myCustomParse(req.url);
*     const parent = await getAgentByName(env.Inbox, parentName);
*     return routeSubAgentRequest(req, parent, { fromPath: rest });
*   }
* };
* ```
*
* @experimental The API surface may change before stabilizing.
*/
async function routeSubAgentRequest(req, parent, options) {
	if (!parseSubAgentPath(options?.fromPath ? `http://placeholder${options.fromPath.startsWith("/") ? "" : "/"}${options.fromPath}` : req.url)) return new Response("Sub-agent path not found in request URL", { status: 400 });
	const forwardUrl = options?.fromPath !== void 0 ? rewritePathname(req.url, options.fromPath) : req.url;
	const forwardInit = {
		method: req.method,
		headers: new Headers(req.headers)
	};
	if (req.body && req.method !== "GET" && req.method !== "HEAD") forwardInit.body = req.body;
	const forwardReq = new Request(forwardUrl, forwardInit);
	return parent.fetch(forwardReq);
}
/**
* Replace a URL's pathname (and optionally its search) while
* preserving every other component. Matches how `_cf_forwardToFacet`
* forwards requests — pathname is the only thing that changes by
* default; if the replacement path carries its own query string,
* that wins.
*/
function rewritePathname(url, fromPath) {
	const normalized = fromPath.startsWith("/") ? fromPath : `/${fromPath}`;
	const queryIdx = normalized.indexOf("?");
	const pathOnly = queryIdx >= 0 ? normalized.slice(0, queryIdx) : normalized;
	const querySuffix = queryIdx >= 0 ? normalized.slice(queryIdx) : "";
	const rewritten = new URL(url);
	rewritten.pathname = pathOnly;
	if (querySuffix) rewritten.search = querySuffix;
	return rewritten.toString();
}
/**
* Get a typed RPC stub for a sub-agent from outside the parent DO.
*
* The returned stub proxies method calls through the parent via a
* stateless per-call bridge (caller → parent → facet), so each
* method invocation costs one extra RPC hop. Works across parent
* hibernation — no cached references to go stale.
*
* Limitations:
*   - RPC methods only. `.fetch()` is not supported (will throw).
*     Use `routeSubAgentRequest` for external HTTP/WS.
*   - Arguments and return values must be structured-cloneable,
*     same as any DO RPC call.
*   - Does not run `onBeforeSubAgent` on the parent — analogous to
*     `getAgentByName` not running `onBeforeConnect`. The caller is
*     assumed to have performed whatever access checks are needed.
*
* @example
* ```ts
* const inbox = await getAgentByName(env.MyInbox, userId);
* const chat = await getSubAgentByName(inbox, MyChat, chatId);
* await chat.addMessage({ role: "user", content: "hi" });
* ```
*
* @experimental The API surface may change before stabilizing.
*/
async function getSubAgentByName(parent, cls, name) {
	if (name.includes("\0")) throw new Error(`Sub-agent name contains null character (\\0), which is reserved.`);
	const bridge = parent;
	const className = cls?.name;
	if (!className) throw new Error(`getSubAgentByName: could not determine class name from ${cls}. Ensure you are passing the class constructor (e.g. getSubAgentByName(parent, MyChat, name)), not a string or undefined.`);
	return new Proxy({}, { get(_target, prop) {
		if (isInternalJsStubProp(prop)) return void 0;
		if (typeof prop !== "string") return void 0;
		if (prop === "fetch") return () => {
			throw new Error("getSubAgentByName returns an RPC-only stub — .fetch() is not supported. Use routeSubAgentRequest() or the /agents/{parent}/{name}/sub/{child}/{name} URL for external HTTP/WS routing.");
		};
		return async (...args) => bridge._cf_invokeSubAgent(className, name, prop, args);
	} });
}
//#endregion
export { SUB_PREFIX, buildAgentPath, buildAgentUrl, buildSubAgentPath, buildSubAgentPathUnchecked, getSubAgentByName, parseSubAgentPath, routeSubAgentRequest };

//# sourceMappingURL=sub-routing.js.map