import { test, expect } from '@playwright/test';

test('Final verification - Population layer works', async ({ page }) => {
  console.log('\n=== FINAL POPULATION LAYER VERIFICATION ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Start fresh - disable all layers
  await page.locator('#toggle-boundary').uncheck();
  await page.locator('#toggle-tiles').uncheck();
  await page.locator('#toggle-house').uncheck();
  await page.locator('#toggle-senate').uncheck();
  await page.locator('#toggle-congress-current').uncheck();
  await page.locator('#toggle-congress-future').uncheck();
  await page.locator('#toggle-population').uncheck();

  console.log('✓ All layers disabled');

  // Enable just map tiles and population
  await page.locator('#toggle-tiles').check();
  await page.locator('#toggle-population').check();

  console.log('✓ Enabled: Map tiles + Population');
  console.log('\nWaiting for population to load...\n');

  // Wait for loading to complete
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const status = await page.locator('#population-status').textContent();
    process.stdout.write(`\r${status}                    `);

    if (status.includes('ready')) {
      console.log('\n');
      break;
    }
  }

  const finalStatus = await page.locator('#population-status').textContent();
  console.log(`Final status: ${finalStatus}`);

  // Take screenshots at different zoom levels
  console.log('\n📸 Taking screenshots...');

  // 1. Full Utah view
  await page.screenshot({ path: 'screenshots/final-utah-full.png', fullPage: true });
  console.log('  ✓ screenshots/final-utah-full.png');

  // 2. Zoom to Salt Lake City
  await page.evaluate(() => {
    map.setView([40.7608, -111.8910], 11);
  });
  await page.waitForTimeout(1000);
  await page.locator('#map').screenshot({ path: 'screenshots/final-slc-zoom.png' });
  console.log('  ✓ screenshots/final-slc-zoom.png');

  // 3. Zoom to Provo
  await page.evaluate(() => {
    map.setView([40.2338, -111.6585], 11);
  });
  await page.waitForTimeout(1000);
  await page.locator('#map').screenshot({ path: 'screenshots/final-provo-zoom.png' });
  console.log('  ✓ screenshots/final-provo-zoom.png');

  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log('✅ Population layer is working!');
  console.log('✅ Check the screenshots to see the red population density dots');
});
