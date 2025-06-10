import OpenAI from 'openai';
import axios from 'axios';
import { AilockMode } from '../types';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  provider?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: LLMResponse['usage'];
}

export class UnifiedLLMService {
  private openai: OpenAI | null = null;
  private openrouterApiKey: string | null = null;
  private defaultProvider: string;
  private models: Record<AilockMode, string>;
  private maxTokens: number;
  private temperature: number;
  private enableStreaming: boolean;

  constructor() {
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || null;
    this.defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openrouter';
    this.maxTokens = parseInt(process.env.MAX_TOKENS || '1000');
    this.temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.7');
    this.enableStreaming = process.env.ENABLE_STREAMING === 'true';

    this.models = {
      researcher: process.env.LLM_MODEL_RESEARCHER || 'anthropic/claude-3-haiku',
      creator: process.env.LLM_MODEL_CREATOR || 'anthropic/claude-3-haiku',
      analyst: process.env.LLM_MODEL_ANALYST || 'anthropic/claude-3-haiku'
    };

    // Initialize OpenAI client as fallback
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  private getSystemPrompt(mode: AilockMode, userContext?: any): string {
    const basePrompt = `You are Ailock, an intelligent AI assistant in the Ai2Ai Network. You help users accomplish tasks through collaboration and smart automation.`;
    
    const modePrompts = {
      researcher: `${basePrompt} You are in RESEARCHER mode. Focus on:
- Gathering and analyzing information
- Providing factual, well-researched responses
- Suggesting research methodologies and data sources
- Helping users discover insights and patterns
- Being thorough and evidence-based in your responses`,

      creator: `${basePrompt} You are in CREATOR mode. Focus on:
- Generating creative ideas and solutions
- Brainstorming innovative approaches
- Helping with content creation and design
- Encouraging experimentation and creativity
- Providing inspiring and imaginative responses`,

      analyst: `${basePrompt} You are in ANALYST mode. Focus on:
- Analyzing data and metrics
- Providing insights and recommendations
- Breaking down complex problems systematically
- Focusing on performance optimization
- Delivering structured, analytical responses`
    };

    let prompt = modePrompts[mode];

    if (userContext?.location) {
      prompt += `\n\nUser location context: ${userContext.location.city}, ${userContext.location.country}`;
    }

    prompt += `\n\nAlways be helpful, concise, and actionable. Suggest relevant context actions when appropriate.`;

    return prompt;
  }

  async generateResponse(
    messages: LLMMessage[],
    mode: AilockMode,
    userContext?: any,
    onStream?: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    const systemPrompt = this.getSystemPrompt(mode, userContext);
    const fullMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      if (this.enableStreaming && onStream) {
        return await this.generateStreamingResponse(fullMessages, mode, onStream);
      } else {
        return await this.generateNonStreamingResponse(fullMessages, mode);
      }
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async generateStreamingResponse(
    messages: LLMMessage[],
    mode: AilockMode,
    onStream: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    if (this.defaultProvider === 'openrouter' && this.openrouterApiKey) {
      return await this.streamOpenRouter(messages, mode, onStream);
    } else if (this.openai) {
      return await this.streamOpenAI(messages, mode, onStream);
    } else {
      throw new Error('No LLM provider configured');
    }
  }

  private async generateNonStreamingResponse(
    messages: LLMMessage[],
    mode: AilockMode
  ): Promise<LLMResponse> {
    if (this.defaultProvider === 'openrouter' && this.openrouterApiKey) {
      return await this.callOpenRouter(messages, mode);
    } else if (this.openai) {
      return await this.callOpenAI(messages, mode);
    } else {
      throw new Error('No LLM provider configured');
    }
  }

  private async streamOpenRouter(
    messages: LLMMessage[],
    mode: AilockMode,
    onStream: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ailocks.ai',
        'X-Title': 'Ailocks AI2AI Network'
      },
      body: JSON.stringify({
        model: this.models[mode],
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let usage: any = undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onStream({ content: '', done: true, usage });
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                fullContent += delta.content;
                onStream({ content: delta.content, done: false });
              }

              // Capture usage info if present
              if (parsed.usage) {
                usage = parsed.usage;
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      usage,
      model: this.models[mode],
      provider: 'openrouter'
    };
  }

  private async streamOpenAI(
    messages: LLMMessage[],
    mode: AilockMode,
    onStream: (chunk: StreamChunk) => void
  ): Promise<LLMResponse> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: true
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onStream({ content: delta.content, done: false });
      }
    }

    onStream({ content: '', done: true });

    return {
      content: fullContent,
      model: 'gpt-3.5-turbo',
      provider: 'openai'
    };
  }

  private async callOpenRouter(messages: LLMMessage[], mode: AilockMode): Promise<LLMResponse> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: this.models[mode],
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ailocks.ai',
          'X-Title': 'Ailocks AI2AI Network'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: this.models[mode],
      provider: 'openrouter'
    };
  }

  private async callOpenAI(messages: LLMMessage[], mode: AilockMode): Promise<LLMResponse> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature
    });

    return {
      content: response.choices[0].message.content || '',
      usage: response.usage,
      model: 'gpt-3.5-turbo',
      provider: 'openai'
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const testMessages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      await this.generateNonStreamingResponse(testMessages, 'researcher');
      return true;
    } catch (error) {
      console.error('LLM health check failed:', error);
      return false;
    }
  }
}