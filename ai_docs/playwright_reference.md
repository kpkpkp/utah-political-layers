# Playwright Testing Reference

Utah Political Layers uses Playwright for end-to-end testing of the map interface.

## Project Setup

### Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 8080 -d public',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
};
```

### Running Tests
```bash
# Install browsers (first time)
npx playwright install chromium

# Run all tests
npm test

# Run specific test file
npx playwright test tests/map.spec.js

# Run with headed browser (visible)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Test Structure

### Basic Test
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Utah Political Layers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for map to initialize
    await page.waitForSelector('.leaflet-container');
  });

  test('should display the map', async ({ page }) => {
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();
  });
});
```

## Map-Specific Testing

### Waiting for Map Load
```javascript
// Wait for tile layers to load
await page.waitForSelector('.leaflet-tile-loaded');

// Wait for GeoJSON layers
await page.waitForSelector('.leaflet-interactive');

// Wait for specific layer
await page.waitForFunction(() => {
  return window.map && window.map.hasLayer(window.houseLayer);
});
```

### Interacting with Map
```javascript
// Click on map at coordinates
await page.locator('.leaflet-container').click({
  position: { x: 400, y: 300 }
});

// Zoom in
await page.locator('.leaflet-control-zoom-in').click();

// Pan the map
await page.locator('.leaflet-container').dragTo(
  page.locator('.leaflet-container'),
  { targetPosition: { x: 200, y: 200 } }
);
```

### Testing Layer Controls
```javascript
// Toggle layer visibility
await page.locator('text=House Districts').click();

// Check layer checkbox
const checkbox = page.locator('input[type="checkbox"]').first();
await expect(checkbox).toBeChecked();
await checkbox.uncheck();
await expect(checkbox).not.toBeChecked();
```

### Testing Popups
```javascript
// Click a district and verify popup
await page.locator('.leaflet-interactive').first().click();
const popup = page.locator('.leaflet-popup-content');
await expect(popup).toBeVisible();
await expect(popup).toContainText('District');
```

## Assertions

### Visual Assertions
```javascript
// Screenshot comparison
await expect(page).toHaveScreenshot('map-loaded.png');

// Element screenshot
const legend = page.locator('.legend');
await expect(legend).toHaveScreenshot('legend.png');
```

### Element Assertions
```javascript
// Check element visibility
await expect(page.locator('.legend')).toBeVisible();

// Check text content
await expect(page.locator('.district-info')).toContainText('Rep.');

// Check CSS property
const layer = page.locator('.leaflet-interactive').first();
await expect(layer).toHaveCSS('fill', /rgb/);
```

### Count Assertions
```javascript
// Check number of districts
const districts = page.locator('.leaflet-interactive');
await expect(districts).toHaveCount(75); // House districts
```

## Common Patterns

### Testing District Colors
```javascript
test('republican districts are red', async ({ page }) => {
  const republicanDistrict = page.locator('[data-party="Republican"]').first();
  await expect(republicanDistrict).toHaveCSS('fill', 'rgb(232, 27, 35)');
});
```

### Testing Layer Toggle
```javascript
test('can toggle layer visibility', async ({ page }) => {
  const layer = page.locator('.house-layer');
  const toggle = page.locator('#house-toggle');

  await expect(layer).toBeVisible();
  await toggle.click();
  await expect(layer).not.toBeVisible();
  await toggle.click();
  await expect(layer).toBeVisible();
});
```

### Testing Mobile Responsiveness
```javascript
test.describe('mobile view', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('legend is collapsed', async ({ page }) => {
    await page.goto('/');
    const legend = page.locator('.legend');
    await expect(legend).toHaveClass(/collapsed/);
  });
});
```

## Debugging

### Console Logs
```javascript
page.on('console', msg => console.log(msg.text()));
```

### Network Requests
```javascript
page.on('request', request => {
  if (request.url().includes('arcgis')) {
    console.log('ArcGIS request:', request.url());
  }
});
```

### Pause Test
```javascript
test('debug test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Opens inspector
});
```

## CI Integration

### GitHub Actions
```yaml
- name: Run Playwright tests
  run: |
    npx playwright install chromium --with-deps
    npm test
  env:
    CI: true
```

### Artifacts
```yaml
- uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwright Locators](https://playwright.dev/docs/locators)
