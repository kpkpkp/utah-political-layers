import { test } from '@playwright/test';

test('Population loads correctly when checkbox is initially checked', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Leaflet') && !text.includes('Download')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('✓ Map loaded');

  // Simulate the scenario: check Population box, reload, and verify it loads automatically
  console.log('\n1. Checking population toggle...');
  const popToggle = page.locator('#toggle-population');
  await popToggle.check();

  // Wait for initial load
  await page.waitForTimeout(5000);

  const firstLoadStatus = await page.evaluate(() => {
    const statusEl = document.getElementById('population-status');
    return {
      text: statusEl?.textContent || '',
      markerCount: window.populationLayer?.getLayers().length || 0,
      layerOnMap: window.map && window.populationLayer ? window.map.hasLayer(window.populationLayer) : false
    };
  });

  console.log(`   Status: ${firstLoadStatus.text}`);
  console.log(`   Markers: ${firstLoadStatus.markerCount}`);
  console.log(`   On map: ${firstLoadStatus.layerOnMap}`);

  // Now reload the page (localStorage should restore the checked state)
  console.log('\n2. Reloading page (Population should auto-load)...');
  await page.reload();
  await page.waitForSelector('#map', { timeout: 5000 });

  // Check if population toggle is still checked
  const isChecked = await page.locator('#toggle-population').isChecked();
  console.log(`   Population toggle checked: ${isChecked}`);

  // Wait for population to load automatically
  console.log('\n3. Waiting for population to load...');
  await page.waitForTimeout(10000);

  const afterReloadStatus = await page.evaluate(() => {
    const statusEl = document.getElementById('population-status');
    return {
      text: statusEl?.textContent || '',
      markerCount: window.populationLayer?.getLayers().length || 0,
      layerOnMap: window.map && window.populationLayer ? window.map.hasLayer(window.populationLayer) : false
    };
  });

  console.log(`   Status: ${afterReloadStatus.text}`);
  console.log(`   Markers: ${afterReloadStatus.markerCount}`);
  console.log(`   On map: ${afterReloadStatus.layerOnMap}`);

  // Zoom to SLC to check if markers are visible
  await page.evaluate(() => {
    window.map.setView([40.7608, -111.891], 13);
  });

  await page.waitForTimeout(2000);

  // Check canvas rendering
  const canvasState = await page.evaluate(() => {
    const canvas = document.querySelector('.leaflet-population-pane canvas');
    if (!canvas) return { error: 'No canvas found' };

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 200), Math.min(canvas.height, 200));
    const pixels = imageData.data;

    let nonTransparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) nonTransparentPixels++;
    }

    return {
      hasCanvas: true,
      nonTransparentPixels,
      hasDrawing: nonTransparentPixels > 0
    };
  });

  console.log('\n=== CANVAS RENDERING ===');
  console.log(`Has canvas: ${canvasState.hasCanvas || false}`);
  console.log(`Non-transparent pixels: ${canvasState.nonTransparentPixels || 0}`);
  console.log(`Has drawing: ${canvasState.hasDrawing || false}`);

  await page.screenshot({ path: 'screenshots/population-init-test.png' });
  console.log('\n📸 Screenshot: population-init-test.png');

  if (afterReloadStatus.markerCount > 0 && canvasState.hasDrawing) {
    console.log('\n✅ SUCCESS: Population loads automatically after page reload!');
  } else {
    console.log('\n⚠️  WARNING: Population may not be loading correctly');
    console.log(`   Markers: ${afterReloadStatus.markerCount}`);
    console.log(`   Canvas has drawing: ${canvasState.hasDrawing}`);
  }
});
