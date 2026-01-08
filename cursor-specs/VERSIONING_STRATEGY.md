# EvoSpec DSL — Versioning Strategy

This document defines how versions are managed across the EvoSpec DSL ecosystem.

---

## Core Principle

> **Documentation version MUST match DSL major version.**

When EvoSpec DSL is at v1.x.x, documentation is v1.
When EvoSpec DSL moves to v2.0.0, documentation becomes v2.

---

## Version Components

### 1. DSL Specification Version

The core language specification follows **Semantic Versioning 2.0**:

```
MAJOR.MINOR.PATCH

v1.0.0 → Initial release
v1.1.0 → New features (backward compatible)
v1.2.0 → More features
v2.0.0 → Breaking changes
```

**Breaking changes require:**
- New major version
- Migration guide
- Deprecation period for previous version

### 2. Documentation Version

Documentation uses **major version only**:

```
docs/v1/  → All v1.x.x documentation
docs/v2/  → All v2.x.x documentation
```

**Within a major version:**
- Minor updates are made in-place
- No separate folders for v1.1, v1.2, etc.
- Changelog tracks all changes

### 3. JSON Schema Version

Schema versions mirror DSL versions:

```
schema/v1/evospec.schema.json  → For v1.x.x specs
schema/v2/evospec.schema.json  → For v2.x.x specs
```

**Schema URL format:**
```
https://evospec.dev/schema/v1/evospec.schema.json
```

### 4. LLM Prompt Version

LLM prompts are versioned with DSL:

```
llm/v1/SYSTEM_PROMPT.md     → For generating v1.x.x specs
llm/v2/SYSTEM_PROMPT.md     → For generating v2.x.x specs
```

---

## Version Matrix

| DSL Version | Docs | Schema | LLM Prompt | Validator |
|-------------|------|--------|------------|-----------|
| 1.0.0       | v1   | v1     | v1         | 1.0.x     |
| 1.1.0       | v1   | v1     | v1         | 1.1.x     |
| 1.2.0       | v1   | v1     | v1         | 1.2.x     |
| 2.0.0       | v2   | v2     | v2         | 2.0.x     |

---

## File Structure

```
EvoSpec-DSL/
├── docs/
│   ├── v1/                    # v1.x.x documentation
│   │   ├── spec/
│   │   ├── guides/
│   │   ├── reference/
│   │   └── CHANGELOG.md       # Changes within v1
│   ├── v2/                    # v2.x.x documentation
│   │   └── ...
│   └── latest -> v1/          # Symlink to current stable
│
├── schema/
│   ├── v1/
│   │   └── evospec.schema.json
│   ├── v2/
│   │   └── evospec.schema.json
│   └── latest -> v1/
│
├── llm/
│   ├── v1/
│   │   ├── SYSTEM_PROMPT.md
│   │   └── examples/
│   ├── v2/
│   │   └── ...
│   └── latest -> v1/
│
└── VERSION                    # Current version: "1.2.0"
```

---

## Spec File Version Declaration

Every EvoSpec file declares its version:

```yaml
spec: evospec/v1    # Uses v1 specification
```

This allows:
- Validator to select correct schema
- Tools to handle version-specific features
- Backward compatibility checks

---

## Version Lifecycle

### 1. Development Phase

```
main branch:
├── docs/v1/          # Current stable
└── docs/next/        # Development (becomes v2)
```

### 2. Release Phase

When releasing v2.0.0:

```bash
# 1. Freeze v1 documentation
git tag docs-v1.0

# 2. Rename next → v2
mv docs/next docs/v2

# 3. Update symlinks
ln -sf v2 docs/latest
ln -sf v2 schema/latest
ln -sf v2 llm/latest

# 4. Update VERSION file
echo "2.0.0" > VERSION
```

### 3. Maintenance Phase

After v2 release:
- v1 receives security fixes only
- v1 documentation remains accessible
- v1 schema remains available

---

## URL Versioning

### Documentation URLs

```
https://evospec.dev/docs/           → Redirects to /docs/v1/
https://evospec.dev/docs/v1/        → v1 documentation
https://evospec.dev/docs/v1/spec/   → v1 specification
https://evospec.dev/docs/v2/        → v2 documentation
https://evospec.dev/docs/next/      → Development docs
```

### Schema URLs

```
https://evospec.dev/schema/v1/evospec.schema.json
https://evospec.dev/schema/v2/evospec.schema.json
https://evospec.dev/schema/latest/evospec.schema.json  → Redirects to v1
```

### LLM Prompt URLs

```
https://evospec.dev/llm/v1/SYSTEM_PROMPT.md
https://evospec.dev/llm/v1/examples/minimal.evospec.yaml
```

---

## Deprecation Policy

### Timeline

```
v1.0.0 released     ─────────────────────────────────────────►
                    │
v2.0.0 released     ──────────────────────────────────────────►
                    │ v1 deprecated
                    │ (12 months support)
                    │
v1 end-of-life      ──────────────────────────────────────────►
                    │ v1 docs remain accessible
                    │ v1 schema remains available
                    │ No more v1 updates
```

### Deprecation Notices

When v2 is released, v1 docs show banner:

```
⚠️ You are viewing documentation for EvoSpec v1.
   Version 2 is now available. [Upgrade Guide →]
```

---

## Changelog Management

### Per-Version Changelog

Each version folder has its own changelog:

```markdown
# EvoSpec DSL v1 Changelog

## [1.2.0] - 2025-03-15
### Added
- New `Capability` node kind
- Support for async processes

### Changed
- Improved error messages

## [1.1.0] - 2025-02-01
### Added
- `Policy` node kind
- Temporal contracts

## [1.0.0] - 2025-01-01
### Added
- Initial release
```

### Root Changelog

Root `CHANGELOG.md` tracks major versions:

```markdown
# EvoSpec DSL Changelog

## v2 (2026-01-01)
Major rewrite with new features...
See [v2 Changelog](docs/v2/CHANGELOG.md)

## v1 (2025-01-01)
Initial release...
See [v1 Changelog](docs/v1/CHANGELOG.md)
```

---

## Migration Guides

When releasing a new major version, create:

```
docs/v2/
└── guides/
    └── migration-from-v1.md
```

Contents:
1. Breaking changes list
2. Step-by-step migration
3. Automated migration tool (if available)
4. FAQ

---

## Validator Version Compatibility

The validator supports multiple DSL versions:

```typescript
import { validate } from '@evospec/validator';

// Auto-detect version from spec
validate(spec);  // Reads spec.spec field

// Explicit version
validate(spec, { version: 'v1' });
validate(spec, { version: 'v2' });
```

### Package Versioning

```
@evospec/validator@1.x.x  → Supports DSL v1 only
@evospec/validator@2.x.x  → Supports DSL v1 + v2
@evospec/validator@3.x.x  → Supports DSL v1 + v2 + v3
```

---

## Git Tags & Branches

### Tags

```
v1.0.0          # DSL v1.0.0 release
v1.1.0          # DSL v1.1.0 release
docs-v1.0       # Docs v1 snapshot
schema-v1.0     # Schema v1 snapshot
```

### Branches

```
main            # Current development
release/v1      # v1 maintenance branch
release/v2      # v2 maintenance branch
```

---

## Summary

| Artifact | Version Format | Update Frequency |
|----------|---------------|------------------|
| DSL Spec | semver (1.2.3) | Per release |
| Documentation | major only (v1) | Continuous |
| JSON Schema | major only (v1) | Per DSL release |
| LLM Prompts | major only (v1) | As needed |
| Validator | semver (1.2.3) | Per DSL release |
| npm packages | semver (1.2.3) | Per release |
