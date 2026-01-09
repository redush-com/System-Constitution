/**
 * Phase 2: Referential Validation
 * Validates references and identity
 */

import type { ValidationError, SysConst, Node } from '../types';

const NODEREF_PATTERN = /^NodeRef\(([a-z][a-z0-9_.-]*)\)$/;

export function validateReferential(spec: SysConst): ValidationError[] {
  const errors: ValidationError[] = [];

  // Build node index
  const nodeIndex = new Map<string, Node>();
  for (const node of spec.domain.nodes) {
    nodeIndex.set(node.id, node);
  }

  // Validate structure.root
  const rootRef = spec.structure.root;
  const rootMatch = NODEREF_PATTERN.exec(rootRef);
  
  if (!rootMatch) {
    errors.push({
      code: 'UNRESOLVED_ROOT',
      phase: 2,
      level: 'hard',
      message: `Invalid root reference format: ${rootRef}`,
      location: 'structure.root',
      suggestion: 'Use format: NodeRef(system.xxx)',
    });
  } else {
    const rootId = rootMatch[1];
    const rootNode = nodeIndex.get(rootId);
    
    if (!rootNode) {
      errors.push({
        code: 'UNRESOLVED_ROOT',
        phase: 2,
        level: 'hard',
        message: `Root node not found: ${rootId}`,
        location: 'structure.root',
      });
    } else if (rootNode.kind !== 'System') {
      errors.push({
        code: 'INVALID_ROOT_KIND',
        phase: 2,
        level: 'hard',
        message: `Root node must be System, got: ${rootNode.kind}`,
        location: 'structure.root',
      });
    }
  }

  // Validate all NodeRefs in children
  spec.domain.nodes.forEach((node, index) => {
    if (node.children) {
      node.children.forEach((child, childIndex) => {
        if (typeof child === 'string') {
          const match = NODEREF_PATTERN.exec(child);
          if (match) {
            const refId = match[1];
            if (!nodeIndex.has(refId)) {
              errors.push({
                code: 'UNRESOLVED_NODEREF',
                phase: 2,
                level: 'hard',
                message: `NodeRef does not resolve: ${child}`,
                location: `domain.nodes[${index}].children[${childIndex}]`,
              });
            }
          } else {
            errors.push({
              code: 'UNRESOLVED_NODEREF',
              phase: 2,
              level: 'hard',
              message: `Invalid NodeRef format: ${child}`,
              location: `domain.nodes[${index}].children[${childIndex}]`,
              suggestion: 'Use format: NodeRef(node.id)',
            });
          }
        }
      });
    }
  });

  // Check for circular children references
  const circularErrors = detectCircularChildren(spec.domain.nodes, nodeIndex);
  errors.push(...circularErrors);

  // Validate test scenario references
  if (spec.tests?.scenarios) {
    spec.tests.scenarios.forEach((ref, index) => {
      const match = NODEREF_PATTERN.exec(ref);
      if (match) {
        const refId = match[1];
        if (!nodeIndex.has(refId)) {
          errors.push({
            code: 'UNRESOLVED_NODEREF',
            phase: 2,
            level: 'hard',
            message: `Scenario reference does not resolve: ${ref}`,
            location: `tests.scenarios[${index}]`,
          });
        }
      }
    });
  }

  return errors;
}

function detectCircularChildren(
  nodes: Node[],
  nodeIndex: Map<string, Node>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): boolean {
    if (recursionStack.has(nodeId)) {
      errors.push({
        code: 'CIRCULAR_CHILDREN',
        phase: 2,
        level: 'hard',
        message: `Circular reference detected: ${[...path, nodeId].join(' -> ')}`,
        location: `domain.nodes`,
        context: { cycle: [...path, nodeId] },
      });
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodeIndex.get(nodeId);
    if (node?.children) {
      for (const child of node.children) {
        if (typeof child === 'string') {
          const match = NODEREF_PATTERN.exec(child);
          if (match) {
            const childId = match[1];
            if (dfs(childId, [...path, nodeId])) {
              return true;
            }
          }
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return errors;
}
