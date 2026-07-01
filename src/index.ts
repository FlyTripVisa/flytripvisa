/**
 * FlyTripVisa - Core Router Gateway
 * Cloudflare Workers Entry Point with AI Gateway Integration
 * Handles routing, middleware, authentication, and error handling
 */

import authRoutes from './api/auth';
import visaRoutes from './api/visa';
import chatRoutes from './api/chat';
import { errorResponse, successResponse } from './utils/response';
import { logger } from './utils/logger';

/**
 * Environment & Binding Types
 */
interface Env {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  CF_AIG_TOKEN: string;
  CF_ACCOUNT_ID: string;
  AI_GATEWAY_URL: string;
  AI_GATEWAY_ID: string;
  AI_MODEL: string;
  SITE_NAME: string;
  CONTACT_PHONE: string;
  SITE_URL: string;
  ENVIRONMENT: string;
}

/**
 * CORS Headers Configuration
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

/**
 * Authentication Middleware - Validates Bearer Token & JWT
 */
async function authenticateRequest(
  request: Request,
  env: Env
): Promise<{ authenticated: boolean; user: any; error?: string }> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return { authenticated: false, user: null };
  }

  try {
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token || token.length < 10) {
      return { authenticated: false, user: null, error: 'Invalid token format' };
    }

    // TODO: Implement JWT verification
    // For now, validate token exists in KV store
    const sessionKey = `auth:${token}`;
    const session = await env.SESSION_KV.get(sessionKey);

    if (!session) {
      return { authenticated: false, user: null, error: 'Token not found' };
    }

    return { authenticated: true, user: JSON.parse(session) };
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return { authenticated: false, user: null, error: 'Authentication failed' };
  }
}

/**
 * CORS Handler - Preflight Requests
 */
function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }
  return null;
}

/**
 * Route Matcher - Maps URL patterns to handlers
 */
async function routeRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  logger.info(`Incoming request: ${method} ${pathname}`);

  // Auth Routes: /api/auth/*
  if (pathname.startsWith('/api/auth')) {
    return authRoutes(request, env, ctx);
  }

  // Visa Routes: /api/visa/*
  if (pathname.startsWith('/api/visa')) {
    return visaRoutes(request, env, ctx);
  }

  // Chat Routes: /api/chat/*
  if (pathname.startsWith('/api/chat')) {
    return chatRoutes(request, env, ctx);
  }

  // Health Check Endpoint
  if (pathname === '/health' && method === 'GET') {
    return successResponse(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT,
        site: env.SITE_NAME,
      },
      200
    );
  }

  // Version Endpoint
  if (pathname === '/api/version' && method === 'GET') {
    return successResponse(
      {
        version: '1.0.0',
        name: env.SITE_NAME,
        url: env.SITE_URL,
        timestamp: new Date().toISOString(),
      },
      200
    );
  }

  // 404 - Not Found
  logger.warn(`Route not found: ${pathname}`);
  return errorResponse(`Route not found: ${pathname}`, 404);
}

/**
 * Error Handler - Centralized error management
 */
function handleError(error: any, env: Env): Response {
  logger.error('Router Error:', error);

  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal Server Error';

  return errorResponse(
    {
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT,
    },
    statusCode
  );
}

/**
 * Main Cloudflare Worker Exports
 */
export default {
  /**
   * HTTP Request Handler - Main entry point
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      // Handle CORS preflight
      const corsResponse = handleCORS(request);
      if (corsResponse) return corsResponse;

      // Route the request
      let response = await routeRequest(request, env, ctx);

      // Ensure CORS headers are included
      const newHeaders = new Headers(response.headers);
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        if (!newHeaders.has(key)) {
          newHeaders.set(key, value);
        }
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      return handleError(error, env);
    }
  },

  /**
   * Scheduled Handler - For cron jobs and background tasks
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    try {
      logger.info('Scheduled event triggered:', { cron: event.cron });

      // TODO: Implement scheduled tasks
      // - Clean up expired sessions
      // - Send visa expiry reminders
      // - Generate daily reports
      // - Database maintenance

      ctx.waitUntil(
        (async () => {
          logger.info('Scheduled task completed');
        })()
      );
    } catch (error) {
      logger.error('Scheduled task error:', error);
    }
  },
} as ExportedHandler<Env>;

/**
 * Export Auth Middleware for use in API handlers
 */
export { authenticateRequest };
