#!/usr/bin/env python3
"""
Constants and utilities for Claude Code Hooks.
"""

import os
from pathlib import Path

# Base directory for all logs (relative to project root)
LOG_BASE_DIR = os.environ.get("CLAUDE_HOOKS_LOG_DIR", "logs")


def get_session_log_dir(session_id: str) -> Path:
    """Get the log directory for a specific session."""
    return Path(LOG_BASE_DIR) / session_id


def ensure_session_log_dir(session_id: str) -> Path:
    """Ensure the log directory for a session exists."""
    log_dir = get_session_log_dir(session_id)
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir
