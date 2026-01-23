import { test } from '@playwright/test';

test('Screenshot of Forward Party display', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  // Click on Senate District 11 (Emily Buss - Forward)
  await page.evaluate(() => {
    const senateLayer = window.layerState.senate;
    senateLayer.eachLayer((layer) => {
      const district = String(layer.feature.properties.DIST);
      if (district === '11') {
        const bounds = layer.getBounds();
        const center = bounds.getCenter();

        // Zoom to this district
        window.map.fitBounds(bounds, { padding: [100, 100] });

        // Click it after a delay for the zoom
        setTimeout(() => {
          layer.fire('click', { latlng: center });
        }, 500);
      }
    });
  });

  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/forward-party-display.png', fullPage: true });

  console.log('Screenshot saved to screenshots/forward-party-display.png');
});
