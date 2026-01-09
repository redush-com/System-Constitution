---
sidebar_position: 3
title: Evolution Layer
---

# 3. Evolution Layer

The Evolution Layer describes **how** the system changes over time — version history, change tracking, and migrations.

## 3.1 Versioning Strategy

SysConst uses **Semantic Versioning (semver)**:

```yaml
project:
  versioning:
    strategy: semver           # REQUIRED
    current: "1.2.0"           # REQUIRED
    compatibility:             # optional
      data: forward-only
      api: no-breaking-in-minor
      processes: instance-pinned
```

## 3.2 History

The `history` array records all version changes:

```yaml
history:
  - version: "1.0.0"
    basedOn: null              # First version
    changes: []
    migrations: []
    notes: "Initial release"

  - version: "1.1.0"
    basedOn: "1.0.0"           # Previous version
    changes:
      - op: add-field
        target: entity.customer
        field: phone
        type: string
        required: false
    migrations:
      - id: mig.1_1_0.phone
        kind: data
        steps:
          - backfill:
              entity: entity.customer
              set: { phone: "" }
        validate:
          - assert: "count(customer where phone is null) == 0"
    notes: "Add phone to customer"
```

## 3.3 Change Operations

### Safe Changes (no migration required)

| Operation | Description |
|-----------|-------------|
| `add-field` (optional) | Add optional field with default |
| `add-node` | Add new node |

### Breaking Changes (migration required)

| Operation | Description |
|-----------|-------------|
| `add-field` (required) | Add required field |
| `remove-field` | Remove existing field |
| `rename-field` | Rename field |
| `type-change` | Change field type |
| `remove-node` | Remove node |
| `rename-node` | Rename node ID |

## 3.4 Migrations

Migrations define how to transform data between versions:

```yaml
migrations:
  - id: mig.1_1_0.customer.phone
    kind: data | schema | process
    steps:
      - backfill:
          entity: entity.customer
          set: { phone: "" }
    validate:
      - assert: "count(customer where phone is null) == 0"
```

For complete details, see the [full specification](/docs/v1/spec/03-evolution-layer.md).
