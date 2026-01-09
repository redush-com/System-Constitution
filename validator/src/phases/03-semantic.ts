/**
 * Phase 3: Semantic Validation
 * Validates kind-specific rules and types
 */

import type { ValidationError, SysConst, Node } from '../types';

const NODEREF_PATTERN = /^NodeRef\(([a-z][a-z0-9_.-]*)\)$/;

export function validateSemantic(spec: SysConst): ValidationError[] {
  const errors: ValidationError[] = [];

  // Build indices
  const nodeIndex = new Map<string, Node>();
  const entityIds = new Set<string>();
  const enumIds = new Set<string>();
  const commandIds = new Set<string>();
  const eventIds = new Set<string>();
  const stepIds = new Set<string>();

  for (const node of spec.domain.nodes) {
    nodeIndex.set(node.id, node);
    switch (node.kind) {
      case 'Entity':
        entityIds.add(node.id);
        break;
      case 'Enum':
        enumIds.add(node.id);
        break;
      case 'Command':
        commandIds.add(node.id);
        break;
      case 'Event':
        eventIds.add(node.id);
        break;
      case 'Step':
        stepIds.add(node.id);
        break;
    }
  }

  // Validate each node based on kind
  spec.domain.nodes.forEach((node, index) => {
    const location = `domain.nodes[${index}]`;
    const nodeErrors = validateNodeSemantic(
      node,
      location,
      { entityIds, enumIds, commandIds, eventIds, stepIds, nodeIndex }
    );
    errors.push(...nodeErrors);
  });

  return errors;
}

interface ValidationContext {
  entityIds: Set<string>;
  enumIds: Set<string>;
  commandIds: Set<string>;
  eventIds: Set<string>;
  stepIds: Set<string>;
  nodeIndex: Map<string, Node>;
}

function validateNodeSemantic(
  node: Node,
  location: string,
  ctx: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const spec = node.spec as Record<string, unknown>;

  switch (node.kind) {
    case 'System':
      if (!spec.goals || !Array.isArray(spec.goals)) {
        errors.push({
          code: 'SEMANTIC_ERROR',
          phase: 3,
          level: 'hard',
          message: "System must have 'goals' array in spec",
          location: `${location}.spec`,
        });
      }
      break;

    case 'Entity':
      errors.push(...validateEntity(node, location, ctx));
      break;

    case 'Enum':
      if (!spec.values || !Array.isArray(spec.values)) {
        errors.push({
          code: 'SEMANTIC_ERROR',
          phase: 3,
          level: 'hard',
          message: "Enum must have 'values' array in spec",
          location: `${location}.spec`,
        });
      }
      break;

    case 'Command':
      errors.push(...validateCommand(node, location, ctx));
      break;

    case 'Event':
      if (!spec.payload || typeof spec.payload !== 'object') {
        errors.push({
          code: 'EVENT_MISSING_PAYLOAD',
          phase: 3,
          level: 'hard',
          message: "Event must have 'payload' in spec",
          location: `${location}.spec`,
        });
      }
      break;

    case 'Query':
      if (!spec.input || typeof spec.input !== 'object') {
        errors.push({
          code: 'QUERY_MISSING_INPUT',
          phase: 3,
          level: 'hard',
          message: "Query must have 'input' in spec",
          location: `${location}.spec`,
        });
      }
      if (!spec.output || typeof spec.output !== 'object') {
        errors.push({
          code: 'QUERY_MISSING_OUTPUT',
          phase: 3,
          level: 'hard',
          message: "Query must have 'output' in spec",
          location: `${location}.spec`,
        });
      }
      break;

    case 'Process':
      errors.push(...validateProcess(node, location, ctx));
      break;

    case 'Step':
      if (!spec.action || typeof spec.action !== 'string') {
        errors.push({
          code: 'SEMANTIC_ERROR',
          phase: 3,
          level: 'hard',
          message: "Step must have 'action' string in spec",
          location: `${location}.spec`,
        });
      }
      break;

    case 'Scenario':
      errors.push(...validateScenario(node, location, ctx));
      break;
  }

  // Validate contracts
  if (node.contracts) {
    node.contracts.forEach((contract, cIndex) => {
      if (!contract.level) {
        contract.level = 'hard'; // Default
      }
      if (!contract.type && !contract.invariant && !contract.temporal && !contract.rule) {
        errors.push({
          code: 'INVALID_CONTRACT',
          phase: 3,
          level: 'hard',
          message: 'Contract must have type, invariant, temporal, or rule',
          location: `${location}.contracts[${cIndex}]`,
        });
      }
    });
  }

  return errors;
}

