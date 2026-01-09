# 3. Evolution Layer

The Evolution Layer describes **how** the system changes over time — version history, change tracking, and migrations.

## 3.1 Purpose

The Evolution Layer provides:

1. **Version History** — Complete record of all specification changes
2. **Change Classification** — Categorization of changes (safe vs. breaking)
3. **Migration Definitions** — How to transform data between versions
4. **Compatibility Rules** — What changes are allowed in which version bumps

## 3.2 Versioning Strategy

SysConst uses **Semantic Versioning (semver)**:

```yaml
project:
  versioning:
    strategy: semver           # REQUIRED
    current: "1.2.0"           # REQUIRED - current version
    compatibility:             # optional
      data: forward-only       # Data compatibility mode
      api: no-breaking-in-minor
      processes: instance-pinned
```

### Version Format

```
MAJOR.MINOR.PATCH

1.0.0 → Initial release
1.1.0 → New features (backward compatible)
1.1.1 → Bug fixes
2.0.0 → Breaking changes
```

### Compatibility Modes

| Mode | Values | Description |
|------|--------|-------------|
| `data` | `forward-only`, `bidirectional` | Data migration direction |
| `api` | `no-breaking-in-minor`, `breaking-allowed` | API change rules |
| `processes` | `instance-pinned`, `auto-migrate` | Running process handling |

## 3.3 History

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

### History Entry Structure

```yaml
- version: "X.Y.Z"           # REQUIRED - semver
  basedOn: "X.Y.Z" | null    # REQUIRED - previous version or null
  changes: [...]             # REQUIRED - array of changes
  migrations: [...]          # REQUIRED - array of migrations
  notes: "..."               # optional - human notes
```

### History Rules

- **MUST** have `history[0].basedOn == null` (first version)
- **MUST** have each version's `basedOn` point to previous version
- **MUST** have `project.versioning.current` match last history entry
- **MUST NOT** have gaps in version chain

## 3.4 Change Operations

Changes are classified by operation type:

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

### Change Format

```yaml
changes:
  # Add optional field
  - op: add-field
    target: entity.customer
    field: phone
    type: string
    required: false

  # Add required field (needs migration)
  - op: add-field
    target: entity.order
    field: taxCents
    type: int
    required: true

  # Remove field
  - op: remove-field
    target: entity.customer
    field: legacyId

  # Rename field
  - op: rename-field
    target: entity.order
    from: total
    to: totalCents

  # Change type
  - op: type-change
    target: entity.order
    field: status
    from: string
    to: enum(OrderStatus)

  # Add node
  - op: add-node
    target: entity.payment

  # Remove node
  - op: remove-node
    target: entity.legacy_data

  # Rename node
  - op: rename-node
    from: entity.user
    to: entity.customer
```

## 3.5 Migrations

Migrations define how to transform data between versions.

### Migration Structure

```yaml
migrations:
  - id: mig.1_1_0.customer.phone    # REQUIRED - unique ID
    kind: data | schema | process   # REQUIRED - migration type
    steps: [...]                    # REQUIRED - migration steps
    validate: [...]                 # optional - validation assertions
```

### Migration Kinds

| Kind | Purpose |
|------|---------|
| `data` | Transform existing data |
| `schema` | Change database schema |
| `process` | Handle running process instances |

### Migration Steps

```yaml
steps:
  # Backfill data
  - backfill:
      entity: entity.customer
      set:
        phone: ""
        updatedAt: "$now"

  # Raw SQL (for schema migrations)
  - sql: "ALTER TABLE customers ADD COLUMN phone VARCHAR(50)"

  # Custom script
  - script: "migrations/1.1.0/backfill-phones.ts"
```

### Migration Validation

```yaml
validate:
  - assert: "count(customer where phone is null) == 0"
  - assert: "count(order where totalCents < 0) == 0"
```

## 3.6 Change Classification Rules

### Minor Version (1.0.0 → 1.1.0)

**Allowed:**
- Add optional fields with defaults
- Add new nodes
- Add new enum values (at end)

**Not Allowed:**
- Remove fields
- Remove nodes
- Change field types
- Rename fields/nodes
- Remove enum values

### Major Version (1.x.x → 2.0.0)

**Allowed:**
- All changes
- Breaking changes with migrations

**Required:**
- Migration for every breaking change
- Deprecation notices for removed features

## 3.7 Implicit Change Detection

The validator detects changes between versions automatically:

```yaml
# Version 1.0.0
- kind: Entity
  id: entity.customer
  spec:
    fields:
      id: { type: uuid, required: true }
      name: { type: string, required: true }

# Version 1.1.0 - phone field added
- kind: Entity
  id: entity.customer
  spec:
    fields:
      id: { type: uuid, required: true }
      name: { type: string, required: true }
      phone: { type: string, required: false }  # NEW
```

If `phone` is added but not declared in `history[].changes`:
- **EVOLUTION_ERROR**: Undeclared change detected

## 3.8 Migration Execution

Migrations are executed in order:

1. **Dry Run** — Validate migration can be applied
2. **Backup** — Create data backup
3. **Execute** — Run migration steps
4. **Validate** — Run validation assertions
5. **Commit** — Finalize changes

If any step fails, rollback to backup.

## 3.9 Process Instance Handling

When processes change between versions:

### Instance-Pinned Mode

```yaml
compatibility:
  processes: instance-pinned
```

- Running instances continue with old version
- New instances use new version
- No automatic migration

### Auto-Migrate Mode

```yaml
compatibility:
  processes: auto-migrate
```

- Running instances are migrated
- Requires process migration definition
- Risk of data loss if not careful

## 3.10 Best Practices

### 1. Always Declare Changes

```yaml
# Good
changes:
  - op: add-field
    target: entity.customer
    field: phone
    type: string
    required: false

# Bad - undeclared change will cause validation error
```

### 2. Provide Migrations for Breaking Changes

```yaml
# Good
changes:
  - op: add-field
    target: entity.order
    field: taxCents
    type: int
    required: true
migrations:
  - id: mig.tax
    kind: data
    steps:
      - backfill:
          entity: entity.order
          set: { taxCents: 0 }

# Bad - required field without migration
```

### 3. Add Validation Assertions

```yaml
migrations:
  - id: mig.phone
    steps:
      - backfill: { entity: entity.customer, set: { phone: "" } }
    validate:
      - assert: "count(customer where phone is null) == 0"
```

### 4. Document Changes

```yaml
history:
  - version: "1.1.0"
    notes: |
      Add phone field to customer for SMS notifications.
      Migration backfills empty string for existing customers.
```
