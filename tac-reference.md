# TAC (Tactical Agentic Coding) Reference

This document describes the TAC course repositories and how they relate to WitnessMark's agentic coding infrastructure.

## Overview

TAC is an 8-lesson course on "agentic coding" - a paradigm where AI agents execute development workflows autonomously rather than just generating code for humans to copy/paste.

The TAC repos are located at `/home/kpkpk/tac-1` through `/home/kpkpk/tac-8`.

## Course Progression

| Level | Theme | Key Concept |
|-------|-------|-------------|
| TAC-1 | Introduction | AI Coding vs Agentic Coding |
| TAC-2 | Structure | Slash Commands, Specs, AI Docs |
| TAC-3 | Automation | AI Developer Workflows (ADWs) |
| TAC-4 | Control | Lifecycle Hooks |
| TAC-5 | Extension | MCP Servers (Playwright) |
| TAC-6 | Isolation | Git Worktrees |
| TAC-7 | Context | Documentation-Driven Development |
| TAC-8 | Scale | Multi-Agent Systems |

---

## TAC-1: Introduction to Agentic Coding

**Key Files:**
- `.claude/settings.json` - Basic permissions
- `programmable/` - Scripts to invoke Claude programmatically (Python, Shell, TypeScript)
- `programmable/prompt.md` - Example agentic prompt with RUN/CREATE/REPORT verbs

**Core Teaching:** The difference between asking AI to generate code vs. having agents execute entire workflows (branch, code, run, commit).

**WitnessMark Status:** Complete (have `settings.local.json`, `.env.sample`)

---

## TAC-2: Project Structure for Agents

**Key Files:**
- `.claude/commands/` - Slash command templates
  - `prime.md` - Onboard to codebase
  - `install.md` - Set up dependencies
  - `tools.md` - List available tools
- `specs/` - Feature specifications
- `ai_docs/` - LLM documentation (API references)
- `agents/` - Agent execution logs

**Core Teaching:** Organizing a codebase so agents can navigate it effectively.

**WitnessMark Status:** Complete (have `commands/`, `specs/`, `adws/`)

---

## TAC-3: AI Developer Workflows (ADWs)

**Key Files:**
- `adws/` - Workflow scripts
  - `health_check.py` - Basic health check
  - `trigger_webhook.py` - React to GitHub webhooks
  - `trigger_cron.py` - Poll GitHub issues
  - `adw_plan_build.py` - Plan then build workflow
- `.claude/commands/` expanded with:
  - `bug.md` - Plan bug fixes
  - `chore.md` - Plan maintenance tasks
  - `feature.md` - Plan new features
  - `implement.md` - Execute a plan

**Core Teaching:** Automating the Plan -> Implement cycle. Agents read specs and execute them.

**WitnessMark Status:** Partial (have `adws/adw_build_and_test.py`, could add more workflows)

---

## TAC-3.5: API-Level E2E Testing (TDD Foundation)

Between ADWs (TAC-3) and browser E2E (TAC-5), API-level end-to-end testing provides the TDD foundation for confident development.

**Key Files:**
- `scripts/smoke-test.sh` - Automated API endpoint validation (~5 seconds)
- `scripts/example-adw-test.py` - Python integration for ADW workflows
- `scripts/README-smoke-tests.md` - Complete documentation

**Core Teaching:** Test-Driven Development through automated end-to-end API validation. Fast feedback loops (5s) enable continuous validation without slowing development.

**TDD Principles Applied:**
1. **Automated validation** - No manual clicking required
2. **End-to-end coverage** - Full request cycle: Client → API → Database → Response
3. **Fast feedback** - 5 seconds enables "test on every change" workflow
4. **Regression prevention** - Catches "whack-a-mole" bugs immediately
5. **Confident refactoring** - Know instantly if changes break existing functionality
6. **CI/CD ready** - JSON output for pipeline integration

**What's Tested:**
- Health endpoints (4): basic health, replica status, costs, heartbeat
- Tracker endpoints (3): status, transactions, listings
- Market endpoints (3): items, opportunities, decomposed
- Schema (1): database structure

**Port Parameterization for Parallel Worktrees:**
```bash
# Worktree 1
./scripts/smoke-test.sh --port 8001

# Worktree 2 (parallel)
./scripts/smoke-test.sh --port 8002

# Worktree 3 (parallel)
./scripts/smoke-test.sh --port 8003
```

**ADW Integration:**
```python
# In adws/adw_build_update_task.py
import json
import subprocess

result = subprocess.run(
    ["./scripts/smoke-test.sh", f"--port={port}", "--json"],
    cwd=worktree_path,
    capture_output=True,
    text=True
)

data = json.loads(result.stdout)
if result.returncode != 0:
    failed_tests = [t for t in data['tests'] if t['status'] == 'fail']
    # Block merge, report failures
    raise ValidationError(f"{len(failed_tests)} tests failed")
```

