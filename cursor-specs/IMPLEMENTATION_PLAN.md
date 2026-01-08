# EvoSpec DSL — Implementation Plan

## Overview

This document outlines the implementation plan for the EvoSpec DSL project, covering:
1. Human-readable documentation (GitHub + website)
2. LLM-friendly specification for AI agents
3. Validation tooling

---

## Phase 1: Project Structure & Foundation

### 1.1 Repository Structure

```
EvoSpec-DSL/
├── cursor-specs/              # Project planning & specs for Cursor AI
│   └── IMPLEMENTATION_PLAN.md
│
├── docs/                      # Human-readable documentation (versioned)
│   ├── v1/
│   │   ├── spec/
│   │   │   ├── 01-introduction.md
│   │   │   ├── 02-domain-layer.md
│   │   │   ├── 03-evolution-layer.md
│   │   │   ├── 04-generation-layer.md
│   │   │   ├── 05-contracts.md
│   │   │   ├── 06-scenarios.md
│   │   │   └── 07-validator.md
│   │   ├── guides/
│   │   │   ├── quick-start.md
│   │   │   ├── migration-guide.md
│   │   │   └── examples/
│   │   │       ├── minimal.md
│   │   │       ├── crud-app.md
│   │   │       └── fullstack-monorepo.md
│   │   └── reference/
│   │       ├── node-kinds.md
│   │       ├── types.md
│   │       └── error-codes.md
│   ├── v2/                    # Future versions
│   └── latest -> v1/          # Symlink to current version
│
├── schema/                    # Machine-readable schemas (versioned)
│   ├── v1/
│   │   ├── evospec.schema.json
│   │   ├── evospec.schema.yaml
│   │   └── node-kinds/
│   │       ├── entity.schema.json
│   │       ├── command.schema.json
│   │       └── ...
│   └── latest -> v1/
│
├── llm/                       # LLM integration assets
│   ├── v1/
│   │   ├── SYSTEM_PROMPT.md       # Compact prompt (~2-4K tokens)
│   │   ├── SYSTEM_PROMPT.min.md   # Ultra-compact (~1K tokens)
│   │   └── examples/
│   │       ├── 01-minimal.evospec.yaml
│   │       ├── 02-entity-crud.evospec.yaml
│   │       ├── 03-process-workflow.evospec.yaml
│   │       └── 04-full-monorepo.evospec.yaml
│   └── latest -> v1/
│
├── validator/                 # Validation library
│   ├── src/
│   │   ├── index.ts
│   │   ├── phases/
│   │   │   ├── 01-structural.ts
│   │   │   ├── 02-referential.ts
│   │   │   ├── 03-semantic.ts
│   │   │   ├── 04-evolution.ts
│   │   │   ├── 05-generation.ts
│   │   │   └── 06-verifiability.ts
│   │   ├── types/
│   │   └── utils/
│   ├── cli/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── website/                   # Documentation website
│   ├── docusaurus.config.js   # or vitepress.config.ts
│   ├── sidebars.js
│   └── src/
│
├── packages/                  # Published npm packages
│   ├── @evospec/schema/
│   ├── @evospec/validator/
│   └── @evospec/cli/
│
├── CHANGELOG.md
├── LICENSE
└── README.md
```

### 1.2 Versioning Strategy

**Documentation versions MUST match DSL versions:**

| DSL Version | Docs Version | Schema Version | LLM Prompt Version |
|-------------|--------------|----------------|-------------------|
| v1.0.0      | v1           | v1             | v1                |
| v1.1.0      | v1           | v1             | v1                |
| v2.0.0      | v2           | v2             | v2                |

**Rules:**
- Major version bump → new docs folder (`v1/` → `v2/`)
- Minor/patch versions → update within same folder
- `latest/` symlink always points to current stable version
- Old versions remain accessible at `/docs/v1/`, `/docs/v2/`, etc.

---

## Phase 2: Documentation (Human-Readable)

### 2.1 Content Structure

Each version folder contains:

```
v1/
├── spec/                      # Normative specification
│   ├── 01-introduction.md     # Purpose, goals, non-goals
│   ├── 02-domain-layer.md     # Node kinds, entities, commands, events
│   ├── 03-evolution-layer.md  # History, migrations, versioning
│   ├── 04-generation-layer.md # Zones, hooks, pipelines
│   ├── 05-contracts.md        # Invariants, policies, temporal
│   ├── 06-scenarios.md        # Test scenarios
│   └── 07-validator.md        # Validation phases, error codes
│
├── guides/                    # How-to guides
│   ├── quick-start.md
│   ├── migration-guide.md
│   └── examples/
│
└── reference/                 # API reference
    ├── node-kinds.md          # All node kinds with full schema
    ├── types.md               # Type system reference
    └── error-codes.md         # All validation errors
```

### 2.2 Documentation Standards

- **Language**: English (primary), Russian (optional translation)
- **Format**: CommonMark + GFM extensions
- **Code blocks**: YAML for examples, JSON for schemas
- **Requirement levels**: RFC 2119 (MUST, SHOULD, MAY)

---

## Phase 3: LLM Integration

### 3.1 System Prompt Tiers

| Tier | File | Size | Use Case |
|------|------|------|----------|
| Full | `SYSTEM_PROMPT.md` | ~3-4K tokens | GPT-4, Claude, capable models |
| Compact | `SYSTEM_PROMPT.min.md` | ~1K tokens | GPT-3.5, smaller models |

### 3.2 System Prompt Structure

