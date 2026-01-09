# Type System Reference

Complete reference for the System Constitution DSL type system.

## Primitive Types

| Type | Description | JSON Type | Example |
|------|-------------|-----------|---------|
| `uuid` | UUID v4 identifier | string | `"550e8400-e29b-41d4-a716-446655440000"` |
| `string` | Text | string | `"Hello, World"` |
| `int` | Integer number | number | `42` |
| `bool` | Boolean | boolean | `true` |
| `datetime` | ISO 8601 timestamp | string | `"2025-01-08T12:00:00Z"` |

## Reference Types

### Entity Reference

Reference to another entity.

```yaml
type: ref(entity.customer)
```

Usage:

```yaml
fields:
  customerId:
    type: ref(entity.customer)
    required: true
```

The referenced entity MUST exist in the spec.

### Enum Reference

Reference to an enum type.

```yaml
type: enum(OrderStatus)
```

Usage:

```yaml
fields:
  status:
    type: enum(OrderStatus)
    required: true
    default: "draft"
```

The referenced enum MUST exist in the spec.

## Field Definitions

### Basic Field

```yaml
fields:
  name:
    type: string
```

### Required Field

```yaml
fields:
  id:
    type: uuid
    required: true
```

### Field with Default

```yaml
fields:
  status:
    type: enum(OrderStatus)
    required: true
    default: "draft"
```

### Field with Description

```yaml
fields:
  email:
    type: string
    required: true
    description: "User's primary email address"
```

### Complete Field Definition

```yaml
fields:
  totalCents:
    type: int
    required: true
    default: 0
    description: "Order total in cents"
```

## Type Usage by Context

### Entity Fields

```yaml
- kind: Entity
  id: entity.order
  spec:
    fields:
      id: { type: uuid, required: true }
      customerId: { type: ref(entity.customer), required: true }
      status: { type: enum(OrderStatus), required: true }
      totalCents: { type: int, required: true, default: 0 }
      notes: { type: string }
      createdAt: { type: datetime, required: true }
      isActive: { type: bool, required: true, default: true }
```

### Command Input/Output

```yaml
- kind: Command
  id: cmd.order.create
  spec:
    input:
      customerId: uuid
      notes: string
    output:
      orderId: uuid
      success: bool
```

### Event Payload

```yaml
- kind: Event
  id: evt.order.created
  spec:
    payload:
      orderId: uuid
      customerId: uuid
      totalCents: int
      occurredAt: datetime
```

### Process State

```yaml
- kind: Process
  id: proc.order.fulfillment
  spec:
    trigger: cmd.order.submit
    state:
      vars:
        orderId: uuid
        paid: bool
        shippedAt: datetime
```

### Step Inputs/Outputs

```yaml
- kind: Step
  id: step.pay
  spec:
    action: "ProcessPayment"
    inputs:
      orderId: uuid
      amountCents: int
    outputs:
      paid: bool
      transactionId: string
```

## Type Validation Rules

### UUID

- MUST be valid UUID v4 format
- Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`

### String

- Any valid UTF-8 string
- No length restrictions by default (use contracts for limits)

### Int

- 64-bit signed integer
- Range: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807

### Bool

- `true` or `false`

### Datetime

- MUST be valid ISO 8601 format
- Pattern: `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$`
- Example: `2025-01-08T12:00:00Z`

### ref(entity.x)

- Referenced entity MUST exist
- Validation error if entity not found

### enum(EnumName)

- Referenced enum MUST exist
- Value MUST be one of enum's values
- Validation error if enum not found or value invalid

## Type Coercion

SysConst does NOT perform automatic type coercion. Types must match exactly.

```yaml
# Valid
totalCents: 100

# Invalid - string instead of int
totalCents: "100"
```

## Nullable Types

By default, optional fields (required: false) can be null:

```yaml
fields:
  phone:
    type: string
    required: false  # Can be null or string
```

Required fields cannot be null:

```yaml
fields:
  email:
    type: string
    required: true  # Must be string, cannot be null
```

## Array Types

SysConst v1 does not have native array types. Use relations for collections:

```yaml
- kind: Entity
  id: entity.order
  spec:
    relations:
      items:
        to: entity.order_item
        type: one-to-many
```

## Custom Types

Custom types are not supported in v1. Use:
- Enums for constrained string values
- Value objects for composite types
- Contracts for validation rules

## Type Examples

### User Entity

```yaml
- kind: Entity
  id: entity.user
  spec:
    fields:
      id:
        type: uuid
        required: true
      email:
        type: string
        required: true
      name:
        type: string
        required: true
      phone:
        type: string
        required: false
      isActive:
        type: bool
        required: true
        default: true
      createdAt:
        type: datetime
        required: true
      lastLoginAt:
        type: datetime
        required: false
```

### Order with Relations

```yaml
- kind: Entity
  id: entity.order
  spec:
    fields:
      id:
        type: uuid
        required: true
      customerId:
        type: ref(entity.customer)
        required: true
      status:
        type: enum(OrderStatus)
        required: true
        default: "draft"
      totalCents:
        type: int
        required: true
        default: 0
    relations:
      customer:
        to: entity.customer
        type: many-to-one
      items:
        to: entity.order_item
        type: one-to-many
```
