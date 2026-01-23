import { test, expect } from '@playwright/test';

test('Debug which data files are loading', async ({ page }) => {
  console.log('\n=== DATA FETCH DEBUG ===\n');

  const fetchedData = {};
  let fetchCount = 0;
  let errorCount = 0;

  // Monitor fetch calls
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('data/') && url.includes('.geojson')) {
      fetchCount++;
      const status = response.status();
      const ok = response.ok();

      try {
        const data = await response.json();
        const filename = url.split('/').pop();
        fetchedData[filename] = {
          status,
          ok,
          features: data.features ? data.features.length : 'N/A',
          type: data.type
        };
        console.log(`✓ ${filename}: ${status} - ${data.features ? data.features.length + ' features' : 'invalid'}`);
      } catch (e) {
        const filename = url.split('/').pop();
        fetchedData[filename] = { status, ok, error: e.message };
        console.log(`✗ ${filename}: ${status} - ${e.message}`);
        errorCount++;
      }
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  console.log(`\n=== Summary ===`);
  console.log(`Fetch calls made: ${fetchCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('\nFetched data:');
  Object.entries(fetchedData).forEach(([name, info]) => {
    console.log(`  ${name}:`, info);
  });

  // Check if init completed
  const initCompleted = await page.evaluate(() => {
    return window.layerState && window.layerState.house && window.layerState.senate;
  });

  console.log(`\ninit() completed successfully: ${initCompleted}`);

  // Try to load data directly
  console.log('\nDirect fetch test:');
  const directTest = await page.evaluate(async () => {
    try {
      const resp = await fetch('data/utah_boundary.geojson');
      console.log('Response status:', resp.status, 'ok:', resp.ok);
      if (!resp.ok) {
        console.log('Response not OK!');
        return { status: resp.status, ok: resp.ok, error: 'not ok' };
      }
      const data = await resp.json();
      console.log('Parsed data type:', data.type, 'features:', data.features ? data.features.length : 'none');
      return { status: resp.status, ok: resp.ok, features: data.features ? data.features.length : 0 };
    } catch (e) {
      console.log('Fetch error:', e.message);
      return { error: e.message };
    }
  });

  console.log('Direct fetch result:', directTest);
});
