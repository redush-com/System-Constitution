# Phased Generation Strategy

A combined approach using **Enhanced Validation (Strategy 2)** and **Multi-Phase Generation (Strategy 5)** to solve schema inconsistency problems in LLM-generated System Constitution (SysConst) specifications.

---

## Problem Statement

When LLM generates SysConst schemas from natural language requirements (e.g., "Advanced task tracker like Redmine"), the output often contains:

- Missing required fields (`modifies`, `output` in Commands)
- Broken references (enum names, entity links)
- Incomplete Process/Step definitions
- Missing Interface and Policy nodes
- Undefined syntax in Scenarios
- Incomplete Generation configuration

These issues block code generation and require manual fixes.

---

## Solution Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASED GENERATION PIPELINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Phase 1  │───▶│ Phase 2  │───▶│ Phase 3  │───▶│ Phase 4  │  │
│  │ Domain   │    │ Commands │    │ Processes│    │ Generation│  │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Validate │    │ Validate │    │ Validate │    │ Validate │  │
│  │ + Fix    │    │ + Fix    │    │ + Fix    │    │ + Fix    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Enhanced Validator

### Current Validation Phases

| Phase | Name | Current Checks |
|-------|------|----------------|
| 01 | Structural | YAML syntax, required fields, node kinds |
| 02 | Referential | NodeRef resolution, relation targets |
| 03 | Semantic | Invariant syntax, type consistency |
| 04 | Evolution | History changes, migration validity |
| 05 | Generation | Zone coverage, hook placement |
| 06 | Verifiability | Scenario completeness |

### New Checks to Add

#### Phase 01 - Structural (Enhanced)

```typescript
// New checks
- spec version MUST be "evospec/v1"
- Command.spec.output MUST be defined
- Command.spec.effects.modifies MUST be defined
- Step.spec.inputs MUST be defined
- Step.spec.outputs MUST be defined
- Process.spec.trigger MUST reference valid Command or Event
- Enum reference format: enum(name) where enum.{name} exists
```

#### Phase 02 - Referential (Enhanced)

```typescript
// New checks
- Process.trigger references existing Command/Event
- Step nodes referenced in Process.children exist
- Workflow ↔ Task linkage (task.workflowId or project.workflowId)
- Policy.applies_to references existing Command
- Interface.exposes.commands all exist
- Interface.exposes.queries all exist
```

#### Phase 03 - Semantic (Enhanced)

```typescript
// New checks
- Process.state.vars initialization logic present
- Scenario $ref() syntax validation
- Scenario seed data contains required entity fields
- Scenario when.command.output_alias for chained commands
- anchored zones MUST have corresponding hooks
- Query.output cannot use primitive "string" for complex data
```

#### Phase 05 - Generation (Enhanced)

```typescript
// New checks
- generation.monorepo.layout MUST be defined
- generation.zones MUST use glob patterns (/**) 
- generation.zones MUST cover all project paths
- generation.verification MUST be defined
- generation.hooks required for anchored zones
```

#### Phase 06 - Verifiability (Enhanced)

```typescript
// New checks
- Interface nodes MUST exist (at least one)
- Policy nodes SHOULD exist for Commands with authorization needs
- tests.scenarios MUST reference defined Scenario nodes
- docs.packs SHOULD be defined
```

### Error Message Format

```typescript
interface ValidationError {
  code: string;           // e.g., "CMD_MISSING_MODIFIES"
  phase: number;          // 1-6
  severity: 'error' | 'warning';
  nodeId: string;         // e.g., "cmd.task.create"
  message: string;        // Human-readable description
  suggestion: string;     // How to fix
  autoFixable: boolean;   // Can LLM fix automatically?
}
```

Example:
```json
{
  "code": "CMD_MISSING_MODIFIES",
  "phase": 1,
  "severity": "error",
  "nodeId": "cmd.task.create",
  "message": "Command 'cmd.task.create' is missing 'effects.modifies' field",
  "suggestion": "Add 'modifies: [entity.task]' to effects",
  "autoFixable": true
}
```

---

## Part 2: Multi-Phase Generation

### Phase 1: Domain Model

**Input:** Natural language requirements
**Output:** Entities, Enums, Value objects, Relations

**LLM Prompt Focus:**
- Entity fields with types and constraints
- Enum definitions with all values
- Relations between entities
- Basic invariant contracts

**Validation After Phase 1:**
- All entities have `id` field (uuid, required)
- All entities have timestamp fields (`createdAt`, `updatedAt`)
- Relations reference existing entities
- Enum values are strings
- No circular dependencies in relations

