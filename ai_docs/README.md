# AI Documentation

This directory contains reference documentation optimized for AI agents working on Utah Political Layers.

## Purpose

These docs provide quick references for the key technologies used in this project. AI agents should consult these when:

1. Working with map rendering (Leaflet)
2. Fetching district data (ArcGIS)
3. Writing or debugging tests (Playwright)

## Contents

| File | Technology | Use Case |
|------|------------|----------|
| `leaflet_reference.md` | Leaflet.js | Map rendering, layers, events, styling |
| `arcgis_reference.md` | ArcGIS REST API | Fetching Utah SGID district boundaries |
| `playwright_reference.md` | Playwright | E2E testing of map interface |

## Usage

### For AI Agents

When starting work on this project, read the relevant reference:

- **Map changes**: Read `leaflet_reference.md`
- **Data fetching**: Read `arcgis_reference.md`
- **Test updates**: Read `playwright_reference.md`

### Conditional Loading

The `/prime` command loads project context. For specific tasks, agents can read individual docs:

```
Read ai_docs/leaflet_reference.md
```

## Updating These Docs

Keep these docs updated when:

- Upgrading library versions
- Adding new API integrations
- Discovering useful patterns

Focus on:
- Quick reference (not tutorials)
- Project-specific examples
- Common patterns used in this codebase
