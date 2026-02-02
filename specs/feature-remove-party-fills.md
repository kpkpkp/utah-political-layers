# Feature Specification: Remove Party Fills Section

**Created:** 2026-02-02
**Status:** Planning
**TAC Level:** 8.5 (Multi-agent orchestration with E2E verification)

---

## Overview

Remove the "Party Fills" section from the control panel, which contains color pickers for customizing party colors (Republican, Democratic, Forward, Other/Unknown). This will make the legend box narrower.

---

## Current State

### Party Fills Section (to be removed)
Located in `public/index.html` within `.panel-fills`:
```html
<div class="panel-fills">
  <div class="panel-title">Party Fills</div>
  <div class="color-picker-row">
    <label for="party-color-republican">Republican</label>
    <input type="color" id="party-color-republican" ... />
  </div>
  <div class="color-picker-row">
    <label for="party-color-democratic">Democratic</label>
    <input type="color" id="party-color-democratic" ... />
  </div>
  <div class="color-picker-row">
    <label for="party-color-forward">Forward</label>
    <input type="color" id="party-color-forward" ... />
  </div>
  <div class="color-picker-row">
    <label for="party-color-other">Other / Unknown</label>
    <input type="color" id="party-color-other" ... />
  </div>
</div>
```

### Grid Layout (current)
```
grid-template-areas:
  "header header"
  "layers layers"
  "legend fills"
  "footer footer"
  "save save";
```

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
│ [■] ☐ Population [loading...]       │
│ [■] ☑ House                         │
│ [■] ☑ Senate                        │
│ [■] ☑ Congress (current)            │
│ [■] ☐ Congress (coming)             │
│ Line width ────────────────         │
│ Opacity    ────────────────         │
├─────────────────────────────────────┤
│ PARTY LEGEND                        │
│ ■ Republican                        │
│ ■ Democratic                        │
│ ■ Forward                           │
│ ■ Other                             │
│ ☐ Fill on map                       │
├─────────────────────────────────────┤
│ [Take Tour]      [Reset to Defaults]│
│ [Save Defaults ▼] (localhost only)  │
└─────────────────────────────────────┘
```

### Grid Changes
Change from 2-column to 1-column layout:
```css
grid-template-areas:
  "header"
  "layers"
  "legend"
  "footer"
  "save";
```

### Panel Width
Reduce from 360px to approximately 220px (narrower single column).

---

## Files to Modify

| File | Changes |
|------|---------|
| `public/index.html` | Remove `.panel-fills` section entirely |
| `public/styles.css` | Update grid to single column, reduce width |
| `public/app.js` | Remove party color picker bindings |
| `docs/index.html` | Same changes (if applicable) |
| `docs/styles.css` | Same changes (if applicable) |
| `docs/app.js` | Same changes (if applicable) |

## Tests to Update

| File | Changes |
|------|---------|
| `tests/test-panel-layout.spec.js` | Remove tests for party fill color pickers, update 2-column tests |

---

## Subtask Breakdown (TAC-8.5)

### Phase 1: Planning (Opus) ✅
- Analyze requirements
- Design new layout
- Create spec document

### Phase 2: Implementation

#### Wave 1 - HTML Changes (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.1 | Sonnet | Remove `.panel-fills` section from public/index.html |
| 2.2 | Sonnet | Remove `.panel-fills` section from docs/index.html |

#### Wave 2 - CSS Changes (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.3 | Sonnet | Update grid to single column in public/styles.css |
| 2.4 | Sonnet | Reduce panel width to ~220px |
| 2.5 | Sonnet | Update mobile CSS to remove fills references |
| 2.6 | Sonnet | Update docs/styles.css with same changes |

#### Wave 3 - JavaScript Changes (Sonnet)
| Task | Model | Description |
|------|-------|-------------|
| 2.7 | Sonnet | Remove party color picker bindings from public/app.js |
| 2.8 | Sonnet | Remove party color picker bindings from docs/app.js |
| 2.9 | Sonnet | Update resetColorConfig to only reset outline colors |

#### Wave 4 - Test Updates (Haiku)
| Task | Model | Description |
|------|-------|-------------|
| 2.10 | Haiku | Remove party fill color picker tests |
| 2.11 | Haiku | Update panel layout tests for single column |
| 2.12 | Haiku | Verify all tests pass |

### Phase 3: Integration (Opus)
- Run full test suite
- Verify visual layout
- Final verification

---

## Acceptance Criteria

- [ ] Party Fills section completely removed from HTML
- [ ] Panel displays as single column
- [ ] Panel width reduced to ~220px
- [ ] Legend still shows party swatches
- [ ] "Fill on map" checkbox still works
- [ ] Outline color pickers still work
- [ ] All existing functionality preserved
- [ ] Tests updated and passing

---

## Notes

- Party colors will use the default values (not customizable)
- The legend swatches will continue to show the default party colors
- Users can still toggle fill on/off with the "Fill on map" checkbox
- Outline colors remain customizable
