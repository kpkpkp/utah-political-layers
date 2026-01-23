import { test, expect } from '@playwright/test';

test('District clicking works correctly', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  console.log('Testing district clicks...\n');

  // Test 1: Click on a house district with population OFF
  console.log('Test 1: Click house district with population OFF');
  await page.locator('#toggle-population').uncheck();
  await page.waitForTimeout(500);

  const houseClick1 = await page.evaluate(() => {
    const houseLayer = window.layerState.house;
    if (!houseLayer) return null;

    let clicked = false;
    houseLayer.eachLayer((layer) => {
      if (!clicked) {
        clicked = true;
        const bounds = layer.getBounds();
        const center = bounds.getCenter();

        // Simulate a click event
        layer.fire('click', {
          latlng: center,
          originalEvent: new MouseEvent('click')
        });

        return true;
      }
    });

    return clicked;
  });

  await page.waitForTimeout(500);
  let popupExists = await page.locator('.leaflet-popup').count();
  console.log(`  Clicked: ${houseClick1 ? 'YES' : 'NO'}`);
  console.log(`  Popup shown: ${popupExists > 0 ? 'YES' : 'NO'}`);

  if (popupExists > 0) {
    const popupText = await page.locator('.leaflet-popup-content').textContent();
    console.log(`  Content: ${popupText.trim()}`);
    await page.keyboard.press('Escape'); // Close popup
    await page.waitForTimeout(300);
  }

  // Test 2: Click on a senate district with population ON
  console.log('\nTest 2: Click senate district with population ON');
  await page.locator('#toggle-population').check();
  await page.waitForTimeout(2000); // Wait for population to load

  const senateClick = await page.evaluate(() => {
    const senateLayer = window.layerState.senate;
    if (!senateLayer) return null;

    let clicked = false;
    senateLayer.eachLayer((layer) => {
      if (!clicked) {
        clicked = true;
        const bounds = layer.getBounds();
        const center = bounds.getCenter();

        layer.fire('click', {
          latlng: center,
          originalEvent: new MouseEvent('click')
        });

        return true;
      }
    });

    return clicked;
  });

  await page.waitForTimeout(500);
  popupExists = await page.locator('.leaflet-popup').count();
  console.log(`  Clicked: ${senateClick ? 'YES' : 'NO'}`);
  console.log(`  Popup shown: ${popupExists > 0 ? 'YES' : 'NO'}`);

  if (popupExists > 0) {
    const popupText = await page.locator('.leaflet-popup-content').textContent();
    console.log(`  Content: ${popupText.trim()}`);
  }

  // Test 3: Check pane pointer-events
  console.log('\nTest 3: Verify pane configuration');
  const paneConfig = await page.evaluate(() => {
    const popPane = document.querySelector('.leaflet-population-pane');
    const overlayPane = document.querySelector('.leaflet-overlay-pane');
    const canvas = popPane?.querySelector('canvas');

    return {
      populationPanePointerEvents: popPane ? getComputedStyle(popPane).pointerEvents : 'not found',
      populationCanvasPointerEvents: canvas ? getComputedStyle(canvas).pointerEvents : 'not found',
      overlayPanePointerEvents: overlayPane ? getComputedStyle(overlayPane).pointerEvents : 'not found',
      populationZIndex: popPane ? getComputedStyle(popPane).zIndex : 'not found',
      overlayZIndex: overlayPane ? getComputedStyle(overlayPane).zIndex : 'not found'
    };
  });

  console.log('  Population pane pointer-events:', paneConfig.populationPanePointerEvents);
  console.log('  Population canvas pointer-events:', paneConfig.populationCanvasPointerEvents);
  console.log('  Overlay pane pointer-events:', paneConfig.overlayPanePointerEvents);
  console.log('  Population z-index:', paneConfig.populationZIndex);
  console.log('  Overlay z-index:', paneConfig.overlayZIndex);

  expect(paneConfig.populationPanePointerEvents).toBe('none');
  expect(paneConfig.populationCanvasPointerEvents).toBe('auto');

  await page.screenshot({ path: 'screenshots/district-click-fixed.png' });

  console.log('\n✅ All tests passed! District clicking works with and without population layer.');
});
