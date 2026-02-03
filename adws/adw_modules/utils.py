"""Utility functions for ADW system in Utah Political Layers."""

import json
import logging
import os
import re
import sys
import uuid
from typing import Dict


def make_adw_id() -> str:
    """Generate a short 8-character UUID for ADW tracking."""
    return str(uuid.uuid4())[:8]


def setup_logger(adw_id: str, trigger_type: str = "adw") -> logging.Logger:
    """Set up logger that writes to both console and file using adw_id.

    Args:
        adw_id: The ADW workflow ID
        trigger_type: Type of trigger (adw, plan_implement, etc.)

    Returns:
        Configured logger instance
    """
    # Create log directory: agents/{adw_id}/{trigger_type}/
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    log_dir = os.path.join(project_root, "agents", adw_id, trigger_type)
    os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, "execution.log")

    # Create logger with unique name
    logger = logging.getLogger(f"adw_{adw_id}")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    # File handler
    file_handler = logging.FileHandler(log_file, mode='a')
    file_handler.setLevel(logging.DEBUG)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # Formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_formatter = logging.Formatter('%(message)s')

    file_handler.setFormatter(file_formatter)
    console_handler.setFormatter(console_formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logger.info(f"ADW Logger initialized - ID: {adw_id}")

    return logger


def get_logger(adw_id: str) -> logging.Logger:
    """Get existing logger by ADW ID."""
    return logging.getLogger(f"adw_{adw_id}")


def parse_json(text: str):
    """Parse JSON that may be wrapped in markdown code blocks."""
    # Try to extract from code blocks
    code_block_pattern = r'```(?:json)?\s*\n(.*?)\n```'
    match = re.search(code_block_pattern, text, re.DOTALL)

    if match:
        json_str = match.group(1).strip()
    else:
        json_str = text.strip()

    # Find JSON boundaries if needed
    if not (json_str.startswith('[') or json_str.startswith('{')):
        array_start = json_str.find('[')
        obj_start = json_str.find('{')

        if array_start != -1 and (obj_start == -1 or array_start < obj_start):
            array_end = json_str.rfind(']')
            if array_end != -1:
                json_str = json_str[array_start:array_end + 1]
        elif obj_start != -1:
            obj_end = json_str.rfind('}')
            if obj_end != -1:
                json_str = json_str[obj_start:obj_end + 1]

    return json.loads(json_str)


def get_safe_subprocess_env() -> Dict[str, str]:
    """Get filtered environment variables safe for subprocess execution."""
    safe_env_vars = {
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "CLAUDE_CODE_PATH": os.getenv("CLAUDE_CODE_PATH", "claude"),
        "HOME": os.getenv("HOME"),
        "USER": os.getenv("USER"),
        "PATH": os.getenv("PATH"),
        "SHELL": os.getenv("SHELL"),
        "TERM": os.getenv("TERM"),
        "LANG": os.getenv("LANG"),
        "PYTHONPATH": os.getenv("PYTHONPATH"),
        "PYTHONUNBUFFERED": "1",
        "PWD": os.getcwd(),
    }

    return {k: v for k, v in safe_env_vars.items() if v is not None}
