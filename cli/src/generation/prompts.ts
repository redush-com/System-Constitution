/**
 * Prompt Templates for LLM Generation
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// System prompt - embedded for reliability
const SYSTEM_PROMPT = `# System Constitution v1 — LLM Generation Guide

You are generating System Constitution specifications. Follow these rules exactly.

## Format

- **File format**: YAML (preferred) or JSON
- **Root key**: \`spec: sysconst/v1\` (REQUIRED)
- **ID pattern**: \`^[a-z][a-z0-9_.-]*$\` (lowercase, starts with letter)

## Core Structure

\`\`\`yaml
spec: sysconst/v1

project:
  id: <stable-id>                    # REQUIRED
  name: "Human Name"                 # optional
  versioning:
    strategy: semver                 # REQUIRED
    current: "1.0.0"                 # REQUIRED

structure:
  root: NodeRef(<system-id>)         # REQUIRED

domain:
  nodes:                             # REQUIRED - array of Node
    - kind: System
      id: system.root
      spec: { goals: [...] }
      children: [NodeRef(...), ...]

generation:                          # optional
  zones: [{ path: "...", mode: overwrite|anchored|preserve|spec-controlled }]
  pipelines:
    build: { cmd: "..." }
    test: { cmd: "..." }

history:                             # optional but recommended
  - version: "1.0.0"
    basedOn: null
    changes: []
    migrations: []
\`\`\`

## Node Structure

Every node MUST have:

\`\`\`yaml
- kind: <NodeKind>      # REQUIRED
  id: <stable-id>       # REQUIRED, unique across spec
  spec: { ... }         # REQUIRED, kind-specific
  meta:                 # optional
    title: "..."
    description: "..."
  children: [...]       # optional
  contracts: [...]      # optional
\`\`\`

## Node Kinds Reference

| Kind | Required in \`spec\` | Example |
|------|-------------------|---------|
| **System** | \`goals: [string]\` | \`spec: { goals: ["Main system"] }\` |
| **Module** | (none) | \`spec: {}\` |
| **Entity** | \`fields: { name: { type, required? } }\` | See below |
| **Enum** | \`values: [string]\` | \`spec: { values: ["a", "b"] }\` |
| **Command** | \`input: { field: type }\` | See below |
| **Event** | \`payload: { field: type }\` | See below |
| **Query** | \`input: {...}, output: {...}\` | |
| **Process** | \`trigger: <id>\` | See below |
| **Step** | \`action: string\` | \`spec: { action: "DoSomething" }\` |
| **Scenario** | \`given, when, then\` | See below |
| **Policy** | \`rules: [...]\` | |
| **Interface** | \`style: openapi|graphql, exposes: {...}\` | |

## Type System

**Primitives:**
- \`uuid\` — UUID v4
- \`string\` — text
- \`int\` — integer
- \`bool\` — boolean
- \`datetime\` — ISO 8601 timestamp

**References:**
- \`ref(entity.customer)\` — reference to entity
- \`enum(OrderStatus)\` — reference to enum

## Entity Example

\`\`\`yaml
- kind: Entity
  id: entity.order
  meta: { title: "Order" }
  spec:
    fields:
      id: { type: uuid, required: true }
      status: { type: enum(OrderStatus), required: true, default: "draft" }
      totalCents: { type: int, required: true, default: 0 }
    relations:
      customer: { to: entity.customer, type: many-to-one }
  contracts:
    - invariant: "totalCents >= 0"
\`\`\`

## Command Example

\`\`\`yaml
- kind: Command
  id: cmd.order.submit
  spec:
    input:
      orderId: uuid
    effects:
      emits: [evt.order.submitted]
\`\`\`

## Event Example

\`\`\`yaml
- kind: Event
  id: evt.order.submitted
  spec:
    payload:
      orderId: uuid
      occurredAt: datetime
\`\`\`

## Process Example

\`\`\`yaml
- kind: Process
  id: proc.order.fulfillment
  spec:
    trigger: cmd.order.submit
    state:
      vars:
        orderId: uuid
        paid: bool
  children:
    - NodeRef(step.pay)
    - NodeRef(step.ship)
  contracts:
    - temporal: "G(step.ship -> paid)"
      level: hard
\`\`\`

## Scenario Example

\`\`\`yaml
- kind: Scenario
  id: sc.order.happy_path
  spec:
    given:
      - seed: { entity: entity.customer, data: { name: "Buyer" } }
      - seed: { entity: entity.order, data: { customerId: "$ref(customer).id" } }
    when:
      - command: { id: cmd.order.submit, input: { orderId: "$ref(order).id" } }
    then:
      - expectEvent: { id: evt.order.submitted, match: { orderId: "$ref(order).id" } }
      - expectEntity: { id: entity.order, where: { id: "$ref(order).id" }, match: { status: "submitted" } }
\`\`\`

## Contracts

\`\`\`yaml
contracts:
  - invariant: "expression"           # Data invariant
    level: hard                       # hard = blocks, soft = warning
  - temporal: "G(condition)"          # LTL temporal logic
  - type: api-compatibility
    rule: "minor cannot remove fields"
\`\`\`

## Generation Zones

| Mode | Behavior |
|------|----------|
| \`overwrite\` | Fully regenerated, no user code |
| \`anchored\` | Has hook anchors for user code |
| \`preserve\` | Never touched by generator |
| \`spec-controlled\` | Changes only via spec changes |

## History & Migrations

\`\`\`yaml
history:
  - version: "1.0.0"
    basedOn: null
    changes: []
    migrations: []
    notes: "Initial"
    
  - version: "1.1.0"
    basedOn: "1.0.0"
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
          - backfill: { entity: entity.customer, set: { phone: "" } }
        validate:
          - assert: "count(customer where phone is null) == 0"
\`\`\`

## Critical Validation Rules

1. **All IDs must be unique** across the entire spec
2. **All NodeRef must resolve** to existing node IDs
3. **Entity must have \`fields\`** in spec
4. **Command must have \`input\`** in spec
5. **Event must have \`payload\`** in spec
6. **Process must have \`trigger\`** in spec
7. **Scenario must have \`given\`, \`when\`, \`then\`** in spec
8. **No circular children** (parent→child→parent)
9. **History chain must be valid** (each version's basedOn exists)
10. **Destructive changes require migrations**

## Minimal Valid Spec

\`\`\`yaml
spec: sysconst/v1

project:
  id: my.app
  versioning:
    strategy: semver
    current: "1.0.0"

structure:
  root: NodeRef(system.root)

domain:
  nodes:
    - kind: System
      id: system.root
      meta: { title: "My Application" }
      spec:
        goals:
          - "Demonstrate minimal SysConst"
\`\`\`

---

**Remember**: Generate valid YAML, use correct ID patterns, ensure all references resolve.`;

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildGeneratePrompt(description: string): string {
  return `Generate an System Constitution v1 specification for the following system:

## System Description

${description}

## Requirements

1. Generate a complete, valid System Constitution YAML
2. Include appropriate entities, commands, events based on the description
3. Add meaningful contracts and invariants where appropriate
4. Include at least one test scenario
5. Set version to 1.0.0
6. Use descriptive IDs following the pattern: entity.name, cmd.name.action, evt.name.action, etc.

## Output Format

Return ONLY the YAML specification, wrapped in \`\`\`yaml code blocks.
Do not include any explanations before or after the YAML.`;
}

export function buildEvolvePrompt(
  currentSpec: string,
  changeDescription: string,
  currentVersion: string,
  newVersion: string
): string {
  return `Evolve the following System Constitution based on the change request.

## Current Specification

\`\`\`yaml
${currentSpec}
\`\`\`

## Change Request

${changeDescription}

## Requirements

1. Modify the spec to implement the requested change
2. Update version from ${currentVersion} to ${newVersion}
3. Add appropriate entry to history[] with:
   - The new version
   - basedOn: "${currentVersion}"
   - Relevant changes[] entries describing what changed
   - migrations[] if needed for breaking changes (add-field with required: true, remove-field, etc.)
4. Ensure all references remain valid
5. Add/update contracts if the change affects data integrity

## Output Format

Return ONLY the complete updated YAML specification, wrapped in \`\`\`yaml code blocks.
Do not include any explanations before or after the YAML.`;
}

export function buildErrorFeedbackPrompt(
  originalPrompt: string,
  errors: Array<{ code: string; message: string; location: string; suggestion?: string }>
): string {
  let errorSection = `\n\n---\n\n⚠️ VALIDATION ERRORS FROM PREVIOUS ATTEMPT:\n\n`;
  errorSection += `The previous generation failed validation. Fix these errors:\n\n`;
  
  for (const error of errors) {
    errorSection += `- [${error.code}] ${error.message}\n`;
    errorSection += `  Location: ${error.location}\n`;
    if (error.suggestion) {
      errorSection += `  Fix: ${error.suggestion}\n`;
    }
    errorSection += `\n`;
  }
  
  errorSection += `\nGenerate a corrected specification that passes all validation phases.`;
  
  return originalPrompt + errorSection;
}
