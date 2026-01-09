---
sidebar_position: 2
title: Domain Layer
---

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

## 2.4 Entity

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
  contracts:
    - invariant: "totalCents >= 0"
      level: hard
```

## 2.5 Command

Write operation that changes system state.

```yaml
- kind: Command
  id: cmd.order.submit
  meta:
    title: "Submit Order"
  spec:
    input:                    # REQUIRED
      orderId: uuid
    output:                   # optional
      success: bool
    effects:                  # optional
      emits:
        - evt.order.submitted
      modifies:
        - entity.order
```

## 2.6 Event

Notification that something happened.

```yaml
- kind: Event
  id: evt.order.submitted
  meta:
    title: "Order Submitted"
  spec:
    payload:                  # REQUIRED
      orderId: uuid
      totalCents: int
      occurredAt: datetime
```

## 2.7 Process

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
  children:                      # Steps
    - NodeRef(step.validate)
    - NodeRef(step.pay)
    - NodeRef(step.ship)
  contracts:
    - temporal: "G(step.ship -> paid)"
      level: hard
```

## 2.8 Type System

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

For complete details, see the [full specification](/docs/v1/spec/02-domain-layer.md).
