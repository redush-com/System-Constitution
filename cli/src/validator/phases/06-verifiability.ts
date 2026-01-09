/**
 * Phase 6: Verifiability Validation
 * Validates that the system can be verified
 */

import type { ValidationError, EvoSpec, Node } from '../types';

export function validateVerifiability(spec: EvoSpec): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required pipelines
  if (spec.generation?.pipelines) {
    const pipelines = spec.generation.pipelines;

    if (!pipelines.build) {
      errors.push({
        code: 'MISSING_BUILD_PIPELINE',
        phase: 6,
        level: 'hard',
        message: "Missing required 'build' pipeline",
        location: 'generation.pipelines',
      });
    } else if (!pipelines.build.cmd || pipelines.build.cmd.trim() === '') {
      errors.push({
        code: 'EMPTY_PIPELINE_CMD',
        phase: 6,
        level: 'hard',
        message: "'build' pipeline has empty command",
        location: 'generation.pipelines.build.cmd',
      });
    }

    if (!pipelines.test) {
      errors.push({
        code: 'MISSING_TEST_PIPELINE',
        phase: 6,
        level: 'hard',
        message: "Missing required 'test' pipeline",
        location: 'generation.pipelines',
      });
    } else if (!pipelines.test.cmd || pipelines.test.cmd.trim() === '') {
      errors.push({
        code: 'EMPTY_PIPELINE_CMD',
        phase: 6,
        level: 'hard',
        message: "'test' pipeline has empty command",
        location: 'generation.pipelines.test.cmd',
      });
    }

    if (!pipelines.migrate) {
      errors.push({
        code: 'MISSING_MIGRATE_PIPELINE',
        phase: 6,
        level: 'hard',
        message: "Missing required 'migrate' pipeline",
        location: 'generation.pipelines',
      });
    } else if (!pipelines.migrate.cmd || pipelines.migrate.cmd.trim() === '') {
      errors.push({
        code: 'EMPTY_PIPELINE_CMD',
        phase: 6,
        level: 'hard',
        message: "'migrate' pipeline has empty command",
        location: 'generation.pipelines.migrate.cmd',
      });
    }
  }

  // Check scenario coverage (soft warnings)
  const commands = spec.domain.nodes.filter(n => n.kind === 'Command');
  const scenarios = spec.domain.nodes.filter(n => n.kind === 'Scenario');

  // Build set of commands covered by scenarios
  const coveredCommands = new Set<string>();
  for (const scenario of scenarios) {
    const scenarioSpec = scenario.spec as Record<string, unknown>;
    if (scenarioSpec.when && Array.isArray(scenarioSpec.when)) {
      for (const action of scenarioSpec.when) {
        const actionObj = action as Record<string, unknown>;
        if (actionObj.command && typeof actionObj.command === 'object') {
          const cmd = actionObj.command as Record<string, unknown>;
          if (cmd.id) {
            coveredCommands.add(cmd.id as string);
          }
        }
      }
    }
  }

  // Warn about uncovered commands
  for (const command of commands) {
    if (!coveredCommands.has(command.id)) {
      errors.push({
        code: 'LOW_SCENARIO_COVERAGE',
        phase: 6,
        level: 'soft',
        message: `Command '${command.id}' has no test scenarios`,
        location: `domain.nodes`,
        suggestion: `Add a Scenario that tests ${command.id}`,
      });
    }
  }

  return errors;
}
