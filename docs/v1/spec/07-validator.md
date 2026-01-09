# 7. Validator

The Validator ensures SysConst documents are correct, consistent, and safe for code generation.

## 7.1 Purpose

The Validator guarantees that:

1. **Spec is executable** — Can be used for code generation
2. **Changes are safe** — Migrations exist for breaking changes
3. **LLM generation is bounded** — Clear limits on what can be modified
4. **Evolution is traceable** — Complete history with no gaps

## 7.2 Validation Phases

Validation proceeds in strict phases. If a phase fails, subsequent phases are **not executed**.

```
Phase 1 → Structural
Phase 2 → Referential
Phase 3 → Semantic
Phase 4 → Evolution
Phase 5 → Generation Safety
Phase 6 → Verifiability
```

## 7.3 Phase 1: Structural Validation

Validates syntax and required fields.

### Rules

| Rule | Level |
|------|-------|
| `spec` MUST equal `sysconst/v1` | hard |
| `project.id` MUST exist | hard |
| `project.versioning.strategy` MUST exist | hard |
| `project.versioning.current` MUST exist | hard |
| `structure.root` MUST exist | hard |
| `domain.nodes` MUST be array | hard |
| Document MUST be valid JSON/YAML | hard |

### Node Rules

For every node:

| Rule | Level |
|------|-------|
| `kind` MUST exist and be valid NodeKind | hard |
| `id` MUST exist | hard |
| `id` MUST match `^[a-z][a-z0-9_.-]*$` | hard |
| `spec` MUST exist and be object | hard |
| `children` MUST be array if present | hard |
| No duplicate `id` values | hard |

### Error Class

```yaml
error:
  code: STRUCTURAL_ERROR
  level: hard
  message: "Missing required field: project.versioning.current"
  location: "project.versioning"
```

## 7.4 Phase 2: Referential Validation

Validates references and identity.

### NodeRef Resolution

| Rule | Level |
|------|-------|
| Every `NodeRef(x)` MUST resolve to existing node | hard |
| `structure.root` MUST reference existing System node | hard |
| All `children` references MUST resolve | hard |

### Cycle Detection

| Rule | Level |
|------|-------|
| No cycles in `children` hierarchy | hard |
| Process ↔ Step cycles allowed (via spec, not children) | - |
| Event ↔ Command cycles allowed (via spec, not children) | - |

### Stable Identity

| Rule | Level |
|------|-------|
| Node `id` MUST NOT change without `rename-node` operation | hard |
| Removed nodes MUST have `remove-node` operation | hard |

### Error Class

```yaml
error:
  code: REFERENCE_ERROR
  level: hard
  message: "NodeRef(entity.unknown) does not resolve"
  location: "domain.nodes[3].children[0]"
```

## 7.5 Phase 3: Semantic Validation

Validates kind-specific rules and types.

### Entity Rules

| Rule | Level |
|------|-------|
| MUST have `fields` in spec | hard |
| Each field MUST have `type` | hard |
| `ref(entity.x)` MUST reference existing Entity | hard |
| `enum(X)` MUST reference existing Enum | hard |

### Command Rules

| Rule | Level |
|------|-------|
| MUST have `input` in spec | hard |
| `effects.emits` events MUST exist | hard |
| `effects.modifies` entities MUST exist | hard |

### Event Rules

| Rule | Level |
|------|-------|
| MUST have `payload` in spec | hard |

### Process Rules

| Rule | Level |
|------|-------|
| MUST have `trigger` in spec | hard |
| `trigger` MUST reference Command or Event | hard |
| All `children` MUST be Steps | hard |
| State vars MUST have valid types | hard |

### Scenario Rules

| Rule | Level |
|------|-------|
| MUST have `given`, `when`, `then` in spec | hard |
| Referenced entities in `seed` MUST exist | hard |
| Referenced commands in `when` MUST exist | hard |
| Referenced events in `then` MUST exist | hard |

### Contract Rules

| Rule | Level |
|------|-------|
| MUST have `type` or recognizable form | hard |
| MUST have `level` (hard/soft) | hard |
| Invariant expressions MUST be parseable | hard |
| Temporal expressions MUST be valid LTL | hard |

### Error Class

```yaml
error:
  code: SEMANTIC_ERROR
  level: hard
  message: "Entity 'entity.order' missing required 'fields' in spec"
  location: "domain.nodes[5].spec"
```

## 7.6 Phase 4: Evolution Validation

Validates version history and migrations.

### History Chain

| Rule | Level |
|------|-------|
| `history[0].basedOn` MUST be null | hard |
| Each version's `basedOn` MUST equal previous version | hard |
| `project.versioning.current` MUST equal last history version | hard |
| No gaps in version chain | hard |

### Change Classification

| Change | Requirement |
|--------|-------------|
| `add-field` (optional) | OK |
| `add-field` (required) | Migration REQUIRED |
| `remove-field` | Migration REQUIRED |
| `rename-field` | Migration REQUIRED |
| `type-change` | Migration REQUIRED |
| `remove-node` | Migration REQUIRED |
| `rename-node` | Migration REQUIRED |

### Implicit Change Detection

| Rule | Level |
|------|-------|
| All changes between versions MUST be declared in `changes` | hard |
| Undeclared changes cause EVOLUTION_ERROR | hard |

### Migration Validation

| Rule | Level |
|------|-------|
| Migration MUST have `id`, `kind`, `steps` | hard |
| `kind` MUST be data/schema/process | hard |
| Migration SHOULD have `validate` assertions | soft |
| Migrations MUST NOT leave data in undefined state | hard |
| Migrations MUST NOT violate hard invariants | hard |

