import { test } from '@playwright/test';

test('Simple test: Population auto-loads when checked', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Loading population') || text.includes('loaded (REST)')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('Step 1: Check population toggle and wait for load');
  await page.locator('#toggle-population').check();
  await page.waitForTimeout(15000);

  const beforeReload = await page.evaluate(() => ({
    markerCount: window.populationLayer?.getLayers().length || 0
  }));

  console.log(`  Markers before reload: ${beforeReload.markerCount}`);

  console.log('\nStep 2: Reload page (Population should auto-load)');
  await page.reload();
  await page.waitForSelector('#map', { timeout: 5000 });

  const isChecked = await page.locator('#toggle-population').isChecked();
  console.log(`  Population toggle checked after reload: ${isChecked}`);

  console.log('\nStep 3: Wait for auto-load...');
  await page.waitForTimeout(25000);

  const afterReload = await page.evaluate(() => ({
    markerCount: window.populationLayer?.getLayers().length || 0,
    statusText: document.getElementById('population-status')?.textContent || ''
  }));

  console.log(`  Markers after reload: ${afterReload.markerCount}`);
  console.log(`  Status: ${afterReload.statusText}`);

  await page.screenshot({ path: 'screenshots/population-simple-test.png' });

  if (afterReload.markerCount > 30000) {
    console.log('\n✅ SUCCESS! Population auto-loaded correctly');
  } else {
    console.log('\n⚠️  Population may not have fully loaded');
  }
});
