/**
 * OpenRouter LLM Provider
 * Uses OpenAI SDK with custom base URL
 */

import OpenAI from 'openai';
import type { LLMProvider, GenerateRequest, GenerateResponse } from './provider.js';
import { LLMProviderError } from './provider.js';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';
  private client: OpenAI;
  private model: string;
  
  constructor(private config: OpenRouterConfig) {
    this.model = config.model;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://sysconst.dev',
        'X-Title': 'System Constitution CLI',
      },
    });
  }
  
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 8192,
      });
      
      const content = response.choices[0]?.message?.content || '';
      
      return {
        content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
        } : undefined,
      };
    } catch (error) {
      throw new LLMProviderError(
        `OpenRouter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_FAILED',
        this.name,
        error
      );
    }
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }
    
    try {
      // Simple check - list models
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
