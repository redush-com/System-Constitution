# 2. Domain Layer

The Domain Layer describes **what** the system is — its data structures, operations, processes, and policies.

## 2.1 Node Kinds

SysConst v1 defines the following node kinds:

| Kind | Purpose |
|------|---------|
| `System` | Root container for the entire system |
| `Module` | Logical grouping of related nodes |
| `Entity` | Persistent data structure |
| `Enum` | Enumeration of values |
| `Value` | Value object (immutable) |
| `Interface` | API boundary (HTTP, GraphQL, Events) |
| `Command` | Write operation that changes state |
| `Event` | Notification of state change |
| `Query` | Read operation |
| `Process` | Multi-step workflow |
| `Step` | Single step within a process |
| `Policy` | Business rule or constraint |
| `Scenario` | Test scenario |
| `Contract` | Formal constraint |

## 2.2 Universal Node Structure

Every node follows this structure:

```yaml
- kind: <NodeKind>           # REQUIRED
  id: <stable-id>            # REQUIRED
  meta:                      # optional
    title: "Human Title"
    description: "Detailed description"
    tags: ["tag1", "tag2"]
  spec: { ... }              # REQUIRED - kind-specific
  impl: { ... }              # optional - implementation details
  facets: { ... }            # optional - extension points
  children: [...]            # optional - child nodes
  contracts: [...]           # optional - constraints
  hooks: [...]               # optional - user code points
```

## 2.3 System

The root node of every specification.

```yaml
- kind: System
  id: system.root
  meta:
    title: "My System"
    description: "System description"
  spec:
    goals:                   # REQUIRED
      - "Goal 1"
      - "Goal 2"
  children:
    - NodeRef(mod.core)
    - NodeRef(mod.api)
```

**Spec Requirements:**
- `goals` — Array of strings describing system goals (**REQUIRED**)

## 2.4 Module

Logical grouping of related nodes.

```yaml
- kind: Module
  id: mod.sales
  meta:
    title: "Sales Module"
  spec: {}                   # Can be empty
  children:
    - NodeRef(entity.order)
    - NodeRef(cmd.order.create)
```

**Spec Requirements:**
- None required (can be empty object)

## 2.5 Entity

Persistent data structure with fields and relations.

```yaml
- kind: Entity
  id: entity.order
  meta:
    title: "Order"
  spec:
    fields:                  # REQUIRED
      id:
        type: uuid
        required: true
      status:
        type: enum(OrderStatus)
        required: true
        default: "draft"
      totalCents:
        type: int
        required: true
        default: 0
    relations:               # optional
      customer:
        to: entity.customer
        type: many-to-one
      items:
        to: entity.order_item
        type: one-to-many
  contracts:
    - invariant: "totalCents >= 0"
      level: hard
```

**Spec Requirements:**
- `fields` — Object mapping field names to field definitions (**REQUIRED**)

**Field Definition:**
```yaml
fieldName:
  type: <FieldType>          # REQUIRED
  required: boolean          # default: false
  default: <value>           # optional
  description: "..."         # optional
```

**Relation Definition:**
```yaml
relationName:
  to: <entity-id>            # REQUIRED
  type: one-to-one | one-to-many | many-to-one | many-to-many  # REQUIRED
```

## 2.6 Enum

Enumeration of allowed values.

```yaml
- kind: Enum
  id: enum.order_status
  meta:
    title: "Order Status"
  spec:
    values:                  # REQUIRED
      - "draft"
      - "submitted"
      - "paid"
      - "shipped"
      - "cancelled"
```

**Spec Requirements:**
- `values` — Array of string values (**REQUIRED**)

## 2.7 Value

Immutable value object.

```yaml
- kind: Value
  id: value.money
  meta:
    title: "Money"
  spec:
    fields:
      amount:
        type: int
        required: true
      currency:
        type: string
        required: true
  contracts:
    - invariant: "amount >= 0"
```

**Spec Requirements:**
- `fields` — Same as Entity (**REQUIRED**)

## 2.8 Command

Write operation that changes system state.

```yaml
- kind: Command
  id: cmd.order.submit
  meta:
    title: "Submit Order"
  spec:
    input:                   # REQUIRED
      orderId: uuid
    output:                  # optional
      success: bool
    effects:                 # optional but recommended
      emits:
        - evt.order.submitted
      modifies:
        - entity.order
```

