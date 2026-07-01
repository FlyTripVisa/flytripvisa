/**
 * AI Chat API Handler
 * Integrates with Cloudflare AI Gateway for LLM-powered responses
 */

import { successResponse, errorResponse } from '../index.js';

export default async function chatRoutes(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

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
 * Handle Chat Message
 * Sends message to Cloudflare AI Gateway and returns response
 */
async function handleChatMessage(request, env) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required and must be a string', 400);
    }

    // Get conversation history from KV
    const conversationKey = `chat:${conversationId || 'default'}`;
    const conversationData = await env.SESSION_KV.get(conversationKey);
    const messages = conversationData ? JSON.parse(conversationData) : [];

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

    // Store updated conversation in KV (7 days expiry)
    await env.SESSION_KV.put(conversationKey, JSON.stringify(messages), {
      expirationTtl: 86400 * 7,
    });

    return successResponse(
      {
        message: aiResponse,
        conversationId: conversationId || 'default',
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    console.error('Chat message error:', error);
    return errorResponse('Failed to process chat message', 500);
  }
}

/**
 * Handle Chat Stream
 * Returns Server-Sent Events stream for real-time response
 */
async function handleChatStream(request, env) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required', 400);
    }

    // TODO: Implement streaming response with Server-Sent Events
    // 1. Get conversation history from KV
    // 2. Add user message to history
    // 3. Call AI Gateway with streaming enabled
    // 4. Return ReadableStream with SSE format
    // 5. Store conversation when complete

    return successResponse(
      {
        message: 'Stream endpoint - implementation pending',
      },
      200
    );
  } catch (error) {
    console.error('Chat stream error:', error);
    return errorResponse('Failed to start chat stream', 500);
  }
}

/**
 * Handle Chat History
 * Returns conversation history from KV
 */
async function handleChatHistory(request, env) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId') || 'default';

    // Get conversation from KV
    const conversationKey = `chat:${conversationId}`;
    const conversationData = await env.SESSION_KV.get(conversationKey);
    const messages = conversationData ? JSON.parse(conversationData) : [];

    return successResponse(
      {
        conversationId,
        messages,
        messageCount: messages.length,
      },
      200
    );
  } catch (error) {
    console.error('Chat history error:', error);
    return errorResponse('Failed to fetch chat history', 500);
  }
}

/**
 * Call Cloudflare AI Gateway
 * Sends messages to Llama 3.3 model via AI Gateway
 */
async function callAIGateway(env, messages) {
  try {
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
      console.error('AI Gateway error:', { status: response.status, error: errorData });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage =
      data.choices?.[0]?.message?.content ||
      'I apologize, but I could not generate a response.';

    return aiMessage;
  } catch (error) {
    console.error('AI Gateway call failed:', error);
    throw error;
  }
}

/**
 * System Prompt for Visa Assistant
 */
const VISA_ASSISTANT_PROMPT = `You are a helpful Visa Assistant for FlyTripVisa. You help users with:
- Visa application process for various countries
- Visa requirements and eligibility
- Document preparation guidance
- Visa status tracking
- General travel advice

Be professional, friendly, and concise. Always direct users to official resources for final verification.`;
