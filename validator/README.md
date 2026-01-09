# @redush/sysconst-validator

**Validation library for System Constitution**

[![npm version](https://img.shields.io/npm/v/@redush/sysconst-validator.svg)](https://www.npmjs.com/package/@redush/sysconst-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/redush-com/System-Constitution/blob/main/LICENSE)

Part of [System Constitution](https://github.com/redush-com/System-Constitution) — an architectural governance layer for autonomous software evolution.

## Installation

```bash
npm install @redush/sysconst-validator
```

## Usage

```typescript
import { validate, validateFile } from '@redush/sysconst-validator';

// Validate YAML string
const result = validate(`
spec: sysconst/v1
project:
  id: myapp
  versioning:
    strategy: semver
    current: "1.0.0"
domain:
  nodes:
    - kind: System
      id: system.root
      spec:
        goals: ["My application"]
`);

if (result.valid) {
  console.log('Constitution is valid!');
} else {
  console.log('Errors:', result.errors);
}

// Validate from file
const fileResult = await validateFile('./myapp.sysconst.yaml');
```

## Validation Phases

The validator runs 6 phases in sequence:

| Phase | Description |
|-------|-------------|
| **1. Structural** | Syntax, required fields, JSON Schema compliance |
| **2. Referential** | NodeRef resolution, unique IDs, no dangling references |
| **3. Semantic** | Kind-specific rules (Entity fields, Command params, etc.) |
| **4. Evolution** | Version history, migration compatibility |
| **5. Generation** | Zone safety, hook anchor validation |
| **6. Verifiability** | Scenario coverage, pipeline definitions |

## API

### `validate(yaml: string): ValidationResult`

Validates a YAML string containing a System Constitution.

### `validateFile(path: string): Promise<ValidationResult>`

Validates a constitution file from disk.

### `ValidationResult`

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  phases: PhaseResult[];
}

interface ValidationError {
  code: string;      // e.g., "INVALID_NODE_REF"
  message: string;
  path?: string;     // JSON path to error location
  phase: number;
}
```

## Error Codes

| Code | Phase | Description |
|------|-------|-------------|
| `INVALID_YAML` | 1 | YAML parsing failed |
| `INVALID_SPEC_VERSION` | 1 | Unknown spec version |
| `SCHEMA_VIOLATION` | 1 | JSON Schema validation failed |
| `DUPLICATE_ID` | 2 | Node ID used more than once |
| `INVALID_NODE_REF` | 2 | NodeRef points to non-existent node |
| `INVALID_FIELD_TYPE` | 3 | Unknown field type in Entity |
| `MISSING_REQUIRED_FIELD` | 3 | Required field not defined |
| `INVALID_EVOLUTION` | 4 | Breaking change without migration |
| `INVALID_ZONE` | 5 | Unknown generation zone |
| `UNCOVERED_SCENARIO` | 6 | Node not covered by any scenario |

See [full error reference](https://github.com/redush-com/System-Constitution/blob/main/docs/v1/reference/error-codes.md).

## Related Packages

- [`@redush/sysconst`](https://www.npmjs.com/package/@redush/sysconst) — CLI tool

## Links

- [Documentation](https://redush.com)
- [GitHub](https://github.com/redush-com/System-Constitution)
- [Full Specification](https://github.com/redush-com/System-Constitution/blob/main/docs/v1/spec/01-introduction.md)

## License

MIT