**Difference from TAC-5:**
- **TAC-3.5 (API E2E):** Tests API endpoints via HTTP (curl/fetch) - 5 seconds
- **TAC-5 (Browser E2E):** Tests UI interactions via browser (Playwright) - 2-3 minutes

Both are end-to-end testing, both enable TDD workflow. Choose based on what you're testing:
- Use API E2E for backend changes, regressions, CI/CD
- Use Browser E2E for UI/UX changes, visual regressions, user flows

### Frontend Tab Sanity Check with Profiling

Validates all 6 frontend tabs are populating with data and captures performance metrics.

**Key Files:**
- `tests/e2e/tab-sanity-check.spec.ts` - Playwright test with API timing capture
- `scripts/tab-sanity-check.sh` - CLI runner with profiling output

**What's Tested:**
- Transactions tab: Transaction count, table rows
- Listings tab: Listing table rows
- Opportunities tab: Opportunity cards/rows
- Crafting tab: Recipe data or empty state
- Health tab: Status indicators, stats, costs
- SQL Interface tab: Query input ready

**Performance Profiling:**
- Intercepts all API requests during tab load
- Captures response time, status, size for each endpoint
- Identifies bottlenecks exceeding thresholds (>2s warning, >5s critical)
- Reports slowest endpoint per tab

**Run Commands:**
```bash
# Run tab sanity check
./scripts/tab-sanity-check.sh

# Run with custom threshold (5 seconds)
./scripts/tab-sanity-check.sh --threshold 5000

# Run with JSON output for CI/CD
./scripts/tab-sanity-check.sh --json

# Run via npm
npm run test:e2e tests/e2e/tab-sanity-check.spec.ts
```

**Example Output:**
```
## Frontend Tab Sanity Check

| Tab          | Status | Load Time | API Calls | Slowest Endpoint      |
|--------------|--------|-----------|-----------|----------------------|
| Transactions | ✅     | 1.2s      | 2         | /api/tracker/transactions (1.1s) |
| Health       | ⚠️     | 8.3s      | 3         | /api/health/stats (17.4s) |

⚠️  Warning: Health tab exceeds 3s threshold (8.3s)
⚠️  Bottleneck: /api/health/stats (17.4s)

Total: 6/6 tabs passing, 1 warning
```

**WitnessMark Status:** Complete ✅ (implemented 2026-01-09)

---

## TAC-4: Lifecycle Hooks

**Key Files:**
- `.claude/hooks/` - Event-driven scripts
  - `pre_tool_use.py` - Runs BEFORE any tool
  - `post_tool_use.py` - Runs AFTER any tool
  - `notification.py` - Handle notifications
  - `stop.py` - Runs when agent stops
  - `subagent_stop.py` - Runs when subagent stops
- `.claude/settings.json` - Hook configuration

**Core Teaching:** Fine-grained control over agent behavior through lifecycle events.

**WitnessMark Status:** Not implemented

---

## TAC-5: MCP (Model Context Protocol) Integration

**Key Files:**
- `.mcp.json` - MCP server configuration (root of project)
- `app/client/playwright.config.ts` - Playwright test configuration
- `tests/e2e/*.spec.ts` - E2E test suites

