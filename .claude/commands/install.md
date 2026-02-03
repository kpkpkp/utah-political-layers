# /install - Set Up Project Dependencies

## Purpose
Initialize project dependencies for local development and testing.

## What This Does
- Installs npm dependencies (Playwright testing framework)
- Installs Playwright browsers (Chromium)
- Validates installation

## Prerequisites
- Node.js 16+ installed
- npm available in PATH
- ~500MB disk space for Playwright browsers

## Installation Steps

### Step 1: Install NPM Dependencies
```bash
npm install
```
This installs `@playwright/test` from package.json

### Step 2: Install Playwright Browsers
```bash
npx playwright install chromium
```
Downloads Chromium browser for E2E testing (~300MB)

### Step 3: Verify Installation
```bash
npm test -- --version
```
Should show Playwright version (e.g., v1.40.0+)

## Running Locally (For Development)

Once installed, run the local development server:
```bash
cd public
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Running Tests

After installation, run E2E tests:
```bash
npm test
```

This runs all Playwright tests in `tests/` directory.

### Test-Specific Commands
```bash
# Run specific test file
npm test tests/some.spec.js

# Run tests in headed mode (see browser)
npm test -- --headed

# Run with debugging
npm test -- --debug

# Update test snapshots
npm test -- --update-snapshots
```

## Troubleshooting

### "npm: command not found"
- Node.js/npm not installed. Install from https://nodejs.org/

### "Playwright browsers failed to download"
- Network issue or disk space problem
- Try: `npx playwright install --with-deps`

### Tests time out
- Increase timeout in playwright.config.js
- Check if local HTTP server is running
- Verify http://localhost:8080 is accessible

### Permission denied on build-standalone.js
```bash
chmod +x build-standalone.js
node build-standalone.js
```

## Installation Verification

After running `/install`, verify with:

1. **Check npm modules:**
   ```bash
   ls node_modules/@playwright
   ```
   Should show: `@playwright test, cjs, driver, test-ct, test-service`

2. **Check Playwright:**
   ```bash
   npx playwright --version
   ```
   Should show version number

3. **Run quick test:**
   ```bash
   npm test
   ```
   Should complete without errors (0 tests if no test files, or pass if tests exist)

## Disk Space Requirements
- node_modules: ~300MB
- Playwright Chromium: ~300MB
- **Total:** ~600MB

## Environment Variables (Optional)
```bash
# Skip playwright browser download (use system browser)
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Set Playwright timeout (milliseconds)
export PLAYWRIGHT_TEST_TIMEOUT=30000
```

## What's Installed

### NPM Packages
- `@playwright/test@^1.40.0` - E2E testing framework

### Playwright Browsers
- Chromium (for testing)
- Note: Firefox, WebKit not installed by default (can be added if needed)

## Next Steps

After successful installation:
1. Run `/prime` for codebase overview
2. Run `/tools` to see available commands
3. Start local dev server: `cd public && python3 -m http.server 8080`
4. Open http://localhost:8080 in browser

## Questions or Issues?

If installation fails:
1. Check error messages carefully
2. Try `npm cache clean --force`
3. Delete node_modules and package-lock.json, then retry
4. Check GitHub issues for similar problems