function validateEntity(
  node: Node,
  location: string,
  ctx: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const spec = node.spec as Record<string, unknown>;

  if (!spec.fields || typeof spec.fields !== 'object') {
    errors.push({
      code: 'ENTITY_MISSING_FIELDS',
      phase: 3,
      level: 'hard',
      message: "Entity must have 'fields' in spec",
      location: `${location}.spec`,
    });
    return errors;
  }

  const fields = spec.fields as Record<string, unknown>;
  
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    if (!fieldDef || typeof fieldDef !== 'object') {
      errors.push({
        code: 'FIELD_MISSING_TYPE',
        phase: 3,
        level: 'hard',
        message: `Field '${fieldName}' must be an object`,
        location: `${location}.spec.fields.${fieldName}`,
      });
      continue;
    }

    const field = fieldDef as Record<string, unknown>;
    
    if (!field.type) {
      errors.push({
        code: 'FIELD_MISSING_TYPE',
        phase: 3,
        level: 'hard',
        message: `Field '${fieldName}' missing 'type'`,
        location: `${location}.spec.fields.${fieldName}`,
      });
      continue;
    }

    // Validate type references
    const typeStr = field.type as string;
    const refMatch = typeStr.match(/^ref\(([^)]+)\)$/);
    const enumMatch = typeStr.match(/^enum\(([^)]+)\)$/);

    if (refMatch) {
      const refId = refMatch[1];
      if (!ctx.entityIds.has(refId)) {
        errors.push({
          code: 'UNRESOLVED_REF_TYPE',
          phase: 3,
          level: 'hard',
          message: `Referenced entity not found: ${refId}`,
          location: `${location}.spec.fields.${fieldName}.type`,
        });
      }
    } else if (enumMatch) {
      // Enum references use name, not ID - skip validation for now
      // In a full implementation, we'd map enum names to IDs
    }
  }

  return errors;
}

function validateCommand(
  node: Node,
  location: string,
  ctx: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const spec = node.spec as Record<string, unknown>;

  if (!spec.input || typeof spec.input !== 'object') {
    errors.push({
      code: 'COMMAND_MISSING_INPUT',
      phase: 3,
      level: 'hard',
      message: "Command must have 'input' in spec",
      location: `${location}.spec`,
    });
  }

  // Validate effects
  if (spec.effects && typeof spec.effects === 'object') {
    const effects = spec.effects as Record<string, unknown>;
    
    if (effects.emits && Array.isArray(effects.emits)) {
      effects.emits.forEach((eventId: string, eIndex: number) => {
        if (!ctx.eventIds.has(eventId)) {
          errors.push({
            code: 'UNRESOLVED_EFFECT_EVENT',
            phase: 3,
            level: 'hard',
            message: `Emitted event not found: ${eventId}`,
            location: `${location}.spec.effects.emits[${eIndex}]`,
          });
        }
      });
    }

    if (effects.modifies && Array.isArray(effects.modifies)) {
      effects.modifies.forEach((entityId: string, eIndex: number) => {
        if (!ctx.entityIds.has(entityId)) {
          errors.push({
            code: 'UNRESOLVED_EFFECT_ENTITY',
            phase: 3,
            level: 'hard',
            message: `Modified entity not found: ${entityId}`,
            location: `${location}.spec.effects.modifies[${eIndex}]`,
          });
        }
      });
    }
  }

  return errors;
}

function validateProcess(
  node: Node,
  location: string,
  ctx: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const spec = node.spec as Record<string, unknown>;

  if (!spec.trigger) {
    errors.push({
      code: 'PROCESS_MISSING_TRIGGER',
      phase: 3,
      level: 'hard',
      message: "Process must have 'trigger' in spec",
      location: `${location}.spec`,
    });
  } else {
    const trigger = spec.trigger as string;
    if (!ctx.commandIds.has(trigger) && !ctx.eventIds.has(trigger)) {
      errors.push({
        code: 'INVALID_PROCESS_TRIGGER',
        phase: 3,
        level: 'hard',
        message: `Process trigger not found: ${trigger}`,
        location: `${location}.spec.trigger`,
      });
    }
  }

  // Validate children are Steps
  if (node.children) {
    node.children.forEach((child, cIndex) => {
      if (typeof child === 'string') {
        const match = NODEREF_PATTERN.exec(child);
        if (match) {
          const childId = match[1];
          const childNode = ctx.nodeIndex.get(childId);
          if (childNode && childNode.kind !== 'Step') {
            errors.push({
              code: 'INVALID_PROCESS_CHILDREN',
              phase: 3,
              level: 'hard',
              message: `Process children must be Steps, got: ${childNode.kind}`,
              location: `${location}.children[${cIndex}]`,
            });
          }
        }
      }
    });
  }

  return errors;
}

function validateScenario(
  node: Node,
  location: string,
  ctx: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const spec = node.spec as Record<string, unknown>;

  if (!spec.given || !Array.isArray(spec.given)) {
    errors.push({
      code: 'SCENARIO_MISSING_GIVEN',
      phase: 3,
      level: 'hard',
      message: "Scenario must have 'given' array in spec",
      location: `${location}.spec`,
    });
  }

  if (!spec.when || !Array.isArray(spec.when)) {
    errors.push({
      code: 'SCENARIO_MISSING_WHEN',
      phase: 3,
      level: 'hard',
      message: "Scenario must have 'when' array in spec",
      location: `${location}.spec`,
    });
  }

  if (!spec.then || !Array.isArray(spec.then)) {
    errors.push({
      code: 'SCENARIO_MISSING_THEN',
      phase: 3,
      level: 'hard',
      message: "Scenario must have 'then' array in spec",
      location: `${location}.spec`,
    });
  }

  return errors;
}
