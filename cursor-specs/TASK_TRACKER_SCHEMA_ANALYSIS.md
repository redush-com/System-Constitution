# Task Tracker Schema Analysis

Analysis of inconsistencies and issues in the `task-tracker.sysconst.yaml` schema that prevent generation of a working application.

---

## 1. Global Issues

### 1.1 Incorrect Specification Version

```yaml
spec: sysconst/v1  # ❌ Wrong
```

**Problem:** Should be `evospec/v1`. Validator will not recognize the schema.

**Solution:**
```yaml
spec: evospec/v1
```

---

### 1.2 Missing `compatibility` in versioning

```yaml
versioning:
  strategy: semver
  current: "1.0.0"
  # ❌ No compatibility rules
```

**Problem:** Generator doesn't know compatibility rules for schema evolution.

**Solution:**
```yaml
versioning:
  strategy: semver
  current: "1.0.0"
  compatibility:
    data: forward-only
    api: no-breaking-in-minor
    processes: instance-pinned
```

---

### 1.3 Missing `monorepo` section in generation

**Problem:** Generator doesn't know project structure — where apps and libs are located.

**Solution:**
```yaml
generation:
  monorepo:
    layout:
      apps:
        api: "apps/api"
        web: "apps/web"
      libs:
        domain: "libs/domain"
        shared: "libs/shared"
```

---

### 1.4 Missing `hooks` for user code

**Problem:** No extension points for custom business logic. All user code will be lost on regeneration.

**Solution:** Add hooks for:
- Custom validation
- Priority calculation
- Notifications
- Integrations

---

### 1.5 Missing `verification` section

**Problem:** No definition of which checks must pass before applying changes.

**Solution:**
```yaml
verification:
  required: [build, test, migrate]
  optional: [e2e, lint]
```

---

### 1.6 Missing `Interface` nodes

**Problem:** Schema doesn't define how the system interacts with the outside world (HTTP API, Events, GraphQL).

---

### 1.7 Missing `Policy` nodes

**Problem:** No authorization policies, validation rules, or rate limiting.

---

### 1.8 Missing `tests` and `docs` sections

**Problem:** Scenarios are defined but not listed in `tests` section. No documentation packs.

---

## 2. Module-Level Issues

---

## 2.1 Module: project

### entity.project

| Field | Issue | Severity |
|-------|-------|----------|
| `parentProjectId` | No nesting depth limit | ⚠️ Medium |
| `ownerId` | No user existence check | ⚠️ Medium |

**Missing contracts:**
- `identifier` uniqueness in system
- Maximum length for `name` and `description`

### cmd.project.create

```yaml
spec:
  input:
    name: string
    description: string
    # ...
  effects:
    emits:
      - evt.project.created
    # ❌ Missing: modifies
```

**Issues:**
1. No `modifies: [entity.project]` — generator doesn't know which entity the command creates
2. No `output` — command doesn't return `projectId`
3. All input fields without required/optional specification

**Solution:**
```yaml
spec:
  input:
    name: { type: string, required: true }
    description: { type: string, required: false }
    identifier: { type: string, required: true }
    ownerId: { type: uuid, required: true }
    parentProjectId: { type: uuid, required: false }
    startDate: { type: datetime, required: false }
    dueDate: { type: datetime, required: false }
  output:
    projectId: uuid
  effects:
    emits:
      - evt.project.created
    modifies:
      - entity.project
```

### cmd.project.update

**Issues:**
1. No `modifies`
2. No permission check (who can edit?)
3. No `output`

### cmd.project.archive

**Issues:**
1. No `modifies`
2. What happens to tasks in archived project?
3. Can it be unarchived? No `cmd.project.unarchive`

---

## 2.2 Module: task

### entity.task

| Field | Issue | Severity |
|-------|-------|----------|
| `status` | Type `enum(task_status)` — but enum is named `enum.task_status` | 🔴 Critical |
| `priority` | Same — name mismatch | 🔴 Critical |
| `assigneeId` | Can it be null after creation? When is it required? | ⚠️ Medium |
| `parentTaskId` | No nesting depth limit | ⚠️ Medium |
| `estimatedHours` | Type `int` — doesn't support fractional hours (0.5h) | ⚠️ Medium |

**Missing contracts:**
- Task cannot be in archived project
- `dueDate >= startDate`
- Maximum length for `title`

**Missing fields:**
- `workflowId` — which workflow applies to the task?

### cmd.task.create

