import { test, expect } from '@playwright/test';

test('Quick verification - Map loads and population API works', async ({ page }) => {
  console.log('Testing map loads...');

  await page.goto('http://localhost:8080');

  // Wait for map element
  await page.waitForSelector('#map', { timeout: 5000 });
  console.log('✅ Map element found!');

  // Check for control panel
  await page.waitForSelector('#controls', { timeout: 5000 });
  console.log('✅ Control panel found!');

  // Check that we can see toggles
  const boundaryToggle = await page.locator('#toggle-boundary');
  const isVisible = await boundaryToggle.isVisible();
  console.log(`✅ Toggle visible: ${isVisible}`);

  // Test population API directly
  console.log('\nTesting population API with new parameters...');

  const apiTest = await page.evaluate(async () => {
    const baseUrl = "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    const params = new URLSearchParams({
      where: "STATEFP10='49'",
      outFields: "*",
      f: "geojson",
      resultRecordCount: "5"
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      featureCount: data.features?.length || 0,
      hasError: !!data.error,
      error: data.error?.message
    };
  });

  console.log(`API Response:`, apiTest);

  if (apiTest.hasError) {
    console.log(`❌ API Error: ${apiTest.error}`);
  } else {
    console.log(`✅ API Success! Retrieved ${apiTest.featureCount} features`);
  }

  expect(apiTest.ok).toBe(true);
  expect(apiTest.featureCount).toBeGreaterThan(0);
  expect(apiTest.hasError).toBe(false);

  console.log('\n🎉 All checks passed!');
});
