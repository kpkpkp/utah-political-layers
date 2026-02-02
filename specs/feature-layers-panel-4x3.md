# Feature Specification: Layers Panel 4:3 Aspect Ratio Redesign

**Created:** 2026-02-02
**Status:** ✅ Completed
**TAC Level:** 8.5 (Multi-agent orchestration with E2E verification)
**Completed:** 2026-02-02

---

## Overview

Redesign the Layers control panel to adopt a 4:3 aspect ratio, grouping color controls by their function (fills vs outlines). The insight is that the control panel in the upper-right naturally fits Utah's profile shape, making the 4:3 ratio both aesthetically and geographically appropriate.

---

## User Story

As a user, I want the Layers control panel to have a more balanced 4:3 aspect ratio with colors logically grouped by their purpose (party fill colors vs layer outline colors), making it easier to find and adjust related settings.

---

## Current State Analysis

### Panel Structure (public/index.html:33-168)

Current panel sections:
1. **Layers** - Toggle switches with inline color pickers
2. **Styling** - Party fill toggle, line width/opacity sliders
3. **Customize Colors** - Two subsections: Party Colors, Outline Colors
4. **Party legend** - Color swatches

### Current Dimensions (public/styles.css:36-53)

```css
.panel {
  min-width: 220px;
  width: 230px;
}
.control-panel {
  width: 265px;
}
```

Current panel is tall and narrow (~265px wide). A 4:3 ratio would be approximately 350px × 263px (or similar).

### Color Controls Currently Scattered

- **Inline in Layers section**: `color-house`, `color-senate`, `color-congress-current`, `color-congress-future`, `color-population`
- **In Customize Colors section**: Party colors (Republican, Democratic, Forward, Other) and Outline colors (House, Senate, Congress current, Congress coming)

There's duplication: `color-house` in Layers and `outline-color-house` in Customize Colors appear to control the same thing.

---

## Technical Design

### 4:3 Aspect Ratio Target

For desktop:
- **Width:** 360px (wider than current 265px)
- **Height:** ~270px target (will depend on content)
- **Ratio:** 4:3 = 1.33:1

### Grouped Color Organization

**Group 1: Fills (Party Colors)**
Controls that affect the fill/background color of districts:
- Republican fill
- Democratic fill
- Forward Party fill
- Other/Unknown fill
- Party fill toggle (on/off)

**Group 2: Outlines (Border Colors)**
Controls that affect the outline/stroke of layers:
- State House outline
- State Senate outline
- Congress current outline
- Congress coming outline
- Population dot color
- Line width slider
- Line opacity slider

### New Panel Layout (2-Column Grid)

```
┌─────────────────────────────────────────────────────┐
│  Utah Political Layers                    [Tour] [×]│
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────────┐│
│  │ LAYERS              │ │ PARTY FILLS             ││
│  │ ☑ Utah boundary     │ │ ☑ Enable party fills    ││
│  │ ☑ Map tiles [▼]     │ │ ■ Republican  [picker]  ││
│  │ ☑ Population        │ │ ■ Democratic  [picker]  ││
│  │ ☑ State House       │ │ ■ Forward     [picker]  ││
│  │ ☑ State Senate      │ │ ■ Other       [picker]  ││
│  │ ☑ Congress (current)│ └─────────────────────────┘│
│  │ ☐ Congress (coming) │ ┌─────────────────────────┐│
│  └─────────────────────┘ │ OUTLINES                ││
│  ┌─────────────────────┐ │ Population   [picker]   ││
│  │ LEGEND              │ │ House        [picker]   ││
│  │ ■ Republican        │ │ Senate       [picker]   ││
│  │ ■ Democratic        │ │ Congress     [picker]   ││
│  │ ■ Forward           │ │ Congress+    [picker]   ││
│  │ ■ Other             │ │ Width ────────○──────   ││
│  └─────────────────────┘ │ Opacity ─────────○───   ││
│                          └─────────────────────────┘│
│  [Reset to Defaults]                                │
└─────────────────────────────────────────────────────┘
```

### CSS Grid Implementation

```css
.control-panel {
  width: 360px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "header header"
    "layers fills"
    "legend outlines"
    "reset reset";
  gap: 12px;
  padding: 14px;
}

.panel-header { grid-area: header; }
.panel-layers { grid-area: layers; }
.panel-fills { grid-area: fills; }
.panel-legend { grid-area: legend; }
.panel-outlines { grid-area: outlines; }
.panel-reset { grid-area: reset; }
```

### Mobile Responsiveness

For mobile (≤480px), the bottom sheet layout remains but stacks the 2-column grid vertically:

