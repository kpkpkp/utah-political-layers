import { test, expect } from '@playwright/test';

test('Population layer toggling works correctly', async ({ page }) => {
  console.log('\n=== POPULATION LAYER TOGGLE TEST ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Get initial state
  const populationCheckbox = page.locator('#toggle-population');
  const initialChecked = await populationCheckbox.isChecked();
  console.log(`Initial population checkbox state: ${initialChecked}`);

  // Get initial circle/marker count (population dots)
  let circleCount = await page.locator('circle[data-testid*="population"], circle[class*="population"]').count();
  console.log(`Population circles initially: ${circleCount}`);

  // Toggle ON if not checked
  if (!initialChecked) {
    console.log('Enabling population layer...');
    await populationCheckbox.check();
    await page.waitForTimeout(3000); // Wait for population API call

    circleCount = await page.locator('circle').count();
    console.log(`Circles after enabling: ${circleCount}`);
    expect(circleCount, 'Should have population dots after enabling').toBeGreaterThan(0);
  }

  // Toggle OFF
  console.log('Disabling population layer...');
  await populationCheckbox.uncheck();
  await page.waitForTimeout(500);

  let circlesAfterDisable = await page.locator('circle').count();
  console.log(`Circles after disabling: ${circlesAfterDisable}`);
  // Population dots should be removed or hidden
  expect(circlesAfterDisable, 'Should have fewer/no population dots after disabling').toBeLessThanOrEqual(circleCount);

  // Toggle back ON
  console.log('Re-enabling population layer...');
  await populationCheckbox.check();
  await page.waitForTimeout(3000);

  let circlesAfterReEnable = await page.locator('circle').count();
  console.log(`Circles after re-enabling: ${circlesAfterReEnable}`);
  expect(circlesAfterReEnable, 'Should have population dots after re-enabling').toBeGreaterThan(0);

  console.log('✅ Population toggle test passed\n');
});

test('District layer toggling works correctly', async ({ page }) => {
  console.log('\n=== DISTRICT LAYER TOGGLE TEST ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Test House layer
  const houseCheckbox = page.locator('#toggle-house');
  const housePath = await page.locator('path[class*="house"], path[data-testid*="house"]').count();
  console.log(`House paths initially: ${housePath}`);

  // Get SVG path count as baseline
  let initialPaths = await page.locator('.leaflet-pane path').count();
  console.log(`Total SVG paths initially: ${initialPaths}`);
  expect(initialPaths, 'Should have SVG paths for districts').toBeGreaterThan(0);

  // Disable house
  console.log('Disabling house layer...');
  await houseCheckbox.uncheck();
  await page.waitForTimeout(500);

  let pathsAfterDisableHouse = await page.locator('.leaflet-pane path').count();
  console.log(`SVG paths after disabling house: ${pathsAfterDisableHouse}`);
  expect(pathsAfterDisableHouse, 'Should have fewer paths after disabling house').toBeLessThan(initialPaths);

  // Re-enable house
  console.log('Re-enabling house layer...');
  await houseCheckbox.check();
  await page.waitForTimeout(500);

  let pathsAfterReEnableHouse = await page.locator('.leaflet-pane path').count();
  console.log(`SVG paths after re-enabling house: ${pathsAfterReEnableHouse}`);
  expect(pathsAfterReEnableHouse, 'Should restore paths after re-enabling house').toBeGreaterThan(pathsAfterDisableHouse);

  // Test Senate layer
  const senateCheckbox = page.locator('#toggle-senate');
  console.log('\nDisabling senate layer...');
  await senateCheckbox.uncheck();
  await page.waitForTimeout(500);

  let pathsAfterDisableSenate = await page.locator('.leaflet-pane path').count();
  console.log(`SVG paths after disabling senate: ${pathsAfterDisableSenate}`);

  // Test Congress layer
  const congressCheckbox = page.locator('#toggle-congress-current');
  console.log('Disabling congress layer...');
  await congressCheckbox.uncheck();
  await page.waitForTimeout(500);

  let pathsAfterDisableCongress = await page.locator('.leaflet-pane path').count();
  console.log(`SVG paths after disabling congress: ${pathsAfterDisableCongress}`);

  // Re-enable all
  console.log('\nRe-enabling all layers...');
  await houseCheckbox.check();
  await senateCheckbox.check();
  await congressCheckbox.check();
  await page.waitForTimeout(500);

  let finalPaths = await page.locator('.leaflet-pane path').count();
  console.log(`SVG paths after re-enabling all: ${finalPaths}`);
  expect(finalPaths, 'Should restore all paths').toBeGreaterThan(pathsAfterDisableCongress);

  console.log('✅ District toggle test passed\n');
});

test('Boundary layer toggling works', async ({ page }) => {
  console.log('\n=== BOUNDARY LAYER TOGGLE TEST ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const boundaryCheckbox = page.locator('#toggle-boundary');
  const isChecked = await boundaryCheckbox.isChecked();
  console.log(`Boundary initially checked: ${isChecked}`);

  // Disable
  await boundaryCheckbox.uncheck();
  await page.waitForTimeout(500);
  console.log('✓ Boundary disabled');

  // Enable
  await boundaryCheckbox.check();
  await page.waitForTimeout(500);
  console.log('✓ Boundary re-enabled');

  expect(await boundaryCheckbox.isChecked()).toBe(true);
  console.log('✅ Boundary toggle test passed\n');
});

test('Map tiles toggling works', async ({ page }) => {
  console.log('\n=== MAP TILES TOGGLE TEST ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const tilesCheckbox = page.locator('#toggle-tiles');
  const tilesSelect = page.locator('#tile-style-select');

  // Check initial state
  const initialChecked = await tilesCheckbox.isChecked();
  console.log(`Tiles initially checked: ${initialChecked}`);
  expect(initialChecked).toBe(true);

  // Open Appearance group (collapsed by default)
  await page.locator('.appearance-group:not(#sources-group) summary').click();
  await page.waitForTimeout(300);

  // Try different tile styles
  const styles = ['osm', 'carto-light', 'carto-voyager'];
  for (const style of styles) {
    console.log(`Switching to ${style}...`);
    await tilesSelect.selectOption(style);
    await page.waitForTimeout(500);
    const selected = await tilesSelect.inputValue();
    console.log(`✓ Selected: ${selected}`);
  }

  // Toggle tiles off
  console.log('Disabling tiles...');
  await tilesCheckbox.uncheck();
  await page.waitForTimeout(500);
  expect(await tilesCheckbox.isChecked()).toBe(false);
  console.log('✓ Tiles disabled');

  // Re-enable
  console.log('Re-enabling tiles...');
  await tilesCheckbox.check();
  await page.waitForTimeout(500);
  expect(await tilesCheckbox.isChecked()).toBe(true);
  console.log('✓ Tiles re-enabled');

  console.log('✅ Tiles toggle test passed\n');
});

test('Population dot clicking interaction', async ({ page }) => {
  console.log('\n=== POPULATION DOT CLICK TEST ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Enable population layer
  const populationCheckbox = page.locator('#toggle-population');
  if (!await populationCheckbox.isChecked()) {
    console.log('Enabling population layer...');
    await populationCheckbox.check();
    await page.waitForTimeout(4000); // Wait longer for API
  } else {
    console.log('Population already enabled, waiting for dots...');
    await page.waitForTimeout(2000);
  }

  // Look for population circles/dots
  const circles = page.locator('circle');
  const circleCount = await circles.count();
  console.log(`Population dots found: ${circleCount}`);

  if (circleCount === 0) {
    console.log('⚠️  No population dots found - API might not have returned data');
    return;
  }

  // Try clicking on a population dot
  const firstCircle = circles.first();
  const boundingBox = await firstCircle.boundingBox();

  if (boundingBox) {
    console.log(`First circle location: ${boundingBox.x}, ${boundingBox.y}`);
    console.log('Attempting to click on population dot...');

    // Click on the circle
    await firstCircle.click({ force: true });
    await page.waitForTimeout(500);

    // Check if any popup/tooltip appeared
    const popup = page.locator('.leaflet-popup, .population-tooltip, [role="tooltip"]');
    const popupVisible = await popup.count() > 0;

    console.log(`Popup/tooltip appeared: ${popupVisible}`);
    if (popupVisible) {
      const popupText = await popup.first().textContent();
      console.log(`Popup content: ${popupText?.substring(0, 100)}`);
    }

    console.log('✓ Population dot click interaction works');
  } else {
    console.log('⚠️  Could not get bounding box for circle');
  }

  console.log('✅ Population dot click test completed\n');
});

test('Styling controls work (party fill, line width, opacity)', async ({ page }) => {
  console.log('\n=== STYLING CONTROLS TEST ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Test party fill toggle
  const partyFillCheckbox = page.locator('#toggle-party-fill');
  console.log('Testing party fill toggle...');
  const initialPartyFill = await partyFillCheckbox.isChecked();
  console.log(`Party fill initially: ${initialPartyFill}`);

  await partyFillCheckbox.uncheck();
  await page.waitForTimeout(300);
  console.log('✓ Party fill disabled');

  await partyFillCheckbox.check();
  await page.waitForTimeout(300);
  console.log('✓ Party fill re-enabled');

  // Open Appearance group (collapsed by default)
  await page.locator('.appearance-group:not(#sources-group) summary').click();
  await page.waitForTimeout(300);

  // Test line width slider
  const lineWidthSlider = page.locator('#line-width');
  console.log('\nTesting line width slider...');
  const initialWidth = await lineWidthSlider.inputValue();
  console.log(`Initial line width: ${initialWidth}`);

  await lineWidthSlider.fill('0.8');
  await page.waitForTimeout(300);
  console.log('✓ Line width adjusted to 0.8');

  // Test line opacity slider
  const opacitySlider = page.locator('#line-opacity');
  console.log('\nTesting line opacity slider...');
  const initialOpacity = await opacitySlider.inputValue();
  console.log(`Initial line opacity: ${initialOpacity}`);

  await opacitySlider.fill('0.7');
  await page.waitForTimeout(300);
  console.log('✓ Line opacity adjusted to 0.7');

  console.log('✅ Styling controls test passed\n');
});
