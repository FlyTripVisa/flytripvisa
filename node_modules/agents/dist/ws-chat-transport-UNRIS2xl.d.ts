import { ChatTransport, UIMessage, UIMessageChunk } from "ai";

//#region src/chat/ws-chat-transport.d.ts
/**
 * Agent-like interface for sending/receiving WebSocket messages.
 * Matches `AgentClient` from `agents/client` and the connection returned by
 * `useAgent` from `agents/react`.
 */
interface AgentConnection {
  send: (data: string) => void;
  addEventListener: (
    type: string,
    listener: (event: MessageEvent) => void,
    options?: {
      signal?: AbortSignal;
    }
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: MessageEvent) => void
  ) => void;
}
type WebSocketChatTransportOptions<ChatMessage extends UIMessage = UIMessage> =
  {
    /** The framework-neutral AgentClient or useAgent connection. */ agent: AgentConnection;
    /**
     * Callback to add custom fields to the request body before sending.
     */
    prepareBody?: (options: {
      messages: ChatMessage[];
      trigger: "submit-message" | "regenerate-message";
      messageId?: string;
    }) => Promise<Record<string, unknown>> | Record<string, unknown>;
    /**
     * Optional set to track active request IDs.
     * IDs are added when a request starts and removed when it completes.
     * Used by the onAgentMessage handler to skip messages already handled by the transport.
     */
    activeRequestIds?: Set<string>;
    /**
     * Whether generic client-side abort/cancel lifecycle should cancel the
     * server turn. Explicit cancellation via cancelActiveServerTurn() always
     * sends CF_AGENT_CHAT_REQUEST_CANCEL.
     * @default false
     */
    cancelOnClientAbort?: boolean;
  };
/**
 * ChatTransport that sends messages over WebSocket and returns a
 * ReadableStream<UIMessageChunk> that the AI SDK's useChat consumes directly.
 *
 * This low-level transport handles new and regenerated request streams plus
 * cancellation. Higher-level protocol coordination such as automatic reconnect
 * resume, cross-tab transcript synchronization, and client-tool continuations
 * is provided by integrations such as `useAgentChat`.
 */
declare class WebSocketChatTransport<
  ChatMessage extends UIMessage = UIMessage
> implements ChatTransport<ChatMessage> {
  agent: AgentConnection;
  private prepareBody?;
  private activeRequestIds?;
  private cancelOnClientAbort;
  private _resumeResolver;
  private _resumeNoneResolver;
  private _onStreamPending;
  private _retryResumeProbe;
  private _expectToolContinuation;
  private _abortToolContinuation;
  private _activeServerTurnId;
  private _cancelAttachedStream;
  private _detachResumeStream;
  constructor(options: WebSocketChatTransportOptions<ChatMessage>);
  /**
   * Point the singleton transport at a new Agent connection. A pending resolver
   * belongs to the old Chat/socket generation and must settle before messages
   * from the replacement connection can be consumed (#1914 review).
   */
  setAgent(agent: AgentConnection): void;
  setCancelOnClientAbort(cancelOnClientAbort: boolean): void;
  /**
   * Explicitly cancel the active server turn, if any.
   * This is separate from generic client-side abort/cancel lifecycle so
   * clients can detach locally without stopping server work.
   */
  cancelActiveServerTurn(): boolean;
  private sendCancelFrame;
  private setActiveServerTurn;
  private clearActiveServerTurn;
  /**
   * Mark that the next reconnectToStream() call should attach to a
   * server-initiated tool continuation rather than a page-load resume.
   */
  expectToolContinuation(): void;
  /**
   * Abort the active client-side tool continuation stream, if one is attached
   * to a server request id.
   */
  abortActiveToolContinuation(): boolean;
  /**
   * True when the transport is waiting for a resume handshake.
   */
  isAwaitingResume(): boolean;
  /**
   * Settle and detach the current handshake without interpreting it as a
   * server-idle response. Used when the owning hook/agent generation changes.
   */
  cancelPendingResume(): boolean;
  /**
   * Invalidate all client-side resume state for an obsolete hook/agent
   * generation without cancelling its durable server turn.
   */
  resetResumeState(): void;
  /**
   * Re-send the active handshake request on the latest socket generation. This
   * preserves one AI SDK resume operation while recovering a request/reply lost
   * with the previous WebSocket.
   */
  retryPendingResume(): boolean;
  /**
   * Called by onAgentMessage when it receives CF_AGENT_STREAM_RESUMING.
   * If reconnectToStream is waiting, this handles the resume handshake
   * (ACK + stream creation) and returns true. Otherwise returns false
   * so the caller can use its own fallback path.
   */
  handleStreamResuming(data: { id: string }): boolean;
  /**
   * Called by onAgentMessage when it receives CF_AGENT_STREAM_RESUME_NONE.
   * If reconnectToStream is waiting, resolves the promise with null
   * immediately (no 5-second timeout). Returns true if handled.
   */
  handleStreamResumeNone(data?: { probeId?: string }): boolean;
  /**
   * Called by onAgentMessage when it receives CF_AGENT_STREAM_PENDING (#1784):
   * the server accepted a turn but its stream has not started yet. If a resume
   * path is awaiting, extend its probe timeout (so it keeps waiting for the
   * eventual STREAM_RESUMING / STREAM_RESUME_NONE instead of resolving null
   * after the short window). Returns true if a waiting path consumed it.
   */
  handleStreamPending(): boolean;
  /**
   * Called by the hook's shared message handler when a server turn finishes
   * outside the currently attached transport stream, such as after local-only
   * client cleanup.
   */
  handleServerTurnCompleted(requestId: string): void;
  /**
   * Register a server turn that is being rendered outside a transport-owned
   * stream, such as the hook's fallback cross-tab/resume observer path.
   */
  observeServerTurn(requestId: string): void;
  sendMessages(options: {
    chatId: string;
    messages: ChatMessage[];
    abortSignal: AbortSignal | undefined;
    trigger: "submit-message" | "regenerate-message";
    messageId?: string;
    body?: object;
    headers?: Record<string, string> | Headers;
    metadata?: unknown;
  }): Promise<ReadableStream<UIMessageChunk>>;
  reconnectToStream(_options: {
    chatId: string;
  }): Promise<ReadableStream<UIMessageChunk> | null>;
  /**
   * Creates a deferred ReadableStream for client-side tool continuations.
   * The stream is returned immediately so AI SDK status becomes "submitted"
   * right after addToolOutput()/addToolApprovalResponse(), then it waits for
   * the server to announce the continuation via STREAM_RESUMING.
   */
  private _createToolContinuationStream;
  /**
   * Creates a ReadableStream that receives resumed stream chunks
   * and forwards them to useChat as UIMessageChunk objects.
   */
  private _createResumeStream;
}
//#endregion
export {
  WebSocketChatTransport as n,
  WebSocketChatTransportOptions as r,
  AgentConnection as t
};
//# sourceMappingURL=ws-chat-transport-UNRIS2xl.d.ts.map
