"""Git operations for ADW workflows in Utah Political Layers."""

import subprocess
import os
from typing import Optional, Tuple


def get_current_branch() -> str:
    """Get current git branch name."""
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True, text=True
    )
    return result.stdout.strip()


def get_current_commit_hash(working_dir: Optional[str] = None) -> Optional[str]:
    """Get the current git commit hash."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=working_dir,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()[:9]
    except subprocess.CalledProcessError:
        return None


def create_branch(branch_name: str) -> Tuple[bool, Optional[str]]:
    """Create and checkout a new branch. Returns (success, error_message)."""
    result = subprocess.run(
        ["git", "checkout", "-b", branch_name],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        if "already exists" in result.stderr:
            result = subprocess.run(
                ["git", "checkout", branch_name],
                capture_output=True, text=True
            )
            if result.returncode != 0:
                return False, result.stderr
            return True, None
        return False, result.stderr
    return True, None


def commit_changes(message: str, working_dir: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    """Stage all changes and commit. Returns (success, error_message)."""
    # Check for changes
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=working_dir
    )
    if not result.stdout.strip():
        return True, None  # No changes

    # Stage changes
    result = subprocess.run(
        ["git", "add", "-A"],
        capture_output=True, text=True, cwd=working_dir
    )
    if result.returncode != 0:
        return False, result.stderr

    # Commit
    result = subprocess.run(
        ["git", "commit", "-m", message],
        capture_output=True, text=True, cwd=working_dir
    )
    if result.returncode != 0:
        return False, result.stderr
    return True, None


def worktree_exists(worktree_name: str, trees_dir: str = "trees") -> bool:
    """Check if a worktree already exists."""
    worktree_path = os.path.join(trees_dir, worktree_name)
    return os.path.exists(worktree_path)


def create_worktree(worktree_name: str, trees_dir: str = "trees") -> Tuple[bool, Optional[str]]:
    """Create a new git worktree. Returns (success, error_message)."""
    worktree_path = os.path.join(trees_dir, worktree_name)

    if worktree_exists(worktree_name, trees_dir):
        return False, f"Worktree '{worktree_name}' already exists at {worktree_path}"

    # Create trees directory if needed
    os.makedirs(trees_dir, exist_ok=True)

    # Create worktree with new branch
    result = subprocess.run(
        ["git", "worktree", "add", worktree_path, "-b", worktree_name],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        return False, result.stderr

    return True, None


def remove_worktree(worktree_name: str, trees_dir: str = "trees") -> Tuple[bool, Optional[str]]:
    """Remove a git worktree. Returns (success, error_message)."""
    worktree_path = os.path.join(trees_dir, worktree_name)

    if not worktree_exists(worktree_name, trees_dir):
        return False, f"Worktree '{worktree_name}' does not exist"

    # Remove the worktree
    result = subprocess.run(
        ["git", "worktree", "remove", worktree_path, "--force"],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        return False, result.stderr

    # Prune worktree list
    subprocess.run(["git", "worktree", "prune"], capture_output=True, text=True)

    return True, None


def list_worktrees() -> list:
    """List all git worktrees."""
    result = subprocess.run(
        ["git", "worktree", "list", "--porcelain"],
        capture_output=True, text=True
    )

    worktrees = []
    current = {}

    for line in result.stdout.strip().split('\n'):
        if line.startswith('worktree '):
            if current:
                worktrees.append(current)
            current = {'path': line[9:]}
        elif line.startswith('HEAD '):
            current['head'] = line[5:]
        elif line.startswith('branch '):
            current['branch'] = line[7:]
        elif line == 'bare':
            current['bare'] = True
        elif line == 'detached':
            current['detached'] = True

    if current:
        worktrees.append(current)

    return worktrees
