import { test, expect } from '@playwright/test';

test('Population click works with district layers enabled', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(1000);

  // Remove tour
  await page.evaluate(() => {
    document.getElementById('tour-overlay')?.remove();
    document.getElementById('tour-callout')?.remove();
  });

  // Enable population layer
  await page.locator('#toggle-population').check();

  // Enable district layers (default state)
  await page.locator('#toggle-house').check();
  await page.locator('#toggle-senate').check();

  // Wait for population data
  await page.waitForFunction(() => window.populationLayer?.getLayers()?.length > 3000, { timeout: 30000 });

  // Zoom to populated area
  await page.evaluate(() => window.map.setView([40.76, -111.89], 11));
  await page.waitForTimeout(500);

  // Find a population marker and click it
  const result = await page.evaluate(() => {
    const layers = window.populationLayer.getLayers();
    const bounds = window.map.getBounds();

    for (const layer of layers) {
      if (bounds.contains(layer.getLatLng())) {
        const pt = window.map.latLngToContainerPoint(layer.getLatLng());

        // Simulate a click event on the marker
        layer.fire('click', { latlng: layer.getLatLng() });

        return {
          clicked: true,
          highlightExists: window.populationHighlight !== null
        };
      }
    }
    return { clicked: false, error: 'No marker in view' };
  });

  console.log('Result:', JSON.stringify(result));
  expect(result.highlightExists).toBe(true);
});
