---
sidebar_position: 1
title: Node Kinds
---

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

## Entity

```yaml
- kind: Entity
  id: entity.order
  spec:
    fields:
      id: { type: uuid, required: true }
      status: { type: enum(OrderStatus), required: true }
    relations:
      customer: { to: entity.customer, type: many-to-one }
```

## Command

```yaml
- kind: Command
  id: cmd.order.submit
  spec:
    input:
      orderId: uuid
    effects:
      emits: [evt.order.submitted]
```

## Event

```yaml
- kind: Event
  id: evt.order.submitted
  spec:
    payload:
      orderId: uuid
      occurredAt: datetime
```

## Process

```yaml
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
```

For complete details, see the [full reference](/docs/v1/reference/node-kinds.md).
