import { test } from '@playwright/test';

test('Test simplest possible queries', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0";

    const tests = [
      {
        name: "Get service info",
        url: `${baseUrl}?f=json`
      },
      {
        name: "Minimal query - just JSON",
        url: `${baseUrl}/query?where=1=1&f=json`
      },
      {
        name: "Minimal query with objectIds",
        url: `${baseUrl}/query?objectIds=1,2,3&f=json`
      },
      {
        name: "Query with returnIdsOnly",
        url: `${baseUrl}/query?where=1=1&returnIdsOnly=true&f=json`
      },
      {
        name: "Minimal GeoJSON",
        url: `${baseUrl}/query?where=1=1&f=geojson`
      }
    ];

    const results = [];

    for (const testCase of tests) {
      try {
        const resp = await fetch(testCase.url);
        const text = await resp.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { rawText: text.substring(0, 500) };
        }

        results.push({
          name: testCase.name,
          status: resp.status,
          success: !data.error,
          error: data.error?.details?.[0] || data.error?.message || null,
          dataPreview: JSON.stringify(data).substring(0, 300)
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          error: error.message
        });
      }
    }

    return results;
  });

  console.log('\n=== SIMPLE QUERY TEST RESULTS ===\n');
  result.forEach(r => {
    console.log(`Test: ${r.name}`);
    console.log(`  Status: ${r.status || 'N/A'}`);
    console.log(`  Success: ${r.success}`);
    if (r.error) {
      console.log(`  Error: ${r.error}`);
    }
    console.log(`  Data: ${r.dataPreview}`);
    console.log('');
  });
});
