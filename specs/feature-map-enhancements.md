# Feature Specification: Map Enhancements Bundle

**Created:** 2026-01-31
**Status:** Planning
**TAC Level:** 8.5 (Multi-agent orchestration with E2E verification)

---

## Overview

This specification covers a bundle of enhancements to the Utah Political Layers map:

1. **Configurable Default Colors** - User-adjustable color scheme stored in map state
2. **Analytics Integration** - Track user interactions and page views
3. **Narrative/Tour System** - Guided walkthrough with pan, zoom, layer toggles, and callouts
4. **Population Outlines** - Ensure population layer outline feature works correctly
5. **Legend Swatch Normalization** - Consistent dimensions, spacing, and styling
6. **Mobile-Responsive Left Panel** - Less intrusive legend/options for portrait and landscape

---

## 1. Configurable Default Colors

### User Story
As a user, I want to customize the map's color scheme (party colors, outline colors) and have my preferences persist across sessions.

### Technical Design

**Current State:**
- Party colors hardcoded in `partyColor()` function (`public/app.js:141-147`)
- Outline colors in `defaultLineColors` object (`public/app.js:158-163`)
- Some color state already stored in localStorage key `utah-layer-colors`

**Implementation:**
1. Create a color configuration panel (collapsible section in left panel)
2. Add color pickers for:
   - Republican (default: #d73027)
   - Democratic (default: #4575b4)
   - Forward Party (default: #8b5cf6)
   - Other/Unknown (default: #9e9e9e)
   - House outline (default: #ff6f00)
   - Senate outline (default: #00b0ff)
   - Congress current outline (default: #8e24aa)
   - Congress future outline (default: #43a047)
3. Store configuration in localStorage key `utah-color-config`
4. Apply colors dynamically via `partyColor()` and style functions
5. Add "Reset to Defaults" button

**Files to Modify:**
- `public/app.js` - Color state management, dynamic color application
- `public/index.html` - Color picker UI section
- `public/styles.css` - Color picker styling

### Subtask Assignment
| Subtask | Model | Complexity |
|---------|-------|------------|
| Color config localStorage schema | Haiku | Low |
| Color picker HTML/CSS | Sonnet | Medium |
| Dynamic color application logic | Sonnet | Medium |
| E2E test: color persistence | Haiku | Low |

---

## 2. Analytics Integration

### User Story
As a project maintainer, I want to understand how users interact with the map (page views, layer usage, zoom levels, time spent).

### Technical Design

**Options:**
- **Google Analytics 4** - Free, widely used, requires Google account
- **Plausible** - Privacy-focused, simple, requires subscription
- **Simple custom analytics** - Minimal tracking, no external dependency

**Recommended: Google Analytics 4 (GA4)**

**Implementation:**
1. Add GA4 snippet to `public/index.html` head
2. Track events:
   - Page view (automatic)
   - Layer toggle (layer name, on/off)
   - Zoom level changes (debounced)
   - District click (district type, district number)
   - Population toggle
   - Tour start/complete
3. Use gtag() API for custom events

**Code Pattern:**
```javascript
// In app.js
const trackEvent = (eventName, params) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, params);
  }
};

// Usage
trackEvent('layer_toggle', { layer: 'house', state: 'on' });
```

**Files to Modify:**
- `public/index.html` - GA4 script tag
- `public/app.js` - Event tracking calls

### Privacy Consideration
Add a simple analytics disclosure in the page footer or help section.

### Subtask Assignment
| Subtask | Model | Complexity |
|---------|-------|------------|
| GA4 script integration | Haiku | Low |
| Event tracking wrapper function | Haiku | Low |
| Add tracking calls to interactions | Sonnet | Medium |
| E2E test: gtag calls fire | Haiku | Low |

---

## 3. Narrative/Tour System

### User Story
As a new user, I want a guided tour that explains how the map layers work and interrelate, with the map panning, zooming, and toggling layers to illustrate each point.

### Technical Design

**Architecture:**
1. Create a tour step definition format
2. Build a tour controller that executes steps sequentially
3. Each step can: pan/zoom, toggle layers, show callout overlay, wait for user click
4. Store tour completion in localStorage

**Tour Step Schema:**
```javascript
const tourSteps = [
  {
    id: 'welcome',
    callout: {
      title: 'Welcome to Utah Political Layers',
      text: 'This map shows Utah legislative districts colored by party affiliation.',
      position: 'center' // 'center', 'top-left', 'bottom-right', etc.
    },
    action: null
  },
  {
    id: 'house-districts',
    callout: {
      title: 'State House Districts',
      text: 'The innermost layer shows 75 State House districts.',
      position: 'right'
    },
    action: {
      type: 'layer',
      target: 'house',
      state: true
    },
    view: { center: [39.32, -111.67], zoom: 7 }
  },
  {
    id: 'zoom-slc',
    callout: {
      title: 'Salt Lake City Detail',
      text: 'Zoom in to see district boundaries in urban areas.',
      position: 'left'
    },
    view: { center: [40.76, -111.89], zoom: 11 }
  }
  // ... more steps
];
```

**UI Components:**
1. "Start Tour" button in panel or welcome modal
2. Tour overlay with callout box (title, text, Next/Skip buttons)
3. Progress indicator (step X of Y)
4. Callout positioning system (avoid overlapping map controls)

**Files to Create:**
- `public/js/tour.js` - Tour controller and step definitions
- `public/css/tour.css` - Tour overlay and callout styling

**Files to Modify:**
- `public/index.html` - Include tour.js, add "Start Tour" button
- `public/app.js` - Expose map/layer APIs for tour controller

### Subtask Assignment
| Subtask | Model | Complexity |
|---------|-------|------------|
| Tour step schema design | Sonnet | Medium |
| Tour controller (execute steps) | Sonnet | Medium |
| Callout overlay HTML/CSS | Sonnet | Medium |
| Tour step content writing | Haiku | Low |
| Tour progress indicators | Haiku | Low |
| E2E test: tour flow | Sonnet | Medium |

---

## 4. Population Outlines Verification

### User Story
As a user, when I click on a population dot, I want to see the census block boundary highlighted.

### Current State Analysis
**From codebase exploration:**
- Population outline pane exists (`populationOutlinePane`, z-index 260)
- Click handler on population markers should highlight block geometry
- `pointer-events: none` on population pane may prevent clicks

**Verification Steps:**
1. Run existing population tests to confirm baseline
2. Test click interaction manually
3. If broken, identify and fix pointer-events or event handling
4. Ensure outline appears with correct styling

**Files to Check:**
- `public/app.js:703-799` - buildPopulationMarker click handler
- `public/app.js:114-124` - Pane configuration

### Subtask Assignment
| Subtask | Model | Complexity |
|---------|-------|------------|
| Run population interaction tests | Haiku | Low |
| Diagnose any click issues | Sonnet | Medium |
| Fix if needed | Sonnet | Medium |
| E2E test: population click shows outline | Haiku | Low |

---

## 5. Legend Swatch Normalization

### User Story
As a user, I want the legend color swatches to be visually consistent - same size, spacing, and style across all entries.

### Current State
**From `public/styles.css:190-211`:**
```css
.swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid #b0b0b0;
}
```

**Issues to Address:**
1. Audit all swatches for consistency (party legend, layer toggles, etc.)
2. Ensure inline swatches in layer rows match legend swatches
3. Standardize spacing (currently 8px gap in legend-row)
4. Consider slightly larger swatches for better visibility (16px × 16px)

### Technical Design

**Unified Swatch System:**
```css
.swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  vertical-align: middle;
}

.legend-row,
.layer-row-label {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

**Files to Modify:**
- `public/styles.css` - Unified swatch class
- `public/index.html` - Ensure all swatches use consistent markup

### Subtask Assignment
| Subtask | Model | Complexity |
|---------|-------|------------|
| Audit swatch usage across HTML | Haiku | Low |
| Normalize CSS for all swatch types | Haiku | Low |
| Visual verification screenshot test | Haiku | Low |

---

## 6. Mobile-Responsive Left Panel

### User Story
As a mobile user, I want the left panel (legend/options) to be less intrusive in portrait or landscape orientation, while still being easily accessible.

### Current State
- **No media queries in styles.css**
- Panel is fixed 265px width, positioned top-left
- Manual collapse toggle exists but requires user action
- Panel may overlap significant map area on small screens

### Technical Design

**Responsive Breakpoints:**
- Desktop: > 768px (current layout)
- Tablet: 481-768px (narrower panel, smaller text)
- Phone: ≤ 480px (bottom sheet or minimal floating button)

**Portrait Mobile (≤ 480px):**
1. Panel auto-collapses on load
2. Floating action button (FAB) to expand panel
3. When expanded, panel becomes a bottom sheet (slides up from bottom)
4. Bottom sheet covers 60% of screen height, scrollable

**Landscape Mobile (≤ 768px height, > 480px width):**
1. Panel becomes narrower (200px)
2. Sections become collapsible accordions
3. Smaller font size (11px)

**Implementation:**
```css
@media (max-width: 480px) {
  .control-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    width: 100%;
    max-height: 60vh;
    border-radius: 16px 16px 0 0;
    transform: translateY(calc(100% - 48px));
    transition: transform 0.3s ease;
  }

  .control-panel.expanded {
    transform: translateY(0);
  }

  .panel-drag-handle {
    display: block;
    /* ... handle styling */
  }
}

@media (max-width: 768px) and (min-width: 481px) {
  .control-panel {
    width: 200px;
    font-size: 11px;
  }
}
```

**Touch Considerations:**
- Add drag handle at top of mobile panel
- Support touch swipe to expand/collapse
- Ensure touch targets are at least 44px

**Files to Modify:**
- `public/styles.css` - Add media queries
- `public/index.html` - Add drag handle element
- `public/app.js` - Touch gesture handling for panel

### Subtask Assignment
| Subtask | Model | Complexity |
|---------|-------|------------|
| Media query breakpoints | Haiku | Low |
| Tablet layout CSS | Sonnet | Medium |
| Phone bottom-sheet CSS | Sonnet | Medium |
| Touch swipe gesture JS | Sonnet | Medium |
| E2E test: mobile viewport | Sonnet | Medium |

---

## Testing Strategy

### Playwright Test Coverage

**New Test Files to Create:**
1. `tests/test-color-config.spec.js` - Color picker, persistence, reset
2. `tests/test-analytics.spec.js` - Verify gtag calls fire
3. `tests/test-tour.spec.js` - Tour step execution, skip, complete
4. `tests/test-mobile-panel.spec.js` - Responsive layout verification
5. `tests/test-legend-swatches.spec.js` - Swatch dimension consistency

**Mobile Testing:**
Configure Playwright for mobile viewports:
```javascript
// In individual tests
test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE
test.use({ viewport: { width: 414, height: 896 } }); // iPhone 11
test.use({ viewport: { width: 768, height: 1024 } }); // iPad
```

### Manual Testing Checklist
- [ ] Color changes persist after page reload
- [ ] Tour completes without errors
- [ ] Population click highlights block boundary
- [ ] Legend swatches are uniform
- [ ] Panel is usable on iPhone and Android
- [ ] Panel is usable in landscape orientation

---

## TAC-8.5 Execution Plan

### Phase 1: Opus Planning (This Document)
✅ Decompose feature bundle into subtasks
✅ Assign complexity and model for each subtask
✅ Define acceptance criteria

### Phase 2: Parallel Subtask Execution

**Wave 1 - Foundation (Can Run in Parallel):**
| Subtask | Model | Dependency |
|---------|-------|------------|
| Color config localStorage schema | Haiku | None |
| GA4 script integration | Haiku | None |
| Audit swatch usage | Haiku | None |
| Media query breakpoints | Haiku | None |
| Tour step schema design | Sonnet | None |

**Wave 2 - Implementation (After Wave 1):**
| Subtask | Model | Dependency |
|---------|-------|------------|
| Color picker HTML/CSS | Sonnet | Wave 1 schema |
| Dynamic color application | Sonnet | Wave 1 schema |
| Tour controller | Sonnet | Wave 1 schema |
| Tablet layout CSS | Sonnet | Wave 1 breakpoints |
| Phone bottom-sheet CSS | Sonnet | Wave 1 breakpoints |

**Wave 3 - Integration (After Wave 2):**
| Subtask | Model | Dependency |
|---------|-------|------------|
| Add analytics tracking calls | Sonnet | Wave 1 GA4 |
| Tour step content | Haiku | Wave 2 controller |
| Touch gestures | Sonnet | Wave 2 CSS |

**Wave 4 - Testing (After Wave 3):**
| Subtask | Model | Dependency |
|---------|-------|------------|
| All E2E tests | Sonnet | Waves 1-3 |

### Phase 3: Opus Integration
1. Review all subtask outputs
2. Merge branches / resolve conflicts
3. Run full E2E test suite
4. Fix any integration issues
5. Final verification

### Phase 4: Deployment Verification
1. Build standalone HTML
2. Test on GitHub Pages staging
3. Mobile device testing (real devices)
4. Sign-off

---

## Files Summary

### Files to Create
| File | Purpose |
|------|---------|
| `public/js/tour.js` | Tour controller and step definitions |
| `public/css/tour.css` | Tour overlay styling |
| `tests/test-color-config.spec.js` | Color configuration tests |
| `tests/test-analytics.spec.js` | Analytics event tests |
| `tests/test-tour.spec.js` | Tour flow tests |
| `tests/test-mobile-panel.spec.js` | Mobile responsive tests |
| `tests/test-legend-swatches.spec.js` | Swatch consistency tests |

### Files to Modify
| File | Changes |
|------|---------|
| `public/index.html` | GA4 script, tour button, color pickers, drag handle |
| `public/app.js` | Color config, analytics tracking, tour API exposure |
| `public/styles.css` | Swatch normalization, media queries, tour styles |

---

## Acceptance Criteria

- [ ] User can customize party and outline colors via UI
- [ ] Color preferences persist across browser sessions
- [ ] GA4 tracks page views and key interactions
- [ ] Tour walks user through all major map features
- [ ] Population dot click highlights census block boundary
- [ ] All legend swatches are 16×16px with consistent styling
- [ ] Panel is usable on 375px width (iPhone SE)
- [ ] Panel is usable in landscape orientation
- [ ] All existing tests continue to pass
- [ ] New tests cover all new functionality
