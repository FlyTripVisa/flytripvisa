/**
 * The resumable run-path stream engine now lives in `@cloudflare/gateway-core`
 * (shared with the other Cloudflare AI Gateway packages). This module re-exports
 * it so the existing `workers-ai-provider/src/resumable-stream` import path keeps
 * working unchanged.
 */
export {
	createResumableStream,
	type ResumableStreamOptions,
	type ResumeExpiredPolicy,
} from "@cloudflare/gateway-core";