**Example Output:**
```yaml
domain:
  nodes:
    - kind: Entity
      id: entity.task
      spec:
        fields:
          id: { type: uuid, required: true }
          title: { type: string, required: true }
          status: { type: enum(task_status), required: true }
          # ...
        relations:
          project: { to: entity.project, type: many-to-one }
    
    - kind: Enum
      id: enum.task_status
      spec:
        values: ["new", "in_progress", "resolved", "closed"]
```

### Phase 2: Commands, Events, Queries

**Input:** Domain Model from Phase 1 + Requirements
**Output:** Commands, Events, Queries

**LLM Prompt Focus:**
- Command input/output fields
- `effects.emits` and `effects.modifies`
- Event payloads
- Query input/output with proper types

**Validation After Phase 2:**
- Every Command has `output` with at least primary ID
- Every Command has `effects.modifies`
- Every Command has `effects.emits`
- Events referenced in `emits` are defined
- Entities referenced in `modifies` exist
- Query output uses Value objects, not primitive strings

**Example Output:**
```yaml
- kind: Command
  id: cmd.task.create
  spec:
    input:
      projectId: { type: uuid, required: true }
      title: { type: string, required: true }
    output:
      taskId: uuid
    effects:
      emits: [evt.task.created]
      modifies: [entity.task]

- kind: Event
  id: evt.task.created
  spec:
    payload:
      taskId: uuid
      projectId: uuid
      occurredAt: datetime
```

### Phase 3: Processes, Steps, Policies

**Input:** Commands + Events from Phase 2 + Requirements
**Output:** Processes, Steps, Policies, Interfaces

**LLM Prompt Focus:**
- Process triggers (Command or Event)
- Step sequence with inputs/outputs
- Policy rules for authorization
- Interface definitions (HTTP, Events)

**Validation After Phase 3:**
- Process.trigger references existing Command/Event
- All Steps have inputs/outputs defined
- Steps referenced in Process.children exist
- Policies reference existing Commands
- At least one Interface is defined
- Temporal contracts are meaningful (not tautologies)

**Example Output:**
```yaml
- kind: Process
  id: proc.task.status_change
  spec:
    trigger: cmd.task.update_status
    state:
      vars:
        taskId: uuid
        fromStatus: enum(task_status)
        toStatus: enum(task_status)
  children:
    - NodeRef(step.validate_transition)
    - NodeRef(step.apply_status)
    - NodeRef(step.notify)
  contracts:
    - temporal: "G(step.apply_status -> step.validate_transition)"
      level: hard

- kind: Interface
  id: iface.rest
  spec:
    style: openapi
    exposes:
      commands: [cmd.task.create, cmd.task.update_status]
      queries: [query.time.report]
```

### Phase 4: Generation Configuration

**Input:** Full Domain + Requirements
**Output:** Monorepo layout, Zones, Hooks, Pipelines, Verification

**LLM Prompt Focus:**
- Project structure (apps, libs)
- Zone coverage with glob patterns
- Hook definitions for customization points
- Pipeline commands
- Verification requirements

**Validation After Phase 4:**
- `monorepo.layout` is defined
- All zones use glob patterns (`/**`)
- Zones cover entire project (no gaps)
- Anchored zones have corresponding hooks
- Required pipelines defined (build, test, migrate)
- Verification section present

**Example Output:**
```yaml
generation:
  monorepo:
    layout:
      apps:
        api: "apps/api"
        web: "apps/web"
      libs:
        domain: "libs/domain"

  zones:
    - path: "apps/api/generated/**"
      mode: overwrite
    - path: "apps/api/src/**"
      mode: anchored
    - path: "libs/domain/**"
      mode: spec-controlled

  hooks:
    - id: hook.task.priority_calculation
      location:
        file: "apps/api/src/domain/task/priority.ts"
        anchorStart: "// <spec:hook id='task.priority_calculation'>"
        anchorEnd: "// </spec:hook>"

  verification:
    required: [build, test, migrate]
    optional: [e2e, lint]
```

---

## Validation Loop Between Phases

```
┌─────────────────────────────────────────────────────────────┐
│                     PHASE EXECUTION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐                                               │
│   │ Generate│                                               │
│   │ Phase N │                                               │
│   └────┬────┘                                               │
│        │                                                    │
│        ▼                                                    │
│   ┌─────────┐     ┌─────────────┐                          │
│   │Validate │────▶│ Errors > 0? │                          │
│   │Phase N  │     └──────┬──────┘                          │
│   └─────────┘            │                                  │
│                    Yes   │   No                             │
│                    ┌─────┴─────┐                            │
│                    ▼           ▼                            │
│              ┌─────────┐  ┌─────────┐                      │
│              │ Fix via │  │ Proceed │                      │
│              │   LLM   │  │ Phase+1 │                      │
│              └────┬────┘  └─────────┘                      │
│                   │                                         │
│                   │ retry < 3                               │
│                   ▼                                         │
│              ┌─────────┐                                   │
│              │Re-validate│                                  │
│              └─────────┘                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Fix Prompt Template

When validation fails, send errors to LLM:

```markdown
## Validation Errors for Phase {N}

