/**
 * Interactive API Key Setup
 * Prompts user for API key when not configured
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { SysConstConfig, LLMProviderName } from './schema.js';
import { loadConfig, getApiKey, saveApiKey, hasApiKey } from './loader.js';

const PROVIDER_INFO: Record<LLMProviderName, { name: string; url: string; keyPrefix: string }> = {
  openrouter: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/keys',
    keyPrefix: 'sk-or-',
  },
  openai: {
    name: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
  },
  anthropic: {
    name: 'Anthropic',
    url: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
  },
  ollama: {
    name: 'Ollama (local)',
    url: '',
    keyPrefix: '',
  },
};

/**
 * Ensure API key is configured for the given provider.
 * If not configured, prompts the user to enter it.
 * Returns the config with the API key set.
 */
export async function ensureApiKey(
  config: SysConstConfig,
  provider?: LLMProviderName
): Promise<{ config: SysConstConfig; cancelled: boolean }> {
  const targetProvider = provider ?? config.llm.provider;
  
  // Ollama doesn't need API key
  if (targetProvider === 'ollama') {
    return { config, cancelled: false };
  }
  
  // Check if API key is already configured
  if (hasApiKey(targetProvider, config)) {
    return { config, cancelled: false };
  }
  
  const info = PROVIDER_INFO[targetProvider];
  
  console.log();
  console.log(chalk.yellow(`⚠ No API key configured for ${info.name}`));
  console.log();
  console.log(`To use LLM features, you need an API key from ${info.name}.`);
  if (info.url) {
    console.log(`Get your key at: ${chalk.cyan(info.url)}`);
  }
  console.log();
  
  const { setupNow } = await inquirer.prompt([{
    type: 'confirm',
    name: 'setupNow',
    message: 'Would you like to enter your API key now?',
    default: true,
  }]);
  
  if (!setupNow) {
    console.log();
    console.log(chalk.gray('You can set up your API key later by:'));
    console.log(chalk.gray(`  1. Running: sysconst config --set-key ${targetProvider}`));
    console.log(chalk.gray(`  2. Setting environment variable: ${getEnvKeyName(targetProvider)}=your-key`));
    console.log();
    return { config, cancelled: true };
  }
  
  const { apiKey } = await inquirer.prompt([{
    type: 'password',
    name: 'apiKey',
    message: `Enter your ${info.name} API key:`,
    mask: '*',
    validate: (input: string) => {
      if (!input || input.trim().length === 0) {
        return 'API key cannot be empty';
      }
      if (info.keyPrefix && !input.startsWith(info.keyPrefix)) {
        return `${info.name} API keys typically start with "${info.keyPrefix}"`;
      }
      return true;
    },
  }]);
  
  // Save the API key to global config
  saveApiKey(targetProvider, apiKey.trim());
  
  console.log();
  console.log(chalk.green(`✓ API key saved to ~/.sysconst/config.yaml`));
  console.log();
  
  // Reload config to pick up the new key
  const newConfig = loadConfig();
  
  return { config: newConfig, cancelled: false };
}

function getEnvKeyName(provider: LLMProviderName): string {
  switch (provider) {
    case 'openrouter': return 'OPENROUTER_API_KEY';
    case 'openai': return 'OPENAI_API_KEY';
    case 'anthropic': return 'ANTHROPIC_API_KEY';
    case 'ollama': return '';
  }
}

/**
 * Interactive provider selection
 */
export async function selectProvider(): Promise<LLMProviderName> {
  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: 'Select LLM provider:',
    choices: [
      { name: 'OpenRouter (recommended - access to multiple models)', value: 'openrouter' },
      { name: 'OpenAI', value: 'openai' },
      { name: 'Anthropic', value: 'anthropic' },
      { name: 'Ollama (local, free)', value: 'ollama' },
    ],
    default: 'openrouter',
  }]);
  
  return provider;
}
