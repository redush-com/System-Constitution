/**
 * LLM Module - Provider Factory
 */

export * from './provider.js';
export * from './openrouter.js';
export * from './openai.js';
export * from './anthropic.js';
export * from './ollama.js';

import type { LLMProvider } from './provider.js';
import { LLMProviderError } from './provider.js';
import { OpenRouterProvider } from './openrouter.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';
import type { SysConstConfig, LLMProviderName } from '../config/schema.js';
import { getApiKey, getModel, getBaseUrl } from '../config/loader.js';

export function createProvider(
  providerName: LLMProviderName,
  config: SysConstConfig,
  modelOverride?: string
): LLMProvider {
  const model = modelOverride || getModel(providerName, config);
  const apiKey = getApiKey(providerName, config);
  const baseUrl = getBaseUrl(providerName, config);
  
  switch (providerName) {
    case 'openrouter':
      if (!apiKey) {
        throw new LLMProviderError(
          'OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.',
          'PROVIDER_NOT_CONFIGURED',
          'openrouter'
        );
      }
      return new OpenRouterProvider({ apiKey, model, baseUrl });
      
    case 'openai':
      if (!apiKey) {
        throw new LLMProviderError(
          'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.',
          'PROVIDER_NOT_CONFIGURED',
          'openai'
        );
      }
      return new OpenAIProvider({ apiKey, model, baseUrl });
      
    case 'anthropic':
      if (!apiKey) {
        throw new LLMProviderError(
          'Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.',
          'PROVIDER_NOT_CONFIGURED',
          'anthropic'
        );
      }
      return new AnthropicProvider({ apiKey, model });
      
    case 'ollama':
      return new OllamaProvider({ model, baseUrl });
      
    default:
      throw new LLMProviderError(
        `Unknown provider: ${providerName}`,
        'PROVIDER_NOT_CONFIGURED',
        providerName
      );
  }
}

export async function getAvailableProviders(config: SysConstConfig): Promise<LLMProviderName[]> {
  const providers: LLMProviderName[] = ['openrouter', 'openai', 'anthropic', 'ollama'];
  const available: LLMProviderName[] = [];
  
  for (const name of providers) {
    try {
      const provider = createProvider(name, config);
      if (await provider.isAvailable()) {
        available.push(name);
      }
    } catch {
      // Provider not configured
    }
  }
  
  return available;
}