**DonutSMP `.mcp.json`:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated", "--headless"]
    }
  }
}
```

**E2E Test Suites:**
- `tests/e2e/crafting-flow.spec.ts` - Crafting calculator user flow
- `tests/e2e/multi-tab.spec.ts` - Multi-tab state synchronization
- `tests/e2e/persistence.spec.ts` - Data persistence across sessions
- `tests/e2e/connection-ui.spec.ts` - Connection status UI behavior
- `tests/e2e/test-deployment-flow.spec.ts` - Deployment verification flow

**Run Commands:**
```bash
npm run test:e2e                    # Run all E2E tests
npm run test:e2e tests/e2e/crafting-flow.spec.ts  # Run specific suite
npm run test:e2e -- --headed       # Run in headed mode
npm run test:e2e -- --debug         # Run with debugging
```

**Core Teaching:** Extending agents with external tools via MCP protocol for browser automation.

**DonutSMP Status:** Complete ✅ (implemented 2026-01-13)

---

## TAC-6: Isolated Execution

**Key Files:**
- `adws/adw_plan_build_iso.py` - Isolated workflow using git worktrees
- `trees/` - Directory for isolated worktrees

**Core Teaching:** Running agents in isolated git worktrees for safe, parallel execution.

**WitnessMark Status:** Not implemented

---

## TAC-7: Documentation-Driven Development

**Key Files:**
- `app_docs/` - Feature documentation with assets
- `ai_docs/` expanded with:
  - `claude_code_cli_reference.md`
  - `claude_code_sdk.md`
  - `e2b.md` (cloud execution)
- `.claude/commands/conditional_docs.md` - Guide for which docs to read

**Core Teaching:** Comprehensive documentation improves agent performance.

**WitnessMark Status:** Partial (have docs in `beacon/` and `manager/`, could consolidate)

---

## TAC-8: Multi-Agent Systems

**Structure:** Contains 5 sub-projects, each demonstrating a different architecture:

| App | Focus |
|-----|-------|
| `app1__agent_layer_primitives` | Minimum vs Scaled Agentic Layer patterns |
| `app2__multi_agent_todone` | Multi-agent task delegation via `tasks.md` |
| `app3__out_loop_multi_agent_task_board` | Out-of-loop orchestration |
| `app4__agentic_prototyping` | Rapid prototyping with agents |
| `app5__nlq_to_sql_aea` | Agent-Environment-Action architecture |

**Core Teaching:** The "12 Leverage Points of Agentic Coding":

**In Agent (Core Four):**
1. Context
2. Model
3. Prompt
4. Tools

**Through Agent:**
5. Standard Output
6. Types
7. Docs
8. Tests
9. Architecture
10. Plans
11. Templates
12. AI Developer Workflows

**WitnessMark Status:** Not implemented

---

## WitnessMark TAC Level Summary

| TAC Level | Concept | DonutSMP |
|-----------|---------|----------|
| TAC-1 | Permissions, `.env.sample` | ✅ Complete |
| TAC-2 | Commands, Specs | ✅ Complete |
| TAC-3 | ADWs, Plan->Implement | ✅ Complete |
| TAC-3.5 | API E2E Testing (TDD) | ✅ Complete |
| TAC-4 | Hooks | ✅ Complete |
| TAC-5 | MCP Servers (Browser E2E) | ✅ Complete |
| TAC-6 | Git Worktrees | ✅ Complete |
| TAC-7 | Consolidated Docs | ✅ Complete |
| TAC-8 | Multi-Agent | ✅ Complete |

**Current Level: TAC-8 (complete)** - Full worktree isolation with multi-agent task coordination, MCP browser automation, and documentation-driven development

---

## DonutSMP TAC Implementation Details

### TAC-4: Lifecycle Hooks (Complete ✅)

We have 5 fully implemented lifecycle hooks in `.claude/hooks/`:

1. **pre_tool_use.py** - Executes before any tool use
   - Validates dangerous commands (blocks `rm -rf` variations)
   - Logs tool invocations to session directory
   - Security gate for destructive operations

2. **post_tool_use.py** - Executes after tool completion
   - Logs tool results and timing
   - Tracks success/failure metrics
   - Session continuity tracking

3. **notification.py** - Handles agent notifications
   - TTS announcements (optional)
   - Session event logging
   - User notification delivery

4. **stop.py** - Executes when agent session stops
   - Session summary generation
   - Cleanup operations
   - Final status reporting

5. **subagent_stop.py** - Executes when subagent completes
   - Subagent result collection
   - Parent-child agent coordination
   - Nested execution tracking

**Hook Utilities:**
- `utils/constants.py` - Shared constants and session directory management
- `utils/llm/anth.py` - Anthropic API integration for hooks
- `utils/llm/oai.py` - OpenAI API integration for hooks

### TAC-6: Git Worktrees (Complete ✅)

We have 9 worktree management commands in `.claude/commands/`:

1. **init_worktree.md** - Create isolated git worktree for parallel development
2. **clean_worktree.md** - Remove worktree and cleanup
3. **merge.md** - Merge worktree changes back to main
4. **worktree_status.md** - Show status of all worktrees
5. **make_worktree_name.md** - Generate standardized worktree names
6. **review.md** - Review changes in worktree before merge
7. **build.md** - Build and test in isolated worktree
8. **mark_in_progress.md** - Update task status in worktree
9. **update_task.md** - Update task completion status

**Worktree Integration:**
- `trees/` - Directory for all isolated worktrees
- `adws/adw_build_update_task.py` - ADW that executes in isolated worktrees
- `adws/adw_plan_implement_update_task.py` - Plan+implement in worktree isolation

**Key Features:**
- Parallel agent execution without conflicts
- Full repository isolation per feature/bug/chore
- Automated merge workflows
- Status tracking per worktree

### TAC-7: Documentation-Driven Development (Complete ✅)

We have complete documentation organization with intelligent routing:

**Documentation Structure:**
1. **app_docs/** - Internal feature documentation (4 major features documented)
   - `feature-market-tracking.md` - Real-time auction house data collection
   - `feature-crafting-calculator.md` - Crafting profit analysis for 1,557 recipes
   - `feature-health-monitoring.md` - Health endpoints and backup system
   - `feature-replica-architecture.md` - Embedded replica pattern with Query API
   - `agentic_kpis.md` - ADW execution metrics and velocity tracking
   - `feature-template.md` - Standard template for new feature docs
   - `README.md` - Documentation organization guide

2. **ai_docs/** - External AI service references (5 files)
   - `anthropic_quick_start.md` - Claude API integration
   - `claude-billing-and-usage.md` - Token usage and cost optimization
   - `deployment-tools.md` - Fly.io deployment guide
   - `openai_quick_start.md` - OpenAI API integration
   - `README.md` - AI documentation index

3. **.claude/commands/conditional_docs.md** - Documentation routing guide
   - Maps docs to trigger conditions (task keywords, file paths, feature areas)
   - Enables intelligent context loading based on current work
   - Prevents unnecessary doc loading (efficient context usage)

**Key Features:**
- Feature-specific documentation with consistent structure
- Automatic documentation detection for test skipping
- Conditional routing based on task context
- KPI tracking for agentic workflows
- Template-driven documentation standards

**Documentation Detection Logic:**
- Automatic `.md`-only change detection in `adw_build_update_task.py`
- Skips API smoke tests for documentation-only commits
- Prevents false failures for legitimate documentation work

### TAC-8: Multi-Agent Systems (Complete ✅)

We have complete multi-agent task coordination via `tasks.md`:

**ATL (Agent Task List) Format:**
```markdown
Task status legend:
- `[]` - Not started (eligible for pickup)
- `[⏰]` - Blocked (waits for all previous tasks in worktree to complete)
- `[🟡, <adw_id>]` - Work in progress
- `[✅ <commit_hash>, <adw_id>]` - Success
- `[❌, <adw_id>]` - Failed

