/**
 * Configuration Loader
 * Loads config from global (~/.evospec/config.yaml) and local (.evospec/config.yaml)
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import type { EvoSpecConfig, ProjectLocalConfig, LLMProviderName, LLMConfig, VersioningConfig } from './schema.js';
import { DEFAULT_CONFIG, ENV_KEYS } from './defaults.js';

const GLOBAL_CONFIG_DIR = join(homedir(), '.evospec');
const GLOBAL_CONFIG_FILE = join(GLOBAL_CONFIG_DIR, 'config.yaml');
const LOCAL_CONFIG_DIR = '.evospec';
const LOCAL_CONFIG_FILE = 'config.yaml';

/**
 * Deep merge two objects, with source values overriding target values.
 * Only merges plain objects, arrays and primitives are replaced.
 */
function deepMergeLLMConfig(target: LLMConfig, source: Partial<LLMConfig>): LLMConfig {
  return {
    provider: source.provider ?? target.provider,
    models: source.models ? { ...target.models, ...source.models } : target.models,
    temperature: source.temperature ?? target.temperature,
    maxRetries: source.maxRetries ?? target.maxRetries,
  };
}

function deepMergeVersioningConfig(target: VersioningConfig, source: Partial<VersioningConfig>): VersioningConfig {
  return {
    autoCommit: source.autoCommit ?? target.autoCommit,
    autoTag: source.autoTag ?? target.autoTag,
    tagPrefix: source.tagPrefix ?? target.tagPrefix,
  };
}

function mergeConfig(target: EvoSpecConfig, source: Partial<EvoSpecConfig>): EvoSpecConfig {
  return {
    project: source.project ?? target.project,
    llm: source.llm ? deepMergeLLMConfig(target.llm, source.llm) : target.llm,
    providers: source.providers ? {
      openrouter: { ...target.providers.openrouter, ...source.providers.openrouter },
      openai: { ...target.providers.openai, ...source.providers.openai },
      anthropic: { ...target.providers.anthropic, ...source.providers.anthropic },
      ollama: { ...target.providers.ollama, ...source.providers.ollama },
    } : target.providers,
    versioning: source.versioning ? deepMergeVersioningConfig(target.versioning, source.versioning) : target.versioning,
  };
}

function loadYamlFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    return parseYaml(content) as T;
  } catch {
    return null;
  }
}

export function loadGlobalConfig(): Partial<EvoSpecConfig> {
  return loadYamlFile<Partial<EvoSpecConfig>>(GLOBAL_CONFIG_FILE) ?? {};
}

export function loadLocalConfig(cwd: string = process.cwd()): ProjectLocalConfig | null {
  const localConfigPath = join(cwd, LOCAL_CONFIG_DIR, LOCAL_CONFIG_FILE);
  return loadYamlFile<ProjectLocalConfig>(localConfigPath);
}

export function loadConfig(cwd: string = process.cwd()): EvoSpecConfig {
  // Start with defaults
  let config: EvoSpecConfig = { ...DEFAULT_CONFIG };
  
  // Merge global config
  const globalConfig = loadGlobalConfig();
  config = mergeConfig(config, globalConfig);
  
  // Merge local config
  const localConfig = loadLocalConfig(cwd);
  if (localConfig) {
    if (localConfig.project) {
      config.project = localConfig.project;
    }
    if (localConfig.llm) {
      config.llm = deepMergeLLMConfig(config.llm, localConfig.llm);
    }
    if (localConfig.versioning) {
      config.versioning = deepMergeVersioningConfig(config.versioning, localConfig.versioning);
    }
  }
  
  // Apply environment variables for API keys
  const openrouterKey = process.env[ENV_KEYS.OPENROUTER_API_KEY];
  if (openrouterKey) {
    config.providers.openrouter.apiKey = openrouterKey;
  }
  const openaiKey = process.env[ENV_KEYS.OPENAI_API_KEY];
  if (openaiKey) {
    config.providers.openai.apiKey = openaiKey;
  }
  const anthropicKey = process.env[ENV_KEYS.ANTHROPIC_API_KEY];
  if (anthropicKey) {
    config.providers.anthropic.apiKey = anthropicKey;
  }
  
  return config;
}

export function getApiKey(provider: LLMProviderName, config: EvoSpecConfig): string | undefined {
  switch (provider) {
    case 'openrouter':
      return config.providers.openrouter.apiKey ?? process.env[ENV_KEYS.OPENROUTER_API_KEY];
    case 'openai':
      return config.providers.openai.apiKey ?? process.env[ENV_KEYS.OPENAI_API_KEY];
    case 'anthropic':
      return config.providers.anthropic.apiKey ?? process.env[ENV_KEYS.ANTHROPIC_API_KEY];
    case 'ollama':
      return undefined; // Ollama doesn't need API key
  }
}

export function getModel(provider: LLMProviderName, config: EvoSpecConfig): string {
  // Check environment variable first, then fall back to config
  const envModel = getEnvModel(provider);
  if (envModel) {
    return envModel;
  }
  return config.llm.models[provider];
}

function getEnvModel(provider: LLMProviderName): string | undefined {
  switch (provider) {
    case 'openrouter':
      return process.env[ENV_KEYS.OPENROUTER_MODEL];
    case 'openai':
      return process.env[ENV_KEYS.OPENAI_MODEL];
    case 'anthropic':
      return process.env[ENV_KEYS.ANTHROPIC_MODEL];
    case 'ollama':
      return process.env[ENV_KEYS.OLLAMA_MODEL];
  }
}

export function getBaseUrl(provider: LLMProviderName, config: EvoSpecConfig): string | undefined {
  return config.providers[provider].baseUrl;
}

export function getGlobalConfigDir(): string {
  return GLOBAL_CONFIG_DIR;
}

export function getGlobalConfigFile(): string {
  return GLOBAL_CONFIG_FILE;
}

export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let currentDir = resolve(startDir);
  const root = resolve('/');
  
  while (currentDir !== root) {
    const evospecDir = join(currentDir, LOCAL_CONFIG_DIR);
    if (existsSync(evospecDir)) {
      return currentDir;
    }
    currentDir = resolve(currentDir, '..');
  }
  
  return null;
}

export function findSpecFile(cwd: string = process.cwd()): string | null {
  const config = loadLocalConfig(cwd);
  if (config?.project?.specFile) {
    const specPath = join(cwd, config.project.specFile);
    if (existsSync(specPath)) {
      return specPath;
    }
  }
  
  // Fallback: look for *.evospec.yaml in cwd
  try {
    const files = readdirSync(cwd);
    const specFile = files.find((f) => f.endsWith('.evospec.yaml'));
    if (specFile) {
      return join(cwd, specFile);
    }
  } catch {
    // Ignore
  }
  
  return null;
}
