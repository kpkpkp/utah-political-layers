# Population Layer: Pitfalls & Solutions

## Overview
The Population layer renders ~44,000 census block markers on a Leaflet canvas. Background preload fetches data from ArcGIS REST API at page init so toggling is instant. Several non-obvious issues were encountered.

## Pitfall 1: `\n` in JS strings breaks Streamlit build
**Symptom:** Entire map disappears (blank dark screen). No console errors visible because the script never executes.

**Cause:** `scripts/build_streamlit.py` wraps JS inside a Python f-string. Any literal `\n` in JS (e.g. `.split('\n')`, `alert("line1\nline2")`) gets interpreted by Python as a real newline, breaking JS string syntax.

**Fix:** Avoid `\n` in JS entirely. Use `.substring()` instead of `.split('\n')`, string concatenation instead of template literals with `\n`. Use `node --check app.js` on the generated JS to catch syntax errors.

**Rule:** Never use `\n` or other escape sequences in JS that passes through the Streamlit build pipeline.

## Pitfall 2: Canvas renderer `_redraw()` before layer is on map
**Symptom:** Background preload always fails with "Cannot read properties of undefined". Manual toggle works fine.

**Cause:** `L.canvas()` renderer initializes its `_ctx` (2D drawing context) lazily in `onAdd()`, which only fires when the layer is added to the map. During background preload, markers were added to a `L.layerGroup()` not yet on the map. Calling `populationRenderer._redraw()` after each chunk tried to access `this._ctx.save()` — but `_ctx` was `undefined`.

**Why manual toggle worked:** The checkbox handler called `layer.addTo(map)` first, initializing the renderer before any `_redraw` call.

**Fix:** Guard `_redraw()` and `enablePopulationCanvasClicks()` with `map.hasLayer(populationLayer)`.

## Pitfall 3: Slow toggle from add/remove layer cycle
**Symptom:** Checking the Population checkbox freezes the UI for several seconds. Users think it didn't register and click again (toggling it back off).

**Cause:** `populationLayer.addTo(map)` re-initializes all 44K `L.circleMarker` instances on the canvas renderer. `map.removeLayer()` tears them down. Every toggle paid this full cost.

**Fix:** Keep the layer on the map permanently. After preload completes, add the layer hidden (`populationPane.style.display = "none"`). Toggle just flips the pane's `display` property — instant show/hide, zero re-render cost.

## Pitfall 4: `window.innerWidth` vs CSS pixels on mobile
**Symptom:** Mobile detection (`window.innerWidth <= 480`) never triggers on some phones.

**Cause:** On high-DPI devices (e.g. Pixel 10), `window.innerWidth` can return device pixels (1645px) while CSS `@media (max-width: 480px)` uses CSS pixels (411px).

**Fix:** Use `window.matchMedia("(max-width: 480px)").matches` which matches CSS behavior.

## Pitfall 5: `position: fixed` inside Streamlit iframe
**Symptom:** Mobile panel positioned off-screen in Streamlit deployment.

**Cause:** Streamlit renders HTML components in an iframe with `height=2000`. `position: fixed` positions relative to the iframe viewport, not the device screen. The panel ends up 2000px down.

**Fix:** The Streamlit build script forces desktop-style panel layout (absolute positioning) inside the iframe, bypassing mobile `position: fixed` entirely.

## Final Architecture

```
Page load
  ├── init() loads GeoJSON layers (boundary, districts, parties)
  └── loadPopulationPoints() fires (not awaited)
        ├── fetchPopulationCount() → 44,069
        └── loadPopulationPointsViaRest() pages through API
              ├── 2000 features per page, ~22 fetches
              ├── buildPopulationMarker() per feature (with null guards)
              ├── addChunk() via requestAnimationFrame (400 markers/frame)
              └── On complete:
                    ├── Add layer to map HIDDEN (pre-renders canvas)
                    ├── If checkbox checked → show pane
                    └── enablePopulationCanvasClicks()

Toggle checkbox
  ├── checked  → populationPane.style.display = ""    (instant)
  └── unchecked → populationPane.style.display = "none" (instant)
```

## Key Files
- `public/app.js` — all population logic (load, render, toggle)
- `public/index.html` — `#toggle-population` checkbox, `#population-status` span
- `scripts/build_streamlit.py` — generates `streamlit_app.py`, source of f-string pitfall
