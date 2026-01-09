# Error Codes Reference

Complete reference for all validation error codes in System Constitution DSL v1.

## Error Format

```yaml
error:
  code: <ErrorCode>
  phase: 1-6
  level: hard | soft
  message: "Human-readable description"
  location: "JSON path to error"
  suggestion: "How to fix (optional)"
```

## Error Codes by Phase

### Phase 1: Structural Errors

| Code | Message | Cause |
|------|---------|-------|
| `STRUCTURAL_ERROR` | Invalid spec format | General structural issue |
| `MISSING_SPEC_VERSION` | Missing 'spec' field | No `spec: sysconst/v1` |
| `INVALID_SPEC_VERSION` | Invalid spec version | `spec` not `sysconst/v1` |
| `MISSING_PROJECT` | Missing 'project' field | No project block |
| `MISSING_PROJECT_ID` | Missing 'project.id' | No project ID |
| `MISSING_VERSIONING` | Missing 'project.versioning' | No versioning config |
| `MISSING_CURRENT_VERSION` | Missing 'project.versioning.current' | No current version |
| `MISSING_STRUCTURE` | Missing 'structure' field | No structure block |
| `MISSING_STRUCTURE_ROOT` | Missing 'structure.root' | No root reference |
| `MISSING_DOMAIN` | Missing 'domain' field | No domain block |
| `MISSING_DOMAIN_NODES` | Missing 'domain.nodes' | No nodes array |
| `INVALID_NODE` | Invalid node structure | Node missing required fields |
| `MISSING_NODE_KIND` | Node missing 'kind' | No kind field |
| `INVALID_NODE_KIND` | Invalid node kind | Unknown kind value |
| `MISSING_NODE_ID` | Node missing 'id' | No id field |
| `INVALID_NODE_ID` | Invalid node ID format | ID doesn't match pattern |
| `MISSING_NODE_SPEC` | Node missing 'spec' | No spec field |
| `DUPLICATE_NODE_ID` | Duplicate node ID | Same ID used twice |

### Phase 2: Reference Errors

| Code | Message | Cause |
|------|---------|-------|
| `REFERENCE_ERROR` | Reference error | General reference issue |
| `UNRESOLVED_NODEREF` | NodeRef does not resolve | Referenced node not found |
| `UNRESOLVED_ROOT` | Structure root does not resolve | Root node not found |
| `INVALID_ROOT_KIND` | Structure root must be System | Root is not System node |
| `CIRCULAR_CHILDREN` | Circular reference in children | Parent-child cycle |
| `MISSING_RENAME_OP` | Node ID changed without rename-node | ID changed between versions |
| `MISSING_REMOVE_OP` | Node removed without remove-node | Node disappeared |

### Phase 3: Semantic Errors

| Code | Message | Cause |
|------|---------|-------|
| `SEMANTIC_ERROR` | Semantic error | General semantic issue |
| `ENTITY_MISSING_FIELDS` | Entity missing 'fields' in spec | No fields defined |
| `FIELD_MISSING_TYPE` | Field missing 'type' | No type for field |
| `INVALID_FIELD_TYPE` | Invalid field type | Unknown type |
| `UNRESOLVED_REF_TYPE` | ref() type does not resolve | Referenced entity not found |
| `UNRESOLVED_ENUM_TYPE` | enum() type does not resolve | Referenced enum not found |
| `COMMAND_MISSING_INPUT` | Command missing 'input' in spec | No input defined |
| `EVENT_MISSING_PAYLOAD` | Event missing 'payload' in spec | No payload defined |
| `QUERY_MISSING_INPUT` | Query missing 'input' in spec | No input defined |
| `QUERY_MISSING_OUTPUT` | Query missing 'output' in spec | No output defined |
| `PROCESS_MISSING_TRIGGER` | Process missing 'trigger' in spec | No trigger defined |
| `INVALID_PROCESS_TRIGGER` | Process trigger does not resolve | Trigger not found |
| `INVALID_PROCESS_CHILDREN` | Process children must be Steps | Non-Step child |
| `SCENARIO_MISSING_GIVEN` | Scenario missing 'given' in spec | No given section |
| `SCENARIO_MISSING_WHEN` | Scenario missing 'when' in spec | No when section |
| `SCENARIO_MISSING_THEN` | Scenario missing 'then' in spec | No then section |
| `INVALID_CONTRACT` | Invalid contract definition | Malformed contract |
| `INVALID_INVARIANT` | Invalid invariant expression | Unparseable invariant |
| `INVALID_TEMPORAL` | Invalid temporal expression | Unparseable LTL |
| `UNRESOLVED_EFFECT_EVENT` | effects.emits event not found | Event doesn't exist |
| `UNRESOLVED_EFFECT_ENTITY` | effects.modifies entity not found | Entity doesn't exist |

### Phase 4: Evolution Errors

| Code | Message | Cause |
|------|---------|-------|
| `EVOLUTION_ERROR` | Evolution error | General evolution issue |
| `INVALID_HISTORY_START` | First history entry must have basedOn: null | Wrong first entry |
| `BROKEN_HISTORY_CHAIN` | History chain is broken | Version gap |
| `VERSION_MISMATCH` | Current version doesn't match history | Wrong current version |
| `UNDECLARED_CHANGE` | Change detected but not declared | Missing change entry |
| `MISSING_MIGRATION` | Breaking change without migration | No migration for change |
| `INVALID_MIGRATION` | Invalid migration definition | Malformed migration |
| `MIGRATION_MISSING_ID` | Migration missing 'id' | No migration ID |
| `MIGRATION_MISSING_KIND` | Migration missing 'kind' | No migration kind |
| `MIGRATION_MISSING_STEPS` | Migration missing 'steps' | No migration steps |
| `INVALID_MIGRATION_KIND` | Invalid migration kind | Unknown kind |
| `MIGRATION_VIOLATES_INVARIANT` | Migration would violate invariant | Data integrity issue |

