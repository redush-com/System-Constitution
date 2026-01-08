# EvoSpec CLI — LLM Generation & Versioning

Technical specification for adding LLM-powered generation and Git-based versioning to the EvoSpec CLI.

---

## Overview

This document specifies three major features:

1. **Project Initialization** — Automatic project setup with Git integration
2. **LLM Generation** — Generate and evolve EvoSpec specifications using AI models
3. **Git Versioning** — Manage spec versions with Git integration

---

## 1. Project Initialization (Critical Feature)

### 1.1 Goals

- **Zero-friction setup** — Single command creates everything needed
- **Automatic Git** — Initialize Git repository automatically
- **Version tracking from day one** — Every spec change is tracked
- **Sensible defaults** — Works out of the box

### 1.2 Project Structure

When `evospec init` is run, it creates the following structure:

```
<project-name>/
├── .git/                          # Git repository (auto-initialized)
│   └── ...
├── .evospec/                      # EvoSpec project metadata
│   ├── config.yaml                # Project-level configuration
│   └── cache/                     # Generation cache (gitignored)
├── <project-name>.evospec.yaml    # Main specification file
├── .gitignore                     # Pre-configured gitignore
└── README.md                      # Auto-generated project readme
```

### 1.3 CLI Command: `evospec init`

```bash
evospec init [project-name] [options]

Arguments:
  project-name         Project name (default: current directory name)

Options:
  -d, --description <desc>   System description for LLM generation
  -p, --provider <provider>  LLM provider for initial generation
  -m, --model <model>        Model for initial generation
  --no-generate              Skip LLM generation, create minimal template
  --no-readme                Don't create README.md
  -y, --yes                  Skip confirmation prompts

Examples:
  # Create new project with LLM-generated spec
  evospec init myshop -d "E-commerce platform with orders and payments"
  
  # Create in current directory
  evospec init -d "Task management system"
  
  # Create minimal project without LLM
  evospec init myapp --no-generate
  
  # Non-interactive mode
  evospec init myapp -d "Blog platform" -y
```

### 1.4 Initialization Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│     evospec init myshop -d "E-commerce with orders and payments"        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 1. Create directory │
                         │    ./myshop/        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 2. Initialize Git   │
                         │    git init         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 3. Create .evospec/ │
                         │    config.yaml      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 4. Create .gitignore│
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────┴───────────────┐
                    │                               │
            Has description?                 No description
                    │                               │
                    ▼                               ▼
         ┌─────────────────────┐      ┌─────────────────────┐
         │ 5a. LLM Generate    │      │ 5b. Create minimal  │
         │     spec with       │      │     template spec   │
         │     validation loop │      │                     │
         └──────────┬──────────┘      └──────────┬──────────┘
                    │                             │
                    └───────────────┬─────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 6. Write spec file  │
                         │ myshop.evospec.yaml │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 7. Create README.md │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 8. Git add all      │
                         │    git add .        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 9. Initial commit   │
                         │ "Initial EvoSpec    │
                         │  v1.0.0"            │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 10. Create tag      │
                         │     v1.0.0          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Done! Project ready │
                         └─────────────────────┘
```

### 1.5 Generated Files

#### `.evospec/config.yaml`

```yaml
# EvoSpec Project Configuration
# Generated by: evospec init

project:
  name: myshop
  specFile: myshop.evospec.yaml

llm:
  provider: openrouter
  model: anthropic/claude-3.5-sonnet
  temperature: 0.3
  maxRetries: 3

versioning:
  autoCommit: true
  autoTag: true
  tagPrefix: v
```

#### `.gitignore`

```gitignore
# EvoSpec
.evospec/cache/

# Environment
.env
.env.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

#### `README.md`

```markdown
# myshop

EvoSpec-managed project.

## Specification

- **Spec file**: `myshop.evospec.yaml`
- **Current version**: 1.0.0

## Commands

```bash
# Validate specification
evospec validate myshop.evospec.yaml

# Evolve specification
evospec evolve myshop.evospec.yaml -c "Add new feature"

