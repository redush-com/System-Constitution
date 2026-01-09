/**
 * Phase 4: Evolution Validation
 * Validates version history and migrations
 */

import type { ValidationError, EvoSpec, HistoryEntry } from '../types';

export function validateEvolution(spec: EvoSpec): ValidationError[] {
  const errors: ValidationError[] = [];

  // If no history, skip evolution validation
  if (!spec.history || spec.history.length === 0) {
    return errors;
  }

  const history = spec.history;

  // Check first entry has basedOn: null
  if (history[0].basedOn !== null) {
    errors.push({
      code: 'INVALID_HISTORY_START',
      phase: 4,
      level: 'hard',
      message: 'First history entry must have basedOn: null',
      location: 'history[0].basedOn',
    });
  }

  // Check history chain
  for (let i = 1; i < history.length; i++) {
    const current = history[i];
    const previous = history[i - 1];

    if (current.basedOn !== previous.version) {
      errors.push({
        code: 'BROKEN_HISTORY_CHAIN',
        phase: 4,
        level: 'hard',
        message: `History chain broken: ${current.version} basedOn ${current.basedOn}, expected ${previous.version}`,
        location: `history[${i}].basedOn`,
      });
    }
  }

  // Check current version matches last history entry
  const lastVersion = history[history.length - 1].version;
  if (spec.project.versioning.current !== lastVersion) {
    errors.push({
      code: 'VERSION_MISMATCH',
      phase: 4,
      level: 'hard',
      message: `Current version ${spec.project.versioning.current} doesn't match last history version ${lastVersion}`,
      location: 'project.versioning.current',
    });
  }

  // Validate migrations
  history.forEach((entry, index) => {
    if (entry.migrations) {
      entry.migrations.forEach((migration, mIndex) => {
        const mLocation = `history[${index}].migrations[${mIndex}]`;

        if (!migration.id) {
          errors.push({
            code: 'MIGRATION_MISSING_ID',
            phase: 4,
            level: 'hard',
            message: "Migration missing 'id'",
            location: mLocation,
          });
        }

        if (!migration.kind) {
          errors.push({
            code: 'MIGRATION_MISSING_KIND',
            phase: 4,
            level: 'hard',
            message: "Migration missing 'kind'",
            location: mLocation,
          });
        } else if (!['data', 'schema', 'process'].includes(migration.kind)) {
          errors.push({
            code: 'INVALID_MIGRATION_KIND',
            phase: 4,
            level: 'hard',
            message: `Invalid migration kind: ${migration.kind}`,
            location: `${mLocation}.kind`,
            suggestion: "Valid kinds: 'data', 'schema', 'process'",
          });
        }

        if (!migration.steps || !Array.isArray(migration.steps)) {
          errors.push({
            code: 'MIGRATION_MISSING_STEPS',
            phase: 4,
            level: 'hard',
            message: "Migration missing 'steps'",
            location: mLocation,
          });
        }
      });
    }

    // Check breaking changes have migrations
    if (entry.changes) {
      const breakingOps = ['remove-field', 'rename-field', 'type-change', 'remove-node', 'rename-node'];
      
      entry.changes.forEach((change, cIndex) => {
        if (breakingOps.includes(change.op)) {
          // Check if there's a migration for this change
          const hasMigration = entry.migrations?.some(m => 
            m.id.includes(change.target) || 
            m.id.includes(change.field || '')
          );

          if (!hasMigration && (!entry.migrations || entry.migrations.length === 0)) {
            errors.push({
              code: 'MISSING_MIGRATION',
              phase: 4,
              level: 'hard',
              message: `Breaking change '${change.op}' on '${change.target}' requires migration`,
              location: `history[${index}].changes[${cIndex}]`,
              suggestion: 'Add a migration with steps to handle this change',
            });
          }
        }

        // Check required field additions have migrations
        if (change.op === 'add-field' && change.required === true) {
          const hasMigration = entry.migrations?.some(m => 
            m.id.includes(change.target) || 
            m.id.includes(change.field || '')
          );

          if (!hasMigration && (!entry.migrations || entry.migrations.length === 0)) {
            errors.push({
              code: 'MISSING_MIGRATION',
              phase: 4,
              level: 'hard',
              message: `Adding required field '${change.field}' to '${change.target}' requires migration`,
              location: `history[${index}].changes[${cIndex}]`,
              suggestion: 'Add a migration to backfill existing data',
            });
          }
        }
      });
    }
  });

  return errors;
}
