# TAC (Tactical Agentic Coding) Multi-Agent Orchestration

You are initiating a TAC workflow - isolated development with E2E verification.

## TAC Pattern
```
OPUS (Plan) → Worktrees (Sonnet/Haiku execute in parallel) → OPUS (Integrate & Verify)
```

## Arguments
$ARGUMENTS

## Your Role: Orchestrator (Opus)

### If given a spec file path:
1. Read the spec file from `specs/`
2. Analyze requirements and identify parallel work streams
3. Break into 2-5 independent subtasks
4. For each subtask, assign appropriate model:
   - **opus**: Complex architecture, integration, critical decisions
   - **sonnet**: Standard implementation, moderate complexity
   - **haiku**: Simple tasks, boilerplate, tests, documentation

### If given a task description:
1. Analyze the task
2. Determine if it needs decomposition or can be done directly
3. If complex: create subtasks as above
4. If simple: execute directly with appropriate model

## Execution Options

### Option 1: In-Process (Task Tool)
Use Claude Code's Task tool for subagents that run in the main working directory:

```
Task tool with:
- subagent_type: "general-purpose"
- model: "sonnet" | "haiku" | "opus"
- prompt: detailed task instructions
- run_in_background: true (for parallel execution)
```

### Option 2: Isolated (Git Worktrees)
For parallel execution with full isolation:

1. **Create worktrees** using `/init_worktree`:
   ```
   /init_worktree feature-subtask-1
   /init_worktree feature-subtask-2
   ```

2. **Add tasks** to `tasks.md`:
   ```markdown
   ## Git Worktree feature-subtask-1
   [] Implement part A {sonnet}

   ## Git Worktree feature-subtask-2
   [] Implement part B {sonnet}
   ```

3. **Run ADW script**:
   ```bash
   python adws/adw_plan_implement.py --spec specs/your-spec.md --worktree feature-subtask-1
   ```

## Output Format

After analysis, output a TAC execution plan:

```
## TAC Execution Plan

### Task: [Brief description]

### Decomposition:
| Subtask | Model | Description | Dependencies |
|---------|-------|-------------|--------------|
| subtask-1 | sonnet | ... | none |
| subtask-2 | haiku | ... | none |
| subtask-3 | sonnet | ... | subtask-1 |

### Execution Strategy:
- [ ] Create worktrees (if isolated) or use Task tool (if in-process)
- [ ] Execute parallel subtasks
- [ ] Integration review (Opus)
- [ ] E2E verification with `npm test`
- [ ] Merge/summarize results

### Approach:
[Brief explanation of how subtasks will be coordinated]
```

## Infrastructure Available

This project has full TAC infrastructure:

**Task Board:**
- `tasks.md` - Central task tracking with status markers

**Git Worktrees:**
- `trees/` - Directory for isolated worktrees
- `/init_worktree` - Create new worktree
- `git worktree remove trees/<name>` - Clean up

**ADW Scripts:**
- `adws/adw_plan_implement.py` - Plan and implement workflow
- `adws/adw_modules/` - Reusable modules (agent, git_ops, utils)

**Commands:**
- `/process_tasks` - Find eligible tasks from tasks.md
- `/update_task` - Update task status after completion

## Utah Political Layers Context

- **App:** Static web map in `public/`
- **Tests:** Playwright E2E in `tests/`
- **Specs:** Feature plans in `specs/`
- **Local Server:** `cd public && python3 -m http.server 8080`
- **Run Tests:** `npm test`

## Verification

After implementation:
1. Run `npm test` to verify E2E tests pass
2. Manually test at http://localhost:8080 if needed
3. Update task status in `tasks.md`
