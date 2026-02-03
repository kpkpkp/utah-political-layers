# Update Task

Update a task's status in tasks.md after agent work completes.

## Variables
worktree_name: $1
task_description: $2
status: $3
commit_hash: $4
error_message: $ARGUMENT

## Instructions

1. Read the current `tasks.md` file
2. Find the task matching the `worktree_name` and `task_description`
3. Update the task status based on the result:
   - If `status` is "success": `[✅ <commit_hash>, <adw_id>] <description>`
   - If `status` is "failed": `[❌] <description> // Failed: <error_message>`
   - If `status` is "in_progress": `[🟡, <adw_id>] <description>`
4. Preserve all other content and formatting
5. Write the updated content back to `tasks.md`

## Task Status Formats

**Success:**
```
[✅ abc123def, adw_12345678] Task description
```

**Failed:**
```
[❌] Task description // Failed: Error message here
```

**In Progress:**
```
[🟡, adw_12345678] Task description
```

## Matching Rules

- Find tasks in the specified worktree section (`## Git Worktree <worktree_name>`)
- Match by task description (partial match is OK)
- Only update the first matching task

## Error Handling

- If no matching task is found, report an error
- Preserve exact markdown formatting
- Keep any tags in `{tag1, tag2}` format

## Report

After updating:
- The task that was updated
- The new status
- Success or failure of the update
