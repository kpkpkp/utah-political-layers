# Feature Planning Template

You are planning a new feature for the Utah Political Layers project.

## Project Context
Utah Political Layers is a static web map that overlays Utah State House and State Senate districts with party affiliation colors, plus toggleable boundaries and congressional districts.

### Structure
- **public/** - Static web content (HTML, CSS, JavaScript, data files)
- **docs/** - Documentation and source data
- **tests/** - Playwright E2E tests

### Key Technologies
- Leaflet.js (mapping library, loaded from CDN)
- GeoJSON (district boundary data)
- Playwright (E2E testing)
- Python (local dev server)
- Node.js (build scripts)

### Data Sources
- Utah SGID ArcGIS FeatureServices (district boundaries)
- Utah Legislature roster (party affiliations)
- Ballotpedia (congressional delegation)

## Feature Request
$ARGUMENTS

## Instructions
1. First, understand the feature requirements and user story
2. Explore the existing codebase for related functionality
3. Create a detailed plan in `specs/feature-<name>.md` with:
   - Feature description and user story
   - Technical design (architecture decisions)
   - Data source changes (if any)
   - Layer/map changes (if any)
   - UI changes (if any)
   - Files to be created/modified
   - Testing strategy
   - Mobile/responsive considerations
4. Output the spec file path when complete