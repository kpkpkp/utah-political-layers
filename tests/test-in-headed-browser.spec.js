import { test } from '@playwright/test';

test('Show working population layer in visible browser', async ({ page }) => {
  console.log('\n========================================');
  console.log('Opening browser to demonstrate the fix...');
  console.log('========================================\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  console.log('1. Disabling all layers first...');
  await page.locator('#toggle-boundary').uncheck();
  await page.locator('#toggle-house').uncheck();
  await page.locator('#toggle-senate').uncheck();
  await page.locator('#toggle-congress-current').uncheck();
  await page.locator('#toggle-congress-future').uncheck();

  console.log('2. Enabling Map tiles + Population...');
  await page.locator('#toggle-tiles').check();
  await page.locator('#toggle-population').check();

  console.log('3. Waiting for population to load...\n');

  // Monitor loading
  for (let i = 0; i < 45; i++) {
    await page.waitForTimeout(1000);
    const status = await page.locator('#population-status').textContent().catch(() => 'Loading...');
    process.stdout.write(`\r   ${status}                         `);

    if (status.includes('ready') || status.includes('blocks')) {
      console.log('\n');
      break;
    }
  }

  const finalStatus = await page.locator('#population-status').textContent();
  console.log(`✅ ${finalStatus}`);

  console.log('\n4. Zooming to Salt Lake City to show population dots...');
  await page.evaluate(() => {
    map.setView([40.7608, -111.8910], 11);
  });

  await page.waitForTimeout(2000);

  console.log('\n========================================');
  console.log('✅ BROWSER SHOULD NOW SHOW RED DOTS!');
  console.log('The browser will stay open for 30 seconds');
  console.log('so you can see the working population layer.');
  console.log('========================================\n');

  // Keep browser open for 30 seconds
  await page.waitForTimeout(30000);
});