The following errors were found in the generated schema:

{errors_list}

## Current Schema (Phase {N} output)

```yaml
{current_yaml}
```

## Instructions

Fix ONLY the listed errors. Do not modify other parts of the schema.
Return the corrected YAML.
```

### Retry Limits

| Phase | Max Retries | On Failure |
|-------|-------------|------------|
| 1 | 3 | Abort generation |
| 2 | 3 | Abort generation |
| 3 | 3 | Skip Processes, warn user |
| 4 | 3 | Use defaults, warn user |

---

## Implementation Plan

### Step 1: Enhance Validator (Week 1)

1. Add new error codes to `validator/src/types.ts`
2. Implement new checks in each phase file
3. Add `autoFixable` flag to errors
4. Update error messages with suggestions

### Step 2: Implement Phase Separation (Week 2)

1. Create `cli/src/generation/phases/` directory
2. Implement `phase-1-domain.ts`
3. Implement `phase-2-commands.ts`
4. Implement `phase-3-processes.ts`
5. Implement `phase-4-generation.ts`

### Step 3: Implement Validation Loop (Week 3)

1. Create `cli/src/generation/phase-runner.ts`
2. Implement fix prompt generation
3. Implement retry logic
4. Add progress reporting

### Step 4: Update System Prompt (Week 4)

1. Add phase-specific prompts to `llm/v1/`
2. Add checklists for each node kind
3. Add examples of common errors
4. Update `SYSTEM_PROMPT.md` with phase awareness

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Schema validation pass rate (first try) | ~20% | 60% |
| Schema validation pass rate (after fixes) | ~50% | 95% |
| Average fix iterations | 5+ | 2 |
| Commands with `modifies` | ~30% | 100% |
| Commands with `output` | ~20% | 100% |
| Processes with valid triggers | ~40% | 100% |

---

## Appendix: Error Code Reference

### Phase 1 - Structural

| Code | Message | Auto-fixable |
|------|---------|--------------|
| `SPEC_VERSION_INVALID` | spec must be "sysconst/v1" | Yes |
| `CMD_MISSING_OUTPUT` | Command missing output field | Yes |
| `CMD_MISSING_MODIFIES` | Command missing effects.modifies | Yes |
| `STEP_MISSING_INPUTS` | Step missing inputs definition | Yes |
| `STEP_MISSING_OUTPUTS` | Step missing outputs definition | Yes |
| `ENUM_REF_INVALID` | Invalid enum reference format | Yes |

### Phase 2 - Referential

| Code | Message | Auto-fixable |
|------|---------|--------------|
| `PROC_TRIGGER_NOT_FOUND` | Process trigger not found | No |
| `STEP_NOT_FOUND` | Step referenced in Process not found | No |
| `WORKFLOW_TASK_UNLINKED` | No link between workflow and task | No |
| `POLICY_TARGET_NOT_FOUND` | Policy applies_to target not found | No |

### Phase 3 - Semantic

| Code | Message | Auto-fixable |
|------|---------|--------------|
| `PROC_STATE_UNINITIALIZED` | Process state vars not initialized | No |
| `SCENARIO_REF_INVALID` | Invalid $ref() syntax in scenario | Yes |
| `SCENARIO_SEED_INCOMPLETE` | Seed missing required fields | Yes |
| `ANCHORED_NO_HOOKS` | Anchored zone without hooks | No |
| `QUERY_OUTPUT_PRIMITIVE` | Query output uses primitive string | Yes |

### Phase 5 - Generation

| Code | Message | Auto-fixable |
|------|---------|--------------|
| `MONOREPO_MISSING` | generation.monorepo not defined | Yes |
| `ZONE_NO_GLOB` | Zone path missing glob pattern | Yes |
| `ZONE_GAP` | Project paths not covered by zones | No |
| `VERIFICATION_MISSING` | generation.verification not defined | Yes |

### Phase 6 - Verifiability

| Code | Message | Auto-fixable |
|------|---------|--------------|
| `NO_INTERFACE` | No Interface nodes defined | No |
| `NO_POLICY_FOR_AUTH` | Command needs Policy for authorization | No |
| `TESTS_SCENARIOS_MISSING` | tests.scenarios not referencing Scenarios | Yes |
