#!/usr/bin/env node

/**
 * EvoSpec CLI
 * Command-line interface for EvoSpec DSL validation, generation, and versioning
 */

// Load environment variables from .env file in current directory, project root, or home directory
import { config as dotenvConfig } from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { resolve, basename, join } from 'path';

// Try loading .env from multiple locations (in order of priority)
const envPaths = [
  resolve(process.cwd(), '.env'),                    // Current directory
  resolve(process.cwd(), '.sysconst', '.env'),        // Project .sysconst folder
  join(homedir(), '.sysconst', '.env'),               // Global ~/.sysconst/.env
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenvConfig({ path: envPath });
    break;
  }
}

import { Command } from 'commander';
import chalk from 'chalk';
import { validateYaml, ValidationResult, ValidationError, ValidationPhase } from './validator/index.js';

// Re-export validator for programmatic use
export * from './validator/index.js';

// Import new commands
import {
  createInitCommand,
  createGenerateCommand,
  createEvolveCommand,
  createVersionCommand,
  createHistoryCommand,
  createDiffCommand,
  createCheckoutCommand,
} from './commands/index.js';

const program = new Command();

program
  .name('sysconst')
  .description('CLI for System Constitution validation, generation, and versioning')
  .version('1.0.0');

// ============================================
// Validate Command
// ============================================

program
  .command('validate <file>')
  .description('Validate a System Constitution file')
  .option('-p, --phase <phases>', 'Validate specific phases (e.g., 1-3 or 1,2,3)', '1-6')
  .option('-s, --strict', 'Treat soft errors as hard errors', false)
  .option('-f, --format <format>', 'Output format: text, json', 'text')
  .option('-q, --quiet', 'Only output errors', false)
  .action((file: string, options: { phase: string; strict: boolean; format: string; quiet: boolean }) => {
    const filePath = resolve(file);
    
    if (!existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }

    const content = readFileSync(filePath, 'utf-8');
    const phases = parsePhases(options.phase);

    const result = validateYaml(content, {
      phases,
      strict: options.strict,
    });

    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printValidationResult(result, options.quiet);
    }

    process.exit(result.ok ? 0 : 1);
  });

// ============================================
// Check Command (alias for validate with phases)
// ============================================

program
  .command('check <file>')
  .description('Quick validation (phases 1-3 only)')
  .option('-f, --format <format>', 'Output format: text, json', 'text')
  .action((file: string, options: { format: string }) => {
    const filePath = resolve(file);
    
    if (!existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }

    const content = readFileSync(filePath, 'utf-8');
    const result = validateYaml(content, { phases: [1, 2, 3] });

    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printValidationResult(result, false);
    }

    process.exit(result.ok ? 0 : 1);
  });

// ============================================
// New Commands
// ============================================

// Init - Create new project with Git integration
program.addCommand(createInitCommand());

// Generate - Generate spec from description using LLM
program.addCommand(createGenerateCommand());

// Evolve - Evolve existing spec using LLM
program.addCommand(createEvolveCommand());

// Version - Manage spec versions
program.addCommand(createVersionCommand());

// History - Show version history
program.addCommand(createHistoryCommand());

// Diff - Compare versions
program.addCommand(createDiffCommand());

// Checkout - Switch to specific version
program.addCommand(createCheckoutCommand());

// ============================================
// Helper Functions
// ============================================

function parsePhases(phaseStr: string): ValidationPhase[] {
  if (phaseStr.includes('-')) {
    const [start, end] = phaseStr.split('-').map(Number);
    const phases: ValidationPhase[] = [];
    for (let i = start; i <= end; i++) {
      if (i >= 1 && i <= 6) {
        phases.push(i as ValidationPhase);
      }
    }
    return phases;
  }
  
  return phaseStr.split(',').map(Number).filter(n => n >= 1 && n <= 6) as ValidationPhase[];
}

function printValidationResult(result: ValidationResult, quiet: boolean): void {
  const phaseNames = [
    '',
    'Structural',
    'Referential',
    'Semantic',
    'Evolution',
    'Generation',
    'Verifiability',
  ];

  if (!quiet) {
    console.log();
    for (let phase = 1; phase <= result.phase; phase++) {
      const phaseErrors = result.errors.filter((e: ValidationError) => e.phase === phase);
      const phaseWarnings = result.warnings.filter((e: ValidationError) => e.phase === phase);
      
      if (phaseErrors.length === 0 && phaseWarnings.length === 0) {
        console.log(chalk.green(`✓ Phase ${phase}: ${phaseNames[phase]} validation passed`));
      } else if (phaseErrors.length > 0) {
        console.log(chalk.red(`✗ Phase ${phase}: ${phaseNames[phase]} validation failed`));
      } else {
        console.log(chalk.yellow(`⚠ Phase ${phase}: ${phaseNames[phase]} validation passed with warnings`));
      }
    }
    console.log();
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log(chalk.red.bold('Errors:'));
    for (const error of result.errors) {
      printError(error);
    }
    console.log();
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log(chalk.yellow.bold('Warnings:'));
    for (const warning of result.warnings) {
      printError(warning);
    }
    console.log();
  }

  // Summary
  if (result.ok) {
    if (result.warnings.length > 0) {
      console.log(chalk.green(`Validation passed with ${result.warnings.length} warning(s)`));
    } else {
      console.log(chalk.green('Validation successful!'));
    }
  } else {
    console.log(chalk.red(`Validation failed with ${result.errors.length} error(s)`));
  }
}

function printError(error: ValidationError): void {
  const levelColor = error.level === 'hard' ? chalk.red : chalk.yellow;
  const levelIcon = error.level === 'hard' ? '✗' : '⚠';
  
  console.log(`  ${levelColor(levelIcon)} [${error.code}] ${error.message}`);
  if (error.location) {
    console.log(chalk.gray(`    at: ${error.location}`));
  }
  if (error.suggestion) {
    console.log(chalk.cyan(`    fix: ${error.suggestion}`));
  }
}

// Run CLI
program.parse();
