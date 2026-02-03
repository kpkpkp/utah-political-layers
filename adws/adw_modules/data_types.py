"""Data types for ADW (AI Developer Workflows) in Utah Political Layers."""

from typing import Optional, List, Literal
from pydantic import BaseModel


# Supported slash commands for this project
SlashCommand = Literal[
    "/prime",
    "/install",
    "/tools",
    "/feature",
    "/bug",
    "/implement",
    "/tac",
    "/plan",
    "/init_worktree",
    "/update_task",
    "/process_tasks",
]


class AgentPromptRequest(BaseModel):
    """Claude Code agent prompt configuration."""

    prompt: str
    adw_id: str
    agent_name: str = "ops"
    model: Literal["sonnet", "opus", "haiku"] = "sonnet"
    dangerously_skip_permissions: bool = False
    output_file: str
    working_dir: Optional[str] = None


class AgentPromptResponse(BaseModel):
    """Claude Code agent response."""

    output: str
    success: bool
    session_id: Optional[str] = None


class AgentTemplateRequest(BaseModel):
    """Claude Code agent template execution request."""

    agent_name: str
    slash_command: str  # More flexible than SlashCommand literal
    args: List[str]
    adw_id: str
    model: Literal["sonnet", "opus", "haiku"] = "sonnet"
    working_dir: Optional[str] = None


class TaskStatus(BaseModel):
    """Status of a task in tasks.md."""

    status: Literal["pending", "blocked", "in_progress", "success", "failed"]
    adw_id: Optional[str] = None
    commit_hash: Optional[str] = None
    error_message: Optional[str] = None


class WorktreeTask(BaseModel):
    """A task within a worktree."""

    description: str
    status: TaskStatus
    tags: List[str] = []


class Worktree(BaseModel):
    """A git worktree with its tasks."""

    name: str
    tasks: List[WorktreeTask] = []
