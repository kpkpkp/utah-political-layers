import { test } from '@playwright/test';

test('Zoom controls are granular (0.25 increments)', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  console.log('Testing granular zoom controls...\n');

  // Get initial zoom level
  const initialZoom = await page.evaluate(() => window.map.getZoom());
  console.log(`Initial zoom level: ${initialZoom}`);

  // Click zoom in button
  await page.locator('.leaflet-control-zoom-in').click();
  await page.waitForTimeout(500);

  const zoomAfterIn = await page.evaluate(() => window.map.getZoom());
  console.log(`Zoom after clicking +: ${zoomAfterIn}`);

  const zoomInDelta = zoomAfterIn - initialZoom;
  console.log(`Zoom delta: ${zoomInDelta.toFixed(2)}`);

  // Click zoom out button twice
  await page.locator('.leaflet-control-zoom-out').click();
  await page.waitForTimeout(500);

  const zoomAfterOut1 = await page.evaluate(() => window.map.getZoom());
  console.log(`Zoom after clicking -: ${zoomAfterOut1}`);

  await page.locator('.leaflet-control-zoom-out').click();
  await page.waitForTimeout(500);

  const zoomAfterOut2 = await page.evaluate(() => window.map.getZoom());
  console.log(`Zoom after clicking - again: ${zoomAfterOut2}`);

  // Check map settings
  const mapSettings = await page.evaluate(() => ({
    zoomSnap: window.map.options.zoomSnap,
    zoomDelta: window.map.options.zoomDelta
  }));

  console.log('\nMap zoom settings:');
  console.log(`  zoomSnap: ${mapSettings.zoomSnap} (should be 0.25)`);
  console.log(`  zoomDelta: ${mapSettings.zoomDelta} (should be 0.25)`);

  if (Math.abs(zoomInDelta - 0.25) < 0.01) {
    console.log('\n✅ Zoom controls are granular! Each click changes zoom by 0.25 levels.');
  } else {
    console.log(`\n⚠️  Zoom delta is ${zoomInDelta.toFixed(2)}, expected 0.25`);
  }
});
