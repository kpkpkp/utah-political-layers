# Feature Specification: Panel UI Refinements & Save Defaults

**Created:** 2026-02-02
**Status:** Planning
**TAC Level:** 8.5 (Multi-agent orchestration with E2E verification)

---

## Overview

Refine the control panel UI with improved organization and add a "Save as Defaults" feature for localhost development.

---

## Feature Requirements

### 1. Move "Fill on map" checkbox
- Move the "Show fill colors" checkbox from Party Fills section to beneath Party Legend
- Simplify label to "Fill on map"

### 2. Population loading status
- Move the population loading status indicator adjacent to the Population layer checkbox
- Currently shows block count when loading/loaded

### 3. Button layout in footer
- Left justify "Take Tour" button
- Right justify "Reset to Defaults" button
- Both at the bottom of the panel (footer area)

### 4. Save as Defaults (localhost only)
- Add a button visible only on localhost
- Saves current colors, checkboxes, and slider values as defaults
- Two options: "Save for Local" and "Save for Deployed"
- Outputs JSON that can be copied to code

---

## Current State Analysis

### Panel Structure (public/index.html)
```
header
layers (with paired outline colors)
legend | fills
reset
```

### Relevant Elements
- `#toggle-party-fill` - Show fill colors checkbox (in panel-fills)
- Population status - Updated dynamically by app.js
- `#tour-btn` - Take Tour button (in panel-fills)
- `#reset-colors-btn` - Reset to Defaults button (in panel-reset)

### localStorage Keys
- `utah-color-config` - Party and outline colors
- `utah-layer-colors` - Legacy layer colors
- `utah-map-view` - Map position/zoom
- `utah-tour-completed` - Tour state

---

## Technical Design

### New Panel Layout

```
┌─────────────────────────────────────┐
│  Utah Political Layers              │
├─────────────────────────────────────┤
│ LAYERS                              │
│ ☑ Utah boundary                     │
│ ☑ Map tiles [▼]                     │
│ [■] ☐ Population [loading...]       │  <- status inline
│ [■] ☑ House                         │
│ [■] ☑ Senate                        │
│ [■] ☑ Congress (current)            │
│ [■] ☐ Congress (coming)             │
│ Line width ────────────────         │
│ Opacity    ────────────────         │
├─────────────────┬───────────────────┤
│ PARTY LEGEND    │ PARTY FILLS       │
│ ■ Republican    │ Republican   [■]  │
│ ■ Democratic    │ Democratic   [■]  │
│ ■ Forward       │ Forward      [■]  │
│ ■ Other         │ Other        [■]  │
│ ☐ Fill on map   │                   │  <- moved here
├─────────────────┴───────────────────┤
│ [Take Tour]      [Reset to Defaults]│  <- footer
│ [Save Defaults ▼] (localhost only)  │
└─────────────────────────────────────┘
```

### Save Defaults Implementation

```javascript
// Detect localhost
const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

// Gather current state
const getCurrentDefaults = () => ({
  colors: {
    party: { ...colorConfig.party },
    outline: { ...colorConfig.outline }
  },
  layers: {
    boundary: document.getElementById('toggle-boundary').checked,
    tiles: document.getElementById('toggle-tiles').checked,
    population: document.getElementById('toggle-population').checked,
    house: document.getElementById('toggle-house').checked,
    senate: document.getElementById('toggle-senate').checked,
    congressCurrent: document.getElementById('toggle-congress-current').checked,
    congressFuture: document.getElementById('toggle-congress-future').checked,
    partyFill: document.getElementById('toggle-party-fill').checked
  },
  sliders: {
    lineWidth: document.getElementById('line-width').value,
    lineOpacity: document.getElementById('line-opacity').value
  },
  tileStyle: document.getElementById('tile-style-select').value
});

// Save to clipboard/console
const saveDefaults = (target) => {
  const defaults = getCurrentDefaults();
  const json = JSON.stringify(defaults, null, 2);
  console.log(`// Defaults for ${target}:`);
  console.log(json);
  navigator.clipboard.writeText(json);
  alert(`Defaults copied to clipboard for ${target}`);
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `public/index.html` | Move fill checkbox, reorganize footer, add save button |
| `public/styles.css` | Footer layout styles, localhost button styling |
| `public/app.js` | Save defaults function, localhost detection, population status placement |

## Files to Create

| File | Purpose |
|------|---------|
| `tests/test-panel-refinements.spec.js` | E2E tests for new layout |

---

## Subtask Breakdown (TAC-8.5)

### Phase 1: Planning (Opus) ✅
- Analyze requirements
- Design new layout
- Create spec document

### Phase 2: Implementation

#### Wave 1 - HTML Structure (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.1 | Sonnet | Move fill checkbox from panel-fills to panel-legend |
| 2.2 | Sonnet | Add population status span next to Population toggle |
| 2.3 | Sonnet | Create footer section with Tour (left) and Reset (right) |
| 2.4 | Sonnet | Add Save Defaults dropdown button (hidden by default) |

#### Wave 2 - CSS Styling (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.5 | Sonnet | Style footer with flexbox justify-between |
| 2.6 | Sonnet | Style Save Defaults button/dropdown |
| 2.7 | Sonnet | Add localhost-only visibility class |

#### Wave 3 - JavaScript Logic (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.8 | Sonnet | Implement getCurrentDefaults() function |
| 2.9 | Sonnet | Implement saveDefaults() with clipboard |
| 2.10 | Sonnet | Add localhost detection and button visibility |
| 2.11 | Sonnet | Move population status update to new location |

#### Wave 4 - Testing (Haiku)
| Task | Model | Description |
|------|-------|-------------|
| 2.12 | Haiku | Test fill checkbox in legend section |
| 2.13 | Haiku | Test footer button alignment |
| 2.14 | Haiku | Test save defaults on localhost |

### Phase 3: Integration (Opus)
- Review all changes
- Run full test suite
- Fix integration issues
- Final verification

---

## Testing Strategy

### E2E Tests (test-panel-refinements.spec.js)

```javascript
test('Fill checkbox is in legend section', async ({ page }) => {
  const fillCheckbox = page.locator('.panel-legend #toggle-party-fill');
  await expect(fillCheckbox).toBeVisible();
});

test('Population status is adjacent to Population toggle', async ({ page }) => {
  const popRow = page.locator('.layer-row:has(#toggle-population)');
  const status = popRow.locator('.population-status');
  await expect(status).toBeVisible();
});

test('Footer has Tour left and Reset right', async ({ page }) => {
  const tourBtn = page.locator('.panel-footer #tour-btn');
  const resetBtn = page.locator('.panel-footer #reset-colors-btn');

  const tourBox = await tourBtn.boundingBox();
  const resetBox = await resetBtn.boundingBox();

  expect(resetBox.x).toBeGreaterThan(tourBox.x);
});

test('Save Defaults visible only on localhost', async ({ page }) => {
  // When on localhost:8080
  const saveBtn = page.locator('#save-defaults-btn');
  await expect(saveBtn).toBeVisible();
});
```

---

## Acceptance Criteria

- [ ] "Fill on map" checkbox is beneath Party Legend swatches
- [ ] Population loading status appears next to Population checkbox
- [ ] Take Tour button is left-aligned in footer
- [ ] Reset to Defaults button is right-aligned in footer
- [ ] Save Defaults button appears only on localhost
- [ ] Save Defaults copies current state to clipboard
- [ ] All existing functionality continues to work
- [ ] Tests pass

---

## Mobile Considerations

- Footer buttons should stack vertically on mobile (< 480px)
- Save Defaults button hidden on mobile (not useful there)
- Touch targets remain 44px minimum
