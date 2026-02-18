# Color Configuration E2E Tests

## Overview

The `test-color-config.spec.js` file contains comprehensive end-to-end tests for the Utah Political Layers color configuration feature. These tests verify that users can customize party fill colors and district outline colors, and that their preferences persist across browser sessions.

## Test Coverage

### 1. Default Color Loading
**Test:** `should load color pickers with default values`

Verifies that all 8 color picker inputs load with their default values:

**Party Colors:**
- Republican: `#d73027` (red)
- Democratic: `#4575b4` (blue)
- Forward: `#8b5cf6` (purple)
- Other: `#9e9e9e` (gray)

**Outline Colors:**
- State House: `#ff6f00` (orange)
- State Senate: `#00b0ff` (cyan)
- Federal House (current): `#8e24aa` (purple)
- Federal House (coming): `#43a047` (green)

### 2. Party Color Persistence
**Test:** `should update and persist party color changes`

Validates the complete flow for changing a party color:
1. User changes a party color via color picker
2. Color picker UI updates immediately
3. Change is saved to localStorage under `utah-color-config` key
4. `window.getColorConfig()` returns the updated value
5. Map re-renders with new colors

### 3. Outline Color Persistence
**Test:** `should update and persist outline color changes`

Validates the complete flow for changing a district outline color:
1. User changes an outline color via color picker
2. Color picker UI updates immediately
3. Change is saved to localStorage under `utah-color-config` key
4. `window.getColorConfig()` returns the updated value
5. Map re-renders with new colors

### 4. Reset Functionality
**Test:** `should reset all colors to defaults when reset button is clicked`

Verifies the reset button behavior:
1. Changes multiple colors (both party and outline)
2. Confirms changes were persisted
3. Clicks the "Reset Colors" button (`#reset-colors-btn`)
4. Verifies localStorage is cleared
5. Confirms all color pickers show default values
6. Validates `window.getColorConfig()` returns defaults

### 5. Cross-Session Persistence
**Test:** `should persist colors across page reload`

Tests the most critical user requirement - color preferences surviving page refreshes:
1. Sets all 8 color pickers to custom values
2. Verifies localStorage contains custom values
3. Reloads the page
4. Confirms localStorage still has custom values
5. Validates all color pickers display the custom values after reload

### 6. JavaScript API Exposure
**Test:** `should expose getColorConfig and updateColorConfig API`

Validates the public API exposed for programmatic access:
- `window.getColorConfig()` - Returns current color configuration
- `window.updateColorConfig(updates)` - Updates colors programmatically

This API enables:
- Browser console debugging
- Third-party integrations
- Automated testing
- Advanced user customizations

### 7. Rapid Change Handling
**Test:** `should handle multiple rapid color changes`

Stress tests the color update mechanism:
1. Rapidly changes the same color picker 5 times
2. Verifies the final value is correctly persisted
3. Ensures no intermediate values are lost or corrupted

### 8. Isolation Testing
**Test:** `should maintain other colors when changing one color`

Validates that changing one color doesn't affect others:
1. Records initial configuration
2. Changes only one color
3. Verifies all other 7 colors remain unchanged

### 9. Visual Regression Capture
**Test:** `should take screenshots of color picker UI`

Creates visual artifacts for manual inspection:
- `screenshots/color-pickers-default.png` - Default state
- `screenshots/color-pickers-custom.png` - With custom colors
- `screenshots/color-pickers-reset.png` - After reset

## Running the Tests

### Run all color config tests
```bash
npx playwright test tests/test-color-config.spec.js
```

### Run a specific test
```bash
npx playwright test tests/test-color-config.spec.js -g "should load color pickers"
```

### Run in headed mode (see browser)
```bash
npx playwright test tests/test-color-config.spec.js --headed
```

### Run with debug mode
```bash
npx playwright test tests/test-color-config.spec.js --debug
```

### Generate HTML report
```bash
npx playwright test tests/test-color-config.spec.js --reporter=html
npx playwright show-report
```

## Test Architecture

### Storage Key
All color configuration is stored under the localStorage key:
```javascript
'utah-color-config'
```

### Data Structure
```javascript
{
  party: {
    republican: "#d73027",
    democratic: "#4575b4",
    forward: "#8b5cf6",
    other: "#9e9e9e"
  },
  outline: {
    house: "#ff6f00",
    senate: "#00b0ff",
    congressCurrent: "#8e24aa",
    congressFuture: "#43a047"
  }
}
```

