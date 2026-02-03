# Session Coda - Permissions Audit

You are performing an end-of-session audit of tool permissions.

## Instructions

### Step 1: Compile Approval List

List **every single interaction** during this session that required user approval. Do not skip any.

Format as a table:
| # | Command/Action | Was Pre-approved? |
|---|----------------|-------------------|

Include:
- All Bash commands executed
- All MCP tool calls (kapture, etc.)
- All WebFetch/WebSearch calls
- Any Write/Edit operations to new file paths

### Step 2: Audit Preapproved Commands

Read `.claude/settings.local.json` and review the current `permissions.allow` list.

Identify **leftovers** - entries that are:
- One-off task IDs or temporary file paths
- Hardcoded absolute paths that won't be reused
- Duplicate or redundant patterns
- Commands from previous sessions no longer relevant

### Step 3: Recommend Additions

Based on the approvals required in Step 1, recommend which commands should be added to `permissions.allow` to ensure uninterrupted work in future sessions.

Group recommendations by category:
- Git commands
- Build/test commands
- Utility commands
- MCP tools
- Web domains

### Step 4: Offer to Update

Ask the user if they want you to update `settings.local.json` with:
1. Removals (stale entries)
2. Additions (new patterns from this session)

Keep the file organized by category and alphabetized within groups.
