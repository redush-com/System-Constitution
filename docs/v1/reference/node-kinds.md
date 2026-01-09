# Node Kinds Reference

Complete reference for all node kinds in System Constitution DSL v1.

## Overview

| Kind | Purpose | Required in `spec` |
|------|---------|-------------------|
| `System` | Root container | `goals` |
| `Module` | Logical grouping | (none) |
| `Entity` | Persistent data | `fields` |
| `Enum` | Value enumeration | `values` |
| `Value` | Immutable object | `fields` |
| `Interface` | API boundary | `style`, `exposes` |
| `Command` | Write operation | `input` |
| `Event` | State change notification | `payload` |
| `Query` | Read operation | `input`, `output` |
| `Process` | Multi-step workflow | `trigger` |
| `Step` | Process step | `action` |
| `Policy` | Business rule | `rules` |
| `Scenario` | Test case | `given`, `when`, `then` |
| `Contract` | Formal constraint | (varies) |

---

## System

Root container for the entire specification.

```yaml
- kind: System
  id: system.root
  meta:
    title: "System Name"
    description: "System description"
  spec:
    goals:                    # REQUIRED
      - "Goal 1"
      - "Goal 2"
  children:
    - NodeRef(mod.core)
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.goals` | `string[]` | Yes | System goals |

---

## Module

Logical grouping of related nodes.

```yaml
- kind: Module
  id: mod.sales
  meta:
    title: "Sales Module"
  spec: {}                    # Can be empty
  children:
    - NodeRef(entity.order)
    - NodeRef(cmd.order.create)
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | `object` | Yes | Can be empty `{}` |

---

## Entity

Persistent data structure.

```yaml
- kind: Entity
  id: entity.order
  meta:
    title: "Order"
  spec:
    fields:                   # REQUIRED
      id:
        type: uuid
        required: true
      status:
        type: enum(OrderStatus)
        required: true
        default: "draft"
    relations:                # optional
      customer:
        to: entity.customer
        type: many-to-one
  contracts:
    - invariant: "totalCents >= 0"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.fields` | `object` | Yes | Field definitions |
| `spec.relations` | `object` | No | Relation definitions |

### Field Definition

```yaml
fieldName:
  type: <FieldType>           # REQUIRED
  required: boolean           # default: false
  default: <value>            # optional
  description: "..."          # optional
```

### Relation Definition

```yaml
relationName:
  to: <entity-id>             # REQUIRED
  type: one-to-one | one-to-many | many-to-one | many-to-many
```

---

## Enum

Enumeration of allowed values.

```yaml
- kind: Enum
  id: enum.order_status
  meta:
    title: "Order Status"
  spec:
    values:                   # REQUIRED
      - "draft"
      - "submitted"
      - "paid"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.values` | `string[]` | Yes | Allowed values |

---

## Value

Immutable value object.

```yaml
- kind: Value
  id: value.money
  meta:
    title: "Money"
  spec:
    fields:                   # REQUIRED
      amount:
        type: int
        required: true
      currency:
        type: string
        required: true
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.fields` | `object` | Yes | Same as Entity |

---

## Interface

API boundary definition.

```yaml
- kind: Interface
  id: iface.http
  meta:
    title: "HTTP API"
  spec:
    style: openapi            # REQUIRED
    exposes:
      commands:
        - cmd.order.create
      queries:
        - qry.order.get
      events: []
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.style` | `string` | Yes | `openapi`, `graphql`, `grpc`, `async` |
| `spec.exposes` | `object` | Yes | Exposed operations |

---

## Command

Write operation that changes state.

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.input` | `object` | Yes | Input parameters |
| `spec.output` | `object` | No | Return values |
| `spec.effects.emits` | `string[]` | No | Events emitted |
| `spec.effects.modifies` | `string[]` | No | Entities modified |

---

## Event

Notification of state change.

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.payload` | `object` | Yes | Event payload fields |

---

## Query

Read operation.

```yaml
- kind: Query
  id: qry.order.get
  meta:
    title: "Get Order"
  spec:
    input:                    # REQUIRED
      orderId: uuid
    output:                   # REQUIRED
      order: ref(entity.order)
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.input` | `object` | Yes | Input parameters |
| `spec.output` | `object` | Yes | Return values |

---

## Process

Multi-step workflow.

```yaml
- kind: Process
  id: proc.order.fulfillment
  meta:
    title: "Order Fulfillment"
  spec:
    trigger: cmd.order.submit # REQUIRED
    state:                    # optional
      vars:
        orderId: uuid
        paid: bool
  children:
    - NodeRef(step.validate)
    - NodeRef(step.pay)
  contracts:
    - temporal: "G(step.ship -> paid)"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.trigger` | `string` | Yes | Command/Event ID that starts process |
| `spec.state.vars` | `object` | No | Process state variables |

---

## Step

Single step within a process.

```yaml
- kind: Step
  id: step.pay
  meta:
    title: "Process Payment"
  spec:
    action: "ProcessPayment"  # REQUIRED
    inputs:                   # optional
      orderId: uuid
    outputs:                  # optional
      paid: bool
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.action` | `string` | Yes | Action identifier |
| `spec.inputs` | `object` | No | Step inputs |
| `spec.outputs` | `object` | No | Step outputs |

---

## Policy

Business rule or constraint.

```yaml
- kind: Policy
  id: policy.order.limits
  meta:
    title: "Order Limits"
  spec:
    rules:                    # REQUIRED
      - "Max 100 items per order"
      - "Max $10,000 per order"
    applies_to:               # optional
      - entity.order
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.rules` | `string[]` | Yes | Rule descriptions |
| `spec.applies_to` | `string[]` | No | Affected nodes |

---

## Scenario

Test case specification.

```yaml
- kind: Scenario
  id: sc.order.happy_path
  meta:
    title: "Order Happy Path"
  spec:
    given:                    # REQUIRED
      - seed:
          entity: entity.customer
          data: { name: "Buyer" }
    when:                     # REQUIRED
      - command:
          id: cmd.order.submit
          input: { orderId: "$ref(order).id" }
    then:                     # REQUIRED
      - expectEvent:
          id: evt.order.submitted
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.given` | `array` | Yes | Preconditions |
| `spec.when` | `array` | Yes | Actions |
| `spec.then` | `array` | Yes | Expectations |

---

## Contract

Standalone formal constraint.

```yaml
- kind: Contract
  id: ctr.api.semver
  meta:
    title: "API Semver Compatibility"
  spec:
    type: api-compatibility
    rule: "minor cannot remove response fields"
    level: hard
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.type` | `string` | Yes | Contract type |
| `spec.rule` | `string` | Yes | Rule description |
| `spec.level` | `string` | Yes | `hard` or `soft` |
