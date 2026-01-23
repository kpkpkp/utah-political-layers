import { test } from '@playwright/test';

test('Zoom to SLC and check markers', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Leaflet') && !text.includes('Download')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('Checking toggle...');
  await page.locator('#toggle-population').check();

  console.log('Waiting for population to load...');
  await page.waitForTimeout(25000);

  const status = await page.evaluate(() => {
    const statusEl = document.getElementById('population-status');
    return statusEl?.textContent || '';
  });

  console.log(`Status: ${status}`);

  // Zoom to SLC
  await page.evaluate(() => {
    window.map.setView([40.7608, -111.891], 13);
  });

  await page.waitForTimeout(2000);

  // Check canvas state
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
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      nonTransparentPixels,
      hasDrawing: nonTransparentPixels > 0,
      markerCount: window.populationLayer?.getLayers().length || 0
    };
  });

  console.log('\n=== CANVAS STATE ===');
  console.log(JSON.stringify(canvasState, null, 2));

  await page.screenshot({ path: 'screenshots/slc-zoom-test.png' });
  console.log('Screenshot: slc-zoom-test.png');
});
