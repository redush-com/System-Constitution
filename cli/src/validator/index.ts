/**
 * System Constitution DSL Validator
 * 
 * Validates SysConst specifications through 6 phases:
 * 1. Structural - syntax and required fields
 * 2. Referential - references and identity
 * 3. Semantic - kind-specific rules
 * 4. Evolution - version history and migrations
 * 5. Generation - code generation safety
 * 6. Verifiability - pipelines and scenarios
 */

import { parse as parseYaml } from 'yaml';
import { validateStructural } from './phases/01-structural';
import { validateReferential } from './phases/02-referential';
import { validateSemantic } from './phases/03-semantic';
import { validateEvolution } from './phases/04-evolution';
import { validateGeneration } from './phases/05-generation';
import { validateVerifiability } from './phases/06-verifiability';

import type {
  SysConst,
  ValidationResult,
  ValidationError,
  ValidateOptions,
  ValidationPhase,
} from './types';

export * from './types';

/**
 * Validate a SysConst specification
 */
export function validate(
  spec: unknown,
  options: ValidateOptions = {}
): ValidationResult {
  const { phases = [1, 2, 3, 4, 5, 6], strict = false } = options;
  
  const allErrors: ValidationError[] = [];
  let currentPhase: ValidationPhase = 1;

  // Phase 1: Structural
  if (phases.includes(1)) {
    currentPhase = 1;
    const errors = validateStructural(spec);
    allErrors.push(...errors);
    
    if (hasHardErrors(errors)) {
      return buildResult(allErrors, currentPhase, strict);
    }
  }

  // Cast to SysConst after structural validation
  const sysConst = spec as SysConst;

  // Phase 2: Referential
  if (phases.includes(2)) {
    currentPhase = 2;
    const errors = validateReferential(sysConst);
    allErrors.push(...errors);
    
    if (hasHardErrors(errors)) {
      return buildResult(allErrors, currentPhase, strict);
    }
  }

  // Phase 3: Semantic
  if (phases.includes(3)) {
    currentPhase = 3;
    const errors = validateSemantic(sysConst);
    allErrors.push(...errors);
    
    if (hasHardErrors(errors)) {
      return buildResult(allErrors, currentPhase, strict);
    }
  }

  // Phase 4: Evolution
  if (phases.includes(4)) {
    currentPhase = 4;
    const errors = validateEvolution(sysConst);
    allErrors.push(...errors);
    
    if (hasHardErrors(errors)) {
      return buildResult(allErrors, currentPhase, strict);
    }
  }

  // Phase 5: Generation
  if (phases.includes(5)) {
    currentPhase = 5;
    const errors = validateGeneration(sysConst);
    allErrors.push(...errors);
    
    if (hasHardErrors(errors)) {
      return buildResult(allErrors, currentPhase, strict);
    }
  }

  // Phase 6: Verifiability
  if (phases.includes(6)) {
    currentPhase = 6;
    const errors = validateVerifiability(sysConst);
    allErrors.push(...errors);
  }

  return buildResult(allErrors, currentPhase, strict);
}

/**
 * Validate a specific phase only
 */
export function validatePhase(
  spec: unknown,
  phase: ValidationPhase
): ValidationError[] {
  switch (phase) {
    case 1:
      return validateStructural(spec);
    case 2:
      return validateReferential(spec as SysConst);
    case 3:
      return validateSemantic(spec as SysConst);
    case 4:
      return validateEvolution(spec as SysConst);
    case 5:
      return validateGeneration(spec as SysConst);
    case 6:
      return validateVerifiability(spec as SysConst);
    default:
      throw new Error(`Invalid phase: ${phase}`);
  }
}

/**
 * Parse YAML string to spec object
 */
export function parseSpec(yaml: string): unknown {
  return parseYaml(yaml);
}

/**
 * Validate YAML string
 */
export function validateYaml(
  yaml: string,
  options: ValidateOptions = {}
): ValidationResult {
  try {
    const spec = parseSpec(yaml);
    return validate(spec, options);
  } catch (error) {
    return {
      ok: false,
      errors: [{
        code: 'STRUCTURAL_ERROR',
        phase: 1,
        level: 'hard',
        message: `Failed to parse YAML: ${(error as Error).message}`,
        location: '',
      }],
      warnings: [],
      phase: 1,
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function hasHardErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.level === 'hard');
}

function buildResult(
  errors: ValidationError[],
  phase: ValidationPhase,
  strict: boolean
): ValidationResult {
  const hardErrors = errors.filter(e => e.level === 'hard');
  const softErrors = errors.filter(e => e.level === 'soft');

  // In strict mode, soft errors become hard errors
  if (strict) {
    return {
      ok: errors.length === 0,
      errors: errors,
      warnings: [],
      phase,
    };
  }

  return {
    ok: hardErrors.length === 0,
    errors: hardErrors,
    warnings: softErrors,
    phase,
  };
}
