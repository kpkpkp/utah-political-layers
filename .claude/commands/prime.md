# /prime - Onboard to Utah Political Layers Codebase

## Purpose
Quick orientation for agents working on this project. Provides codebase structure, technology stack, and key concepts.

## Project Overview
**Utah Political Layers** is a local web map that overlays Utah State House and State Senate districts with party affiliation colors, plus toggleable boundaries and congressional districts.

- **Technology:** Static web app (HTML/CSS/JavaScript)
- **Map Library:** Leaflet.js
- **Testing:** Playwright (E2E tests)
- **Data Source:** Utah SGID ArcGIS FeatureServices + external APIs

## Directory Structure

```
utah-political-layers/
├── public/                 # Static web content (served by HTTP server)
│   ├── index.html         # Main HTML entry point
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript (map logic, layer management)
│   ├── data/              # GeoJSON and data files
│   └── assets/            # Images, icons, etc.
├── docs/                  # Documentation and data sources
│   └── data/              # Party affiliation data, district boundaries
├── tests/                 # Playwright E2E tests
├── .claude/               # Claude Code configuration
│   ├── commands/          # Slash command templates (this directory)
│   └── settings.local.json # Permissions and tool allowlist
├── DEPLOYMENT.md          # Deployment instructions
├── SHARING.md             # How to share the map
├── build-standalone.js    # Build script for standalone version
└── playwright.config.js   # Playwright configuration
```

## Key Files & What They Do

### Core Application Files
- **public/index.html** - Main HTML page, map container
- **public/js/** - JavaScript logic for Leaflet map, layer toggling, district interactions
- **public/data/utah_parties.json** - Party affiliation data for districts
- **docs/data/utah_parties.json** - Source party data (mirrors public/data/)

### Configuration & Scripts
- **playwright.config.js** - E2E test configuration
- **build-standalone.js** - Bundles the web map into standalone HTML file
- **DEPLOYMENT.md** - GitHub Pages deployment steps

### Documentation
- **README.md** - Project overview (what it is, how to run locally)
- **DEPLOYMENT.md** - Deployment instructions
- **SHARING.md** - How to share the map via social media, etc.
- **FIXES.md** - Known issues and fixes

## Technology Stack

- **Mapping:** Leaflet.js (loaded from CDN)
- **Data Format:** GeoJSON (district boundaries)
- **HTTP Server:** Python 3 (`python3 -m http.server`)
- **Testing:** Playwright (browser automation)
- **Build:** Node.js script (build-standalone.js)

## Data Flow

1. **Districts** - GeoJSON fetched from Utah SGID ArcGIS services
2. **Party Data** - House/Senate party affiliations from Utah Legislature roster
3. **Congressional** - US congressional districts from ArcGIS, delegation from Ballotpedia
4. **Rendering** - Leaflet map with color-coded layers based on party affiliation

## Party Colors (Key Information)
- **Republican (GOP):** Red
- **Democratic (Dem):** Blue
- **Forward Party:** Purple
- **Other/Unaffiliated:** Gray

## Recent Development
Key recent commits:
- Enable clicking through to population dots when party fill disabled
- Make zoom controls more granular (0.25x increments)
- Add Forward Party to legend with purple color
- Fix district clicking by adjusting population layer z-index
- Add 'blocks' label to population status display

## Quick Start for Agents

### Running Locally
```bash
cd public
python3 -m http.server 8080
# Open http://localhost:8080 in browser
```

### Running Tests
```bash
npm install  # First time only
npm test     # Runs Playwright tests
```

### Making Changes
1. Edit files in `public/js/` for map logic
2. Edit `public/data/utah_parties.json` for party data
3. Test locally with HTTP server
4. Run Playwright tests to validate
5. Consider build-standalone.js for deployment

## Common Tasks

### Add/Update Party Color
- Edit party color mappings in `public/js/` (search for color definitions)
- Update legend in HTML/CSS
- Update `public/data/utah_parties.json` if adding new parties

### Add New Layer
- Create GeoJSON data source
- Add Leaflet layer in JavaScript
- Update layer control UI
- Add tests in `tests/`

### Fix District Interaction
- Check z-index ordering in CSS
- Verify Leaflet pointer-events settings
- Ensure click handlers are properly attached
- Run E2E tests to validate

## Data Sources
- **Districts:** Utah SGID ArcGIS FeatureServices (2022-2032)
- **Party Data:** Utah Legislature roster
- **Congressional:** Ballotpedia (US congressional delegations)

## Important Considerations
- Map must work on mobile devices (responsive design)
- Performance: Optimize layer rendering for many districts
- Accessibility: Ensure color contrast meets standards
- Data Freshness: Update party rosters seasonally

## Next Steps
Run `/install` to set up dependencies, then `/tools` to see available commands.