```markdown
# EvoSpec DSL v1 — Generation Guide

## Quick Reference
[Core structure, required fields, ID patterns]

## Node Kinds Table
[Compact table: Kind → Required spec fields]

## Type System
[Primitives, references, enums]

## Validation Rules (Critical)
[Top 10 most common errors to avoid]

## Minimal Example
[Complete minimal valid spec]
```

### 3.3 Few-Shot Examples

Examples ordered by complexity:
1. **Minimal** — bare minimum valid spec
2. **Entity CRUD** — single entity with commands
3. **Process Workflow** — process with steps and events
4. **Full Monorepo** — complete real-world example

---

## Phase 4: JSON Schema

### 4.1 Schema Organization

```
schema/v1/
├── evospec.schema.json        # Root schema (references others)
├── definitions/
│   ├── node.schema.json       # Base Node definition
│   ├── project.schema.json
│   ├── domain.schema.json
│   ├── generation.schema.json
│   └── history.schema.json
└── node-kinds/
    ├── entity.schema.json
    ├── command.schema.json
    ├── event.schema.json
    ├── process.schema.json
    ├── step.schema.json
    ├── scenario.schema.json
    └── ...
```

### 4.2 Schema Features

- JSON Schema Draft 2020-12
- `$ref` for modularity
- Custom `x-evospec-*` extensions for tooling hints
- Published to: `https://evospec.dev/schema/v1/evospec.schema.json`

---

## Phase 5: Validator

### 5.1 Validation Phases

| Phase | Name | Checks |
|-------|------|--------|
| 1 | Structural | JSON Schema, required fields, ID format |
| 2 | Referential | NodeRef resolution, no cycles |
| 3 | Semantic | Kind-specific rules, type checking |
| 4 | Evolution | History chain, migration requirements |
| 5 | Generation | Zone coverage, hook validity |
| 6 | Verifiability | Pipeline definitions, scenario coverage |

### 5.2 Package Structure

```
@evospec/validator
├── validate(spec) → ValidationResult
├── validatePhase(spec, phase) → PhaseResult
├── loadSchema(version) → JSONSchema
└── errors → ErrorCode enum

@evospec/cli
├── evospec validate <file>
├── evospec check <file> --phase=1-3
└── evospec init
```

### 5.3 Error Format

```typescript
interface ValidationError {
  code: ErrorCode;           // e.g., "REFERENCE_ERROR"
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  level: "hard" | "soft";
  message: string;
  location: string;          // JSON path, e.g., "domain.nodes[2].spec"
  suggestion?: string;       // Fix suggestion
}
```

---

## Phase 6: Website Deployment

### 6.1 Technology Choice

**Recommended: Docusaurus 3.x**
- React-based, excellent for technical docs
- Built-in versioning support
- Algolia DocSearch integration
- MDX support for interactive examples

**Alternative: VitePress**
- Lighter weight, Vue-based
- Faster build times
- Good for simpler documentation

### 6.2 Deployment Options

| Platform | Pros | Cons |
|----------|------|------|
| GitHub Pages | Free, integrated with repo | Manual versioning |
| Vercel | Auto-deploy, preview branches | Free tier limits |
| Netlify | Similar to Vercel | Similar limits |
| Cloudflare Pages | Fast, generous free tier | Less features |

**Recommended: Vercel** (best DX for Docusaurus)

### 6.3 URL Structure

```
https://evospec.dev/
├── /                          # Landing page
├── /docs/                     # Latest docs (redirect to /docs/v1/)
├── /docs/v1/                  # v1 documentation
├── /docs/v1/spec/             # Specification
├── /docs/v1/guides/           # Guides
├── /docs/v2/                  # Future v2 docs
├── /schema/v1/                # JSON Schema files
├── /llm/v1/                   # LLM prompts (downloadable)
└── /playground/               # Online validator (future)
```

---

## Implementation Roadmap

### Milestone 1: Foundation (Week 1-2)
- [ ] Set up repository structure
- [ ] Create JSON Schema v1 (root + definitions)
- [ ] Write SYSTEM_PROMPT.md for LLM
- [ ] Create 4 example files

### Milestone 2: Documentation (Week 3-4)
- [ ] Write specification docs (7 chapters)
- [ ] Write quick-start guide
- [ ] Set up Docusaurus with versioning
- [ ] Deploy to Vercel

### Milestone 3: Validator (Week 5-6)
- [ ] Implement Phase 1-3 validation
- [ ] Implement Phase 4-6 validation
- [ ] Create CLI tool
- [ ] Publish to npm

### Milestone 4: Polish (Week 7-8)
- [ ] Add search (Algolia)
- [ ] Add interactive playground
- [ ] Write migration guide
- [ ] Create video tutorials

---

## Success Criteria

1. **Human-readable**: Developers can understand EvoSpec in <30 minutes
2. **LLM-friendly**: GPT-4/Claude generates valid specs on first try >80%
3. **Validatable**: All specs can be validated in <100ms
4. **Versioned**: Old versions remain accessible, migration paths documented

---

## Open Questions

1. **Domain**: `evospec.dev` or `evospec.io`?
2. **License**: MIT or Apache 2.0?
3. **Translations**: Russian docs in same repo or separate?
4. **Playground**: Build custom or use existing JSON Schema playground?

---

## References

- [JSON Schema](https://json-schema.org/)
- [Docusaurus Versioning](https://docusaurus.io/docs/versioning)
- [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) — Requirement Levels
