/**
 * Phase 1: Structural Validation
 * Validates syntax and required fields
 */

import type { ValidationError, SysConst, Node } from '../types';

const VALID_KINDS = [
  'System',
  'Module',
  'Entity',
  'Enum',
  'Value',
  'Interface',
  'Command',
  'Event',
  'Query',
  'Process',
  'Step',
  'Policy',
  'Scenario',
  'Contract',
];

const ID_PATTERN = /^[a-z][a-z0-9_.-]*$/;

export function validateStructural(spec: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if spec is an object
  if (!spec || typeof spec !== 'object') {
    errors.push({
      code: 'STRUCTURAL_ERROR',
      phase: 1,
      level: 'hard',
      message: 'Spec must be an object',
      location: '',
    });
    return errors;
  }

  const s = spec as Record<string, unknown>;

  // Check spec version
  if (!('spec' in s)) {
    errors.push({
      code: 'MISSING_SPEC_VERSION',
      phase: 1,
      level: 'hard',
      message: "Missing 'spec' field",
      location: '',
      suggestion: "Add 'spec: sysconst/v1' at the root",
    });
  } else if (s.spec !== 'sysconst/v1') {
    errors.push({
      code: 'INVALID_SPEC_VERSION',
      phase: 1,
      level: 'hard',
      message: `Invalid spec version: ${s.spec}`,
      location: 'spec',
      suggestion: "Use 'spec: sysconst/v1'",
    });
  }

  // Check project
  if (!('project' in s)) {
    errors.push({
      code: 'MISSING_PROJECT',
      phase: 1,
      level: 'hard',
      message: "Missing 'project' field",
      location: '',
    });
  } else {
    const project = s.project as Record<string, unknown>;
    
    if (!project.id) {
      errors.push({
        code: 'MISSING_PROJECT_ID',
        phase: 1,
        level: 'hard',
        message: "Missing 'project.id'",
        location: 'project',
      });
    }

    if (!project.versioning) {
      errors.push({
        code: 'MISSING_VERSIONING',
        phase: 1,
        level: 'hard',
        message: "Missing 'project.versioning'",
        location: 'project',
      });
    } else {
      const versioning = project.versioning as Record<string, unknown>;
      if (!versioning.current) {
        errors.push({
          code: 'MISSING_CURRENT_VERSION',
          phase: 1,
          level: 'hard',
          message: "Missing 'project.versioning.current'",
          location: 'project.versioning',
        });
      }
    }
  }

  // Check structure
  if (!('structure' in s)) {
    errors.push({
      code: 'MISSING_STRUCTURE',
      phase: 1,
      level: 'hard',
      message: "Missing 'structure' field",
      location: '',
    });
  } else {
    const structure = s.structure as Record<string, unknown>;
    if (!structure.root) {
      errors.push({
        code: 'MISSING_STRUCTURE_ROOT',
        phase: 1,
        level: 'hard',
        message: "Missing 'structure.root'",
        location: 'structure',
      });
    }
  }

  // Check domain
  if (!('domain' in s)) {
    errors.push({
      code: 'MISSING_DOMAIN',
      phase: 1,
      level: 'hard',
      message: "Missing 'domain' field",
      location: '',
    });
  } else {
    const domain = s.domain as Record<string, unknown>;
    if (!domain.nodes || !Array.isArray(domain.nodes)) {
      errors.push({
        code: 'MISSING_DOMAIN_NODES',
        phase: 1,
        level: 'hard',
        message: "Missing or invalid 'domain.nodes'",
        location: 'domain',
      });
    } else {
      // Validate each node
      const seenIds = new Set<string>();
      
      domain.nodes.forEach((node: unknown, index: number) => {
        const nodeErrors = validateNode(node, `domain.nodes[${index}]`, seenIds);
        errors.push(...nodeErrors);
      });
    }
  }

  return errors;
}

function validateNode(
  node: unknown,
  location: string,
  seenIds: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!node || typeof node !== 'object') {
    errors.push({
      code: 'INVALID_NODE',
      phase: 1,
      level: 'hard',
      message: 'Node must be an object',
      location,
    });
    return errors;
  }

  const n = node as Record<string, unknown>;

  // Check kind
  if (!('kind' in n)) {
    errors.push({
      code: 'MISSING_NODE_KIND',
      phase: 1,
      level: 'hard',
      message: "Node missing 'kind'",
      location,
    });
  } else if (!VALID_KINDS.includes(n.kind as string)) {
    errors.push({
      code: 'INVALID_NODE_KIND',
      phase: 1,
      level: 'hard',
      message: `Invalid node kind: ${n.kind}`,
      location: `${location}.kind`,
      suggestion: `Valid kinds: ${VALID_KINDS.join(', ')}`,
    });
  }

  // Check id
  if (!('id' in n)) {
    errors.push({
      code: 'MISSING_NODE_ID',
      phase: 1,
      level: 'hard',
      message: "Node missing 'id'",
      location,
    });
  } else {
    const id = n.id as string;
    
    if (!ID_PATTERN.test(id)) {
      errors.push({
        code: 'INVALID_NODE_ID',
        phase: 1,
        level: 'hard',
        message: `Invalid node ID format: ${id}`,
        location: `${location}.id`,
        suggestion: 'ID must match pattern: ^[a-z][a-z0-9_.-]*$',
      });
    }

    if (seenIds.has(id)) {
      errors.push({
        code: 'DUPLICATE_NODE_ID',
        phase: 1,
        level: 'hard',
        message: `Duplicate node ID: ${id}`,
        location: `${location}.id`,
      });
    } else {
      seenIds.add(id);
    }
  }

  // Check spec
  if (!('spec' in n)) {
    errors.push({
      code: 'MISSING_NODE_SPEC',
      phase: 1,
      level: 'hard',
      message: "Node missing 'spec'",
      location,
    });
  } else if (typeof n.spec !== 'object' || n.spec === null) {
    errors.push({
      code: 'MISSING_NODE_SPEC',
      phase: 1,
      level: 'hard',
      message: "'spec' must be an object",
      location: `${location}.spec`,
    });
  }

  // Check children if present
  if ('children' in n && n.children !== undefined) {
    if (!Array.isArray(n.children)) {
      errors.push({
        code: 'STRUCTURAL_ERROR',
        phase: 1,
        level: 'hard',
        message: "'children' must be an array",
        location: `${location}.children`,
      });
    }
  }

  return errors;
}
