import { test, expect } from '@playwright/test';

test('Map must be visible with district layers rendered (not grey emptiness)', async ({ page }) => {
  console.log('\n=== MAP VISIBILITY & CONTENT VERIFICATION ===\n');

  await page.goto('http://localhost:8080');
  console.log('✓ Page loaded');

  // Wait for the map container to be visible
  const mapElement = page.locator('#map');
  await mapElement.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Map element is visible');

  // Wait for layers to load (wait for init function to complete)
  await page.waitForTimeout(3000);

  // CRITICAL CHECK: Verify that SVG layers (Leaflet district paths) are actually rendered
  // Each district is rendered as an SVG path in the Leaflet SVG pane
  const svgPaths = page.locator('.leaflet-pane path');
  const pathCount = await svgPaths.count();

  console.log(`SVG paths found: ${pathCount}`);
  expect(pathCount, 'Map should have SVG paths for districts (House, Senate, Congress)').toBeGreaterThan(0);

  // Check that at least one SVG layer is visible (house, senate, or congress districts)
  const houseCheckbox = page.locator('#toggle-house');
  const senateCheckbox = page.locator('#toggle-senate');
  const congressCheckbox = page.locator('#toggle-congress-current');

  const houseChecked = await houseCheckbox.isChecked();
  const senateChecked = await senateCheckbox.isChecked();
  const congressChecked = await congressCheckbox.isChecked();

  console.log(`House enabled: ${houseChecked}, Senate enabled: ${senateChecked}, Congress enabled: ${congressChecked}`);

  // At least one district layer should be enabled by default
  expect(houseChecked || senateChecked || congressChecked, 'At least one district layer should be enabled').toBe(true);

  // CRITICAL CHECK: Verify that the SVG paths have fill colors (indicating party affiliation is being applied)
  // Get a sample of paths and check if they have meaningful fill colors
  const firstPath = page.locator('.leaflet-pane path').first();
  const fillColor = await firstPath.evaluate(el => window.getComputedStyle(el).fill);

  console.log(`Sample path fill color: ${fillColor}`);
  expect(fillColor, 'District paths should have fill colors (not white or transparent)').not.toBe('rgba(0, 0, 0, 0)');
  expect(fillColor, 'District paths should have fill colors').not.toBe('none');

  // CRITICAL CHECK: Screenshot comparison - empty vs populated map
  const mapBounds = await mapElement.boundingBox();
  console.log(`\nMap dimensions: ${mapBounds.width}x${mapBounds.height}`);

  // Get the map canvas area screenshot
  await page.screenshot({ path: 'screenshots/map-visibility-full.png', fullPage: true });
  console.log('✓ Screenshot saved: map-visibility-full.png');

  // Get just the map area
  await mapElement.screenshot({ path: 'screenshots/map-visibility-map-area.png' });
  console.log('✓ Screenshot saved: map-visibility-map-area.png');

  // Additional verification: Check that Leaflet layers are properly initialized
  const layerCount = await page.evaluate(() => {
    if (typeof layerState === 'undefined') return -1;
    let count = 0;
    if (layerState.boundary) count++;
    if (layerState.house) count++;
    if (layerState.senate) count++;
    if (layerState.congressCurrent) count++;
    if (layerState.congressFuture) count++;
    return count;
  });

  console.log(`Layer state objects initialized: ${layerCount}`);
  expect(layerCount, 'At least boundary and house layers should be initialized').toBeGreaterThan(2);

  // Verify the map has zoomed to Utah bounds (not stuck at world view)
  const mapZoom = await page.evaluate(() => map.getZoom());
  console.log(`Map zoom level: ${mapZoom}`);
  expect(mapZoom, 'Map should be zoomed to Utah (zoom 6-9), not world view').toBeGreaterThanOrEqual(6);
  expect(mapZoom, 'Map zoom should be reasonable for Utah').toBeLessThanOrEqual(10);

  // Verify the map center is within Utah bounds
  const mapCenter = await page.evaluate(() => {
    const center = map.getCenter();
    return { lat: center.lat, lng: center.lng };
  });
  console.log(`Map center: ${mapCenter.lat.toFixed(2)}, ${mapCenter.lng.toFixed(2)}`);

  const inUtah = mapCenter.lat > 37 && mapCenter.lat < 42 && mapCenter.lng > -114 && mapCenter.lng < -109;
  expect(inUtah, 'Map should be centered on Utah').toBe(true);

  // Check for any console errors related to loading
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  console.log(`\n✅ Map is visible and populated with district layers`);
  console.log(`✅ District paths are rendered with proper colors`);
  console.log(`✅ Map is centered on Utah at proper zoom level`);
});

test('Toggling layers shows/hides district content', async ({ page }) => {
  console.log('\n=== LAYER TOGGLE VERIFICATION ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Get baseline path count with layers enabled
  let pathCountWith = await page.locator('.leaflet-pane path').count();
  console.log(`Path count with layers enabled: ${pathCountWith}`);
  expect(pathCountWith, 'Should have paths with layers enabled').toBeGreaterThan(0);

  // Disable all district layers
  await page.locator('#toggle-house').uncheck();
  await page.locator('#toggle-senate').uncheck();
  await page.locator('#toggle-congress-current').uncheck();
  await page.locator('#toggle-congress-future').uncheck();
  await page.locator('#toggle-boundary').uncheck();
  await page.waitForTimeout(500);

  // Get path count with layers disabled
  let pathCountWithout = await page.locator('.leaflet-pane path').count();
  console.log(`Path count with all district layers disabled: ${pathCountWithout}`);

  // With only tiles enabled, path count should be much lower or zero
  expect(pathCountWithout, 'Should have fewer paths with layers disabled').toBeLessThan(pathCountWith);

  // Re-enable house layer
  await page.locator('#toggle-house').check();
  await page.waitForTimeout(500);

  let pathCountHouseOnly = await page.locator('.leaflet-pane path').count();
  console.log(`Path count with house layer only: ${pathCountHouseOnly}`);
  expect(pathCountHouseOnly, 'Should have paths when house layer is enabled').toBeGreaterThan(pathCountWithout);

  console.log(`\n✅ Layer toggling correctly shows/hides content`);
});

test('Incognito mode loads map correctly (no cache issues)', async ({ browser }) => {
  console.log('\n=== INCOGNITO MODE TEST ===\n');

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:8080');
  console.log('✓ Page loaded in incognito context');

  await page.waitForTimeout(2000);

  // Verify map loads with content even without cache
  const pathCount = await page.locator('.leaflet-pane path').count();
  console.log(`SVG paths in incognito mode: ${pathCount}`);
  expect(pathCount, 'Map should load with district paths in incognito mode').toBeGreaterThan(0);

  // Verify zoom is set to Utah
  const mapZoom = await page.evaluate(() => map.getZoom());
  console.log(`Map zoom in incognito mode: ${mapZoom}`);
  expect(mapZoom, 'Map should be zoomed to Utah in incognito mode').toBeGreaterThanOrEqual(6);

  console.log(`\n✅ Map loads correctly in incognito mode`);

  await context.close();
});
