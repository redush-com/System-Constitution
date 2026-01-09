/**
 * Validation Loop - Retry generation until valid
 */

import { parse as parseYaml } from 'yaml';
import { validateYaml, type ValidationResult, type ValidationError } from '../validator/index.js';
import type { LLMProvider } from '../llm/provider.js';
import { getSystemPrompt, buildErrorFeedbackPrompt } from './prompts.js';

export interface GenerationResult {
  success: boolean;
  spec?: unknown;
  yaml?: string;
  attempts: number;
  errors?: ValidationError[];
}

export interface ValidationLoopOptions {
  maxRetries: number;
  temperature?: number;
  onAttempt?: (attempt: number, total: number) => void;
  onValidationError?: (attempt: number, errors: ValidationError[]) => void;
}

/**
 * Extract YAML from LLM response
 * Handles responses with ```yaml code blocks or raw YAML
 */
export function extractYaml(content: string): string {
  // Try to extract from code block
  const codeBlockMatch = content.match(/```(?:yaml|yml)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find YAML starting with 'spec:'
  const specMatch = content.match(/(spec:\s*sysconst\/v1[\s\S]*)/);
  if (specMatch) {
    return specMatch[1].trim();
  }
  
  // Return as-is
  return content.trim();
}

/**
 * Generate spec with validation loop
 */
export async function generateWithValidation(
  provider: LLMProvider,
  userPrompt: string,
  options: ValidationLoopOptions
): Promise<GenerationResult> {
  const systemPrompt = getSystemPrompt();
  let attempts = 0;
  let lastErrors: ValidationError[] = [];
  let currentPrompt = userPrompt;
  
  while (attempts < options.maxRetries) {
    attempts++;
    options.onAttempt?.(attempts, options.maxRetries);
    
    // Generate from LLM
    const response = await provider.generate({
      systemPrompt,
      userPrompt: currentPrompt,
      temperature: options.temperature ?? 0.3,
    });
    
    // Extract YAML from response
    const yaml = extractYaml(response.content);
    
    // Parse YAML
    let spec: unknown;
    try {
      spec = parseYaml(yaml);
    } catch (e) {
      const parseError: ValidationError = {
        code: 'STRUCTURAL_ERROR',
        phase: 1,
        level: 'hard',
        message: `YAML parse error: ${e instanceof Error ? e.message : 'Unknown error'}`,
        location: '',
      };
      lastErrors = [parseError];
      options.onValidationError?.(attempts, lastErrors);
      
      // Build error feedback prompt
      currentPrompt = buildErrorFeedbackPrompt(userPrompt, lastErrors);
      continue;
    }
    
    // Validate
    const result = validateYaml(yaml, { strict: false });
    
    if (result.ok) {
      return {
        success: true,
        spec,
        yaml,
        attempts,
      };
    }
    
    // Validation failed - prepare for retry
    lastErrors = result.errors;
    options.onValidationError?.(attempts, lastErrors);
    
    // Build error feedback prompt
    currentPrompt = buildErrorFeedbackPrompt(userPrompt, lastErrors);
  }
  
  // Max retries exceeded
  return {
    success: false,
    attempts,
    errors: lastErrors,
  };
}
