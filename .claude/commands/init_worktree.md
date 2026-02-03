# Initialize Git Worktree

Create a new git worktree for isolated agent execution.

## Variables
worktree_name: $ARGUMENTS

## Instructions

1. Create a new git worktree in `trees/<worktree_name>` directory
2. Base the worktree on the main branch with a new branch named `<worktree_name>`
3. Report success or failure

## Git Worktree Setup

Execute these steps in order:

1. **Create the trees directory** if it doesn't exist:
   ```bash
   mkdir -p trees
   ```

2. **Check if worktree already exists**:
   - If `trees/<worktree_name>` exists, report that it exists and stop
   - Otherwise, proceed with creation

3. **Create the git worktree**:
   ```bash
   git worktree add trees/<worktree_name> -b <worktree_name>
   ```

4. **Verify creation**:
   ```bash
   ls -la trees/<worktree_name>
   git worktree list
   ```

## Error Handling

- If worktree already exists, report this and exit gracefully
- If git worktree creation fails, report the error

## Report

Report one of:
- Success: "Worktree '<worktree_name>' created at trees/<worktree_name>"
- Exists: "Worktree '<worktree_name>' already exists at trees/<worktree_name>"
- Error: "Failed to create worktree: <error message>"

## Notes

- Git worktrees provide isolated workspaces for parallel development
- Each worktree has its own branch and working directory
- Changes in one worktree don't affect others until merged
- Use `git worktree remove trees/<worktree_name>` to clean up