```css
@media (max-width: 480px) {
  .control-panel {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "layers"
      "legend"
      "fills"
      "outlines"
      "reset";
  }
}
```

---

## Implementation Plan

### Files to Modify

| File | Changes |
|------|---------|
| `public/index.html` | Restructure panel into grid areas, remove duplicate color pickers, add panel header |
| `public/styles.css` | CSS Grid layout, 4:3 proportions, update responsive breakpoints |
| `public/app.js` | Remove redundant color picker event listeners, consolidate color state |

### Files to Create

| File | Purpose |
|------|---------|
| `tests/test-panel-layout.spec.js` | E2E tests for 4:3 layout, groupings, responsiveness |

---

## Subtask Breakdown (TAC-8.5)

### Phase 1: Planning (Opus) ✅
- Analyze current panel structure
- Design 4:3 grid layout
- Identify redundant controls
- Create spec document

### Phase 2: Implementation (Parallel Execution)

#### Wave 1 - Foundation (Haiku)
| Task | Model | Complexity | Description |
|------|-------|------------|-------------|
| 2.1 | Haiku | Low | Audit duplicate color pickers between Layers section and Customize Colors |
| 2.2 | Haiku | Low | Define CSS Grid template for 4:3 layout |
| 2.3 | Haiku | Low | Create test file skeleton with test case names |

#### Wave 2 - Core Implementation (Sonnet)
| Task | Model | Complexity | Description |
|------|-------|------------|-------------|
| 2.4 | Sonnet | Medium | Restructure index.html with new grid areas (header, layers, fills, legend, outlines, reset) |
| 2.5 | Sonnet | Medium | Implement CSS Grid with 4:3 proportions and styling |
| 2.6 | Sonnet | Medium | Update app.js to remove redundant listeners and consolidate color state |

#### Wave 3 - Polish (Sonnet)
| Task | Model | Complexity | Description |
|------|-------|------------|-------------|
| 2.7 | Sonnet | Medium | Update mobile responsive CSS for new grid layout |
| 2.8 | Sonnet | Medium | Implement E2E tests for layout and groupings |

### Phase 3: Integration (Opus)
- Review all changes
- Run full test suite
- Fix integration issues
- Visual verification
- Final sign-off

---

## Testing Strategy

### E2E Tests (test-panel-layout.spec.js)

```javascript
// Test cases to implement:
test.describe('Layers Panel 4:3 Layout', () => {
  test('panel has approximately 4:3 aspect ratio', async ({ page }) => {
    // Measure panel dimensions, verify ratio ~1.33
  });

  test('party fill colors are grouped together', async ({ page }) => {
    // Verify Republican, Democratic, Forward, Other pickers in fills section
  });

  test('outline colors are grouped together', async ({ page }) => {
    // Verify House, Senate, Congress outline pickers in outlines section
  });

  test('sliders are in outlines section', async ({ page }) => {
    // Verify line-width and line-opacity in outlines group
  });

  test('no duplicate color pickers exist', async ({ page }) => {
    // Verify single color picker per layer
  });

  test('mobile layout stacks columns vertically', async ({ page }) => {
    // Set viewport to 375x667, verify single-column layout
  });

  test('color changes still work correctly', async ({ page }) => {
    // Change a color, verify it persists and applies to map
  });
});
```

### Visual Verification

- Desktop: Panel should appear balanced (4:3 ratio)
- Panel should fit nicely in upper-right, complementing Utah's profile
- Colors should be logically grouped
- Mobile: Should remain usable as bottom sheet

---

## Acceptance Criteria

- [ ] Panel width is ~360px with ~4:3 aspect ratio on desktop
- [ ] Party fill colors (Republican, Democratic, Forward, Other) are grouped in "Party Fills" section
- [ ] Outline colors (House, Senate, Congress, Population) are grouped in "Outlines" section
- [ ] Line width and opacity sliders are in "Outlines" section
- [ ] No duplicate color pickers exist in the panel
- [ ] Mobile layout stacks sections vertically
- [ ] All existing color functionality continues to work
- [ ] Existing tests continue to pass
- [ ] New layout tests pass

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing color persistence | Carefully migrate localStorage keys if needed |
| Layout breaks on edge viewports | Test multiple viewport sizes |
| Touch targets too small in new layout | Maintain 44px minimum touch targets |
| Tour callouts mispositioned | Update tour.js callout positioning if needed |

---

## Rollback Plan

If issues are discovered:
1. Revert HTML/CSS changes to previous layout
2. Keep any app.js code cleanup that's independent of layout
3. Mark this spec as "Blocked" with notes on issues found
