---
sidebar_position: 7
title: Validator
---

# 7. Validator

The Validator ensures SysConst documents are correct, consistent, and safe for code generation.

## 7.1 Validation Phases

Validation proceeds in strict phases. If a phase fails, subsequent phases are **not executed**.

| Phase | Name | Checks |
|-------|------|--------|
| 1 | Structural | JSON Schema, required fields, ID format |
| 2 | Referential | NodeRef resolution, no cycles |
| 3 | Semantic | Kind-specific rules, type checking |
| 4 | Evolution | History chain, migration requirements |
| 5 | Generation | Zone coverage, hook validity |
| 6 | Verifiability | Pipeline definitions, scenario coverage |

## 7.2 Error Codes

| Code | Phase | Description |
|------|-------|-------------|
| `STRUCTURAL_ERROR` | 1 | Invalid spec format |
| `REFERENCE_ERROR` | 2 | Broken identity/refs |
| `SEMANTIC_ERROR` | 3 | Invalid meaning |
| `EVOLUTION_ERROR` | 4 | Unsafe version change |
| `GENERATION_ERROR` | 5 | Unsafe code change |
| `VERIFICATION_ERROR` | 6 | Unverifiable system |

## 7.3 Error Format

```yaml
error:
  code: SEMANTIC_ERROR
  phase: 3
  level: hard
  message: "Entity 'entity.order' missing required 'fields' in spec"
  location: "domain.nodes[5].spec"
  suggestion: "Add 'fields' object to entity spec"
```

## 7.4 CLI Usage

```bash
# Validate a spec file
sysconst validate myspec.sysconst.yaml

# Validate specific phases only
sysconst validate myspec.sysconst.yaml --phase=1-3

# Strict mode (soft errors become hard)
sysconst validate myspec.sysconst.yaml --strict
```

## 7.5 Programmatic Usage

```typescript
import { validate } from '@sysconst/validator';

const result = validate(spec);

if (result.ok) {
  console.log('Validation passed');
} else {
  console.error('Errors:', result.errors);
}
```

For complete details, see the [full specification](/docs/v1/spec/07-validator.md).
