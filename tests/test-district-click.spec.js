import { test } from '@playwright/test';

test('Test district click functionality', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('Testing district clicks...\n');

  // Test with population OFF
  console.log('1. Testing with Population layer OFF');
  await page.locator('#toggle-population').uncheck();
  await page.waitForTimeout(1000);

  // Click on a known district area (center of Utah)
  const mapBounds = await page.locator('#map').boundingBox();
  const clickX = mapBounds.x + mapBounds.width / 2;
  const clickY = mapBounds.y + mapBounds.height / 2;

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);

  const popup1 = await page.locator('.leaflet-popup-content').textContent().catch(() => null);
  console.log(`   Popup shown: ${popup1 ? 'YES' : 'NO'}`);
  if (popup1) console.log(`   Content: ${popup1}`);

  // Close popup
  if (popup1) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Test with population ON
  console.log('\n2. Testing with Population layer ON');
  await page.locator('#toggle-population').check();
  await page.waitForTimeout(3000);

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);

  const popup2 = await page.locator('.leaflet-popup-content').textContent().catch(() => null);
  console.log(`   Popup shown: ${popup2 ? 'YES' : 'NO'}`);
  if (popup2) console.log(`   Content: ${popup2}`);

  // Check z-indexes
  const zIndexInfo = await page.evaluate(() => {
    const populationPane = document.querySelector('.leaflet-population-pane');
    const overlayPane = document.querySelector('.leaflet-overlay-pane');

    return {
      populationZ: populationPane ? window.getComputedStyle(populationPane).zIndex : 'not found',
      overlayZ: overlayPane ? window.getComputedStyle(overlayPane).zIndex : 'not found',
      populationPointerEvents: populationPane ? window.getComputedStyle(populationPane).pointerEvents : 'not found'
    };
  });

  console.log('\n=== Z-INDEX INFO ===');
  console.log(`Population pane z-index: ${zIndexInfo.populationZ}`);
  console.log(`Overlay pane z-index: ${zIndexInfo.overlayZ}`);
  console.log(`Population pointer-events: ${zIndexInfo.populationPointerEvents}`);

  await page.screenshot({ path: 'screenshots/district-click-test.png' });
});
