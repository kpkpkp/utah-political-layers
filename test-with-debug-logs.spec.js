import { test } from '@playwright/test';

test('Capture debug logs', async ({ page }) => {
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(text);
  });

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  console.log('\n=== ENABLING POPULATION LAYER ===\n');

  await page.locator('#toggle-population').check();

  await page.waitForTimeout(10000);

  const status = await page.locator('#population-status').textContent();
  console.log(`\nFinal status: ${status}`);

  console.log(`\nTotal log entries: ${logs.length}`);
  const buildMarkerLogs = logs.filter(l => l.includes('[buildPopulationMarker]'));
  console.log(`BuildMarker logs: ${buildMarkerLogs.length}`);
});
