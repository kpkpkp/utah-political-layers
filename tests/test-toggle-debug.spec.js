import { test } from '@playwright/test';

test('Debug population toggle', async ({ page }) => {
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`[ERROR] ${error.message}`);
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('\n=== Initial state ===');

  const initialState = await page.evaluate(() => {
    return {
      toggleExists: !!document.getElementById('toggle-population'),
      toggleChecked: document.getElementById('toggle-population')?.checked,
      layerExists: !!window.populationLayer,
      layerOnMap: window.map && window.populationLayer ? window.map.hasLayer(window.populationLayer) : false
    };
  });

  console.log(JSON.stringify(initialState, null, 2));

  console.log('\n=== Checking toggle ===');

  const toggle = page.locator('#toggle-population');
  await toggle.check();

  await page.waitForTimeout(1000);

  const afterToggle = await page.evaluate(() => {
    return {
      toggleChecked: document.getElementById('toggle-population')?.checked,
      layerOnMap: window.map && window.populationLayer ? window.map.hasLayer(window.populationLayer) : false,
      loadingState: window.populationState?.loading,
      loadedState: window.populationState?.loaded
    };
  });

  console.log('\n=== After checking toggle ===');
  console.log(JSON.stringify(afterToggle, null, 2));

  console.log('\n=== Waiting 10 seconds for loading ===');
  await page.waitForTimeout(10000);

  const afterWait = await page.evaluate(() => {
    const statusEl = document.getElementById('population-status');
    return {
      statusText: statusEl?.textContent || 'no status element',
      layerCount: window.populationLayer?.getLayers().length || 0,
      loading: window.populationState?.loading,
      loaded: window.populationState?.loaded
    };
  });

  console.log('\n=== After waiting ===');
  console.log(JSON.stringify(afterWait, null, 2));

  await page.screenshot({ path: 'screenshots/toggle-debug.png' });
});
