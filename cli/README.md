# @redush/sysconst

**System Constitution — Architectural governance for autonomous software evolution**

[![npm version](https://img.shields.io/npm/v/@redush/sysconst.svg)](https://www.npmjs.com/package/@redush/sysconst)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/redush-com/System-Constitution/blob/main/LICENSE)

System Constitution is an **architectural governance layer** that enforces structural integrity and controls permissible evolution of software systems. Designed for autonomous LLM generation without human-in-the-loop — stability through formal constraints, not process discipline.

## Installation

```bash
# Global CLI
npm install -g @redush/sysconst

# As library
npm install @redush/sysconst
```

## Quick Start

### CLI Usage

```bash
# Create a new constitution with LLM generation
sysconst init myshop -d "E-commerce platform with products and orders"

# Create without LLM (minimal template)
sysconst init myapp --no-generate

# Validate a constitution
sysconst validate myapp.sysconst.yaml
```

### Programmatic Usage

```typescript
import { validate, validateYaml, parseSpec } from '@redush/sysconst';

// Validate YAML string
const result = validateYaml(`
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

if (result.ok) {
  console.log('Constitution is valid!');
} else {
  console.log('Errors:', result.errors);
}
```

## CLI Commands

### `init` — Create New Constitution

```bash
sysconst init <name> [options]

Options:
  -d, --description <text>   Description for LLM generation
  --no-generate              Skip LLM, create minimal template
  --provider <name>          LLM provider (openrouter|openai|anthropic|ollama)
  --model <name>             Specific model to use
  -o, --output <path>        Output directory
```

### `validate` — Validate Constitution

```bash
sysconst validate <file>

# Examples
sysconst validate myapp.sysconst.yaml
sysconst validate ./specs/*.sysconst.yaml
```

### `generate` — Generate from Description

```bash
sysconst generate <description> [options]

Options:
  -o, --output <file>        Output file path
  --provider <name>          LLM provider
  --model <name>             Specific model

# Example
sysconst generate "Task management with projects and tasks" -o tasks.sysconst.yaml
```

### `evolve` — Evolve Existing Constitution

```bash
sysconst evolve <file> [options]

Options:
  -c, --change <description>  Change description
  --provider <name>           LLM provider

# Example
sysconst evolve myapp.sysconst.yaml -c "Add user authentication"
```

### `version` — Version Management

```bash
# Bump version
sysconst version bump <major|minor|patch> -f <file>

# Tag current version in Git
sysconst version tag -f <file>
```

### `history` — View Version History

```bash
sysconst history -f <file>
```

### `diff` — Compare Versions

```bash
sysconst diff <version1> <version2> -f <file>
```

### `checkout` — Restore Version

```bash
sysconst checkout <version>
```

## Validation API

### `validateYaml(yaml: string, options?): ValidationResult`

Validates a YAML string containing a System Constitution.

### `validate(spec: unknown, options?): ValidationResult`

Validates a parsed spec object.

### `parseSpec(yaml: string): unknown`

Parses YAML string to spec object.

### `ValidationResult`

```typescript
interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  phase: ValidationPhase;
}

interface ValidationError {
  code: string;
  message: string;
  phase: ValidationPhase;
  level: 'hard' | 'soft';
  location?: string;
  suggestion?: string;
}
```

## Validation Phases

| Phase | Description |
|-------|-------------|
| **1. Structural** | Syntax, required fields, JSON Schema compliance |
| **2. Referential** | NodeRef resolution, unique IDs, no dangling references |
| **3. Semantic** | Kind-specific rules (Entity fields, Command params, etc.) |
| **4. Evolution** | Version history, migration compatibility |
| **5. Generation** | Zone safety, hook anchor validation |
| **6. Verifiability** | Scenario coverage, pipeline definitions |

## LLM Providers

| Provider | Default Model | Notes |
|----------|---------------|-------|
| **OpenRouter** (default) | `anthropic/claude-sonnet-4.5` | Access to 100+ models |
| OpenAI | `gpt-5.2` | Direct OpenAI API |
| Anthropic | `claude-sonnet-4-5` | Direct Anthropic API |
| Ollama | `llama4` | Free, runs locally |

### API Key Configuration

On first use, the CLI prompts for API key and saves it to `~/.sysconst/config.yaml`.

**For CI/CD**, use environment variables:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
# or
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...
```

## Constitution File Format

```yaml
spec: sysconst/v1

project:
  id: myapp
  versioning:
    strategy: semver
    current: "1.0.0"

structure:
  root: NodeRef(system.root)

domain:
  nodes:
    - kind: System
      id: system.root
      spec:
        goals:
          - "My application"

    - kind: Entity
      id: entity.user
      spec:
        fields:
          id: { type: uuid, required: true }
          email: { type: string, required: true }
      contracts:
        - invariant: "email != ''"
```

## Links

- [Documentation](https://redush.com)
- [GitHub](https://github.com/redush-com/System-Constitution)
- [Quick Start Guide](https://github.com/redush-com/System-Constitution/blob/main/docs/v1/guides/quick-start.md)
- [Full Specification](https://github.com/redush-com/System-Constitution/blob/main/docs/v1/spec/01-introduction.md)

## License

MIT
