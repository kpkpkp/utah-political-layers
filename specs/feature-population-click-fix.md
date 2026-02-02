# Feature Specification: Fix Population Block Click Functionality

**Created:** 2026-02-02
**Status:** In Progress
**TAC Level:** 8.5 (Multi-agent orchestration with E2E verification)

---

## Overview

Population blocks (census block markers on the map) are not responding to mouse clicks. When a user clicks on a population dot, its census block boundary should be drawn on the map. This feature previously worked but has regressed.

---

## Root Cause Analysis

### Issue Location
`docs/app.js` lines 108-114 have inverted `pointerEvents` settings compared to the working implementation in `public/app.js`.

### Current (Broken) Configuration in `docs/app.js`:
```javascript
const populationPane = map.createPane("populationPane");
populationPane.style.zIndex = "450";
populationPane.style.pointerEvents = "auto";  // WRONG - blocks clicks

const populationOutlinePane = map.createPane("populationOutlinePane");
populationOutlinePane.style.zIndex = "460";
populationOutlinePane.style.pointerEvents = "none";  // WRONG - can't dismiss
```

### Correct Configuration in `public/app.js`:
```javascript
const populationPane = map.createPane("populationPane");
populationPane.style.zIndex = "250";  // Above tiles (200), below overlays (400)
populationPane.style.pointerEvents = "none";  // Allow clicks to pass through

const populationOutlinePane = map.createPane("populationOutlinePane");
populationOutlinePane.style.zIndex = "260";  // Just above population pane
populationOutlinePane.style.pointerEvents = "auto";  // Allow clicks on outline to dismiss
```

### Missing Helper Function
`docs/app.js` is also missing the `enablePopulationCanvasClicks()` helper function that enables pointer events on the canvas element after markers are added.

---

## Technical Design

### Fix Strategy
1. Update `docs/app.js` pane configuration to match `public/app.js`
2. Add the missing `enablePopulationCanvasClicks()` helper function
3. Ensure the helper is called when markers are added
4. Create E2E tests to verify click functionality

### Click Flow (Expected Behavior)
1. User clicks on a population dot (canvas circle marker)
2. populationPane has `pointerEvents = "none"` - click passes through
3. Canvas element has `pointerEvents = "auto"` (set by helper)
4. Leaflet canvas renderer receives the click event
5. circleMarker click handler fires
6. Census block boundary (outline) is drawn in populationOutlinePane
7. Clicking outline again dismisses it

---

## Files to Modify

| File | Changes |
|------|---------|
| `docs/app.js` | Fix pointerEvents, add enablePopulationCanvasClicks helper |
| `public/app.js` | Already correct (reference implementation) |

## Files to Create

| File | Purpose |
|------|---------|
| `tests/test-population-clicks.spec.js` | E2E tests for population click functionality |

---

## Subtask Breakdown (TAC-8.5)

### Phase 1: Planning (Opus) ✅
- Analyze root cause
- Identify files needing changes
- Create spec document

### Phase 2: Implementation

#### Wave 1 - Fix docs/app.js (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.1 | Sonnet | Fix populationPane pointerEvents to "none" |
| 2.2 | Sonnet | Fix populationOutlinePane pointerEvents to "auto" |
| 2.3 | Sonnet | Update zIndex values to 250/260 |
| 2.4 | Sonnet | Add enablePopulationCanvasClicks helper function |
| 2.5 | Sonnet | Call helper after first chunk of markers added |

#### Wave 2 - E2E Tests (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.6 | Sonnet | Test population toggle enables layer |
| 2.7 | Sonnet | Test clicking population dot draws boundary |
| 2.8 | Sonnet | Test clicking boundary again dismisses it |
| 2.9 | Sonnet | Test clicking different dot switches boundary |

### Phase 3: Integration (Opus)
- Run full test suite
- Verify fix in browser
- Final verification

---

## Testing Strategy

### E2E Tests (test-population-clicks.spec.js)

```javascript
test('Clicking population dot draws census block boundary', async ({ page }) => {
  // Enable population layer
  await page.locator('#toggle-population').check();

  // Wait for population to load
  await page.waitForFunction(() => {
    const status = document.getElementById('population-status');
    return status && status.textContent.includes('ready');
  }, { timeout: 60000 });

  // Click on a population dot (canvas element)
  const canvas = page.locator('.leaflet-pane.leaflet-populationPane-pane canvas');
  await canvas.click({ position: { x: 200, y: 200 } });

  // Verify boundary was drawn
  const outline = page.locator('.leaflet-pane.leaflet-populationOutlinePane-pane path');
  await expect(outline).toBeVisible();
});

test('Clicking boundary dismisses it', async ({ page }) => {
  // ... setup and click to show boundary ...

  // Click on the boundary to dismiss
  const outline = page.locator('.leaflet-pane.leaflet-populationOutlinePane-pane');
  await outline.click();

  // Verify boundary was removed
  await expect(outline.locator('path')).not.toBeVisible();
});
```

---

## Acceptance Criteria

- [ ] Population dots respond to clicks
- [ ] Clicking a dot draws the census block boundary
- [ ] Clicking the boundary dismisses it
- [ ] Clicking a different dot switches the boundary
- [ ] All existing tests continue to pass
- [ ] E2E tests pass for click functionality

---

## Notes

- The `public/app.js` file already has the correct implementation
- The `docs/app.js` file appears to be a deployed/older version that diverged
- The fix should sync `docs/app.js` with `public/app.js` for this functionality
