/**
 * The AI Gateway provider registry now lives in `@cloudflare/gateway-core`
 * (shared with the other Cloudflare AI Gateway packages). This module re-exports
 * it so the existing `workers-ai-provider/src/gateway-providers` import path
 * keeps working unchanged.
 */
export {
	type Billing,
	detectProviderByUrl,
	findProviderBySlug,
	GATEWAY_PROVIDERS,
	type GatewayProviderInfo,
	type WireFormat,
	wireableProviders,
} from "@cloudflare/gateway-core";
