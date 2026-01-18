import { test } from '@playwright/test';

test('Test hover and click functionality', async ({ page }) => {
  console.log('\n=== TESTING HOVER & CLICK ===\n');

  await page.goto('http://localhost:8080/');
  await page.waitForTimeout(2000);

  // Enable only tiles and population
  await page.locator('#toggle-boundary').uncheck();
  await page.locator('#toggle-house').uncheck();
  await page.locator('#toggle-senate').uncheck();
  await page.locator('#toggle-congress-current').uncheck();
  await page.locator('#toggle-congress-future').uncheck();

  await page.locator('#toggle-tiles').check();
  await page.locator('#toggle-population').check();

  console.log('Waiting for population to load...');

  // Wait for loading
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const status = await page.locator('#population-status').textContent();
    if (status.includes('ready')) {
      console.log(`✅ ${status}`);
      break;
    }
  }

  // Zoom to Salt Lake City
  console.log('\nZooming to Salt Lake City...');
  await page.evaluate(() => {
    map.setView([40.7608, -111.8910], 13);
  });
  await page.waitForTimeout(2000);

  console.log('\nTesting hover functionality...');

  // Find a population marker and hover over it
  const canvas = page.locator('.leaflet-population-pane canvas').first();

  // Hover near center where there should be markers
  await canvas.hover({ position: { x: 400, y: 300 } });
  await page.waitForTimeout(500);

  // Check if tooltip appears
  const tooltip = page.locator('.population-tooltip');
  const tooltipVisible = await tooltip.isVisible().catch(() => false);

  if (tooltipVisible) {
    const tooltipText = await tooltip.textContent();
    console.log(`✅ Hover tooltip appeared: ${tooltipText}`);
  } else {
    console.log('⚠️  Tooltip not visible (might need to hover over actual dot)');
  }

  console.log('\nTesting click functionality...');

  // Click to highlight boundary
  await canvas.click({ position: { x: 400, y: 300 } });
  await page.waitForTimeout(500);

  // Check if outline appears
  const outlinePane = await page.evaluate(() => {
    const pane = document.querySelector('.leaflet-populationOutline-pane');
    return {
      exists: !!pane,
      childCount: pane?.children.length || 0
    };
  });

  if (outlinePane.exists && outlinePane.childCount > 0) {
    console.log(`✅ Click highlighted census block boundary`);
  } else {
    console.log('⚠️  Boundary highlight not detected');
  }

  // Take screenshot
  await page.screenshot({ path: 'screenshots/hover-click-test.png', fullPage: true });
  console.log('\n📸 Screenshot saved: screenshots/hover-click-test.png');

  console.log('\n=== TEST COMPLETE ===');
  console.log('Now reload the page in Chrome and try:');
  console.log('  • Hover over red dots → See population info');
  console.log('  • Click a dot → Highlight census block boundary');
});
