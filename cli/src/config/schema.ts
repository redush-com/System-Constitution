/**
 * Configuration Schema Types
 */

export type LLMProviderName = 'openrouter' | 'openai' | 'anthropic' | 'ollama';

export interface LLMConfig {
  provider: LLMProviderName;
  models: {
    openrouter: string;
    openai: string;
    anthropic: string;
    ollama: string;
  };
  temperature: number;
  maxRetries: number;
}

export interface ProviderConfig {
  baseUrl?: string;
  apiKey?: string;
}

export interface ProvidersConfig {
  openrouter: ProviderConfig;
  openai: ProviderConfig;
  anthropic: ProviderConfig;
  ollama: ProviderConfig;
}

export interface VersioningConfig {
  autoCommit: boolean;
  autoTag: boolean;
  tagPrefix: string;
}

export interface ProjectConfig {
  name: string;
  specFile: string;
}

export interface SysConstConfig {
  project?: ProjectConfig;
  llm: LLMConfig;
  providers: ProvidersConfig;
  versioning: VersioningConfig;
}

export interface ProjectLocalConfig {
  project: ProjectConfig;
  llm?: Partial<LLMConfig>;
  versioning?: Partial<VersioningConfig>;
}