# View version history
evospec history

# Bump version
evospec version bump minor -m "Description"
```

## Generated by

EvoSpec CLI v1.0.0
```

### 1.6 Init in Existing Directory

When running `evospec init` in a directory that already has files:

```bash
cd existing-project
evospec init
```

Behavior:
1. **If `.git/` exists** — Use existing Git repo, don't reinitialize
2. **If `.evospec/` exists** — Error: "Project already initialized"
3. **If `*.evospec.yaml` exists** — Error: "Spec file already exists"
4. **Otherwise** — Initialize normally, add to existing Git if present

### 1.7 Init Without Git (Edge Case)

If Git is not installed on the system:

```bash
evospec init myapp

# Output:
# ⚠ Warning: Git not found. Version tracking will be limited.
# ✓ Created myapp/
# ✓ Created myapp/.evospec/config.yaml
# ✓ Created myapp/myapp.evospec.yaml
# ✓ Created myapp/README.md
# 
# Note: Install Git for full version tracking features.
```

The project still works, but:
- `evospec version bump` updates spec only (no commit/tag)
- `evospec history` shows only spec history (no Git info)
- `evospec diff` uses spec history only
- `evospec checkout` is disabled

### 1.8 Interactive Mode

Without `-y` flag, init prompts for confirmation:

```
$ evospec init myshop -d "E-commerce platform"

EvoSpec Project Initialization
==============================

Project name:     myshop
Directory:        ./myshop/
Description:      E-commerce platform

This will:
  • Create directory ./myshop/
  • Initialize Git repository
  • Generate specification using LLM (anthropic/claude-3.5-sonnet)
  • Create initial commit and tag v1.0.0

Proceed? [Y/n] y

Creating project...
  ✓ Created directory
  ✓ Initialized Git repository
  ✓ Created .evospec/config.yaml
  ✓ Created .gitignore
  ⠋ Generating specification... (attempt 1/3)
  ✓ Generated valid specification
  ✓ Created myshop.evospec.yaml
  ✓ Created README.md
  ✓ Created initial commit
  ✓ Created tag v1.0.0

Done! Project created at ./myshop/

Next steps:
  cd myshop
  evospec validate myshop.evospec.yaml
  evospec evolve myshop.evospec.yaml -c "Add feature"
```

---

## 2. LLM Generation

### 1.1 Goals

- Generate valid EvoSpec specifications from natural language descriptions
- Evolve existing specifications based on change requests
- Ensure all generated specs pass validation before output
- Support multiple LLM providers (OpenRouter, OpenAI, Anthropic, Ollama)

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Commands                             │
│  evospec generate | evospec evolve | evospec chat               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Generation Engine                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Prompt      │  │ LLM         │  │ Validation Loop         │  │
│  │ Builder     │──│ Provider    │──│ (retry until valid)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM Provider Abstraction                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐  │
│  │ OpenRouter   │ │ OpenAI       │ │ Anthropic    │ │ Ollama │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 CLI Commands

#### `evospec generate`

Generate a new EvoSpec specification from a description.

```bash
evospec generate <description> [options]

Arguments:
  description          Natural language description of the system

Options:
  -o, --output <file>  Output file path (default: stdout)
  -p, --provider <p>   LLM provider: openrouter|openai|anthropic|ollama (default: openrouter)
  -m, --model <model>  Model identifier (default: anthropic/claude-3.5-sonnet)
  --max-retries <n>    Max validation retry attempts (default: 3)
  --temperature <t>    Model temperature 0-1 (default: 0.3)
  --verbose            Show generation progress and retries

Examples:
  evospec generate "E-commerce with orders and payments" -o shop.evospec.yaml
  evospec generate "Task management system" --provider ollama --model llama3
```

#### `evospec evolve`

Evolve an existing specification based on a change request.

