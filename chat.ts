// @ts-nocheck
import type { Context } from '@netlify/functions';
import { getDeployStore } from '@netlify/blobs';
import { UnifiedLLMService } from './backend/src/services/UnifiedLLMService';

const llm = new UnifiedLLMService();

export default async function handler(req: Request, _ctx: Context) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { message, sessionId = 'default', mode = 'creator' } = await req.json();
  if (!message) return new Response('Message required', { status: 400 });

  const store = getDeployStore('chat-history');
  const key = `chat-${sessionId}`;
  const history: any[] = (await store.get(key, { type: 'json' })) || [];

  const messages = [
    ...history,
    { role: 'user', content: message }
  ];

  // Create TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await llm.generateResponse(messages, mode, undefined, (chunk) => {
          controller.enqueue(encoder.encode(chunk.content));
        });
      } catch (err) {
        controller.enqueue(encoder.encode('\n[ERROR]'));
      } finally {
        controller.close();
      }
    }
  });

  // We don't await streaming; after generation we need to save full assistant message, so call generateResponse again non-stream? We'll capture at end.
  const full = await llm.generateResponse(messages, mode);
  await store.setJSON(key, [...messages, { role: 'assistant', content: full.content }]);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
} 