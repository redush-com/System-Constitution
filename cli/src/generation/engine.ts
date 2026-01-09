/**
 * Generation Engine
 * High-level API for spec generation and evolution
 */

import { readFileSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import * as semver from 'semver';
import type { LLMProvider } from '../llm/provider.js';
import type { SysConstConfig, LLMProviderName } from '../config/schema.js';
import { createProvider } from '../llm/index.js';
import { buildGeneratePrompt, buildEvolvePrompt } from './prompts.js';
import { generateWithValidation, type GenerationResult } from './validation-loop.js';

export interface GenerateOptions {
  description: string;
  provider?: LLMProviderName;
  model?: string;
  maxRetries?: number;
  temperature?: number;
  onAttempt?: (attempt: number, total: number) => void;
  onValidationError?: (attempt: number, errors: unknown[]) => void;
}

export interface EvolveOptions {
  specFile: string;
  change: string;
  bump?: 'major' | 'minor' | 'patch';
  provider?: LLMProviderName;
  model?: string;
  maxRetries?: number;
  temperature?: number;
  onAttempt?: (attempt: number, total: number) => void;
  onValidationError?: (attempt: number, errors: unknown[]) => void;
}

export interface EvolveResult extends GenerationResult {
  previousVersion?: string;
  newVersion?: string;
}

/**
 * Generate a new SysConst specification
 */
export async function generateSpec(
  config: SysConstConfig,
  options: GenerateOptions
): Promise<GenerationResult> {
  const providerName = options.provider || config.llm.provider;
  const provider = createProvider(providerName, config, options.model);
  
  const userPrompt = buildGeneratePrompt(options.description);
  
  return generateWithValidation(provider, userPrompt, {
    maxRetries: options.maxRetries ?? config.llm.maxRetries,
    temperature: options.temperature ?? config.llm.temperature,
    onAttempt: options.onAttempt,
    onValidationError: options.onValidationError,
  });
}

/**
 * Evolve an existing SysConst specification
 */
export async function evolveSpec(
  config: SysConstConfig,
  options: EvolveOptions
): Promise<EvolveResult> {
  // Read current spec
  const currentYaml = readFileSync(options.specFile, 'utf-8');
  const currentSpec = parseYaml(currentYaml) as {
    project?: { versioning?: { current?: string } };
  };
  
  // Get current version
  const currentVersion = currentSpec?.project?.versioning?.current || '1.0.0';
  
  // Calculate new version
  const bumpType = options.bump || 'minor';
  const newVersion = semver.inc(currentVersion, bumpType) || `${currentVersion}-next`;
  
  // Create provider
  const providerName = options.provider || config.llm.provider;
  const provider = createProvider(providerName, config, options.model);
  
  // Build prompt
  const userPrompt = buildEvolvePrompt(
    currentYaml,
    options.change,
    currentVersion,
    newVersion
  );
  
  // Generate with validation
  const result = await generateWithValidation(provider, userPrompt, {
    maxRetries: options.maxRetries ?? config.llm.maxRetries,
    temperature: options.temperature ?? config.llm.temperature,
    onAttempt: options.onAttempt,
    onValidationError: options.onValidationError,
  });
  
  return {
    ...result,
    previousVersion: currentVersion,
    newVersion,
  };
}

/**
 * Generate minimal template spec (no LLM)
 */
export function generateMinimalSpec(projectName: string): string {
  const projectId = projectName.toLowerCase().replace(/[^a-z0-9]/g, '.');
  
  return stringifyYaml({
    spec: 'sysconst/v1',
    project: {
      id: projectId,
      name: projectName,
      versioning: {
        strategy: 'semver',
        current: '1.0.0',
      },
    },
    structure: {
      root: 'NodeRef(system.root)',
    },
    domain: {
      nodes: [
        {
          kind: 'System',
          id: 'system.root',
          meta: {
            title: projectName,
            description: 'Main system',
          },
          spec: {
            goals: ['Define your system goals here'],
          },
          children: ['NodeRef(mod.core)'],
        },
        {
          kind: 'Module',
          id: 'mod.core',
          meta: {
            title: 'Core',
          },
          spec: {},
          children: ['NodeRef(entity.example)'],
        },
        {
          kind: 'Entity',
          id: 'entity.example',
          meta: {
            title: 'Example Entity',
          },
          spec: {
            fields: {
              id: { type: 'uuid', required: true },
              name: { type: 'string', required: true },
              createdAt: { type: 'datetime', required: true },
            },
          },
          contracts: [
            { invariant: "name != ''", level: 'hard' },
          ],
        },
      ],
    },
    history: [
      {
        version: '1.0.0',
        basedOn: null,
        changes: [],
        migrations: [],
        notes: 'Initial version',
      },
    ],
  }, { lineWidth: 0 });
}
