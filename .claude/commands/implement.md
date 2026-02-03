# Implementation Template

You are implementing a planned task for the Utah Political Layers project.

## Project Context
Utah Political Layers is a static web map that overlays Utah State House and Senate districts with party affiliation colors, plus toggleable boundaries and congressional districts.

### Technology Stack
- **Frontend:** Static HTML/CSS/JavaScript in `public/`
- **Map Library:** Leaflet.js (loaded from CDN)
- **Data:** GeoJSON from Utah SGID ArcGIS + `public/data/utah_parties.json`
- **Testing:** Playwright E2E tests in `tests/`

### Build/Test Pipeline
1. Edit files in `public/` (HTML, CSS, JS)
2. Start local server: `cd public && python3 -m http.server 8080`
3. Test manually at http://localhost:8080
4. Run Playwright tests: `npm test`
5. (Optional) Build standalone: `node build-standalone.js`

## Spec to Implement
$ARGUMENTS

## Instructions
1. Read the spec file from `specs/` directory
2. Follow the implementation plan step by step
3. After code changes:
   - If modifying JS: ensure no console errors
   - If modifying CSS: check mobile responsiveness
   - If modifying data: validate JSON format
   - If testable: add/update tests in `tests/`
4. Run `npm test` to verify E2E tests pass
5. Summarize what was implemented

## Key File Locations
- **Map Logic:** `public/js/`
- **Styles:** `public/css/`
- **Party Data:** `public/data/utah_parties.json`
- **Main Page:** `public/index.html`
- **Tests:** `tests/*.spec.js`

## Party Colors Reference
- Republican (GOP): Red (`#E81B23`)
- Democratic (Dem): Blue (`#0015BC`)
- Forward Party: Purple (`#8A2BE2`)
- Other/Unaffiliated: Gray (`#808080`)