### HTML Elements Tested
**Party Color Pickers:**
- `#party-color-republican`
- `#party-color-democratic`
- `#party-color-forward`
- `#party-color-other`

**Outline Color Pickers:**
- `#outline-color-house`
- `#outline-color-senate`
- `#outline-color-congress-current`
- `#outline-color-congress-future`

**Control Buttons:**
- `#reset-colors-btn`

### JavaScript API
**Get current configuration:**
```javascript
const config = window.getColorConfig();
console.log(config.party.republican); // "#d73027"
```

**Update configuration:**
```javascript
window.updateColorConfig({
  party: { republican: "#ff0000" }
});
```

## Test Patterns Used

### 1. Clean State
Each test starts with a fresh localStorage state:
```javascript
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
});
```

### 2. Color Value Verification
Tests validate both UI state and storage state:
```javascript
// Check UI
const pickerValue = await picker.inputValue();
expect(pickerValue).toBe('#ff0000');

// Check storage
const stored = await page.evaluate(() => {
  return JSON.parse(localStorage.getItem('utah-color-config'));
});
expect(stored.party.republican).toBe('#ff0000');
```

### 3. Cross-Reload Persistence
Critical pattern for testing localStorage persistence:
```javascript
// Set value
await picker.fill('#ff0000');

// Reload page
await page.reload();

// Verify value persisted
expect(await picker.inputValue()).toBe('#ff0000');
```

## Debugging Failed Tests

### Check Screenshots
Failed tests automatically create screenshots in `screenshots/` directory. Look for:
- Incorrect color picker values
- Missing UI elements
- Layout issues

### Check Browser Console
Tests log to console. Run with `--headed` to see:
```bash
npx playwright test tests/test-color-config.spec.js --headed
```

### Inspect localStorage
Add debug output to see storage state:
```javascript
test('debug storage', async ({ page }) => {
  const storage = await page.evaluate(() => {
    return {
      colorConfig: localStorage.getItem('utah-color-config'),
      allKeys: Object.keys(localStorage)
    };
  });
  console.log(storage);
});
```

### Check Element Selectors
Verify elements exist:
```javascript
const picker = page.locator('#party-color-republican');
console.log('Exists:', await picker.count()); // Should be 1
```

## Common Issues

### Issue: Test timeout waiting for elements
**Solution:** Increase timeout or verify element IDs match
```javascript
await page.waitForSelector('#controls', { timeout: 30000 });
```

### Issue: Colors not persisting after reload
**Solution:** Check that localStorage isn't being cleared by other code or browser settings

### Issue: Color picker values don't match expected
**Solution:** Some browsers normalize hex colors (e.g., `#FF0000` → `#ff0000`). Tests use lowercase.

### Issue: Screenshots directory doesn't exist
**Solution:** Create it manually:
```bash
mkdir -p screenshots
```

## Integration with CI/CD

These tests are designed to run in headless mode on CI servers:

```yaml
# .github/workflows/test.yml
- name: Run Color Config Tests
  run: npx playwright test tests/test-color-config.spec.js
```

## Future Enhancements

Potential additions to this test suite:

1. **Color Format Validation** - Verify invalid hex codes are rejected
2. **Accessibility Testing** - Check color contrast ratios
3. **Visual Regression** - Automated screenshot comparison
4. **Performance Testing** - Measure color update latency
5. **Import/Export** - Test color config export/import features
6. **Color Themes** - Test predefined color theme switching

## Related Files

- **Implementation:** `/public/app.js` (lines 149-1128)
- **HTML Structure:** `/public/index.html` (color picker inputs)
- **Styles:** `/public/styles.css` (color picker styling)
- **Feature Spec:** `/specs/feature-map-enhancements.md`

## Test Metrics

- **Total Tests:** 9
- **Coverage Areas:** 8 color pickers + 1 reset button + 2 API functions
- **Test Duration:** ~15-20 seconds (all tests)
- **Screenshots Generated:** 3

## Maintainer Notes

When modifying the color configuration feature:

1. **Update default colors:** Modify `DEFAULT_COLORS` constant in test file
2. **Add new color pickers:** Add to appropriate test array (`partyPickers` or `outlinePickers`)
3. **Change element IDs:** Update all relevant locator selectors
4. **Modify storage key:** Update `COLOR_CONFIG_KEY` constant
5. **Change reset behavior:** Update reset test expectations

## License

Same as main project (Utah Political Layers).
