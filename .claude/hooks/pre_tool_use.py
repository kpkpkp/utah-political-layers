#!/usr/bin/env python3
"""
Pre-tool-use hook for Utah Political Layers.

This hook runs BEFORE any tool call. It can:
- Block dangerous commands (exit code 2)
- Log tool usage for debugging
- Modify tool inputs (via stdout JSON)

Exit codes:
- 0: Allow tool call
- 2: Block tool call (message shown to Claude)
"""

import json
import sys
import re
from pathlib import Path

# Import from utils
sys.path.insert(0, str(Path(__file__).parent))
from utils.constants import ensure_session_log_dir


def is_dangerous_rm_command(command: str) -> bool:
    """Detect dangerous rm commands."""
    normalized = ' '.join(command.lower().split())

    patterns = [
        r'\brm\s+.*-[a-z]*r[a-z]*f',  # rm -rf, rm -fr, rm -Rf
        r'\brm\s+.*-[a-z]*f[a-z]*r',  # rm -fr variations
        r'\brm\s+--recursive\s+--force',
        r'\brm\s+--force\s+--recursive',
    ]

    for pattern in patterns:
        if re.search(pattern, normalized):
            return True

    # Check recursive rm targeting dangerous paths
    dangerous_paths = [r'/', r'/\*', r'~', r'~/', r'\$HOME', r'\.\.', r'\*']

    if re.search(r'\brm\s+.*-[a-z]*r', normalized):
        for path in dangerous_paths:
            if re.search(path, normalized):
                return True

    return False


def is_env_file_access(tool_name: str, tool_input: dict) -> bool:
    """Check if tool is accessing .env files with sensitive data."""
    if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write']:
        file_path = tool_input.get('file_path', '')
        if '.env' in file_path and not file_path.endswith('.env.sample'):
            return True

    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        # Allow .env.sample but block .env
        if re.search(r'\b\.env\b(?!\.sample)', command):
            return True

    return False


def main():
    try:
        input_data = json.load(sys.stdin)

        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        session_id = input_data.get('session_id', 'unknown')

        # Block .env file access
        if is_env_file_access(tool_name, tool_input):
            print("BLOCKED: Access to .env files is prohibited", file=sys.stderr)
            print("Use .env.sample for templates", file=sys.stderr)
            sys.exit(2)

        # Block dangerous rm commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            if is_dangerous_rm_command(command):
                print("BLOCKED: Dangerous rm command detected", file=sys.stderr)
                sys.exit(2)

        # Log tool usage
        log_dir = ensure_session_log_dir(session_id)
        log_path = log_dir / 'pre_tool_use.json'

        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []

        # Append this tool call
        log_data.append({
            'tool_name': tool_name,
            'tool_input': tool_input,
            'session_id': session_id,
        })

        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == '__main__':
    main()
