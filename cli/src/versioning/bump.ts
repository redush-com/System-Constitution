/**
 * Version Bump Logic
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import * as semver from 'semver';
import { validateYaml } from '../validator/index.js';
import type { Git } from './git.js';

export type BumpType = 'major' | 'minor' | 'patch';

export interface BumpOptions {
  specFile: string;
  type: BumpType;
  message: string;
  changes?: ChangeEntry[];
  noCommit?: boolean;
  noTag?: boolean;
  dryRun?: boolean;
}

export interface ChangeEntry {
  op: string;
  target: string;
  field?: string;
  type?: string;
  required?: boolean;
  from?: string;
  to?: string;
}

export interface BumpResult {
  success: boolean;
  previousVersion: string;
  newVersion: string;
  commitHash?: string;
  tagName?: string;
  errors?: string[];
}

/**
 * Parse change entry from string format: op:target:field:type
 */
export function parseChangeEntry(str: string): ChangeEntry {
  const parts = str.split(':');
  const entry: ChangeEntry = {
    op: parts[0] || 'unknown',
    target: parts[1] || '',
  };
  
  if (parts[2]) entry.field = parts[2];
  if (parts[3]) entry.type = parts[3];
  
  return entry;
}

/**
 * Bump version in spec file
 */
export async function bumpVersion(
  git: Git | null,
  options: BumpOptions
): Promise<BumpResult> {
  const errors: string[] = [];
  
  // Read current spec
  const content = readFileSync(options.specFile, 'utf-8');
  const spec = parseYaml(content) as {
    project?: { versioning?: { current?: string } };
    history?: Array<{
      version: string;
      basedOn: string | null;
      changes: ChangeEntry[];
      migrations: unknown[];
      notes?: string;
    }>;
  };
  
  // Get current version
  const currentVersion = spec?.project?.versioning?.current;
  if (!currentVersion) {
    return {
      success: false,
      previousVersion: '0.0.0',
      newVersion: '0.0.0',
      errors: ['Cannot find current version in spec'],
    };
  }
  
  // Calculate new version
  const newVersion = semver.inc(currentVersion, options.type);
  if (!newVersion) {
    return {
      success: false,
      previousVersion: currentVersion,
      newVersion: currentVersion,
      errors: [`Invalid version format: ${currentVersion}`],
    };
  }
  
  // Update spec
  if (spec.project?.versioning) {
    spec.project.versioning.current = newVersion;
  }
  
  // Add history entry
  if (!spec.history) {
    spec.history = [];
  }
  
  const historyEntry = {
    version: newVersion,
    basedOn: currentVersion,
    changes: options.changes || [],
    migrations: [],
    notes: options.message,
  };
  
  spec.history.push(historyEntry);
  
  // Validate updated spec
  const updatedYaml = stringifyYaml(spec, { lineWidth: 0 });
  const validationResult = validateYaml(updatedYaml, { strict: false });
  
  if (!validationResult.ok) {
    return {
      success: false,
      previousVersion: currentVersion,
      newVersion,
      errors: validationResult.errors.map(e => `[${e.code}] ${e.message}`),
    };
  }
  
  // Dry run - don't write
  if (options.dryRun) {
    return {
      success: true,
      previousVersion: currentVersion,
      newVersion,
    };
  }
  
  // Write spec file
  writeFileSync(options.specFile, updatedYaml, 'utf-8');
  
  let commitHash: string | undefined;
  let tagName: string | undefined;
  
  // Git operations
  if (git && !options.noCommit) {
    try {
      await git.add(options.specFile);
      commitHash = await git.commit(options.message);
      
      if (!options.noTag) {
        tagName = `v${newVersion}`;
        await git.tag(tagName, options.message);
      }
    } catch (error) {
      errors.push(`Git error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return {
    success: errors.length === 0,
    previousVersion: currentVersion,
    newVersion,
    commitHash,
    tagName,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Get current version from spec file
 */
export function getCurrentVersion(specFile: string): string | null {
  try {
    const content = readFileSync(specFile, 'utf-8');
    const spec = parseYaml(content) as {
      project?: { versioning?: { current?: string } };
    };
    return spec?.project?.versioning?.current || null;
  } catch {
    return null;
  }
}
