import { test } from '@playwright/test';

test('Simple click test on districts', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  // Wait for layers to actually load
  await page.waitForTimeout(2000);

  // Check if layers are loaded
  const layerInfo = await page.evaluate(() => {
    return {
      hasHouse: window.layerState?.house ? true : false,
      hasSenate: window.layerState?.senate ? true : false,
      houseOnMap: window.layerState?.house && window.map.hasLayer(window.layerState.house),
      senateOnMap: window.layerState?.senate && window.map.hasLayer(window.layerState.senate)
    };
  });
  console.log('Layer status:', layerInfo);

  console.log('Clicking on map center...\n');

  const mapBounds = await page.locator('#map').boundingBox();
  const clickX = mapBounds.x + mapBounds.width / 2;
  const clickY = mapBounds.y + mapBounds.height / 2;

  console.log('Test 1: Population OFF');
  await page.locator('#toggle-population').uncheck();
  await page.waitForTimeout(1000);

  // Check pane z-indexes and pointer-events
  const paneInfo = await page.evaluate(() => {
    const panes = {
      overlay: document.querySelector('.leaflet-overlay-pane'),
      population: document.querySelector('.leaflet-populationPane'),
      map: document.querySelector('#map')
    };
    return {
      overlayZIndex: panes.overlay ? getComputedStyle(panes.overlay).zIndex : 'not found',
      overlayPointerEvents: panes.overlay ? getComputedStyle(panes.overlay).pointerEvents : 'not found',
      populationZIndex: panes.population ? getComputedStyle(panes.population).zIndex : 'not found',
      populationPointerEvents: panes.population ? getComputedStyle(panes.population).pointerEvents : 'not found',
      mapPointerEvents: panes.map ? getComputedStyle(panes.map).pointerEvents : 'not found'
    };
  });
  console.log('Pane info:', paneInfo);

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(2000);

  const popup1Exists = await page.locator('.leaflet-popup').count();
  const popup1Text = popup1Exists > 0 ? await page.locator('.leaflet-popup-content').textContent() : null;

  console.log(`  Popup shown: ${popup1Exists > 0 ? 'YES' : 'NO'}`);
  if (popup1Text) console.log(`  Content: ${popup1Text.trim()}`);

  // Close popup if it exists
  if (popup1Exists > 0) {
    await page.locator('.leaflet-popup-close-button').click();
    await page.waitForTimeout(500);
  }

  console.log('\nTest 2: Population ON (checking for 5 seconds)');
  await page.locator('#toggle-population').check();
  await page.waitForTimeout(5000);

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(2000);

  const popup2Exists = await page.locator('.leaflet-popup').count();
  const popup2Text = popup2Exists > 0 ? await page.locator('.leaflet-popup-content').textContent() : null;

  console.log(`  Popup shown: ${popup2Exists > 0 ? 'YES' : 'NO'}`);
  if (popup2Text) console.log(`  Content: ${popup2Text.trim()}`);

  await page.screenshot({ path: 'screenshots/click-simple-test.png' });

  if (popup1Exists > 0 && popup2Exists > 0) {
    console.log('\n✅ District clicking works with and without population!');
  } else if (popup1Exists > 0) {
    console.log('\n⚠️  Districts clickable WITHOUT population, but NOT with population enabled');
  } else {
    console.log('\n❌ Districts not clickable at all');
  }
});
