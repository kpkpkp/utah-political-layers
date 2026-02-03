#!/usr/bin/env python3
"""
Stop hook for Utah Political Layers.

This hook runs when a Claude session ends. It:
- Logs session summary
- Optionally copies transcript to chat.json for review
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Import from utils
sys.path.insert(0, str(Path(__file__).parent))
from utils.constants import ensure_session_log_dir


def main():
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument('--chat', action='store_true',
                          help='Copy transcript to chat.json')
        args = parser.parse_args()

        input_data = json.load(sys.stdin)

        session_id = input_data.get("session_id", "unknown")
        transcript_path = input_data.get("transcript_path", "")

        # Ensure session log directory exists
        log_dir = ensure_session_log_dir(session_id)
        log_path = log_dir / "stop.json"

        # Create session summary
        summary = {
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "transcript_path": transcript_path,
            "stop_hook_active": input_data.get("stop_hook_active", False),
        }

        # Read existing log data or initialize
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []

        log_data.append(summary)

        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)

        # Handle --chat switch: copy transcript to chat.json
        if args.chat and transcript_path and os.path.exists(transcript_path):
            chat_data = []
            try:
                with open(transcript_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                chat_data.append(json.loads(line))
                            except json.JSONDecodeError:
                                pass

                chat_file = log_dir / 'chat.json'
                with open(chat_file, 'w') as f:
                    json.dump(chat_data, f, indent=2)

            except Exception:
                pass

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == "__main__":
    main()