### Phase 5: Generation Errors

| Code | Message | Cause |
|------|---------|-------|
| `GENERATION_ERROR` | Generation error | General generation issue |
| `UNCOVERED_FILE` | File not covered by any zone | Missing zone |
| `OVERLAPPING_ZONES` | Zones overlap | Multiple zones for file |
| `PRESERVE_ZONE_MODIFIED` | Plan modifies preserve zone | Writing to preserve |
| `HOOK_IN_OVERWRITE` | Hook in overwrite zone | Hook placement error |
| `DUPLICATE_HOOK_ID` | Duplicate hook ID | Same hook ID twice |
| `INVALID_HOOK_ANCHORS` | Hook anchors not distinct | Same start/end |
| `HOOK_CONTENT_MODIFIED` | Plan modifies hook content | Writing inside anchors |
| `HOOK_ANCHOR_DELETED` | Plan deletes hook anchor | Removing anchors |
| `HOOK_CONTRACT_VIOLATED` | Hook contract violated | Code doesn't match contract |

### Phase 6: Verification Errors

| Code | Message | Cause |
|------|---------|-------|
| `VERIFICATION_ERROR` | Verification error | General verification issue |
| `MISSING_BUILD_PIPELINE` | Missing 'build' pipeline | No build command |
| `MISSING_TEST_PIPELINE` | Missing 'test' pipeline | No test command |
| `MISSING_MIGRATE_PIPELINE` | Missing 'migrate' pipeline | No migrate command |
| `EMPTY_PIPELINE_CMD` | Pipeline command is empty | Empty cmd string |
| `SCENARIO_INVALID_ENTITY` | Scenario references invalid entity | Entity not found |
| `SCENARIO_INVALID_COMMAND` | Scenario references invalid command | Command not found |
| `SCENARIO_INVALID_EVENT` | Scenario references invalid event | Event not found |
| `LOW_SCENARIO_COVERAGE` | Insufficient scenario coverage | Missing test coverage |
| `UNVERIFIED_CONTRACT` | Contract has no verification scenario | Contract not tested |

## Contract Violations

| Code | Message | Cause |
|------|---------|-------|
| `CONTRACT_VIOLATION` | Contract violated | General contract issue |
| `INVARIANT_VIOLATION` | Invariant violated | Data constraint failed |
| `TEMPORAL_VIOLATION` | Temporal contract violated | Process ordering failed |
| `API_COMPAT_VIOLATION` | API compatibility violated | Breaking API change |
| `POLICY_VIOLATION` | Policy violated | Business rule failed |

## Error Levels

### Hard Errors

Hard errors **block** generation and deployment:

```yaml
error:
  code: ENTITY_MISSING_FIELDS
  level: hard
  message: "Entity 'entity.order' missing required 'fields' in spec"
```

**Must be fixed before proceeding.**

### Soft Errors (Warnings)

Soft errors generate **warnings** but allow continuation:

```yaml
error:
  code: LOW_SCENARIO_COVERAGE
  level: soft
  message: "Command 'cmd.order.cancel' has no test scenarios"
```

**Should be fixed but not blocking.**

## Example Errors

### Missing Required Field

```yaml
error:
  code: ENTITY_MISSING_FIELDS
  phase: 3
  level: hard
  message: "Entity 'entity.order' missing required 'fields' in spec"
  location: "domain.nodes[5].spec"
  suggestion: "Add 'fields' object to entity spec"
```

### Unresolved Reference

```yaml
error:
  code: UNRESOLVED_NODEREF
  phase: 2
  level: hard
  message: "NodeRef(entity.unknown) does not resolve"
  location: "domain.nodes[3].children[2]"
  suggestion: "Check that 'entity.unknown' exists or fix the reference"
```

### Missing Migration

```yaml
error:
  code: MISSING_MIGRATION
  phase: 4
  level: hard
  message: "Field removal requires migration: entity.customer.legacyId"
  location: "history[2]"
  suggestion: "Add migration with backfill or data cleanup steps"
```

### Preserve Zone Modified

```yaml
error:
  code: PRESERVE_ZONE_MODIFIED
  phase: 5
  level: hard
  message: "Plan attempts to modify preserve zone: apps/frontend/**"
  location: "plan.changes[3]"
  suggestion: "Remove changes to preserve zone or change zone mode"
```

### Contract Violation

```yaml
error:
  code: INVARIANT_VIOLATION
  phase: 3
  level: hard
  message: "Invariant violated: totalCents >= 0"
  location: "domain.nodes[5].contracts[0]"
  context:
    contract: "totalCents >= 0"
    field: "totalCents"
    value: -100
```

## Handling Errors

### In CLI

```bash
$ sysconst validate myspec.yaml

✗ Phase 3: Semantic validation failed

Errors:
  [ENTITY_MISSING_FIELDS] Entity 'entity.order' missing required 'fields' in spec
    at: domain.nodes[5].spec
    fix: Add 'fields' object to entity spec

Validation failed with 1 error(s)
```

### In Code

```typescript
import { validate } from '@sysconst/validator';

const result = validate(spec);

if (!result.ok) {
  for (const error of result.errors) {
    console.error(`[${error.code}] ${error.message}`);
    console.error(`  at: ${error.location}`);
    if (error.suggestion) {
      console.error(`  fix: ${error.suggestion}`);
    }
  }
}
```

### Filtering by Phase

```typescript
// Get only structural errors
const structuralErrors = result.errors.filter(e => e.phase === 1);

// Get only hard errors
const hardErrors = result.errors.filter(e => e.level === 'hard');
```
