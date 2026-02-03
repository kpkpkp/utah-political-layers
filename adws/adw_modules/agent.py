"""Claude Code agent module for executing prompts programmatically."""

import subprocess
import sys
import os
import json
from typing import Optional, List, Dict, Any, Tuple
from dotenv import load_dotenv

from .data_types import (
    AgentPromptRequest,
    AgentPromptResponse,
    AgentTemplateRequest,
)
from .utils import get_safe_subprocess_env

# Load environment variables
load_dotenv()

# Get Claude Code CLI path from environment
CLAUDE_PATH = os.getenv("CLAUDE_CODE_PATH", "claude")

# Model selection mapping for slash commands
SLASH_COMMAND_MODEL_MAP: Dict[str, str] = {
    "/implement": "opus",
    "/feature": "opus",
    "/bug": "opus",
    "/tac": "opus",
    "/plan": "sonnet",
    "/prime": "haiku",
    "/install": "haiku",
    "/tools": "haiku",
    "/init_worktree": "sonnet",
    "/update_task": "sonnet",
    "/process_tasks": "sonnet",
}


def get_model_for_slash_command(slash_command: str, default: str = "sonnet") -> str:
    """Get the recommended model for a slash command."""
    return SLASH_COMMAND_MODEL_MAP.get(slash_command, default)


def check_claude_installed() -> Optional[str]:
    """Check if Claude Code CLI is installed. Return error message if not."""
    try:
        result = subprocess.run(
            [CLAUDE_PATH, "--version"], capture_output=True, text=True
        )
        if result.returncode != 0:
            return f"Error: Claude Code CLI not installed at: {CLAUDE_PATH}"
    except FileNotFoundError:
        return f"Error: Claude Code CLI not installed at: {CLAUDE_PATH}"
    return None


def parse_jsonl_output(output_file: str) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """Parse JSONL output file and return all messages and the result message."""
    try:
        with open(output_file, "r") as f:
            messages = [json.loads(line) for line in f if line.strip()]

            result_message = None
            for message in reversed(messages):
                if message.get("type") == "result":
                    result_message = message
                    break

            return messages, result_message
    except Exception as e:
        print(f"Error parsing JSONL file: {e}", file=sys.stderr)
        return [], None


def prompt_claude_code(request: AgentPromptRequest) -> AgentPromptResponse:
    """Execute Claude Code with the given prompt configuration."""

    error_msg = check_claude_installed()
    if error_msg:
        return AgentPromptResponse(output=error_msg, success=False, session_id=None)

    # Create output directory if needed
    output_dir = os.path.dirname(request.output_file)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    # Build command
    cmd = [CLAUDE_PATH, "-p", request.prompt]
    cmd.extend(["--model", request.model])
    cmd.extend(["--output-format", "stream-json"])
    cmd.append("--verbose")

    if request.dangerously_skip_permissions:
        cmd.append("--dangerously-skip-permissions")

    env = get_safe_subprocess_env()

    try:
        # Change to working directory if specified
        cwd = request.working_dir or os.getcwd()

        with open(request.output_file, "w") as f:
            result = subprocess.run(
                cmd, stdout=f, stderr=subprocess.PIPE, text=True, env=env, cwd=cwd
            )

        if result.returncode == 0:
            print(f"Output saved to: {request.output_file}")

            messages, result_message = parse_jsonl_output(request.output_file)

            if result_message:
                session_id = result_message.get("session_id")
                is_error = result_message.get("is_error", False)
                subtype = result_message.get("subtype", "")

                if subtype == "error_during_execution":
                    return AgentPromptResponse(
                        output="Error during execution",
                        success=False,
                        session_id=session_id
                    )

                result_text = result_message.get("result", "")
                return AgentPromptResponse(
                    output=result_text, success=not is_error, session_id=session_id
                )
            else:
                with open(request.output_file, "r") as f:
                    raw_output = f.read()
                return AgentPromptResponse(
                    output=raw_output, success=True, session_id=None
                )
        else:
            error_msg = f"Claude Code error: {result.stderr}"
            print(error_msg, file=sys.stderr)
            return AgentPromptResponse(output=error_msg, success=False, session_id=None)

    except subprocess.TimeoutExpired:
        return AgentPromptResponse(
            output="Error: Command timed out",
            success=False,
            session_id=None
        )
    except Exception as e:
        return AgentPromptResponse(
            output=f"Error executing Claude Code: {e}",
            success=False,
            session_id=None
        )


def execute_template(request: AgentTemplateRequest) -> AgentPromptResponse:
    """Execute a Claude Code template with slash command and arguments."""
    # Get model for this slash command
    model = SLASH_COMMAND_MODEL_MAP.get(request.slash_command, request.model)

    # Construct prompt
    prompt = f"{request.slash_command} {' '.join(request.args)}"

    # Determine project root and output directory
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    output_dir = os.path.join(project_root, "agents", request.adw_id, request.agent_name)
    os.makedirs(output_dir, exist_ok=True)

    output_file = os.path.join(output_dir, "raw_output.jsonl")

    prompt_request = AgentPromptRequest(
        prompt=prompt,
        adw_id=request.adw_id,
        agent_name=request.agent_name,
        model=model,
        dangerously_skip_permissions=True,
        output_file=output_file,
        working_dir=request.working_dir,
    )

    return prompt_claude_code(prompt_request)
