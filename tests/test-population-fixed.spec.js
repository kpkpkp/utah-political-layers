import { test, expect } from '@playwright/test';

test('Test population layer after fix', async ({ page }) => {
  console.log('\n=== TESTING POPULATION LAYER AFTER FIX ===\n');

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() !== 'log') {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  let networkCount = 0;
  page.on('response', async response => {
    if (response.url().includes('arcgis')) {
      networkCount++;
      console.log(`[Network ${networkCount}] ${response.status()} ${response.url().substring(0, 150)}...`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  // Enable only population layer
  await page.locator('#toggle-boundary').uncheck();
  await page.locator('#toggle-house').uncheck();
  await page.locator('#toggle-senate').uncheck();
  await page.locator('#toggle-congress-current').uncheck();

  await page.locator('#toggle-population').check();
  console.log('✅ Population layer enabled');

  // Wait for loading to complete (give it up to 30 seconds)
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const status = await page.locator('#population-status').textContent();
    console.log(`Status (${i+1}s): ${status}`);

    if (status.includes('ready') || status.includes('blocks')) {
      break;
    }
  }

  const finalStatus = await page.locator('#population-status').textContent();
  console.log(`\n✅ Final status: ${finalStatus}`);

  // Check if circles/markers were actually added to the map
  const markerInfo = await page.evaluate(() => {
    const populationPane = document.querySelector('.leaflet-population-pane');
    return {
      paneExists: !!populationPane,
      childCount: populationPane?.children.length || 0,
      innerHTML: populationPane?.innerHTML.substring(0, 200) || 'N/A'
    };
  });

  console.log(`\nPopulation pane info:`, markerInfo);

  // Take screenshot
  await page.screenshot({ path: 'screenshots/population-fixed.png' });
  console.log('Screenshot saved: screenshots/population-fixed.png');

  console.log(`\n=== SUMMARY ===`);
  console.log(`Final status: ${finalStatus}`);
  console.log(`Network requests: ${networkCount}`);
  console.log(`Population pane children: ${markerInfo.childCount}`);

  // Verify it worked - status shows block count or "ready"
  expect(finalStatus).toMatch(/ready|blocks/);
  expect(finalStatus).not.toContain('no features');
  expect(networkCount).toBeGreaterThan(0);
});