```yaml
spec:
  input:
    priority: string  # ❌ Should be enum(task_priority)
```

**Issues:**
1. `priority: string` instead of `enum(task_priority)`
2. No `modifies: [entity.task]`
3. No `output: { taskId: uuid }`
4. No check: can reporter create tasks in this project?

### cmd.task.assign

**Issues:**
1. No `modifies`
2. Who can assign? No Policy
3. What if assignee already assigned? Reassignment?
4. No `previousAssigneeId` in event

### cmd.task.update_status

```yaml
spec:
  input:
    newStatus: string  # ❌ Should be enum(task_status)
```

**Issues:**
1. `newStatus: string` instead of `enum(task_status)`
2. No `modifies`
3. **Critical:** No workflow link — how is transition validity checked?
4. No `oldStatus` in input (taken from entity?)
5. Who can change status? Only assignee? Owner? Anyone?

### cmd.task.add_comment

**Issues:**
1. No `modifies: [entity.comment]`
2. No `output: { commentId: uuid }`
3. `isPrivate: bool` — who can see private comments?

### cmd.task.attach_file

**Issues:**
1. No `modifies: [entity.attachment]`
2. No `output: { attachmentId: uuid }`
3. `storageKey` — where does it come from? Who uploads the file?
4. No `mimeType` validation (allowed types?)

### entity.comment

**Issues:**
1. `isPrivate` — no definition of who can see (only author? + project owner?)
2. No `cmd.comment.update` and `cmd.comment.delete`
3. No support for mentions (@user)

### entity.attachment

**Issues:**
1. `storageKey` — no format description and storage backend
2. No `cmd.attachment.delete`
3. No duplicate file check

---

## 2.3 Module: user

### entity.user

| Field | Issue | Severity |
|-------|-------|----------|
| `status` | Type `enum(user_status)` vs `enum.user_status` | 🔴 Critical |
| `password` | ❌ Missing! How does authentication work? | 🔴 Critical |
| `roles` | many-to-many — no join table entity | ⚠️ Medium |

**Missing fields:**
- `passwordHash` or auth provider reference
- `avatarUrl`
- `timezone`
- `locale`

**Missing contracts:**
- `username` uniqueness
- `email` uniqueness

### entity.role

```yaml
fields:
  permissions:
    type: string  # ❌ What is this? JSON? CSV? Enum[]?
```

**Issues:**
1. `permissions: string` — undefined format
2. No list of possible permissions
3. No role → user relation (reverse side of many-to-many)

**Solution:**
```yaml
# Option 1: Enum array
- kind: Enum
  id: enum.permission
  spec:
    values:
      - "project.create"
      - "project.edit"
      - "project.delete"
      - "task.create"
      - "task.assign"
      - "task.status.change"
      # ...

# In entity.role:
permissions:
  type: array(enum(permission))
```

### cmd.user.register

**Issues:**
1. No `password` in input — how is the account created?
2. No `modifies: [entity.user]`
3. No `output: { userId: uuid }`
4. No email verification flow

### cmd.user.assign_role

**Issues:**
1. No `modifies`
2. Who can assign roles? Only admin?
3. What if role already assigned?

**Missing commands:**
- `cmd.user.login`
- `cmd.user.logout`
- `cmd.user.change_password`
- `cmd.user.deactivate`
- `cmd.user.remove_role`

---

## 2.4 Module: time

### entity.time_entry

| Field | Issue | Severity |
|-------|-------|----------|
| `hours` | Type `int` — doesn't support 0.5h, 1.25h | ⚠️ Medium |
| `loggedDate` | Is this work date or entry date? | ⚠️ Medium |

**Missing fields:**
- `activityType` (development, review, meeting, etc.)
- `billable: bool`

### cmd.time.log

**Issues:**
1. No `modifies: [entity.time_entry]`
2. No `output: { timeEntryId: uuid }`
3. Can time be logged on closed task?
4. Can time be logged in the past without restrictions?

### cmd.time.update

**Issues:**
1. No `modifies`
2. Who can edit? Only author?
3. Is there a time limit for editing?

**Missing commands:**
- `cmd.time.delete`

### query.time.report

```yaml
spec:
  output:
    totalHours: int
    entries: string  # ❌ What is this? JSON? How to parse?
```

**Issues:**
1. `entries: string` — should be `array(TimeEntryDTO)` or reference to structure
2. `totalHours: int` — should be `decimal` for precision
3. No grouping (by day, by task, by user)
4. No pagination

