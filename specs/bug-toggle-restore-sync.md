# Bug: Layer Checkboxes Out of Sync with Rendered Layers on Restore

**Status:** Fixed
**Severity:** Medium — visual mismatch between UI and map state
**Affected layers:** `congressFuture` (and any future layer created without `.addTo(map)`)

## Symptom

When a user checks the "Congress (2025 proposed)" toggle, saves state to localStorage, and reloads the page, the checkbox appears checked but the layer is not rendered on the map.

## Root Cause

In the toggle restoration loop (`app.js`), the conditional only handled two cases:

```javascript
if (!checkbox.checked) {
  map.removeLayer(layerState[key]);
} else if (key === "population") {
  layerState.population.addTo(map);
}
```

The `congressFuture` layer is created **without** `.addTo(map)` (unlike boundary, house, senate, etc. which are added during creation). When the checkbox was restored as checked, neither branch executed — the layer was never added to the map.

## Fix

Replace the population-specific branch with a generic `map.hasLayer()` check:

```javascript
if (!checkbox.checked) {
  map.removeLayer(layerState[key]);
} else if (!map.hasLayer(layerState[key])) {
  layerState[key].addTo(map);
}
```

This handles all cases:
- **Unchecked** → remove from map
- **Checked but not on map** → add to map (fixes `congressFuture`, covers `population`)
- **Checked and already on map** → no-op (safe for tiles, boundary, house, senate, congressCurrent)

## Files Changed

- `public/app.js` — toggle restoration conditional
- `docs/app.js` — production mirror of same fix

## Test Coverage

- `tests/test-toggle-restore.spec.js` — 5 test cases covering:
  1. congressFuture checked in localStorage is rendered (the specific bug)
  2. All unchecked → none on map
  3. All checked → all on map
  4. Mixed states faithfully restored
  5. No saved state → HTML defaults apply

## Date

2026-02-05
