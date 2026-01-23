import { test, expect } from '@playwright/test';

test('Population layer displays on map', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('1. Map loaded');

  // Enable population layer
  const popToggle = page.locator('#toggle-population');
  await popToggle.check();
  console.log('2. Population layer toggle checked');

  // Wait for loading to complete (check status text)
  const statusLocator = page.locator('#population-status');

  // Wait up to 30 seconds for population data to load
  console.log('3. Waiting for population data to load...');

  let attempts = 0;
  let loaded = false;

  while (attempts < 60 && !loaded) {
    await page.waitForTimeout(500);
    const statusText = await statusLocator.textContent().catch(() => '');

    if (attempts % 4 === 0) {
      console.log(`   Status: ${statusText}`);
    }

    if (statusText.includes('ready') || statusText.includes('loaded')) {
      loaded = true;
      console.log(`✅ Population loaded: ${statusText}`);
    }

    attempts++;
  }

  if (!loaded) {
    const finalStatus = await statusLocator.textContent().catch(() => 'unknown');
    console.log(`⚠️  Final status after timeout: ${finalStatus}`);
  }

  // Check for canvas circle markers
  const canvasCount = await page.locator('canvas').count();
  console.log(`4. Canvas elements on page: ${canvasCount}`);

  // Check if population layer has markers
  const markerCount = await page.evaluate(() => {
    const layers = window.map?._layers;
    if (!layers) return 0;

    let count = 0;
    for (const id in layers) {
      const layer = layers[id];
      if (layer.options && typeof layer.options.density === 'number') {
        count++;
      }
    }
    return count;
  });

  console.log(`5. Population markers found: ${markerCount}`);

  // Take screenshot
  await page.screenshot({ path: 'screenshots/population-layer-test.png' });
  console.log('6. Screenshot saved');

  // Verify we have markers
  expect(markerCount).toBeGreaterThan(0);
  console.log('\n🎉 Population layer is displaying correctly!');
});
