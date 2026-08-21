//#region src/observability/ai/options.d.ts
/** Opt-in span payload storage. Both flags default to `false`. */
type AISDKStorageOptions = {
  readonly storeMessages?: boolean;
  readonly storeTools?: boolean;
};
/** Instrumentation options for the AI SDK v6 and v7 wrapper. */
type AISDKInstrumentationOptions = AISDKStorageOptions & {
  /**
   * Context keys to emit as `cloudflare.agents.runtime_context.{key}`, set
   * once for the wrapper rather than per call.
   *
   * Distinct from the AI SDK's own per-call `telemetry.includeRuntimeContext`,
   * which shares the name but selects keys that map onto the canonical
   * `cloudflare.agents.turn.*` / `cloudflare.agents.metadata.*` attributes.
   */
  readonly includeRuntimeContext?: readonly string[];
};
//#endregion
//#region src/observability/ai/index.d.ts
/**
 * Wraps an AI SDK namespace with tracing.
 */
declare function wrapAISDK<T extends Record<string, unknown>>(
  ai: T,
  options?: AISDKInstrumentationOptions
): T;
//#endregion
export {
  type AISDKInstrumentationOptions,
  type AISDKStorageOptions,
  wrapAISDK
};
//# sourceMappingURL=index.d.ts.map
