# Feature: Background Population Data Loading

## User Story
As a user, I want the population data to load automatically in the background when the page loads, so that when I enable the Population layer, the dots appear instantly instead of waiting for a multi-second data fetch.

## Current Behavior
- Population data only loads when user clicks the Population checkbox
- Loading takes 5-10 seconds (44,000+ census blocks via paginated REST API)
- User sees "Population: loading..." status and must wait
- If user unchecks and re-checks, data is already cached in memory

## Desired Behavior
- Population data starts loading immediately on page init
- Loading happens silently in background (no status indicator initially)
- When user enables Population layer, dots appear instantly (if load complete)
- If user enables layer before load completes, show loading status
- No change to visual behavior - just faster perceived performance

## Technical Design

### Architecture
The change decouples **data loading** from **layer visibility**:

```
CURRENT FLOW:
  Checkbox checked → Add layer to map → Load data → Show dots

NEW FLOW:
  Page init → Load data in background (independent)
  Checkbox checked → Add layer to map → Show dots (instant if loaded)
```

### State Management
Keep existing `populationState` object:
```javascript
const populationState = {
  loaded: false,    // true when all data fetched
  loading: false,   // true during fetch
  maxDensity: 1,
  totalCount: 0
};
```

### Key Changes

#### 1. Add background load call in init() (~line 1276)
```javascript
// Start loading population data in background
// Don't wait for checkbox - load immediately for instant toggle
loadPopulationPoints().catch((error) => {
  console.error('Background population load failed:', error);
});
```

#### 2. Modify loadPopulationPoints() to not require layer on map
- Remove assumption that layer is already added to map
- Data loads into `populationLayer` LayerGroup regardless
- Layer gets added to map separately when checkbox is checked

#### 3. Update status indicator behavior
- During background load: No visible status (or subtle indicator)
- If checkbox enabled during load: Show status
- When load complete: Update status only if layer is visible

#### 4. Modify attachToggle for population
```javascript
if (layerKey === "population") {
  if (populationState.loaded) {
    // Data ready - instant display
    layer.addTo(map);
  } else if (populationState.loading) {
    // Still loading - add layer and show status
    layer.addTo(map);
    showPopulationLoadingStatus();
  } else {
    // Not started (shouldn't happen with background load)
    layer.addTo(map);
    loadPopulationPoints();
  }
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `public/app.js` | Add background load call, modify toggle handler |
| `docs/app.js` | Same changes (deployed version) |
| `streamlit_app.py` | Same changes (inlined JavaScript) |

## Testing Strategy

### E2E Tests to Create

1. **test-background-population-load.spec.js**
   - Verify population loading starts on page init
   - Verify `populationState.loading` becomes true early
   - Verify data loads without checkbox being checked
   - Verify checkbox toggle shows dots instantly when load complete

2. **test-population-toggle-during-load.spec.js**
   - Enable population checkbox before load completes
   - Verify loading status shows
   - Verify dots appear when load completes
   - Verify no duplicate load attempts

3. **test-population-instant-toggle.spec.js**
   - Wait for background load to complete
   - Toggle population checkbox
   - Verify dots appear in <100ms (instant)

### Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Page loads, wait, enable population | Instant dot display |
| Page loads, immediately enable population | Shows loading, then dots |
| Enable population, disable, re-enable | Instant both times after first load |
| Page loads with population pre-enabled | Dots appear as data loads |

## Implementation Plan (TAC-8.5)

### Phase 1: Planning (Opus) ✓
- Analyze current code flow
- Design background loading approach
- Create this spec document

### Phase 2: Implementation (Sonnet)
- Modify `public/app.js` with background load
- Update toggle handler logic
- Ensure status indicator works correctly

### Phase 3: Testing (Haiku)
- Create E2E test files
- Test background load behavior
- Test toggle timing scenarios

### Phase 4: Sync & Integration (Sonnet)
- Sync changes to `docs/app.js`
- Sync changes to `streamlit_app.py`
- Verify all three deployments work

### Phase 5: Verification (Opus)
- Run full E2E test suite
- Manual testing
- Commit and push

## Rollback Plan
If background loading causes issues:
1. Remove the background `loadPopulationPoints()` call from init
2. Revert to on-demand loading (current behavior)
3. The toggle handler already has fallback to load if not loaded

## Performance Considerations
- Background load uses same chunked rendering (400 markers at a time)
- Uses `requestAnimationFrame` to not block UI
- localStorage cache still works for subsequent page loads
- No additional network requests vs current behavior

## Mobile/Responsive Considerations
- No UI changes required
- Background load works same on mobile
- May want to delay background load on slow connections (future enhancement)
