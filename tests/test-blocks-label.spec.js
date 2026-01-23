import { test } from '@playwright/test';

test('Verify "blocks" label appears in population status', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('blocks loaded')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('Checking population toggle...');
  await page.locator('#toggle-population').check();

  // Wait a bit to see loading progress
  await page.waitForTimeout(3000);

  const duringLoad = await page.evaluate(() => {
    const statusEl = document.getElementById('population-status');
    return statusEl?.textContent || '';
  });

  console.log(`Status during load: ${duringLoad}`);

  // Wait for completion
  await page.waitForTimeout(20000);

  const finalStatus = await page.evaluate(() => {
    const statusEl = document.getElementById('population-status');
    return statusEl?.textContent || '';
  });

  console.log(`Final status: ${finalStatus}`);

  if (finalStatus.includes('blocks')) {
    console.log('✅ SUCCESS: "blocks" label is present!');
  } else {
    console.log('❌ FAIL: "blocks" label is missing');
  }
});
