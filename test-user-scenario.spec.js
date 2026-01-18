import { test, expect } from '@playwright/test';

test('Replicate user scenario - clear all then enable population only', async ({ page }) => {
  console.log('\n=== REPLICATING USER SCENARIO ===\n');

  // Track console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Population')) {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  console.log('1. Disabling all layers...');
  await page.locator('#toggle-boundary').uncheck();
  await page.locator('#toggle-tiles').uncheck();
  await page.locator('#toggle-house').uncheck();
  await page.locator('#toggle-senate').uncheck();
  await page.locator('#toggle-congress-current').uncheck();
  await page.locator('#toggle-congress-future').uncheck();

  // Make sure population is unchecked
  await page.locator('#toggle-population').uncheck();

  await page.waitForTimeout(1000);

  // Take screenshot with everything disabled
  await page.screenshot({ path: 'screenshots/user-test-1-all-off.png', fullPage: true });
  console.log('✅ Screenshot 1: All layers off');

  console.log('\n2. Enabling ONLY population layer...');
  await page.locator('#toggle-population').check();

  // Wait for loading to start
  await page.waitForTimeout(2000);

  // Monitor status updates
  for (let i = 0; i < 20; i++) {
    const status = await page.locator('#population-status').textContent();
    console.log(`   Status (${i+1}s): ${status}`);

    if (status.includes('ready') || status.includes('failed')) {
      break;
    }

    await page.waitForTimeout(1000);
  }

  const finalStatus = await page.locator('#population-status').textContent();
  console.log(`\n✅ Final status: ${finalStatus}`);

  // Check what's actually on the map
  const mapInfo = await page.evaluate(() => {
    const populationPane = document.querySelector('.leaflet-population-pane');
    const canvases = document.querySelectorAll('canvas');
    const circles = document.querySelectorAll('circle');

    return {
      populationPaneExists: !!populationPane,
      populationPaneChildren: populationPane?.children.length || 0,
      populationPaneHTML: populationPane?.innerHTML.substring(0, 300) || '',
      totalCanvases: canvases.length,
      totalCircles: circles.length,
      canvasInfo: Array.from(canvases).map(c => ({
        className: c.className,
        width: c.width,
        height: c.height,
        visible: c.offsetParent !== null
      }))
    };
  });

  console.log('\n=== MAP INSPECTION ===');
  console.log('Population pane exists:', mapInfo.populationPaneExists);
  console.log('Population pane children:', mapInfo.populationPaneChildren);
  console.log('Total canvases:', mapInfo.totalCanvases);
  console.log('Total circles:', mapInfo.totalCircles);
  console.log('Canvas details:', JSON.stringify(mapInfo.canvasInfo, null, 2));

  if (mapInfo.populationPaneHTML) {
    console.log('Population pane HTML:', mapInfo.populationPaneHTML);
  }

  // Take full page screenshot
  await page.screenshot({ path: 'screenshots/user-test-2-population-only.png', fullPage: true });
  console.log('\n✅ Screenshot 2: Population layer only (full page)');

  // Also take a zoomed in view of just the map
  const mapElement = await page.locator('#map');
  await mapElement.screenshot({ path: 'screenshots/user-test-3-map-only.png' });
  console.log('✅ Screenshot 3: Map area only');

  // Try zooming in to Salt Lake City area where population should be dense
  console.log('\n3. Zooming to Salt Lake City area...');
  await page.evaluate(() => {
    // Salt Lake City coordinates: 40.7608° N, 111.8910° W
    map.setView([40.7608, -111.8910], 11);
  });

  await page.waitForTimeout(2000);
  await mapElement.screenshot({ path: 'screenshots/user-test-4-zoomed-slc.png' });
  console.log('✅ Screenshot 4: Zoomed to Salt Lake City');

  // Check if markers are being added to the layer
  const layerInfo = await page.evaluate(() => {
    let markerCount = 0;
    if (window.populationLayer && window.populationLayer.eachLayer) {
      window.populationLayer.eachLayer(() => markerCount++);
    }
    return { markerCount };
  });

  console.log('\n=== LAYER INFO ===');
  console.log('Markers in populationLayer:', layerInfo.markerCount);

  console.log('\n=== FINAL SUMMARY ===');
  console.log(`Status: ${finalStatus}`);
  console.log(`Markers loaded: ${layerInfo.markerCount}`);
  console.log(`Visible elements: ${mapInfo.populationPaneChildren} in pane, ${mapInfo.totalCanvases} canvases, ${mapInfo.totalCircles} circles`);
});
