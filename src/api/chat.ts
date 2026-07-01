/**
 * AI Chat API Routes
 * Integrates with Cloudflare AI Gateway for LLM-powered responses
 */

import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

interface Env {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  CF_AIG_TOKEN: string;
  CF_ACCOUNT_ID: string;
  AI_GATEWAY_URL: string;
  AI_GATEWAY_ID: string;
  AI_MODEL: string;
  [key: string]: any;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default async function chatRoutes(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  logger.info(`Chat Route: ${method} ${pathname}`);

  // POST /api/chat/message
  if (pathname === '/api/chat/message' && method === 'POST') {
    return handleChatMessage(request, env);
  }

  // POST /api/chat/stream
  if (pathname === '/api/chat/stream' && method === 'POST') {
    return handleChatStream(request, env);
  }

  // GET /api/chat/history
  if (pathname === '/api/chat/history' && method === 'GET') {
    return handleChatHistory(request, env);
  }

  return errorResponse('Chat route not found', 404);
}

/**
 * Handle Chat Message (Single Request/Response)
 */
async function handleChatMessage(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { message, sessionId, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required and must be a string', 400);
    }

    logger.info('Chat message received:', { sessionId, conversationId });

    // Get conversation history from KV
    const conversationKey = `chat:${conversationId || 'default'}`;
    const conversationData = await env.SESSION_KV.get(conversationKey);
    const messages: ChatMessage[] = conversationData
      ? JSON.parse(conversationData)
      : [];

    // Add user message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call Cloudflare AI Gateway
    const aiResponse = await callAIGateway(env, messages);

    // Add assistant response
    messages.push({
      role: 'assistant',
      content: aiResponse,
    });

    // Store updated conversation in KV
    await env.SESSION_KV.put(conversationKey, JSON.stringify(messages), {
      expirationTtl: 86400 * 7, // 7 days
    });

    // Optionally store in D1 for persistence
    // TODO: Save to D1 database

    return successResponse(
      {
        message: aiResponse,
        conversationId: conversationId || 'default',
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    logger.error('Chat message error:', error);
    return errorResponse('Failed to process chat message', 500);
  }
}

/**
 * Handle Chat Stream (Server-Sent Events)
 */
async function handleChatStream(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required', 400);
    }

    logger.info('Chat stream requested:', { conversationId });

    // TODO: Implement streaming response using Server-Sent Events
    // This requires returning a ReadableStream with proper formatting

    return successResponse(
      {
        message: 'Stream endpoint - implementation pending',
      },
      200
    );
  } catch (error) {
    logger.error('Chat stream error:', error);
    return errorResponse('Failed to start chat stream', 500);
  }
}

/**
 * Handle Chat History
 */
async function handleChatHistory(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const conversationId =
      url.searchParams.get('conversationId') || 'default';

    logger.info('Fetching chat history:', { conversationId });

    // Get conversation from KV
    const conversationKey = `chat:${conversationId}`;
    const conversationData = await env.SESSION_KV.get(conversationKey);
    const messages: ChatMessage[] = conversationData
      ? JSON.parse(conversationData)
      : [];

    return successResponse(
      {
        conversationId,
        messages,
        messageCount: messages.length,
      },
      200
    );
  } catch (error) {
    logger.error('Chat history error:', error);
    return errorResponse('Failed to fetch chat history', 500);
  }
}

/**
 * Call Cloudflare AI Gateway with Messages
 */
async function callAIGateway(
  env: Env,
  messages: ChatMessage[]
): Promise<string> {
  try {
    logger.info('Calling AI Gateway:', { messageCount: messages.length });

    const response = await fetch(`${env.AI_GATEWAY_URL}/${env.AI_GATEWAY_ID}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CF_AIG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('AI Gateway error:', { status: response.status, error: errorData });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const aiMessage =
      data.choices?.[0]?.message?.content ||
      'I apologize, but I could not generate a response.';

    logger.info('AI response received:', { messageLength: aiMessage.length });
    return aiMessage;
  } catch (error) {
    logger.error('AI Gateway call failed:', error);
    throw error;
  }
}

/**
 * System Prompt for Visa Assistant
 */
const VISA_ASSISTANT_PROMPT = `You are a helpful Visa Assistant for FlyTripVisa. You help users with:
- Visa application process
- Visa requirements for different countries
- Visa status checking
- Document preparation
- General travel advice

Be professional, friendly, and concise. Always direct users to the official visa application portal for official processes.`;
