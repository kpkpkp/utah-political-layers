# AI Developer Workflows (ADWs)

This directory contains scripts for automating development workflows with Claude Code agents.

## Overview

ADWs enable autonomous agent execution of development tasks like planning, implementing, and testing features.

## Directory Structure

```
adws/
├── README.md                    # This file
├── adw_plan_implement.py        # Main orchestration script
└── adw_modules/                 # Reusable modules
    ├── __init__.py
    ├── agent.py                 # Claude Code agent execution
    ├── data_types.py            # Pydantic models
    ├── git_ops.py               # Git worktree operations
    └── utils.py                 # Utility functions
```

## Usage

### Plan and Implement Workflow

Run the plan-implement workflow with a task description:

```bash
# Simple task (runs in main directory)
python adws/adw_plan_implement.py --task "Add zoom controls to map"

# With isolated worktree
python adws/adw_plan_implement.py --task "Add new layer type" --worktree feature-layers

# Using existing spec file
python adws/adw_plan_implement.py --spec specs/feature-map-enhancements.md

# With specific model
python adws/adw_plan_implement.py --task "Fix bug X" --model opus
```

### Options

- `--task`: Task description to implement
- `--spec`: Path to existing spec file (skip planning phase)
- `--worktree`: Create/use isolated git worktree
- `--model`: Model to use (`sonnet` or `opus`, default: `sonnet`)
- `--verbose`: Enable verbose output

## Modules

### agent.py

Executes Claude Code prompts and templates:
- `prompt_claude_code()` - Execute raw prompt
- `execute_template()` - Execute slash command template
- Model routing based on command type

### git_ops.py

Git operations for worktree management:
- `create_worktree()` - Create new worktree
- `remove_worktree()` - Remove worktree
- `list_worktrees()` - List all worktrees
- `commit_changes()` - Stage and commit

### utils.py

Utility functions:
- `make_adw_id()` - Generate unique workflow ID
- `setup_logger()` - Configure logging
- `parse_json()` - Parse JSON from markdown

### data_types.py

Pydantic models:
- `AgentPromptRequest` - Prompt configuration
- `AgentPromptResponse` - Agent response
- `AgentTemplateRequest` - Template execution
- `TaskStatus`, `WorktreeTask`, `Worktree` - Task board types

## Output

ADW execution creates logs and artifacts in:

```
agents/{adw_id}/
├── plan_implement/
│   └── execution.log        # Workflow logs
├── planner-{adw_id}/
│   └── raw_output.jsonl     # Planning phase output
└── builder-{adw_id}/
    └── raw_output.jsonl     # Implementation phase output
```

## Related Commands

- `/tac` - TAC multi-agent orchestration
- `/init_worktree` - Create git worktree
- `/update_task` - Update task board
- `/process_tasks` - Find eligible tasks

## Requirements

- Python 3.10+
- `pydantic` package
- `python-dotenv` package
- Claude Code CLI (`claude` command)
- Valid `ANTHROPIC_API_KEY` in `.env`

Install dependencies:
```bash
pip install pydantic python-dotenv
```
