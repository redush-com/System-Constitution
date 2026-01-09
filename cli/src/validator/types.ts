/**
 * EvoSpec DSL Validator Types
 */

// ============================================
// Core Types
// ============================================

export type StableId = string;

export type NodeKind =
  | 'System'
  | 'Module'
  | 'Entity'
  | 'Enum'
  | 'Value'
  | 'Interface'
  | 'Command'
  | 'Event'
  | 'Query'
  | 'Process'
  | 'Step'
  | 'Policy'
  | 'Scenario'
  | 'Contract';

export interface Meta {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface Field {
  type: string;
  required?: boolean;
  default?: unknown;
  description?: string;
}

export interface Relation {
  to: StableId;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
}

export interface Contract {
  type?: string;
  invariant?: string;
  temporal?: string;
  rule?: string;
  level?: 'hard' | 'soft';
}

export interface Hook {
  id: StableId;
  location: {
    file: string;
    anchorStart: string;
    anchorEnd: string;
  };
  contract?: {
    signature?: string;
    purity?: boolean;
    async?: boolean;
    throws?: boolean;
  };
}

// ============================================
// Node Types
// ============================================

export interface Node {
  kind: NodeKind;
  id: StableId;
  meta?: Meta;
  spec: Record<string, unknown>;
  impl?: Record<string, unknown>;
  facets?: Record<string, unknown>;
  children?: (string | Node)[];
  contracts?: Contract[];
  hooks?: Hook[];
}

// ============================================
// Spec Structure
// ============================================

export interface Project {
  id: StableId;
  name?: string;
  versioning: {
    strategy: 'semver';
    current: string;
    compatibility?: {
      data?: 'forward-only' | 'bidirectional';
      api?: 'no-breaking-in-minor' | 'breaking-allowed';
      processes?: 'instance-pinned' | 'auto-migrate';
    };
  };
}

export interface Structure {
  root: string;
}

export interface Domain {
  nodes: Node[];
}

export interface Zone {
  path: string;
  mode: 'overwrite' | 'anchored' | 'preserve' | 'spec-controlled';
}

export interface Pipeline {
  cmd: string;
}

export interface Generation {
  monorepo?: {
    layout?: {
      apps?: Record<string, string>;
      libs?: Record<string, string>;
    };
  };
  zones?: Zone[];
  hooks?: Hook[];
  pipelines?: {
    build?: Pipeline;
    test?: Pipeline;
    e2e?: Pipeline;
    migrate?: Pipeline;
    lint?: Pipeline;
  };
  verification?: {
    required?: string[];
    optional?: string[];
  };
}

export interface Change {
  op: string;
  target: StableId;
  field?: string;
  type?: string;
  required?: boolean;
  from?: string;
  to?: string;
}

export interface MigrationStep {
  backfill?: {
    entity: StableId;
    set: Record<string, unknown>;
  };
  sql?: string;
  script?: string;
}

export interface Migration {
  id: StableId;
  kind: 'data' | 'schema' | 'process';
  steps: MigrationStep[];
  validate?: { assert: string }[];
}

export interface HistoryEntry {
  version: string;
  basedOn: string | null;
  changes: Change[];
  migrations: Migration[];
  notes?: string;
}

export interface Tests {
  scenarios?: string[];
}

export interface DocPack {
  id: StableId;
  include: Record<string, unknown>;
}

export interface Docs {
  packs?: DocPack[];
}

export interface EvoSpec {
  spec: 'sysconst/v1';
  project: Project;
  structure: Structure;
  domain: Domain;
  generation?: Generation;
  history?: HistoryEntry[];
  tests?: Tests;
  docs?: Docs;
}

// ============================================
// Validation Types
// ============================================

export type ErrorCode =
  | 'STRUCTURAL_ERROR'
  | 'MISSING_SPEC_VERSION'
  | 'INVALID_SPEC_VERSION'
  | 'MISSING_PROJECT'
  | 'MISSING_PROJECT_ID'
  | 'MISSING_VERSIONING'
  | 'MISSING_CURRENT_VERSION'
  | 'MISSING_STRUCTURE'
  | 'MISSING_STRUCTURE_ROOT'
  | 'MISSING_DOMAIN'
  | 'MISSING_DOMAIN_NODES'
  | 'INVALID_NODE'
  | 'MISSING_NODE_KIND'
  | 'INVALID_NODE_KIND'
  | 'MISSING_NODE_ID'
  | 'INVALID_NODE_ID'
  | 'MISSING_NODE_SPEC'
  | 'DUPLICATE_NODE_ID'
  | 'REFERENCE_ERROR'
  | 'UNRESOLVED_NODEREF'
  | 'UNRESOLVED_ROOT'
  | 'INVALID_ROOT_KIND'
  | 'CIRCULAR_CHILDREN'
  | 'MISSING_RENAME_OP'
  | 'MISSING_REMOVE_OP'
  | 'SEMANTIC_ERROR'
  | 'ENTITY_MISSING_FIELDS'
  | 'FIELD_MISSING_TYPE'
  | 'INVALID_FIELD_TYPE'
  | 'UNRESOLVED_REF_TYPE'
  | 'UNRESOLVED_ENUM_TYPE'
  | 'COMMAND_MISSING_INPUT'
  | 'EVENT_MISSING_PAYLOAD'
  | 'QUERY_MISSING_INPUT'
  | 'QUERY_MISSING_OUTPUT'
  | 'PROCESS_MISSING_TRIGGER'
  | 'INVALID_PROCESS_TRIGGER'
  | 'INVALID_PROCESS_CHILDREN'
  | 'SCENARIO_MISSING_GIVEN'
  | 'SCENARIO_MISSING_WHEN'
  | 'SCENARIO_MISSING_THEN'
  | 'INVALID_CONTRACT'
  | 'INVALID_INVARIANT'
  | 'INVALID_TEMPORAL'
  | 'UNRESOLVED_EFFECT_EVENT'
  | 'UNRESOLVED_EFFECT_ENTITY'
  | 'EVOLUTION_ERROR'
  | 'INVALID_HISTORY_START'
  | 'BROKEN_HISTORY_CHAIN'
  | 'VERSION_MISMATCH'
  | 'UNDECLARED_CHANGE'
  | 'MISSING_MIGRATION'
  | 'INVALID_MIGRATION'
  | 'MIGRATION_MISSING_ID'
  | 'MIGRATION_MISSING_KIND'
  | 'MIGRATION_MISSING_STEPS'
  | 'INVALID_MIGRATION_KIND'
  | 'MIGRATION_VIOLATES_INVARIANT'
  | 'GENERATION_ERROR'
  | 'UNCOVERED_FILE'
  | 'OVERLAPPING_ZONES'
  | 'PRESERVE_ZONE_MODIFIED'
  | 'HOOK_IN_OVERWRITE'
  | 'DUPLICATE_HOOK_ID'
  | 'INVALID_HOOK_ANCHORS'
  | 'HOOK_CONTENT_MODIFIED'
  | 'HOOK_ANCHOR_DELETED'
  | 'HOOK_CONTRACT_VIOLATED'
  | 'VERIFICATION_ERROR'
  | 'MISSING_BUILD_PIPELINE'
  | 'MISSING_TEST_PIPELINE'
  | 'MISSING_MIGRATE_PIPELINE'
  | 'EMPTY_PIPELINE_CMD'
  | 'SCENARIO_INVALID_ENTITY'
  | 'SCENARIO_INVALID_COMMAND'
  | 'SCENARIO_INVALID_EVENT'
  | 'LOW_SCENARIO_COVERAGE'
  | 'UNVERIFIED_CONTRACT'
  | 'CONTRACT_VIOLATION'
  | 'INVARIANT_VIOLATION'
  | 'TEMPORAL_VIOLATION'
  | 'API_COMPAT_VIOLATION'
  | 'POLICY_VIOLATION';

export type ErrorLevel = 'hard' | 'soft';

export type ValidationPhase = 1 | 2 | 3 | 4 | 5 | 6;

export interface ValidationError {
  code: ErrorCode;
  phase: ValidationPhase;
  level: ErrorLevel;
  message: string;
  location: string;
  suggestion?: string;
  context?: Record<string, unknown>;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  phase: ValidationPhase;
}

export interface ValidateOptions {
  phases?: ValidationPhase[];
  strict?: boolean;
}