**Spec Requirements:**
- `input` — Object mapping parameter names to types (**REQUIRED**)

**Optional:**
- `output` — Object mapping return field names to types
- `effects.emits` — Array of event IDs this command emits
- `effects.modifies` — Array of entity IDs this command modifies

## 2.9 Event

Notification that something happened.

```yaml
- kind: Event
  id: evt.order.submitted
  meta:
    title: "Order Submitted"
  spec:
    payload:                 # REQUIRED
      orderId: uuid
      totalCents: int
      occurredAt: datetime
```

**Spec Requirements:**
- `payload` — Object mapping field names to types (**REQUIRED**)

## 2.10 Query

Read operation that retrieves data.

```yaml
- kind: Query
  id: qry.order.get
  meta:
    title: "Get Order"
  spec:
    input:                   # REQUIRED
      orderId: uuid
    output:                  # REQUIRED
      order: ref(entity.order)
```

**Spec Requirements:**
- `input` — Object mapping parameter names to types (**REQUIRED**)
- `output` — Object mapping return field names to types (**REQUIRED**)

## 2.11 Process

Multi-step workflow triggered by a command or event.

```yaml
- kind: Process
  id: proc.order.fulfillment
  meta:
    title: "Order Fulfillment"
  spec:
    trigger: cmd.order.submit    # REQUIRED
    state:                       # optional
      vars:
        orderId: uuid
        paid: bool
        shipped: bool
  children:                      # Steps
    - NodeRef(step.validate)
    - NodeRef(step.pay)
    - NodeRef(step.ship)
  contracts:
    - temporal: "G(step.ship -> paid)"
      level: hard
```

**Spec Requirements:**
- `trigger` — ID of command or event that starts this process (**REQUIRED**)

**Optional:**
- `state.vars` — Process state variables with types

## 2.12 Step

Single step within a process.

```yaml
- kind: Step
  id: step.pay
  meta:
    title: "Process Payment"
  spec:
    action: "ProcessPayment"     # REQUIRED
    inputs:                      # optional
      orderId: uuid
      amount: int
    outputs:                     # optional
      paid: bool
      transactionId: string
```

**Spec Requirements:**
- `action` — Action name/identifier (**REQUIRED**)

## 2.13 Interface

API boundary definition.

```yaml
- kind: Interface
  id: iface.http
  meta:
    title: "HTTP API"
  spec:
    style: openapi               # REQUIRED: openapi | graphql | grpc | async
    exposes:
      commands:
        - cmd.order.create
        - cmd.order.submit
      queries:
        - qry.order.get
      events: []                 # For async interfaces
  contracts:
    - type: api-compatibility
      rule: "minor cannot remove response fields"
      level: hard
```

**Spec Requirements:**
- `style` — API style (**REQUIRED**)
- `exposes` — What operations are exposed

## 2.14 Policy

Business rule or constraint.

```yaml
- kind: Policy
  id: policy.order.max_items
  meta:
    title: "Maximum Order Items"
  spec:
    rules:
      - "Order cannot have more than 100 items"
      - "Each item quantity must be between 1 and 999"
    applies_to:
      - entity.order
      - entity.order_item
```

## 2.15 Type System

### Primitive Types

| Type | Description | Example |
|------|-------------|---------|
| `uuid` | UUID v4 | `"550e8400-e29b-41d4-a716-446655440000"` |
| `string` | Text | `"Hello"` |
| `int` | Integer | `42` |
| `bool` | Boolean | `true` |
| `datetime` | ISO 8601 timestamp | `"2025-01-08T12:00:00Z"` |

### Reference Types

| Type | Description | Example |
|------|-------------|---------|
| `ref(entity.x)` | Reference to entity | `ref(entity.customer)` |
| `enum(EnumName)` | Reference to enum | `enum(OrderStatus)` |

### Usage

```yaml
fields:
  id:
    type: uuid
  name:
    type: string
  count:
    type: int
  active:
    type: bool
  createdAt:
    type: datetime
  customerId:
    type: ref(entity.customer)
  status:
    type: enum(OrderStatus)
```
