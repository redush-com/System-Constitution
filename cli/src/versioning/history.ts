/**
 * History Management
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import type { Git, GitLogEntry } from './git.js';

export interface HistoryEntry {
  version: string;
  basedOn: string | null;
  changes: Array<{
    op: string;
    target: string;
    field?: string;
    type?: string;
  }>;
  migrations: unknown[];
  notes?: string;
}

export interface HistoryEntryWithGit extends HistoryEntry {
  git?: {
    hash: string;
    date: string;
    message: string;
    author: string;
  };
}

export interface VersionConsistencyResult {
  ok: boolean;
  specVersion: string;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    suggestion?: string;
  }[];
}

/**
 * Get history from spec file
 */
export function getHistory(specFile: string): HistoryEntry[] {
  try {
    const content = readFileSync(specFile, 'utf-8');
    const spec = parseYaml(content) as {
      history?: HistoryEntry[];
    };
    return spec?.history || [];
  } catch {
    return [];
  }
}

/**
 * Get history with Git information
 */
export async function getHistoryWithGit(
  specFile: string,
  git: Git | null,
  tagPrefix: string = 'v'
): Promise<HistoryEntryWithGit[]> {
  const history = getHistory(specFile);
  
  if (!git) {
    return history;
  }
  
  const tags = await git.getTags();
  const result: HistoryEntryWithGit[] = [];
  
  for (const entry of history) {
    const tagName = `${tagPrefix}${entry.version}`;
    const entryWithGit: HistoryEntryWithGit = { ...entry };
    
    if (tags.includes(tagName)) {
      try {
        const commit = await git.getTagCommit(tagName);
        if (commit) {
          const log = await git.log(100);
          const logEntry = log.find(l => l.hash.startsWith(commit.substring(0, 7)));
          if (logEntry) {
            entryWithGit.git = {
              hash: logEntry.hash.substring(0, 7),
              date: logEntry.date,
              message: logEntry.message,
              author: logEntry.author,
            };
          }
        }
      } catch {
        // Ignore git errors
      }
    }
    
    result.push(entryWithGit);
  }
  
  return result;
}

/**
 * Check version consistency
 */
export async function checkVersionConsistency(
  specFile: string,
  git: Git | null,
  tagPrefix: string = 'v'
): Promise<VersionConsistencyResult> {
  const checks: VersionConsistencyResult['checks'] = [];
  
  // Get spec version
  let specVersion = '0.0.0';
  try {
    const content = readFileSync(specFile, 'utf-8');
    const spec = parseYaml(content) as {
      project?: { versioning?: { current?: string } };
    };
    specVersion = spec?.project?.versioning?.current || '0.0.0';
  } catch {
    checks.push({
      name: 'Spec readable',
      passed: false,
      message: 'Cannot read spec file',
      suggestion: 'Check file path and permissions',
    });
    return { ok: false, specVersion, checks };
  }
  
  checks.push({
    name: 'Spec version',
    passed: true,
    message: `Version: ${specVersion}`,
  });
  
  // Check Git tag
  if (git) {
    const tagName = `${tagPrefix}${specVersion}`;
    const tags = await git.getTags();
    
    if (tags.includes(tagName)) {
      checks.push({
        name: 'Git tag',
        passed: true,
        message: `Tag ${tagName} exists and matches`,
      });
    } else {
      checks.push({
        name: 'Git tag',
        passed: false,
        message: `Tag ${tagName} not found`,
        suggestion: 'Run: sysconst version tag',
      });
    }
    
    // Check uncommitted changes
    const hasChanges = await git.hasUncommittedChanges();
    if (hasChanges) {
      checks.push({
        name: 'Uncommitted changes',
        passed: false,
        message: 'Uncommitted changes in working directory',
        suggestion: 'Run: git add && git commit',
      });
    } else {
      checks.push({
        name: 'Uncommitted changes',
        passed: true,
        message: 'No uncommitted changes',
      });
    }
  }
  
  // Check history chain
  const history = getHistory(specFile);
  let historyValid = true;
  const versions = new Set(history.map(h => h.version));
  
  for (const entry of history) {
    if (entry.basedOn !== null && !versions.has(entry.basedOn)) {
      historyValid = false;
      break;
    }
  }
  
  if (historyValid) {
    checks.push({
      name: 'History chain',
      passed: true,
      message: `Valid (${history.length} versions)`,
    });
  } else {
    checks.push({
      name: 'History chain',
      passed: false,
      message: 'Broken history chain',
      suggestion: 'Check basedOn references in history',
    });
  }
  
  // Check current version is in history
  const currentInHistory = history.some(h => h.version === specVersion);
  if (currentInHistory) {
    checks.push({
      name: 'Current version in history',
      passed: true,
      message: 'Current version exists in history',
    });
  } else {
    checks.push({
      name: 'Current version in history',
      passed: false,
      message: 'Current version not found in history',
      suggestion: 'Add history entry for current version',
    });
  }
  
  const ok = checks.every(c => c.passed);
  return { ok, specVersion, checks };
}

/**
 * Get spec content at a specific version
 */
export async function getSpecAtVersion(
  specFile: string,
  version: string,
  git: Git,
  tagPrefix: string = 'v'
): Promise<string | null> {
  const tagName = `${tagPrefix}${version}`;
  const { basename } = await import('path');
  const fileName = basename(specFile);
  
  try {
    return await git.show(tagName, fileName);
  } catch {
    return null;
  }
}
