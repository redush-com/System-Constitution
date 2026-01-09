# System Constitution

**Architectural governance layer for autonomous software evolution**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@redush/sysconst.svg)](https://www.npmjs.com/package/@redush/sysconst)

System Constitution is an **architectural governance layer** that enforces structural integrity and controls permissible evolution of software systems over time. Unlike specification-driven approaches that rely on process discipline and human oversight, System Constitution embeds **formal constraints** directly into the system definition—LLMs simply cannot introduce changes that violate architectural contracts.

## The Problem

Traditional approaches to LLM-guided development face a fundamental challenge: **architectural degradation**. Without human-in-the-loop oversight, autonomous agents can gradually erode system structure through:

- Unauthorized coupling between modules
- Contract violations and invariant breaches
- Uncontrolled schema evolution
- Loss of separation of concerns

**Process-based solutions** (like OpenSpec/Spec Kit) address this through rituals and iteration—requiring human review at each step. This works, but limits autonomy.

## Our Approach: Formal Constraints

System Constitution takes a different path: **structural integrity through formal constraints**, not process discipline.

| Without System Constitution | With System Constitution |
|----------------------------|--------------------------|
| Stability through discipline and iteration | Stability through formal constraints |
| Human-in-the-loop required | Autonomous generation possible |
| Process protects the system | Contracts protect the system |
| LLM can propose any change | LLM cannot violate contracts |

The system uses **Git** for version control of constitution files, providing full history, branching, and diff capabilities for architectural evolution.

## Key Capabilities

- **Architectural Governance** — Define structural boundaries that cannot be violated
- **Contract Enforcement** — Invariants, temporal constraints, and policies are machine-verified
- **Autonomous-Ready** — Designed for LLM generation without human-in-the-loop
- **Controlled Evolution** — Track every architectural change with full history and migrations
- **Stack-Agnostic** — Works with any technology stack
- **Git-Native Versioning** — Constitution files are version-controlled with Git

## Quick Start

### Installation

```bash
npm install -g @redush/sysconst
```

### Create Your First Constitution

```bash
# With LLM generation (CLI will prompt for API key on first use)
sysconst init myshop -d "E-commerce platform with products and orders"

# Without LLM (minimal template)
sysconst init myapp --no-generate
```

On first use, the CLI will:
1. Ask if you want to set up an API key
2. Show you where to get one (e.g., [openrouter.ai/keys](https://openrouter.ai/keys))
3. Save it securely to `~/.sysconst/config.yaml`

> **Tip:** Use `--no-generate` to skip LLM and create a minimal template, or use Ollama for free local generation.

This creates `myapp.sysconst.yaml`:

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

### Validate

```bash
sysconst validate myapp.sysconst.yaml
```

## Documentation

- 📖 [Full Specification](docs/v1/spec/01-introduction.md)
- 🚀 [Quick Start Guide](docs/v1/guides/quick-start.md)
- 📚 [Reference](docs/v1/reference/node-kinds.md)
- 🌐 [Website](https://redush.com)

## Project Structure

```
System-Constitution/
├── docs/v1/              # Human-readable documentation
│   ├── spec/             # Specification (7 chapters)
│   ├── guides/           # How-to guides
│   └── reference/        # API reference
├── schema/v1/            # JSON Schema
├── llm/v1/               # LLM integration
│   ├── SYSTEM_PROMPT.md  # Prompt for LLMs
│   └── examples/         # Example constitutions
├── validator/            # TypeScript validator
├── cli/                  # CLI tool
└── website/              # Docusaurus site
```

## Package

```bash
npm install -g @redush/sysconst
```

The `@redush/sysconst` package includes both CLI and programmatic validator API.

## Core Concepts

### Architectural Governance

System Constitution defines **what changes are permissible**, not just what the system looks like. Every modification must satisfy:

1. **Structural Contracts** — Invariants that must always hold
2. **Temporal Constraints** — Rules about state transitions over time
3. **Evolution Policies** — What kinds of changes are allowed between versions

### Node Kinds

| Kind | Purpose |
|------|---------|
| `System` | Root container |
| `Module` | Logical grouping with boundaries |
| `Entity` | Persistent data with invariants |
| `Command` | Write operation with preconditions |
| `Event` | State change notification |
| `Process` | Multi-step workflow with temporal contracts |
| `Scenario` | Verification case |

### Validation Phases

1. **Structural** — Syntax and required fields
2. **Referential** — References and identity
3. **Semantic** — Kind-specific rules
4. **Evolution** — History and migrations
5. **Generation** — Zone and hook safety
6. **Verifiability** — Pipelines and scenarios

### Generation Zones

| Mode | Description |
|------|-------------|
| `overwrite` | Fully regenerated |
| `anchored` | Has hook anchors for user code |
| `preserve` | Never touched |
| `spec-controlled` | Changes only via constitution |

## LLM Integration

### CLI Commands

The CLI includes built-in LLM support for generating and evolving constitutions:

```bash
# Generate new constitution from description
sysconst generate "Task management with projects and tasks" -o tasks.sysconst.yaml

# Evolve existing constitution
sysconst evolve myapp.sysconst.yaml -c "Add user authentication"
```

### Supported Providers

| Provider | Default Model | Notes |
|----------|---------------|-------|
| **OpenRouter** (default) | `anthropic/claude-sonnet-4.5` | Access to 100+ models |
| OpenAI | `gpt-5.2` | Direct OpenAI API |
| Anthropic | `claude-sonnet-4-5` | Direct Anthropic API |
| Ollama | `llama4` | Free, runs locally |

**Switch provider:**
```bash
sysconst init myapp -d "..." --provider openai
sysconst init myapp -d "..." --provider ollama  # Free, no API key needed
```

### API Key Configuration

The CLI automatically prompts for API key on first use. Keys are saved to `~/.sysconst/config.yaml`.

**For CI/CD or automation**, use environment variables:
```bash
export OPENROUTER_API_KEY=sk-or-v1-...
# or
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...
```

### Validation Loop

All generated constitutions are automatically validated. If validation fails, the LLM retries with error feedback (up to 3 attempts by default).

### System Prompt

For custom LLM integrations, use the [System Prompt](llm/v1/SYSTEM_PROMPT.md) (~3-4K tokens).

## Why Not Specification-Driven?

Specification-driven approaches (OpenSpec, Spec Kit, etc.) are excellent for **human-guided development** where:
- A human reviews each iteration
- Process discipline ensures quality
- Specifications document intent

System Constitution is designed for **autonomous generation** where:
- LLMs operate without constant human oversight
- Formal constraints replace process discipline
- The constitution enforces architectural integrity programmatically

Both approaches are valid—they solve different problems.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Documentation](https://redush.com)
- [GitHub](https://github.com/redush-com/System-Constitution)
- [npm](https://www.npmjs.com/package/@redush/sysconst)
