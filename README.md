# Utah Political Layers

Local web map that overlays Utah State House and State Senate districts with party affiliation colors, plus a toggleable Utah boundary outline.
Includes current and coming Utah congressional district layers.

## Run locally

1. Start a local server from the `public` folder:
   - `cd public`
   - `python3 -m http.server 8080`
2. Open `http://localhost:8080` in your browser.

## Data sources

- District boundaries: Utah SGID ArcGIS FeatureServices
  - House districts 2022-2032
  - Senate districts 2022-2032
  - Utah state boundary
  - US Congress districts 2022-2032
  - US Congress districts 2026-2032
- Party & member roster: Utah Legislature roster (`https://le.utah.gov/asp/roster/roster.asp?house=H`)
- Congressional delegation: Ballotpedia (`https://ballotpedia.org/United_States_congressional_delegations_from_Utah`)