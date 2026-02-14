# Feature: Mobile Controls Visibility

## Problem Statement
On mobile devices, the legend and layer controls are not discoverable. Users must switch to "Desktop view" in their mobile browser to see and interact with these controls. The existing bottom sheet implementation has a drag handle that is too subtle (4px x 40px gray bar) for users to notice, making the controls effectively invisible.

## User Story
**As a** mobile user visiting the Utah Political Layers map,
**I want to** easily find and use the legend, layer toggles, and appearance controls,
**So that** I can explore district data without switching to Desktop view.

## Current State Analysis

### What exists today (≤480px viewport)
- Control panel converts to a **bottom sheet** (`position: fixed; bottom: 0`)
- Collapsed state shows only a **48px-tall area** with a 4px-tall gray drag handle
- Panel toggle (◀/▶) and corner rotation buttons are **hidden** (`display: none`)
- Drag handle supports touch gestures (swipe up/down) and tap to toggle
- Expanded state uses `max-height: 60vh` with `overflow-y: auto`

### Root cause of the problem
1. **Drag handle is nearly invisible** — 4px x 40px gray bar with no label or icon
2. **No visual indicator** that controls exist below the map
3. **No floating button** or persistent affordance to open controls
4. **Panel starts expanded** on first visit (covering 60% of screen), user may swipe it away and never find it again

## Technical Design

### Approach: Floating Toggle Button + Improved Bottom Sheet

Replace the subtle drag handle with a **floating action button (FAB)** that's always visible when the panel is collapsed, plus improve the bottom sheet header for better discoverability.

### Changes

#### 1. Add a Floating Toggle Button (mobile only)
- Circular button (48px diameter) fixed at bottom-right of screen
- Shows a **layers icon** (☰ or stacked-layers SVG) when panel is collapsed
- Shows a **close icon** (✕) when panel is expanded
- Visible only at ≤480px viewport width
- z-index above map but below the panel (z-index: 999)
- Tapping opens/closes the bottom sheet

#### 2. Improve Bottom Sheet Header
- Replace the 4px drag handle with a **styled header bar** containing:
  - A wider drag indicator (48px x 5px, rounded, more visible)
  - The title "Utah Political Layers" always visible in the bar
  - A close (✕) button on the right side of the header
- Header bar acts as the drag target for swipe gestures

#### 3. Start Collapsed on Mobile
- On mobile viewports, the panel should **start collapsed** by default
- The FAB provides a clear way to open it
- This gives users a full-screen map on first load

#### 4. Keep Existing Tablet/Desktop Behavior
- No changes to viewports >480px
- The panel toggle (◀/▶) and corner rotation continue to work as-is

## Files to Modify

| File | Changes |
|------|---------|
| `public/index.html` | Add floating toggle button element; update drag handle markup to include title + close button |
| `public/styles.css` | Add FAB styles; update mobile bottom sheet header styles; add collapsed-on-mobile initialization |
| `public/app.js` | Add FAB click handler; update collapse/expand logic to toggle FAB icon; start collapsed on mobile; wire up close button |

## Detailed Implementation

### HTML Changes (`public/index.html`)

Add after the `#map` div:
```html
<button class="mobile-fab" id="mobile-fab" aria-label="Toggle controls">
  <span class="mobile-fab-icon">☰</span>
</button>
```

Update the drag handle area inside `#controls`:
```html
<div class="panel-drag-handle" aria-hidden="true">
  <div class="drag-indicator"></div>
</div>
<div class="panel-mobile-header">
  <span class="panel-mobile-title">Utah Political Layers</span>
  <button class="panel-close-btn" id="panel-close-btn" aria-label="Close controls">✕</button>
</div>
```

### CSS Changes (`public/styles.css`)

**Base styles (hidden on desktop):**
```css
.mobile-fab { display: none; }
.panel-mobile-header { display: none; }
.drag-indicator { /* inner bar */ }
```

**Mobile media query (≤480px):**
```css
.mobile-fab {
  display: flex;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #d0d0d0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 999;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}

/* Hide FAB when panel is expanded */
body:has(.control-panel:not(.collapsed)) .mobile-fab {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}

.panel-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.panel-mobile-title {
  font-weight: 600;
  font-size: 14px;
}

.panel-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  padding: 8px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}
```

### JavaScript Changes (`public/app.js`)

```javascript
// Start collapsed on mobile
if (window.innerWidth <= 480) {
  panel.classList.add('collapsed');
}

// FAB click handler
const fab = document.getElementById('mobile-fab');
if (fab) {
  fab.addEventListener('click', () => {
    panel.classList.remove('collapsed');
  });
}

// Close button handler
const closeBtn = document.getElementById('panel-close-btn');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    panel.classList.add('collapsed');
  });
}
```

## Visual Behavior Summary

| State | What user sees |
|-------|---------------|
| Page load (mobile) | Full-screen map + FAB button in bottom-right |
| Tap FAB | Bottom sheet slides up with controls, FAB fades out |
| Tap ✕ or swipe down | Bottom sheet collapses, FAB reappears |
| Tablet/desktop | No change from current behavior |

## Testing Strategy

### Manual Testing
- Test on iPhone Safari, Android Chrome (portrait + landscape)
- Verify FAB is visible and tappable on small screens
- Verify bottom sheet opens/closes correctly
- Verify swipe gestures still work on the drag handle area
- Verify no changes on tablet/desktop viewports

### Playwright E2E Tests
Add tests in `tests/` for:
1. FAB visible on mobile viewport, hidden on desktop
2. FAB click opens the panel (removes `collapsed` class)
3. Close button collapses the panel
4. Panel starts collapsed on mobile-width viewport
5. FAB hidden when panel is expanded
6. Legend and layer toggles accessible when panel is open

### Test viewports
- 375×667 (iPhone SE)
- 390×844 (iPhone 14)
- 430×932 (iPhone 14 Pro Max)
- 768×1024 (iPad — should NOT show FAB)
- 1280×800 (desktop — no changes)

## Mobile/Responsive Considerations
- FAB touch target: 56px (exceeds 44px minimum)
- Close button touch target: 44x44px minimum
- Bottom sheet max-height: 60vh (unchanged)
- Landscape mode: existing 50vh max-height still applies
- No horizontal scroll introduced
- z-index layering: map (base) < FAB (999) < panel (1000)
- `body:has()` selector used for FAB visibility — supported in all modern mobile browsers (Safari 15.4+, Chrome 105+)

## Out of Scope
- Tablet-specific changes (481-768px works adequately)
- Redesigning the control panel layout itself
- Adding new controls or functionality
- PWA / app-shell changes