### Error Class

```yaml
error:
  code: EVOLUTION_ERROR
  level: hard
  message: "Field removal without migration: entity.customer.legacyId"
  location: "history[2].changes"
```

## 7.7 Phase 5: Generation Safety Validation

Validates code generation rules.

### Zone Coverage

| Rule | Level |
|------|-------|
| Every file MUST be covered by exactly one zone | hard |
| No overlapping zones | hard |
| `preserve` zones MUST NOT be in generation plan | hard |
| `overwrite` zones MUST NOT contain hooks | hard |

### Hook Validation

| Rule | Level |
|------|-------|
| Each hook MUST have unique `id` | hard |
| `anchorStart` and `anchorEnd` MUST be distinct | hard |
| Hook MUST be in `anchored` zone | hard |
| Hook contract MUST be verifiable | soft |

### Plan Validation

If LLM generates a plan:

| Rule | Level |
|------|-------|
| Plan MUST NOT write to `preserve` zones | hard |
| Plan MUST NOT modify hook content | hard |
| Plan MUST NOT delete hook anchors | hard |
| Plan MUST NOT violate hook contracts | hard |

### Error Class

```yaml
error:
  code: GENERATION_ERROR
  level: hard
  message: "Plan attempts to modify preserve zone: apps/frontend/**"
  location: "plan.changes[3]"
```

## 7.8 Phase 6: Verifiability Validation

Validates that the system can be verified.

### Pipeline Requirements

| Rule | Level |
|------|-------|
| `build` pipeline MUST be defined | hard |
| `test` pipeline MUST be defined | hard |
| `migrate` pipeline MUST be defined | hard |
| Pipeline commands MUST NOT be empty | hard |

### Scenario Coverage

| Rule | Level |
|------|-------|
| All Scenarios MUST reference existing entities/commands/events | hard |
| Each Command SHOULD have ≥1 Scenario | soft |
| Each hard Contract SHOULD have verification Scenario | soft |

### Error Class

```yaml
error:
  code: VERIFICATION_ERROR
  level: hard
  message: "Missing required pipeline: migrate"
  location: "generation.pipelines"
```

## 7.9 Error Taxonomy

| Code | Phase | Description |
|------|-------|-------------|
| `STRUCTURAL_ERROR` | 1 | Invalid spec format |
| `REFERENCE_ERROR` | 2 | Broken identity/refs |
| `SEMANTIC_ERROR` | 3 | Invalid meaning |
| `EVOLUTION_ERROR` | 4 | Unsafe version change |
| `GENERATION_ERROR` | 5 | Unsafe code change |
| `VERIFICATION_ERROR` | 6 | Unverifiable system |

## 7.10 Error Format

```yaml
error:
  code: <ErrorCode>
  phase: 1-6
  level: hard | soft
  message: "Human-readable description"
  location: "JSON path to error"
  suggestion: "How to fix (optional)"
  context:
    # Additional context
    expected: "..."
    actual: "..."
```

## 7.11 Validation Algorithm

```
validate(spec):
  errors = []

  # Phase 1
  errors += phase1_structural(spec)
  if has_hard_errors(errors): return FAIL

  # Phase 2
  errors += phase2_referential(spec)
  if has_hard_errors(errors): return FAIL

  # Phase 3
  errors += phase3_semantic(spec)
  if has_hard_errors(errors): return FAIL

  # Phase 4
  errors += phase4_evolution(spec)
  if has_hard_errors(errors): return FAIL

  # Phase 5
  errors += phase5_generation(spec)
  if has_hard_errors(errors): return FAIL

  # Phase 6
  errors += phase6_verifiability(spec)
  if has_hard_errors(errors): return FAIL

  return OK (with soft warnings)
```

## 7.12 Determinism Guarantee

**The validator MUST be deterministic:**

For the same spec, the validator ALWAYS produces the same result, regardless of:
- LLM used
- Generator implementation
- Execution environment
- Time of execution

This is the foundation of **managed evolution**.

## 7.13 CLI Usage

```bash
# Validate a spec file
sysconst validate myspec.sysconst.yaml

# Validate specific phases only
sysconst validate myspec.sysconst.yaml --phase=1-3

# Output format
sysconst validate myspec.sysconst.yaml --format=json

# Strict mode (soft errors become hard)
sysconst validate myspec.sysconst.yaml --strict
```

## 7.14 Programmatic Usage

```typescript
import { validate, ValidationResult } from '@sysconst/validator';

const spec = loadSpec('myspec.sysconst.yaml');
const result: ValidationResult = validate(spec);

if (result.ok) {
  console.log('Validation passed');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
} else {
  console.error('Validation failed:', result.errors);
}
```

## 7.15 Best Practices

### 1. Validate Early and Often

```bash
# In CI/CD
- name: Validate SysConst
  run: sysconst validate spec.sysconst.yaml --strict
```

### 2. Fix Hard Errors First

Hard errors block everything. Fix them before addressing soft warnings.

### 3. Don't Ignore Soft Warnings

Soft warnings often indicate future problems. Address them proactively.

### 4. Use Strict Mode in CI

```bash
sysconst validate spec.sysconst.yaml --strict
```

### 5. Validate Before LLM Generation

Always validate the spec before asking LLM to generate code:

```typescript
const result = validate(spec);
if (!result.ok) {
  throw new Error('Cannot generate from invalid spec');
}
// Now safe to generate
```
