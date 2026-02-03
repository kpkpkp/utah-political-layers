# Process Tasks

Analyze tasks.md and identify tasks ready for agent pickup.

## Instructions

1. Read the `tasks.md` file
2. Identify eligible tasks:
   - `[]` (not started) - always eligible
   - `[⏰]` (blocked) - eligible only if ALL tasks above in same worktree are `[✅]`
3. Skip tasks that are:
   - `[🟡]` - in progress
   - `[✅]` - completed
   - `[❌]` - failed
4. Return JSON array of eligible tasks

## Task Status Guide

- `[]` - Not started (ready for pickup)
- `[⏰]` - Blocked (waiting on prior tasks)
- `[🟡, <adw_id>]` - In progress
- `[✅ <commit>, <adw_id>]` - Success
- `[❌]` - Failed

## Blocking Rules

A blocked task `[⏰]` is only eligible if:
- ALL tasks above it in the same worktree section are `[✅]` (success)
- If any task above is `[🟡]`, `[]`, `[⏰]`, or `[❌]`, the blocked task stays blocked

## Tag Extraction

Extract tags from task descriptions. Tags use format `{tag1, tag2}`:
- `[] Add feature X {opus}` → tags: ["opus"]
- `[] Fix bug Y {sonnet, urgent}` → tags: ["sonnet", "urgent"]

## Output Format

Return a JSON array:

```json
[
  {
    "worktree_name": "feature-auth",
    "tasks_to_start": [
      {
        "description": "Add user login",
        "tags": ["sonnet"]
      }
    ]
  }
]
```

## Examples

### Example 1: Mixed status worktree
```
## Git Worktree feature-auth
[✅ abc1234, id1] Task 1
[🟡, id2] Task 2
[] Task 3 {sonnet}
[⏰] Task 4
```

Result: Only Task 3 is eligible. Task 4 is blocked because Task 2 is in progress.

### Example 2: Failed task blocks subsequent
```
## Git Worktree bugfix
[❌] Task 1 // Failed: error
[⏰] Task 2
```

Result: No tasks eligible. Task 2 is blocked because Task 1 failed (not `[✅]`).

## Task

Read `tasks.md` and return eligible tasks in JSON format.
