/**
 * Phase 5: Generation Safety Validation
 * Validates code generation rules
 */

import type { ValidationError, EvoSpec, Zone, Hook } from '../types';

export function validateGeneration(spec: EvoSpec): ValidationError[] {
  const errors: ValidationError[] = [];

  // If no generation config, skip
  if (!spec.generation) {
    return errors;
  }

  const gen = spec.generation;

  // Validate zones
  if (gen.zones) {
    errors.push(...validateZones(gen.zones));
  }

  // Validate hooks
  if (gen.hooks) {
    errors.push(...validateHooks(gen.hooks, gen.zones || []));
  }

  return errors;
}

function validateZones(zones: Zone[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenPaths = new Set<string>();

  zones.forEach((zone, index) => {
    const location = `generation.zones[${index}]`;

    if (!zone.path) {
      errors.push({
        code: 'GENERATION_ERROR',
        phase: 5,
        level: 'hard',
        message: "Zone missing 'path'",
        location,
      });
    }

    if (!zone.mode) {
      errors.push({
        code: 'GENERATION_ERROR',
        phase: 5,
        level: 'hard',
        message: "Zone missing 'mode'",
        location,
      });
    } else if (!['overwrite', 'anchored', 'preserve', 'spec-controlled'].includes(zone.mode)) {
      errors.push({
        code: 'GENERATION_ERROR',
        phase: 5,
        level: 'hard',
        message: `Invalid zone mode: ${zone.mode}`,
        location: `${location}.mode`,
        suggestion: "Valid modes: 'overwrite', 'anchored', 'preserve', 'spec-controlled'",
      });
    }

    // Check for duplicate paths (simplified check)
    if (zone.path && seenPaths.has(zone.path)) {
      errors.push({
        code: 'OVERLAPPING_ZONES',
        phase: 5,
        level: 'hard',
        message: `Duplicate zone path: ${zone.path}`,
        location,
      });
    }
    if (zone.path) {
      seenPaths.add(zone.path);
    }
  });

  return errors;
}

function validateHooks(hooks: Hook[], zones: Zone[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  // Build zone lookup for checking hook placement
  const overwriteZones = zones
    .filter(z => z.mode === 'overwrite')
    .map(z => z.path);

  hooks.forEach((hook, index) => {
    const location = `generation.hooks[${index}]`;

    // Check unique ID
    if (!hook.id) {
      errors.push({
        code: 'GENERATION_ERROR',
        phase: 5,
        level: 'hard',
        message: "Hook missing 'id'",
        location,
      });
    } else {
      if (seenIds.has(hook.id)) {
        errors.push({
          code: 'DUPLICATE_HOOK_ID',
          phase: 5,
          level: 'hard',
          message: `Duplicate hook ID: ${hook.id}`,
          location,
        });
      }
      seenIds.add(hook.id);
    }

    // Check location
    if (!hook.location) {
      errors.push({
        code: 'GENERATION_ERROR',
        phase: 5,
        level: 'hard',
        message: "Hook missing 'location'",
        location,
      });
    } else {
      if (!hook.location.file) {
        errors.push({
          code: 'GENERATION_ERROR',
          phase: 5,
          level: 'hard',
          message: "Hook location missing 'file'",
          location: `${location}.location`,
        });
      }

      if (!hook.location.anchorStart || !hook.location.anchorEnd) {
        errors.push({
          code: 'INVALID_HOOK_ANCHORS',
          phase: 5,
          level: 'hard',
          message: "Hook location missing 'anchorStart' or 'anchorEnd'",
          location: `${location}.location`,
        });
      } else if (hook.location.anchorStart === hook.location.anchorEnd) {
        errors.push({
          code: 'INVALID_HOOK_ANCHORS',
          phase: 5,
          level: 'hard',
          message: 'Hook anchorStart and anchorEnd must be different',
          location: `${location}.location`,
        });
      }

      // Check hook is not in overwrite zone
      if (hook.location.file) {
        for (const zonePath of overwriteZones) {
          if (matchesGlob(hook.location.file, zonePath)) {
            errors.push({
              code: 'HOOK_IN_OVERWRITE',
              phase: 5,
              level: 'hard',
              message: `Hook '${hook.id}' is in overwrite zone: ${zonePath}`,
              location: `${location}.location.file`,
              suggestion: 'Move hook to an anchored zone',
            });
            break;
          }
        }
      }
    }
  });

  return errors;
}

/**
 * Simple glob matching (supports ** and *)
 */
function matchesGlob(path: string, pattern: string): boolean {
  // Normalize paths
  const normalizedPath = path.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  // Convert glob to regex
  const regexPattern = normalizedPattern
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/{{GLOBSTAR}}/g, '.*')
    .replace(/\//g, '\\/');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(normalizedPath);
}