**Solution:**
```yaml
- kind: Value
  id: value.time_report_entry
  spec:
    fields:
      taskId: uuid
      taskTitle: string
      userId: uuid
      userName: string
      hours: decimal
      loggedDate: datetime
      description: string

- kind: Query
  id: query.time.report
  spec:
    input:
      projectId: { type: uuid, required: false }
      userId: { type: uuid, required: false }
      startDate: { type: datetime, required: true }
      endDate: { type: datetime, required: true }
      groupBy: { type: enum(report_grouping), required: false }
      page: { type: int, required: false, default: 1 }
      pageSize: { type: int, required: false, default: 50 }
    output:
      totalHours: decimal
      entries: array(ref(value.time_report_entry))
      pagination:
        total: int
        page: int
        pageSize: int
```

---

## 2.5 Module: workflow

### entity.workflow

| Field | Issue | Severity |
|-------|-------|----------|
| `projectId` | Nullable — global or per-project? How is it selected? | 🔴 Critical |
| `isDefault` | One per system? Per project? How to enforce? | 🔴 Critical |

**Missing contracts:**
- Only one `isDefault: true` per projectId (or globally)
- Workflow cannot be deleted if in use

**Missing commands:**
- `cmd.workflow.create`
- `cmd.workflow.update`
- `cmd.workflow.delete`
- `cmd.workflow.add_transition`
- `cmd.workflow.remove_transition`

**Critical ambiguity:**
- How does task know which workflow applies to it?
- No `workflowId` field in `entity.task`

### entity.workflow_transition

| Field | Issue | Severity |
|-------|-------|----------|
| `requiredRoleId` | How is it checked? No Policy | 🔴 Critical |
| `fromStatus`/`toStatus` | Type `enum(task_status)` vs `enum.task_status` | 🔴 Critical |

**Missing fields:**
- `name` — human-readable transition name
- `conditions` — additional conditions (e.g., "all subtasks closed")

**Missing contracts:**
- Uniqueness of pair (workflowId, fromStatus, toStatus)

### proc.task.lifecycle

```yaml
spec:
  trigger: cmd.task.create  # ❌ Wrong trigger
  state:
    vars:
      taskId: uuid
      currentStatus: string  # Where does this come from?
```

**Issues:**

1. **Wrong trigger:** `cmd.task.create` — but lifecycle is about status changes
   - Should be: `cmd.task.update_status` or `evt.task.created`

2. **State not initialized:**
   - `currentStatus` — where does the value come from? How is it updated?

3. **Steps not connected:**
   - No flow control (sequence, parallel, conditional)
   - When is each step called?

4. **No workflow link:**
   - How does process use `entity.workflow_transition`?

5. **Temporal contract is meaningless:**
   ```yaml
   temporal: "G(step.task.update_status -> F(evt.task.status_changed))"
   ```
   - This is a tautology — if status is updated, event will occur

### step.task.validate_transition

```yaml
spec:
  action: "ValidateWorkflowTransition"  # Just a string
```

**Issues:**
1. `action` — this is a magic string, no definition
2. No `inputs` — what data is needed?
3. No `outputs` — what does it return?
4. No link to `entity.workflow_transition`

**Solution:**
```yaml
- kind: Step
  id: step.task.validate_transition
  meta:
    title: "Validate Status Transition"
  spec:
    action: "ValidateWorkflowTransition"
    inputs:
      taskId: uuid
      fromStatus: enum(task_status)
      toStatus: enum(task_status)
      userId: uuid
    outputs:
      isValid: bool
      errorCode: string
      errorMessage: string
  contracts:
    - invariant: "transition exists in task.project.workflow.transitions"
      level: hard
```

### step.task.update_status

**Issues:**
1. No inputs/outputs
2. How is it connected to `cmd.task.update_status`?

### step.task.notify_assignee

**Issues:**
1. No inputs — who to notify? About what?
2. No outputs — was it sent successfully?
3. What notification channel? Email? In-app? Push?

---

## 3. Scenario Issues

### sc.task.create_and_assign

```yaml
given:
  - seed:
      entity: entity.user
      data:
        username: "john.doe"
        # ...
  - seed:
      entity: entity.project
      data:
        ownerId: "$ref(john.doe).id"  # ❌ Unclear syntax
```

**Issues:**

1. **Undefined reference syntax:**
   - `$ref(john.doe).id` — how does this work?
   - `john.doe` — is this username? How is it matched?
   - What if two users have the same username?

