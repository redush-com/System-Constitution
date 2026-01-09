/**
 * Default Configuration Values
 */

import type { SysConstConfig, LLMConfig, ProvidersConfig, VersioningConfig } from './schema.js';

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openrouter',
  models: {
    openrouter: 'anthropic/claude-sonnet-4.5',
    openai: 'gpt-5.2',
    anthropic: 'claude-sonnet-4-5',
    ollama: 'llama4',
  },
  temperature: 0.3,
  maxRetries: 3,
};

export const DEFAULT_PROVIDERS_CONFIG: ProvidersConfig = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {},
  ollama: {
    baseUrl: 'http://localhost:11434',
  },
};

export const DEFAULT_VERSIONING_CONFIG: VersioningConfig = {
  autoCommit: true,
  autoTag: true,
  tagPrefix: 'v',
};

export const DEFAULT_CONFIG: SysConstConfig = {
  llm: DEFAULT_LLM_CONFIG,
  providers: DEFAULT_PROVIDERS_CONFIG,
  versioning: DEFAULT_VERSIONING_CONFIG,
};

export const ENV_KEYS = {
  // API Keys
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  // Model overrides
  OPENROUTER_MODEL: 'OPENROUTER_MODEL',
  OPENAI_MODEL: 'OPENAI_MODEL',
  ANTHROPIC_MODEL: 'ANTHROPIC_MODEL',
  OLLAMA_MODEL: 'OLLAMA_MODEL',
} as const;