```bash
evospec evolve <spec-file> [options]

Arguments:
  spec-file            Path to existing EvoSpec file

Options:
  -c, --change <desc>  Change description (required)
  -o, --output <file>  Output file (default: overwrite input)
  --bump <type>        Version bump: major|minor|patch (default: minor)
  --no-bump            Don't bump version
  -p, --provider <p>   LLM provider (default: from config)
  -m, --model <model>  Model identifier (default: from config)
  --max-retries <n>    Max validation retry attempts (default: 3)
  --dry-run            Show changes without writing

Examples:
  evospec evolve app.evospec.yaml -c "Add phone field to customer"
  evospec evolve app.evospec.yaml -c "Add notification system" --bump major
```

#### `evospec chat`

Interactive chat mode for spec development.

```bash
evospec chat [spec-file] [options]

Arguments:
  spec-file            Optional: existing spec to modify

Options:
  -p, --provider <p>   LLM provider
  -m, --model <model>  Model identifier
  --save-on-exit       Save spec when exiting chat

Examples:
  evospec chat                           # Start new spec interactively
  evospec chat app.evospec.yaml          # Modify existing spec
```

### 1.4 LLM Provider Interface

```typescript
interface LLMProvider {
  readonly name: string;
  
  /**
   * Generate completion from prompt
   */
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  
  /**
   * Check if provider is configured and available
   */
  isAvailable(): Promise<boolean>;
}

interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface GenerateResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}
```

### 1.5 Provider Implementations

#### OpenRouter (Default)

```typescript
class OpenRouterProvider implements LLMProvider {
  constructor(config: {
    apiKey: string;           // OPENROUTER_API_KEY
    model: string;            // e.g., "anthropic/claude-3.5-sonnet"
    baseUrl?: string;         // default: https://openrouter.ai/api/v1
  });
}
```

#### OpenAI

```typescript
class OpenAIProvider implements LLMProvider {
  constructor(config: {
    apiKey: string;           // OPENAI_API_KEY
    model: string;            // e.g., "gpt-4-turbo"
    baseUrl?: string;         // for Azure or proxies
  });
}
```

#### Anthropic

```typescript
class AnthropicProvider implements LLMProvider {
  constructor(config: {
    apiKey: string;           // ANTHROPIC_API_KEY
    model: string;            // e.g., "claude-3-5-sonnet-20241022"
  });
}
```

#### Ollama (Local)

```typescript
class OllamaProvider implements LLMProvider {
  constructor(config: {
    model: string;            // e.g., "llama3", "codellama"
    baseUrl?: string;         // default: http://localhost:11434
  });
}
```

### 1.6 Validation Loop (Critical Feature)

**Before outputting any generated specification, it MUST pass validation.**

If validation fails, the model regenerates with error feedback until:
- Validation passes (success)
- Max retries exceeded (failure)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Validation Loop Flow                          │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │ User Request │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ Build Prompt │◄─────────────────────────────┐
     │ + System     │                              │
     │ + Context    │                              │
     │ + Errors     │ (if retry)                   │
     └──────┬───────┘                              │
            │                                      │
            ▼                                      │
     ┌──────────────┐                              │
     │ LLM Generate │                              │
     └──────┬───────┘                              │
            │                                      │
            ▼                                      │
     ┌──────────────┐                              │
     │ Parse YAML   │                              │
     └──────┬───────┘                              │
            │                                      │
            ▼                                      │
     ┌──────────────┐      ┌─────────────┐        │
     │  Validate    │─────▶│ Errors?     │        │
     │  (6 phases)  │      └──────┬──────┘        │
     └──────────────┘             │               │
                           Yes    │    No         │
                         ┌────────┴────────┐      │
                         │                 │      │
                         ▼                 ▼      │
                  ┌─────────────┐   ┌───────────┐ │
                  │ Retry < Max │   │  Output   │ │
                  │     ?       │   │  Result   │ │
                  └──────┬──────┘   └───────────┘ │
                         │                        │
                   Yes   │   No                   │
                  ┌──────┴──────┐                 │
                  │             │                 │
                  ▼             ▼                 │
           ┌───────────┐ ┌───────────┐           │
           │ Add Error │ │   Fail    │           │
           │ to Prompt │ │   Exit    │           │
           └─────┬─────┘ └───────────┘           │
                 │                               │
                 └───────────────────────────────┘