Tags: {opus}, {sonnet}, {adw_plan_implement_update_task}
```

**Coordination Commands:**
1. **process_tasks.md** - Analyze tasks.md and identify eligible tasks for pickup
2. **mark_in_progress.md** - Mark task as in-progress when agent starts work
3. **update_task.md** - Update task status on completion/failure
4. **plan.md** - Create plan for task execution

**Automation:**
- `adws/adw_triggers/adw_trigger_cron_todone.py` - Automated task distribution
  - Monitors tasks.md continuously
  - Spawns agents for eligible tasks
  - Handles task dependencies and blocking

**Multi-Agent Patterns:**
- Git worktree isolation (each agent works in separate worktree)
- Task dependency management (⏰ blocked tasks)
- Model selection hints ({opus}, {sonnet})
- Workflow routing ({adw_plan_implement_update_task})
- Commit tracking (✅ with commit hash + agent ID)

**Example Coordination:**
```markdown
## Git Worktree healthcheck-api
[✅ 1bd3cc8b5, b181479d] Create heartbeat endpoint {sonnet}
[✅ 160d2bbfb, fc530e99] Create stats endpoint {sonnet}
[⏰] Add caching layer (blocked until above tasks complete)
```

---

## Common Patterns Across All TAC Repos

### Directory Structure
```
project/
├── .claude/
│   ├── commands/      # Slash command templates
│   ├── hooks/         # Lifecycle hooks (TAC-4+)
│   └── settings.json  # Permissions
├── adws/              # AI Developer Workflows
├── specs/             # Feature specifications
├── ai_docs/           # LLM reference documentation
├── app/               # Application code
└── .mcp.json          # MCP server config (TAC-5+)
```

### The Plan -> Implement Cycle
1. `/chore`, `/bug`, or `/feature` creates a plan in `specs/`
2. `/implement specs/plan.md` executes the plan
3. Agent reads spec, makes changes, runs validation

### Permission Model
All TAC repos use `.claude/settings.json` to explicitly allow/deny tools:
```json
{
  "permissions": {
    "allow": ["Read", "Write", "Bash(uv:*)"],
    "deny": ["Bash(rm -rf:*)"]
  }
}
```

---

## Upgrading WitnessMark

To reach higher TAC levels, consider:

**TAC-4 (Hooks):**
- Add `.claude/hooks/pre_tool_use.py` for logging
- Add `.claude/hooks/stop.py` for session summaries

**TAC-5 (MCP):**
- Add `.mcp.json` with Playwright for automated E2E testing

**TAC-6 (Isolation):**
- Modify ADWs to use git worktrees for safe parallel execution

**TAC-7 (Docs):**
- Create root `README.md` consolidating all project docs
- Add `ai_docs/` with Cloudflare Workers/D1 references

**TAC-8 (Multi-Agent):**
- Add `tasks.md` for multi-agent task delegation
- Create parallel ADWs for different subsystems
