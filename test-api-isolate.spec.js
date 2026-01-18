import { test } from '@playwright/test';

test('Isolate problematic parameter', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    const tests = [
      {
        name: "Baseline - just where",
        params: { where: "1=1", f: "geojson" }
      },
      {
        name: "Add outFields (suspect #1)",
        params: { where: "1=1", f: "geojson", outFields: "OBJECTID,PopDensity,POP10,Area" }
      },
      {
        name: "Add outFields with *",
        params: { where: "1=1", f: "geojson", outFields: "*" }
      },
      {
        name: "Just resultRecordCount",
        params: { where: "1=1", f: "geojson", resultRecordCount: "5" }
      },
      {
        name: "Add resultOffset (suspect #2)",
        params: { where: "1=1", f: "geojson", resultRecordCount: "5", resultOffset: "0" }
      },
      {
        name: "Add outSR (suspect #3)",
        params: { where: "1=1", f: "geojson", outSR: "4326" }
      },
      {
        name: "outFields + resultRecordCount (no offset)",
        params: { where: "1=1", f: "geojson", outFields: "*", resultRecordCount: "5" }
      }
    ];

    const results = [];

    for (const testCase of tests) {
      try {
        const params = new URLSearchParams(testCase.params);
        const url = `${baseUrl}?${params.toString()}`;
        const resp = await fetch(url);
        const data = await resp.json();

        results.push({
          name: testCase.name,
          status: resp.status,
          success: !data.error,
          featureCount: data.features?.length || 0,
          error: data.error?.details?.[0] || null
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          fetchError: error.message
        });
      }
    }

    return results;
  });

  console.log('\n=== PARAMETER ISOLATION TEST ===\n');
  result.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.name}`);
    console.log(`   Features: ${r.featureCount}`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
    if (r.fetchError) {
      console.log(`   Fetch Error: ${r.fetchError}`);
    }
    console.log('');
  });
});