```

#### Validation Loop Implementation

```typescript
interface GenerationResult {
  success: boolean;
  spec?: EvoSpec;
  yaml?: string;
  attempts: number;
  errors?: ValidationError[];
}

async function generateWithValidation(
  provider: LLMProvider,
  request: GenerationRequest,
  options: {
    maxRetries: number;
    onRetry?: (attempt: number, errors: ValidationError[]) => void;
  }
): Promise<GenerationResult> {
  
  let attempts = 0;
  let lastErrors: ValidationError[] = [];
  
  while (attempts < options.maxRetries) {
    attempts++;
    
    // Build prompt (include errors if retry)
    const prompt = buildPrompt(request, lastErrors);
    
    // Generate from LLM
    const response = await provider.generate({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: prompt,
    });
    
    // Extract YAML from response
    const yaml = extractYaml(response.content);
    
    // Parse YAML
    let spec: unknown;
    try {
      spec = parseYaml(yaml);
    } catch (e) {
      lastErrors = [{
        code: 'STRUCTURAL_ERROR',
        phase: 1,
        level: 'hard',
        message: `YAML parse error: ${e.message}`,
        location: '',
      }];
      options.onRetry?.(attempts, lastErrors);
      continue;
    }
    
    // Validate
    const result = validate(spec);
    
    if (result.ok) {
      return {
        success: true,
        spec: spec as EvoSpec,
        yaml,
        attempts,
      };
    }
    
    // Validation failed - prepare for retry
    lastErrors = result.errors;
    options.onRetry?.(attempts, lastErrors);
  }
  
  // Max retries exceeded
  return {
    success: false,
    attempts,
    errors: lastErrors,
  };
}
```

#### Error Feedback Prompt

When retrying, include validation errors in the prompt:

```typescript
function buildPrompt(
  request: GenerationRequest,
  errors: ValidationError[]
): string {
  let prompt = request.userPrompt;
  
  if (errors.length > 0) {
    prompt += `\n\n---\n\n`;
    prompt += `⚠️ VALIDATION ERRORS FROM PREVIOUS ATTEMPT:\n\n`;
    prompt += `The previous generation failed validation. Fix these errors:\n\n`;
    
    for (const error of errors) {
      prompt += `- [${error.code}] ${error.message}\n`;
      prompt += `  Location: ${error.location}\n`;
      if (error.suggestion) {
        prompt += `  Fix: ${error.suggestion}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `\nGenerate a corrected specification that passes all validation phases.`;
  }
  
  return prompt;
}
```

### 1.7 Configuration

#### Config File Location

```
~/.evospec/config.yaml       # Global config
./.evospec.yaml              # Project config (overrides global)
```

#### Config Schema

```yaml
# ~/.evospec/config.yaml

llm:
  # Default provider
  provider: openrouter
  
  # Default model per provider
  models:
    openrouter: anthropic/claude-3.5-sonnet
    openai: gpt-4-turbo
    anthropic: claude-3-5-sonnet-20241022
    ollama: llama3
  
  # Generation settings
  temperature: 0.3
  maxRetries: 3

# Provider-specific settings
providers:
  openrouter:
    baseUrl: https://openrouter.ai/api/v1
    # apiKey from OPENROUTER_API_KEY env var
  
  openai:
    baseUrl: https://api.openai.com/v1
    # apiKey from OPENAI_API_KEY env var
  
  anthropic:
    # apiKey from ANTHROPIC_API_KEY env var
  
  ollama:
    baseUrl: http://localhost:11434
```

#### Environment Variables

```bash
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 1.8 Prompt Engineering

#### System Prompt

Use the existing `llm/v1/SYSTEM_PROMPT.md` as the system prompt.

#### Generation Prompt Template

```markdown
Generate an EvoSpec DSL v1 specification for the following system:

## System Description

{user_description}

## Requirements

1. Generate a complete, valid EvoSpec YAML
2. Include appropriate entities, commands, events
3. Add meaningful contracts and invariants
4. Include at least one test scenario
5. Set version to 1.0.0

## Output Format

Return ONLY the YAML specification, wrapped in ```yaml code blocks.
Do not include any explanations before or after the YAML.
```

#### Evolution Prompt Template

```markdown
Evolve the following EvoSpec specification based on the change request.

## Current Specification

```yaml
{current_spec}
```

## Change Request

{change_description}

## Requirements

1. Modify the spec to implement the requested change
2. Update version from {current_version} to {new_version}
3. Add appropriate entry to history[] with:
   - The new version
   - basedOn: {current_version}
   - Relevant changes[] entries
   - migrations[] if needed for breaking changes
4. Ensure all references remain valid
5. Add/update contracts if needed

## Output Format

Return ONLY the complete updated YAML specification.
```

---

## 2. Git Versioning

### 2.1 Goals

- Synchronize EvoSpec semver with Git commits and tags
- Provide CLI commands for version management
- Enable version history viewing and comparison
- Support rollback to previous versions

### 2.2 CLI Commands

#### `evospec version`

Show or manage specification version.

```bash
evospec version [command] [options]

Commands:
  (none)               Show current version
  bump <type>          Bump version (major|minor|patch)
  check                Verify version consistency with Git
  tag                  Create Git tag for current version

Options for 'bump':
  -m, --message <msg>  Commit message (required)
  -c, --change <spec>  Add change entry (format: op:target:field:type)
  --no-commit          Update spec but don't commit
  --no-tag             Don't create Git tag
  --dry-run            Show what would happen

Examples:
  evospec version                                    # Show: 1.2.0
  evospec version bump minor -m "Add notifications"
  evospec version bump patch -m "Fix customer email" \
    -c "add-field:entity.customer:emailVerified:bool"
  evospec version check
  evospec version tag
```

#### `evospec history`

Show version history.

```bash
evospec history [options]

Options:
  -n, --limit <n>      Number of versions to show (default: 10)
  --git                Include Git commit info
  --changes            Show change details
  --json               Output as JSON

Examples:
  evospec history
  evospec history --git --changes
  evospec history -n 5 --json
```

Output format:

```
Version History
===============

v1.2.0 (current)
  Date: 2025-01-08
  Git:  abc1234 - Add payment processing
  Changes:
    - add-node: entity.payment
    - add-node: cmd.payment.process

v1.1.0
  Date: 2025-01-05
  Git:  def5678 - Add phone to customer
  Changes:
    - add-field: entity.customer.phone (string, optional)

v1.0.0
  Date: 2025-01-01
  Git:  ghi9012 - Initial spec
  Notes: Initial version
```

#### `evospec diff`

Compare two versions.

```bash
evospec diff <version1> <version2> [options]

Arguments:
  version1             First version (e.g., 1.0.0, v1.0.0, HEAD~1)
  version2             Second version (default: current)

Options:
  --format <fmt>       Output format: text|json|yaml (default: text)
  --changes-only       Show only changes[], not full diff

Examples:
  evospec diff 1.0.0 1.2.0
  evospec diff v1.1.0              # Compare v1.1.0 to current
  evospec diff HEAD~1              # Compare to previous commit
```

#### `evospec checkout`

Switch to a specific version.

```bash
evospec checkout <version> [options]

Arguments:
  version              Version to checkout (e.g., 1.0.0, v1.0.0)

Options:
  --branch <name>      Create new branch for this version
  --force              Discard uncommitted changes

Examples:
  evospec checkout 1.0.0
  evospec checkout v1.1.0 --branch feature/from-v1.1
```

### 2.3 Version Bump Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              evospec version bump minor -m "message"             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ 1. Read current  │
                    │    spec file     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 2. Calculate new │
                    │    version       │
                    │    1.2.0 → 1.3.0 │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 3. Update spec:  │
                    │  - current ver   │
                    │  - history[]     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 4. Validate      │
                    │    updated spec  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 5. Write spec    │
                    │    file          │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 6. Git add       │
                    │    spec file     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 7. Git commit    │
                    │    with message  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 8. Git tag       │
                    │    v1.3.0        │
                    └──────────────────┘
```

### 2.4 Git Integration

```typescript
interface GitOperations {
  /**
   * Check if current directory is a Git repo
   */
  isGitRepo(): Promise<boolean>;
  
  /**
   * Get current commit hash
   */
  getCurrentCommit(): Promise<string>;
  
  /**
   * Get list of tags
   */
  getTags(): Promise<string[]>;
  
  /**
   * Check if there are uncommitted changes
   */
  hasUncommittedChanges(): Promise<boolean>;
  
  /**
   * Stage file for commit
   */
  add(file: string): Promise<void>;
  
  /**
   * Create commit
   */
  commit(message: string): Promise<string>;
  
  /**
   * Create tag
   */
  tag(name: string, message?: string): Promise<void>;
  
  /**
   * Get file content at specific ref
   */
  show(ref: string, file: string): Promise<string>;
  
  /**
   * Checkout ref
   */
  checkout(ref: string, options?: { branch?: string }): Promise<void>;
}
```

### 2.5 Version Consistency Check

```bash
evospec version check
```

Verifies:

1. **Spec version matches Git tag** (if tag exists)
2. **History chain is valid** (each version's basedOn is correct)
3. **No uncommitted changes** to spec file
4. **Current version is latest** in history

Output:

```
Version Consistency Check
=========================

✓ Spec version: 1.3.0
✓ Git tag v1.3.0 exists and matches
✓ History chain is valid (3 versions)
✓ No uncommitted changes

All checks passed!
```

Or with errors:

```
Version Consistency Check
=========================

✓ Spec version: 1.3.0
✗ Git tag v1.3.0 not found
  Run: evospec version tag

✓ History chain is valid
⚠ Uncommitted changes in spec file
  Run: git add && git commit

1 error, 1 warning
```

---

## 3. File Structure Changes

### New CLI Files

```
cli/
├── src/
│   ├── index.ts                    # Existing - add new commands
│   ├── commands/
│   │   ├── init.ts                 # NEW: init command (project setup)
│   │   ├── generate.ts             # NEW: generate command
│   │   ├── evolve.ts               # NEW: evolve command
│   │   ├── chat.ts                 # NEW: chat command
│   │   ├── version.ts              # NEW: version commands
│   │   ├── history.ts              # NEW: history command
│   │   ├── diff.ts                 # NEW: diff command
│   │   └── checkout.ts             # NEW: checkout command
│   ├── llm/
│   │   ├── provider.ts             # NEW: LLMProvider interface
│   │   ├── openrouter.ts           # NEW: OpenRouter implementation
│   │   ├── openai.ts               # NEW: OpenAI implementation
│   │   ├── anthropic.ts            # NEW: Anthropic implementation
│   │   ├── ollama.ts               # NEW: Ollama implementation
│   │   └── index.ts                # NEW: Provider factory
│   ├── generation/
│   │   ├── engine.ts               # NEW: Generation engine
│   │   ├── prompts.ts              # NEW: Prompt templates
│   │   └── validation-loop.ts      # NEW: Retry logic
│   ├── versioning/
│   │   ├── bump.ts                 # NEW: Version bump logic
│   │   ├── git.ts                  # NEW: Git operations
│   │   └── history.ts              # NEW: History management
│   ├── project/
│   │   ├── init.ts                 # NEW: Project initialization logic
│   │   ├── structure.ts            # NEW: Directory/file creation
│   │   └── templates.ts            # NEW: File templates (gitignore, readme)
│   └── config/
│       ├── loader.ts               # NEW: Config file loading
│       ├── schema.ts               # NEW: Config schema
│       └── defaults.ts             # NEW: Default configuration
└── package.json                    # Update dependencies
```

### Generated Project Structure

When `evospec init myproject` is run:

```
myproject/
├── .git/                           # Auto-initialized Git repository
│   ├── HEAD
│   ├── config
│   ├── objects/
│   ├── refs/
│   │   └── tags/
│   │       └── v1.0.0              # Initial version tag
│   └── ...
├── .evospec/                       # EvoSpec project metadata
│   ├── config.yaml                 # Project configuration
│   └── cache/                      # Temporary files (gitignored)
│       └── .gitkeep
├── myproject.evospec.yaml          # Main specification (v1.0.0)
├── .gitignore                      # Pre-configured
└── README.md                       # Auto-generated documentation
```

### New Dependencies

```json
{
  "dependencies": {
    "openai": "^4.x",              // OpenAI SDK (works with OpenRouter)
    "@anthropic-ai/sdk": "^0.x",   // Anthropic SDK
    "simple-git": "^3.x",          // Git operations
    "inquirer": "^9.x",            // Interactive prompts
    "ora": "^8.x",                 // Spinners for progress
    "fs-extra": "^11.x"            // Enhanced file operations
  }
}
```

---

## 4. Error Handling

### Initialization Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `DIRECTORY_EXISTS` | Target directory already exists | Use different name or `--force` |
| `PROJECT_EXISTS` | `.evospec/` already exists | Project already initialized |
| `SPEC_FILE_EXISTS` | `*.evospec.yaml` already exists | Remove or rename existing spec |
| `GIT_NOT_FOUND` | Git not installed | Install Git (warning, not error) |
| `GIT_INIT_FAILED` | Git init failed | Check permissions |
| `PERMISSION_DENIED` | Cannot create directory/files | Check filesystem permissions |

### Generation Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `PROVIDER_NOT_CONFIGURED` | Missing API key | Set env var or config |
| `PROVIDER_UNAVAILABLE` | API unreachable | Check network/URL |
| `GENERATION_FAILED` | LLM returned invalid response | Retry or change model |
| `VALIDATION_FAILED_MAX_RETRIES` | Couldn't generate valid spec | Manual intervention |
| `YAML_PARSE_ERROR` | LLM returned malformed YAML | Retry with feedback |

### Versioning Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `NOT_GIT_REPO` | No .git directory | Run `evospec init` or `git init` |
| `UNCOMMITTED_CHANGES` | Dirty working tree | Commit or stash |
| `TAG_EXISTS` | Git tag already exists | Use different version |
| `VERSION_MISMATCH` | Spec version ≠ Git tag | Run `version check` |
| `INVALID_VERSION` | Bad semver format | Fix version string |

---

## 5. Success Criteria

### Initialization

- [ ] `evospec init` creates complete project structure
- [ ] Git repository is automatically initialized
- [ ] Initial commit and tag v1.0.0 are created
- [ ] LLM generation works during init (with `-d` flag)
- [ ] Works without Git installed (graceful degradation)
- [ ] Detects and respects existing Git repositories
- [ ] Interactive mode prompts for confirmation
- [ ] Non-interactive mode with `-y` flag

### Generation

- [ ] `evospec generate` creates valid spec from description
- [ ] `evospec evolve` updates spec with proper history
- [ ] Validation loop retries until valid (max 3 attempts)
- [ ] All 4 providers work (OpenRouter, OpenAI, Anthropic, Ollama)
- [ ] Config file loading works (global + project)

### Versioning

- [ ] `evospec version bump` updates spec + commits + tags
- [ ] `evospec history` shows version history
- [ ] `evospec diff` compares versions
- [ ] `evospec version check` validates consistency
- [ ] Works without Git (graceful degradation with warnings)

### Integration

- [ ] `evospec init` + LLM generation in single command
- [ ] `evospec evolve` + version bump in single command
- [ ] Generated specs pass all 6 validation phases
- [ ] Error messages are actionable
- [ ] All commands respect `.evospec/config.yaml`

---

## 6. Future Considerations

### Not in Scope (v1)

- Multi-file spec support
- Spec merging (like git merge)
- Collaborative editing
- Cloud sync
- Spec templates marketplace

### Potential v2 Features

- `evospec migrate` — Generate migration code
- `evospec codegen` — Generate code from spec
- `evospec publish` — Publish to registry
- `evospec import` — Import from OpenAPI/GraphQL
