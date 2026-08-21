//#region src/chat/wire-types.ts
/**
* Enum for message types to improve type safety and maintainability
*/
let MessageType = /* @__PURE__ */ function(MessageType) {
	MessageType["CF_AGENT_CHAT_MESSAGES"] = "cf_agent_chat_messages";
	MessageType["CF_AGENT_USE_CHAT_REQUEST"] = "cf_agent_use_chat_request";
	MessageType["CF_AGENT_USE_CHAT_RESPONSE"] = "cf_agent_use_chat_response";
	MessageType["CF_AGENT_CHAT_CLEAR"] = "cf_agent_chat_clear";
	MessageType["CF_AGENT_CHAT_REQUEST_CANCEL"] = "cf_agent_chat_request_cancel";
	/** Sent by server when client connects and there's an active stream to resume */
	MessageType["CF_AGENT_STREAM_RESUMING"] = "cf_agent_stream_resuming";
	/** Sent by client to acknowledge stream resuming notification and request chunks */
	MessageType["CF_AGENT_STREAM_RESUME_ACK"] = "cf_agent_stream_resume_ack";
	/** Sent by client after message handler is ready, requesting stream resume check */
	MessageType["CF_AGENT_STREAM_RESUME_REQUEST"] = "cf_agent_stream_resume_request";
	/** Sent by server when client requests resume but no active stream exists */
	MessageType["CF_AGENT_STREAM_RESUME_NONE"] = "cf_agent_stream_resume_none";
	/**
	* Sent by server when a turn is accepted but its resumable stream has not
	* started yet (queued / debouncing / waiting on MCP / async setup). Tells a
	* reconnecting client to keep waiting rather than resolve its resume probe to
	* "no stream". Resolved by a later `CF_AGENT_STREAM_RESUMING` (stream started)
	* or `CF_AGENT_STREAM_RESUME_NONE` (settled without streaming). See #1784.
	*/
	MessageType["CF_AGENT_STREAM_PENDING"] = "cf_agent_stream_pending";
	/** Client sends tool result to server (for client-side tools) */
	MessageType["CF_AGENT_TOOL_RESULT"] = "cf_agent_tool_result";
	/** Server notifies client that a message was updated (e.g., tool result applied) */
	MessageType["CF_AGENT_MESSAGE_UPDATED"] = "cf_agent_message_updated";
	/** Client sends tool approval response to server (for tools with needsApproval) */
	MessageType["CF_AGENT_TOOL_APPROVAL"] = "cf_agent_tool_approval";
	/**
	* Server→client progress hint: a durable chat turn is being recovered
	* (interrupted by a deploy/eviction or a stream-stall watchdog abort and now
	* resuming). Sent when a recovery continuation is scheduled and cleared on
	* every terminal outcome. (`@cloudflare/think` also replays it on connect;
	* `@cloudflare/ai-chat` broadcasts the live signal only — see #1645.)
	* Backward-compatible — clients that don't understand it ignore it. See #1620.
	*/
	MessageType["CF_AGENT_CHAT_RECOVERING"] = "cf_agent_chat_recovering";
	return MessageType;
}({});
//#endregion
export { MessageType as t };

//# sourceMappingURL=wire-types-CnMt6_HR.js.map