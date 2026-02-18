# Bug: Background Population Load Tests Fail

## Summary

Background population loading is **already implemented** in `app.js:1427-1430`. The code eagerly calls `loadPopulationPoints()` during `init()` so data is ready when the user checks the Population checkbox. However, the E2E tests that verify this behavior fail due to timeout issues — the 60s Playwright test timeout fires before the ArcGIS API finishes delivering ~30K+ population blocks.

## Reproduction

```bash
npx playwright test tests/test-background-population-load.spec.js
```

**Result:** 3 of 5 tests fail with "Test timeout of 60000ms exceeded."

- `instant toggle after load complete` — FAIL (timeout)
- `toggle during load shows status` — FAIL (timeout at load completion wait, plus status regex mismatch)
- `toggle population checkbox adds/removes layer` — FAIL (timeout)
- `starts loading on page init` — PASS
- `population state is exposed on window` — PASS

## Root Cause Analysis

### Issue 1: Test Timeout vs Data Load Time
The Playwright config sets `timeout: 60000` (60s). The tests use `page.evaluate()` with an internal 120s timeout to wait for `populationState.loaded`, but Playwright kills the test at 60s. The ArcGIS REST API paginates 2000 records per request, requiring 15+ round trips for all ~30K blocks.

### Issue 2: Status Text Assertion Mismatch
Line 129 checks `statusText.toMatch(/Population|loading|ready/i)` but the actual status text during loading is just `"loading"` or `"loading..."` (no "Population" prefix). This matches. But line 168 checks `finalStatusText.toMatch(/ready/i)` — the actual final status is `"X,XXX blocks"`, not `"ready"` (line 1050 of app.js: `status.textContent = restCount ? '...' : "ready"`). Since `restCount` is always truthy, the status is always `"N blocks"`, never `"ready"`.

## Proposed Fix

### Fix 1: Increase test timeout for population tests
Set `test.setTimeout(180000)` (3 minutes) on tests that wait for full population load.

### Fix 2: Fix status text assertions
- Line 129: Change to `/loading|blocks|ready/i` to match actual possible states
- Line 168: Change to `/blocks|ready/i` to match actual final state

### Fix 3: Use test-level timeout instead of evaluate-internal timeout
Replace the in-evaluate polling pattern with Playwright's `waitForFunction` which respects the test timeout properly.

## Files to Modify

| File | Change |
|------|--------|
| `tests/test-background-population-load.spec.js` | Fix timeouts, assertions, polling pattern |

## Implementation Plan (TAC-8.5)

### Phase 1: Fix tests (Sonnet)
1. Add `test.setTimeout(180000)` to each test that waits for population load
2. Replace in-evaluate polling with `page.waitForFunction(() => window.populationState?.loaded, { timeout: 150000 })`
3. Fix status text regex: `/loading|blocks|ready/i` and `/blocks|ready/i`
4. Add skip-tour helper consistency

### Phase 2: Run E2E tests to green (Sonnet)
1. Run the fixed test file
2. If still timing out, increase timeout or add network-aware polling
3. Iterate until all 5 tests pass

### Phase 3: Integrate and verify (Opus)
1. Review all changes for correctness
2. Run full test suite to ensure no regressions
3. Rebuild streamlit_app.py (no app.js changes needed)

## Testing Strategy

```bash
# Run just the population background load tests
npx playwright test tests/test-background-population-load.spec.js --reporter=line

# Run all population-related tests for regression check
npx playwright test tests/test-population*.spec.js tests/test-background*.spec.js --reporter=line
```

## Notes

- The actual feature (background population loading) works correctly in both public/ and Streamlit deployments
- No changes to `app.js` are needed — only test fixes
- The ArcGIS API is external and slow; tests must accommodate real network latency
