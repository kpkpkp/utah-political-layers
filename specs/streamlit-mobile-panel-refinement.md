# Streamlit Mobile Panel Refinement

## Problem

The Streamlit deployment (`utah-political-layers.streamlit.app`) renders inside a `height=2000` iframe. On mobile phones (tested on Pixel 10, 411x923 CSS pixels), the base mobile CSS (`@media max-width: 480px`) activates and destroys the desktop panel layout — switching to a single-column bottom-sheet that doesn't work inside the oversized iframe. The result: controls invisible, map zoomed to wrong area, unusable on phones.

## Solution Overview

A comprehensive Streamlit-specific CSS override in `scripts/build_streamlit.py` that restores the desktop two-column panel layout at all viewport widths inside the iframe, plus a JS fix for `fitBounds` zoom calculation.

## Key Pitfalls & Lessons Learned

### 1. `window.innerHeight` lies inside iframes

**Problem:** `window.innerHeight` inside Streamlit's `height=2000` iframe returns `2000`, not the phone's visible viewport (~700-900px). This breaks any JS that tries to calculate zoom levels or viewport-relative positioning.

**Failed attempts:**
- `fitBounds` with padding — calculates zoom for 2000px container, Utah appears tiny
- `setView` with hardcoded zoom 6/7 — centers Utah at y=1000 in a 2000px container, invisible in top 700px viewport
- Temporarily resizing map container and restoring after 50ms — animation gets cancelled when height restores
- `containerPointToLatLng` pan math — wrong direction because `window.innerHeight` was 2000

**Solution:** `screen.availHeight` returns the real device screen dimensions regardless of iframe. Resize the map container to `screen.availHeight` permanently (the 2000px below the fold is invisible anyway), then `fitBounds` works correctly.

```js
const inIframe = window.self !== window.top;
if (inIframe) {
  const realViewport = Math.min(screen.availHeight || 700, window.innerHeight);
  mapEl.style.height = realViewport + 'px';
  map.invalidateSize({ animate: false });
}
```

### 2. CSS grid children can't escape their grid area

**Problem:** "Fill on map" checkbox needed to right-align to the panel's right edge, but it lives inside `.panel-legend` which occupies only the right grid column (~180px wide). `margin-left: auto`, `width: 100%`, and `justify-content: space-between` all work correctly — but only within the 180px column.

**Failed attempts:**
- `width: 100%` on `.party-title-row` — stretches to 100% of the column, not the panel
- `display: contents` on `.panel-legend` — children join parent grid but the two-column layout breaks entirely (layers and legend stack vertically)
- `grid-column: 1 / -1` on `.party-title-row` — can't span grid columns from inside a grid child

**Solution:** Absolutely position `.fill-toggle` within `.panel-legend` (set to `position: relative`). `top: 0; right: 0` places it at the right edge of the column, which IS the right edge of the panel content area.

### 3. Streamlit override must be COMPREHENSIVE

**Problem:** The base mobile CSS (`@media max-width: 480px`) sets many properties on `.control-panel` — `position: fixed`, `grid-template-columns: 1fr`, `width: 220px`, etc. A partial Streamlit override that only sets a few properties leaves the rest broken.

**Solution:** The Streamlit override must explicitly reset EVERY property that the base mobile CSS changes. This includes:
- Grid layout (`grid-template-columns`, `grid-template-areas`, `gap`)
- Positioning (`position: absolute` not `fixed`, `right` not `left`)
- Sizing (`width`, `max-height`, `min-width`)
- Visual (`border-radius`, `box-shadow`, `padding`, `font-size`)
- Collapse behavior (`transform`, `opacity`, `pointer-events`)
- Toggle button visibility and positioning
- Hiding mobile-only elements (FAB, drag handle, mobile header, corner button)

### 4. `input[type=color]` vs styled `<div>` alignment

**Problem:** The "Map tiles" row uses a `<div class="tile-swatch">` while all other rows use `<input type=color>`. Browsers render color inputs with ~2px internal padding (inset appearance) that a plain div doesn't have. This causes visible misalignment.

**Solution:** Add `padding: 2px`, `border: none`, and `background-clip: content-box` to `.tile-swatch` so the background draws only inside the padding, matching the color input's inset look.

### 5. Touch target debugging via adb is unreliable for iframes

**Problem:** `adb shell input tap x y` sends taps to the browser's top-level page. Streamlit renders content inside nested iframes, so taps often miss the target or hit the wrong element. Coordinate calculation requires accounting for Chrome UI bar height, device pixel ratio, AND iframe position.

**Lesson:** For Streamlit iframe testing, it's faster to have the user tap on the physical device than to try to calculate adb tap coordinates through multiple layers of framing.

## Changes Made

### HTML (`public/index.html`)
- "Fill on map" checkbox moved inline with "Parties" heading (label text before checkbox)
- "Other / Unknown" legend row gets `id="other-legend-row"` and `class="other-row"` for conditional visibility
- "Recenter Map" shortened to "Recenter"

### CSS (`public/styles.css`)
- Forward party swatch: `#8b5cf6` (purple) → `#808080` (grey)
- Other/Unknown swatch: `#9e9e9e` → `#8B7D6B` (taupe)
- `.other-row` hidden by default, `.other-row.show` displays it
- `.party-title-row` flex container with `space-between`
- `.fill-toggle` inline-flex with no border/margin
- Touch targets: close button 36px → 44px

### JavaScript (`public/app.js`)
- Forward party default: `#8b5cf6` → `#808080`
- Other party default: `#9e9e9e` → `#8B7D6B`
- Other/Unknown legend row shown only when congress-future toggle is checked
- Iframe detection: resize map container to `screen.availHeight` on load
- Recenter: same iframe-aware resize + `fitBounds` in iframe, standard `fitBounds` otherwise

### Build Script (`scripts/build_streamlit.py`)
- Comprehensive `@media (max-width: 480px)` override restoring desktop layout
- Panel: right-side, two-column grid (3fr 2fr), absolute positioning
- Toggle button: visible with left-edge positioning
- Mobile elements hidden (FAB, drag handle, mobile header, corner button, save defaults)
- Layer rows: zero margin/padding, uniform alignment, `gap: 4px`
- Tile swatch: `padding: 2px`, `background-clip: content-box`, no border
- Legend rows: zero spacing
- "Layers" heading hidden (redundant)
- Fill toggle absolutely positioned at top-right of legend column
- Header buttons uniform height (`min-height: 0`, matching padding)
- Landscape override for FAB/toggle visibility

## Files Modified
- `public/index.html` / `docs/index.html`
- `public/styles.css` / `docs/styles.css`
- `public/app.js` / `docs/app.js`
- `scripts/build_streamlit.py`
- `streamlit_app.py` (auto-generated)

## Testing
- Pixel 10 physical device via adb screencap
- Streamlit deployment at `utah-political-layers.streamlit.app`
- Viewport: 411x923 CSS pixels (non-desktop mode)
- Verified: panel visible, two-column layout, recenter fills screen, all toggles accessible
