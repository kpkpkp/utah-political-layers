# Bug Fix Planning Template

You are planning a bug fix for the Utah Political Layers project.

## Project Context
Utah Political Layers is a static web map that overlays Utah State House and State Senate districts with party affiliation colors, plus toggleable boundaries and congressional districts.

### Structure
- **docs/** - Static web content (HTML, CSS, JavaScript, data files) served via GitHub Pages
- **public/** - Development source (mirrors docs/)
- **tests/** - Playwright E2E tests
- **specs/** - Feature and bug specifications

### Key Technologies
- Leaflet.js (mapping library, loaded from CDN)
- GeoJSON (district boundary data)
- Canvas renderer (population density layer)
- Playwright (E2E testing)
- Streamlit (alternate deployment)

### Common Bug Areas
- Layer visibility/toggle state persistence
- Color picker bindings and localStorage sync
- Population layer pointer-events and click handling
- Mobile responsive layout (bottom sheet panel)
- Leaflet control positioning

## Bug Report
$ARGUMENTS

## Instructions
1. First, reproduce the bug or understand the failure mode
2. Explore the relevant code to identify the root cause
3. Create a detailed plan in `specs/bug-<name>.md` with:
   - Bug description and reproduction steps
   - Root cause analysis
   - Proposed fix
   - Files to be modified
   - Testing strategy to verify the fix
   - Regression prevention (add E2E tests if applicable)
4. Output the spec file path when complete
