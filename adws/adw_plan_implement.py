#!/usr/bin/env python3
"""
ADW Plan-Implement workflow for Utah Political Layers.

This script runs the plan and implement phases in sequence:
1. /plan - Creates a plan based on the task description
2. /implement - Implements the plan

Usage:
    python adws/adw_plan_implement.py --task "Add feature X" --worktree feature-x
    python adws/adw_plan_implement.py --spec specs/feature-x.md
"""

import os
import sys
import json
import re
import argparse
from datetime import datetime

# Add the adw_modules directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "adw_modules"))

from agent import execute_template, AgentTemplateRequest
from utils import make_adw_id, setup_logger
from git_ops import create_worktree, worktree_exists, get_current_commit_hash


def extract_plan_path(output: str) -> str:
    """Extract the plan file path from the plan command output."""
    patterns = [
        r"specs/[a-zA-Z0-9\-_]+\.md",
        r"Created plan at:\s*(specs/[a-zA-Z0-9\-_]+\.md)",
        r"Plan file:\s*(specs/[a-zA-Z0-9\-_]+\.md)",
    ]

    for pattern in patterns:
        match = re.search(pattern, output, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1) if match.groups() else match.group(0)

    raise ValueError("Could not find plan file path in output")


def main():
    parser = argparse.ArgumentParser(description="Run plan-implement workflow")
    parser.add_argument("--task", help="Task description to implement")
    parser.add_argument("--spec", help="Path to existing spec file")
    parser.add_argument("--worktree", help="Worktree name for isolated execution")
    parser.add_argument("--model", choices=["sonnet", "opus"], default="sonnet")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()

    if not args.task and not args.spec:
        parser.error("Either --task or --spec is required")

    adw_id = make_adw_id()
    logger = setup_logger(adw_id, "plan_implement")

    print(f"\n{'='*60}")
    print(f"ADW Plan-Implement Workflow")
    print(f"ADW ID: {adw_id}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    # Determine working directory
    working_dir = os.getcwd()
    if args.worktree:
        worktree_path = os.path.join("trees", args.worktree)
        if not worktree_exists(args.worktree):
            print(f"Creating worktree: {args.worktree}")
            success, error = create_worktree(args.worktree)
            if not success:
                print(f"Failed to create worktree: {error}")
                sys.exit(1)
        working_dir = os.path.abspath(worktree_path)

    plan_path = args.spec
    workflow_success = True

    # Phase 1: Planning (if no spec provided)
    if not args.spec:
        print("\n--- Phase 1: Planning ---\n")

        plan_request = AgentTemplateRequest(
            agent_name=f"planner-{adw_id}",
            slash_command="/feature",
            args=[args.task],
            adw_id=adw_id,
            model=args.model,
            working_dir=working_dir,
        )

        plan_response = execute_template(plan_request)

        if plan_response.success:
            print("Planning completed successfully")
            try:
                plan_path = extract_plan_path(plan_response.output)
                print(f"Plan created at: {plan_path}")
            except ValueError as e:
                print(f"Warning: {e}")
                workflow_success = False
        else:
            print(f"Planning failed: {plan_response.output}")
            workflow_success = False

    # Phase 2: Implementation
    if workflow_success and plan_path:
        print("\n--- Phase 2: Implementation ---\n")

        implement_request = AgentTemplateRequest(
            agent_name=f"builder-{adw_id}",
            slash_command="/implement",
            args=[plan_path],
            adw_id=adw_id,
            model=args.model,
            working_dir=working_dir,
        )

        implement_response = execute_template(implement_request)

        if implement_response.success:
            print("Implementation completed successfully")
            commit_hash = get_current_commit_hash(working_dir)
            if commit_hash:
                print(f"Latest commit: {commit_hash}")
        else:
            print(f"Implementation failed: {implement_response.output}")
            workflow_success = False

    # Summary
    print(f"\n{'='*60}")
    print("Workflow Summary")
    print(f"{'='*60}")
    print(f"ADW ID: {adw_id}")
    print(f"Status: {'SUCCESS' if workflow_success else 'FAILED'}")
    print(f"Logs: agents/{adw_id}/plan_implement/execution.log")
    print(f"{'='*60}\n")

    sys.exit(0 if workflow_success else 1)


if __name__ == "__main__":
    main()
