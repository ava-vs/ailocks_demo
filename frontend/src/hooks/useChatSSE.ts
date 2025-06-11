import { useAilockStore } from '../store/ailockStore';
import { Message } from '../types';

export const useChatSSE = () => {
  const {
    addMessage,
    appendToStreamingMessage,
    clearStreamingMessage,
    setTyping,
    currentSessionId,
    setCurrentSessionId,
    currentMode
  } = useAilockStore();

  // Helper: start SSE stream and process chunks
  const startStream = async (controller: AbortController, body: any) => {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    clearStreamingMessage();
    setTyping(true);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      appendToStreamingMessage(chunk);
    }

    // When stream ends, convert streamingMessage to full Message in store
    const fullContent = useAilockStore.getState().streamingMessage;
    if (fullContent.trim()) {
      addMessage({
        id: Date.now().toString(),
        content: fullContent,
        senderId: 'ailock',
        timestamp: new Date(),
        type: 'text'
      } as Message);
    }
    clearStreamingMessage();
    setTyping(false);
  };

  const sendMessage = async (message: Message) => {
    // Immediately add user message to store
    addMessage(message);

    const controller = new AbortController();

    // Build request body
    const body: any = {
      message: message.content,
      mode: currentMode
    };
    if (currentSessionId) body.sessionId = currentSessionId;

    // Start streaming
    await startStream(controller, body);

    // After first successful call if we didn't have sessionId, we can set from response header maybe. Skipped.
  };

  const sendTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  return { sendMessage, sendTyping };
}; 