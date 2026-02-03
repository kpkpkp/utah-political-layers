# /tools - Available Tools & Commands

## Purpose
Reference guide for all available tools and commands in this project.

## Claude Code Tools Available

### File Operations
- **Read** - Read file contents (max 2000 lines)
- **Write** - Create new files or overwrite existing
- **Edit** - Make targeted replacements in files
- **Glob** - Find files by name pattern (e.g., `**/*.js`)
- **Grep** - Search file contents by regex pattern

### Code Execution
- **Bash** - Execute shell commands
  - Allowed: npm, test, git, node, curl, kill, etc.
  - Blocked: rm -rf (destructive operations)
- **Task** - Launch specialized agents for complex work
  - `Explore` - Fast codebase exploration
  - `Bash` - Command execution specialist
  - `Plan` - Software architecture planning
  - `general-purpose` - Research and multi-step tasks

### Web & Network
- **WebFetch** - Fetch and analyze web content
  - Allowed domains: facebook.com, unitedutah.org, utahforwardparty.org, wikipedia.org
- **WebSearch** - Search the web for information

### Git Operations
- **Bash(git:*)** - Full git support
  - Branch creation/switching
  - Commits and pushes
  - Worktree management

### GitHub Operations
- **gh** CLI via Bash - GitHub CLI commands
  - `gh auth status` - Check authentication
  - `gh pr create` - Create pull requests
  - `gh issue` - Work with issues

## Project-Specific Commands

### /prime
**Onboard to codebase**
- Quick overview of project structure
- Technology stack explanation
- Key files and directories
- Party color reference
- Recent development context
- Quick start guide

Usage: `/prime`

### /install
**Set up dependencies**
- Install npm packages
- Install Playwright browsers
- Verify installation
- Troubleshooting guide

Usage: `/install`

### /tools
**Show available tools (this command)**
- Lists all Claude Code tools
- Lists project commands
- Permission information
- Common workflows

Usage: `/tools`

## Permission & Security Model

### Allowed Operations
✅ Read/Write/Edit files
✅ Run npm/test commands
✅ Git operations (add, commit, push, branch)
✅ Playwright tests
✅ Web fetches (specific domains only)
✅ Web search
✅ Kill processes (for cleanup)
✅ Bash execution for development

### Blocked Operations
❌ Destructive shell commands (rm -rf, etc.)
❌ Unauthorized web domains
❌ Privilege escalation

Full permission list in `.claude/settings.local.json`

## Common Development Workflows

### 1. Fix a Bug
```
/prime              # Understand codebase
Read relevant files # Find the issue
Edit/Write          # Make fix
npm test            # Validate
Git commit          # Save changes
```

### 2. Add a Feature
```
/prime              # Understand structure
Create spec         # Plan feature
Edit files          # Implement
npm test            # Test feature
Git commit          # Save work
gh pr create        # Create pull request
```

### 3. Run Local Server
```bash
cd public
python3 -m http.server 8080
# Open http://localhost:8080
```

### 4. Run Tests
```bash
npm install         # (first time)
npm test            # Run all tests
npm test -- --headed  # See browser
```

## File Type Mappings

| File Type | Tool | Example |
|-----------|------|---------|
| JavaScript | Edit | `public/js/map.js` |
| JSON | Edit | `public/data/utah_parties.json` |
| HTML | Edit | `public/index.html` |
| CSS | Edit | `public/css/styles.css` |
| Markdown | Edit | `README.md`, `DEPLOYMENT.md` |
| Test | Edit | `tests/example.spec.js` |

## Terminal Aliases (Useful Commands)

### Quick Reference
```bash
# Start dev server
cd public && python3 -m http.server 8080

# Run tests
npm test

# Run specific test file
npm test tests/file.spec.js

# Clean install
rm -rf node_modules package-lock.json && npm install

# Check git status
git status

# View recent commits
git log --oneline -10

# Build standalone version
node build-standalone.js
```

## Debugging Tools

### Browser Console
- Open DevTools in browser (F12)
- Check console for JavaScript errors
- Use Network tab to inspect API calls

### Playwright Debugging
```bash
npm test -- --debug
```
- Step through tests
- Inspect page state
- Take screenshots

### Git Debugging
```bash
git log --oneline     # View commits
git diff              # View changes
git status            # View changed files
```

## Performance Analysis

### Check Build Size
```bash
ls -lh build-standalone.js
wc -l public/js/*.js
```

### Measure Startup
```bash
# Time how long to load locally
time curl http://localhost:8080
```

### Test Performance
```bash
npm test -- --reporter=list  # Show test timing
```

## External Resources

### Utah Political Data
- **Utah Legislature Roster:** https://le.utah.gov/asp/roster/roster.asp
- **Utah SGID:** https://gis.utah.gov/ (ArcGIS FeatureServices)
- **Ballotpedia:** https://ballotpedia.org/ (Congressional info)

### Map Library Docs
- **Leaflet.js:** https://leafletjs.com/
- **GeoJSON:** https://geojson.org/

### Testing & Tools
- **Playwright:** https://playwright.dev/
- **Node.js/npm:** https://nodejs.org/

## Command Cheat Sheet

| Task | Command |
|------|---------|
| Read code | `Read` tool |
| Edit code | `Edit` tool |
| Find files | `Glob` tool |
| Search code | `Grep` tool |
| Run shell | `Bash` tool |
| Explore codebase | `Task` with Explore agent |
| Plan changes | `Task` with Plan agent |
| Complex research | `Task` with general-purpose agent |
| Fetch webpage | `WebFetch` tool |
| Search web | `WebSearch` tool |

## Next Steps

1. Run `/prime` to understand the project
2. Run `/install` to set up dependencies
3. Choose a task (bug fix, feature, etc.)
4. Use appropriate tools from this guide
5. Validate with tests before committing

---

**Questions?** Check `.claude/` directory for configuration files, or read `README.md` and `DEPLOYMENT.md` for detailed documentation.
