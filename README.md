# Utah Political Layers

Interactive web visualization of Utah political boundaries — precincts, state house/senate districts, and congressional districts with party affiliation overlays.

**[Live app →](https://utah-political-layers.streamlit.app/)**

## Built with TAC

This project was built using **TAC (Tactical Agentic Coding)** — a structured methodology for human-AI pair programming where Claude operates as a co-developer under explicit architectural direction.

- 175+ commits with Claude as a contributor
- 200 deployments
- The `ai_docs/` and `adws/` directories contain the TAC infrastructure

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
- Party & member roster: [Utah Legislature roster](https://le.utah.gov/asp/roster/roster.asp?house=H)
- Congressional delegation: [Ballotpedia — Utah](https://ballotpedia.org/United_States_congressional_delegations_from_Utah)

## Tech

HTML, JavaScript, Streamlit, GitHub Pages
