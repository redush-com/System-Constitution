/**
 * Project Initialization Logic
 */

import { basename, resolve, join } from 'path';
import { existsSync } from 'fs';
import type { SysConstConfig, LLMProviderName } from '../config/schema.js';
import { loadConfig } from '../config/loader.js';
import { createGit, isGitAvailable, type Git } from '../versioning/git.js';
import { generateSpec } from '../generation/engine.js';
import {
  createProjectStructure,
  projectExists,
  getProjectStructure,
  type ProjectStructure,
} from './structure.js';

export interface InitOptions {
  projectName?: string;
  targetDir?: string;
  description?: string;
  provider?: LLMProviderName;
  model?: string;
  noGenerate?: boolean;
  noReadme?: boolean;
  skipConfirmation?: boolean;
  onStep?: (step: string, status: 'start' | 'done' | 'skip' | 'error', message?: string) => void;
  onGenerationAttempt?: (attempt: number, total: number) => void;
  onGenerationError?: (attempt: number, errors: unknown[]) => void;
}

export interface InitResult {
  success: boolean;
  projectDir: string;
  specFile: string;
  version: string;
  gitInitialized: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Initialize a new System Constitution project
 */
export async function initProject(options: InitOptions): Promise<InitResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Determine target directory and project name
  const targetDir = options.targetDir
    ? resolve(options.targetDir)
    : options.projectName
      ? resolve(process.cwd(), options.projectName)
      : process.cwd();
  
  const projectName = options.projectName || basename(targetDir);
  
  // Check if project already exists
  const existing = projectExists(targetDir);
  if (existing.exists) {
    const reason = existing.reason === 'sysconst_dir'
      ? 'Project already initialized (.sysconst/ exists)'
      : 'Spec file already exists';
    return {
      success: false,
      projectDir: targetDir,
      specFile: '',
      version: '',
      gitInitialized: false,
      errors: [reason],
      warnings,
    };
  }
  
  const structure = getProjectStructure(targetDir, projectName);
  let gitInitialized = false;
  let git: Git | null = null;
  
  // Step 1: Create directory
  options.onStep?.('directory', 'start');
  
  // Step 2: Initialize Git
  const gitAvailable = await isGitAvailable();
  if (gitAvailable) {
    options.onStep?.('git', 'start');
    
    // Check if already a git repo
    const gitDir = join(targetDir, '.git');
    if (existsSync(gitDir)) {
      options.onStep?.('git', 'skip', 'Git repository already exists');
      git = createGit(targetDir);
      gitInitialized = true;
    } else {
      try {
        // Create directory first if needed
        if (!existsSync(targetDir)) {
          const { mkdirSync } = await import('fs');
          mkdirSync(targetDir, { recursive: true });
        }
        
        git = createGit(targetDir);
        await git.init();
        gitInitialized = true;
        options.onStep?.('git', 'done');
      } catch (error) {
        warnings.push(`Git init failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        options.onStep?.('git', 'error', 'Git initialization failed');
      }
    }
  } else {
    warnings.push('Git not found. Version tracking will be limited.');
    options.onStep?.('git', 'skip', 'Git not available');
  }
  
  // Step 3: Create .sysconst/config.yaml
  options.onStep?.('config', 'start');
  
  // Step 4: Create .gitignore
  options.onStep?.('gitignore', 'start');
  
  // Step 5: Generate or create spec
  let specContent: string | undefined;
  
  if (options.description && !options.noGenerate) {
    options.onStep?.('generate', 'start');
    
    try {
      const config = loadConfig();
      const result = await generateSpec(config, {
        description: options.description,
        provider: options.provider,
        model: options.model,
        onAttempt: options.onGenerationAttempt,
        onValidationError: options.onGenerationError,
      });
      
      if (result.success && result.yaml) {
        specContent = result.yaml;
        options.onStep?.('generate', 'done');
      } else {
        warnings.push('LLM generation failed, using minimal template');
        options.onStep?.('generate', 'error', 'Generation failed, using template');
      }
    } catch (error) {
      warnings.push(`LLM generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      options.onStep?.('generate', 'error', 'Generation error, using template');
    }
  } else {
    options.onStep?.('generate', 'skip', 'Using minimal template');
  }
  
  // Create project structure
  const structureResult = createProjectStructure({
    projectName,
    targetDir,
    specContent,
    description: options.description,
    provider: options.provider,
    model: options.model,
    createReadme: !options.noReadme,
  });
  
  if (!structureResult.success) {
    return {
      success: false,
      projectDir: targetDir,
      specFile: structure.specFile,
      version: '1.0.0',
      gitInitialized,
      errors: structureResult.errors,
      warnings: [...warnings, ...structureResult.warnings],
    };
  }
  
  warnings.push(...structureResult.warnings);
  options.onStep?.('config', 'done');
  options.onStep?.('gitignore', 'done');
  options.onStep?.('spec', 'done');
  
  if (!options.noReadme) {
    options.onStep?.('readme', 'done');
  }
  
  // Step 8-10: Git commit and tag
  if (git && gitInitialized) {
    try {
      options.onStep?.('commit', 'start');
      
      await git.add('.');
      await git.commit('Initial System Constitution v1.0.0');
      
      options.onStep?.('commit', 'done');
      
      options.onStep?.('tag', 'start');
      await git.tag('v1.0.0', 'Initial version');
      options.onStep?.('tag', 'done');
    } catch (error) {
      warnings.push(`Git commit/tag failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      options.onStep?.('commit', 'error');
    }
  }
  
  return {
    success: true,
    projectDir: targetDir,
    specFile: structure.specFile,
    version: '1.0.0',
    gitInitialized,
    errors,
    warnings,
  };
}