2. **Missing required fields in seed:**
   - `entity.user` — no `id`, `createdAt`
   - `entity.project` — no `id`, `createdAt`, `updatedAt`

3. **Reference to non-existent object:**
   ```yaml
   projectId: "$ref(project).id"  # Which project? By name?
   taskId: "$ref(task).id"        # task not created yet!
   ```

**Solution — explicit aliases:**
```yaml
given:
  - seed:
      alias: "john"  # Explicit alias
      entity: entity.user
      data:
        id: "{{uuid}}"
        username: "john.doe"
        # ...
  - seed:
      alias: "project1"
      entity: entity.project
      data:
        id: "{{uuid}}"
        ownerId: "{{john.id}}"
when:
  - command:
      id: cmd.task.create
      input:
        projectId: "{{project1.id}}"
      output_alias: "created_task"  # Save result
  - command:
      id: cmd.task.assign
      input:
        taskId: "{{created_task.taskId}}"
```

### sc.task.complete_workflow

**Issues:**
1. Same `$ref()` syntax problems
2. No workflow transition check — scenario assumes `new -> in_progress -> resolved` is allowed

---

## 4. Generation Issues

### zones

```yaml
zones:
  - path: "src/domain/entities"
    mode: spec-controlled
  - path: "src/domain/commands"
    mode: spec-controlled
  - path: "src/domain/events"
    mode: spec-controlled
  - path: "src/application/services"
    mode: anchored
  - path: "src/infrastructure"
    mode: preserve
  - path: "tests/scenarios"
    mode: overwrite
```

**Issues:**

1. **Incomplete coverage:**
   - Where is `src/index.ts`?
   - Where are configs (`package.json`, `tsconfig.json`)?
   - Where are migrations?

2. **No glob patterns:**
   - `src/domain/entities` — is this a file or directory?
   - Should be: `src/domain/entities/**`

3. **`anchored` zone without hooks:**
   - `src/application/services` — mode: anchored
   - But no hook definitions!

4. **No frontend:**
   - Only backend structure
   - How to generate UI?

---

## 5. Missing Components

### 5.1 Interface nodes

```yaml
# Should be:
- kind: Interface
  id: iface.rest
  meta:
    title: "REST API"
  spec:
    style: openapi
    basePath: "/api/v1"
    exposes:
      commands:
        - cmd.project.create
        - cmd.project.update
        - cmd.task.create
        # ...
      queries:
        - query.time.report
  contracts:
    - type: api-compatibility
      rule: "minor cannot remove response fields"
      level: hard
```

### 5.2 Policy nodes

```yaml
# Should be:
- kind: Policy
  id: policy.task.can_change_status
  meta:
    title: "Task Status Change Authorization"
  spec:
    applies_to: cmd.task.update_status
    rules:
      - "user.id == task.assigneeId"
      - "user.hasRole('project_manager', task.projectId)"
      - "user.id == task.project.ownerId"
    combine: "any"  # any rule passes = allowed
```

### 5.3 Value objects

```yaml
# Should be:
- kind: Value
  id: value.date_range
  spec:
    fields:
      startDate: datetime
      endDate: datetime
  contracts:
    - invariant: "endDate >= startDate"
```

### 5.4 Audit/History entity

For the requirement "Maintain complete audit trail", an entity is needed:

```yaml
- kind: Entity
  id: entity.audit_log
  spec:
    fields:
      id: { type: uuid, required: true }
      entityType: { type: string, required: true }
      entityId: { type: uuid, required: true }
      action: { type: string, required: true }
      userId: { type: uuid, required: true }
      changes: { type: json, required: true }
      occurredAt: { type: datetime, required: true }
```

---

## 6. Severity Summary

| Category | Issue Count | Severity |
|----------|-------------|----------|
| Global | 8 | 🔴 Blocking |
| module.project | 6 | 🟡 High |
| module.task | 15 | 🔴 Blocking |
| module.user | 12 | 🔴 Blocking |
| module.time | 8 | 🟡 High |
| module.workflow | 14 | 🔴 Blocking |
| Scenarios | 4 | 🟡 High |
| Generation | 4 | 🟡 High |
| Missing components | 4 types | 🔴 Blocking |

**Conclusion:** Schema requires significant rework before generation. Main blockers:
1. Wrong spec version
2. Missing workflow ↔ task link
3. Missing Interface and Policy nodes
4. Undefined syntax in Scenarios
5. Commands without `modifies` and `output`
