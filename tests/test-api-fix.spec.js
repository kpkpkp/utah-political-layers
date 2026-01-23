import { test } from '@playwright/test';

test('Test with corrected field name', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    const tests = [
      {
        name: "BROKEN - With OBJECTID",
        params: {
          where: "1=1",
          outFields: "OBJECTID,PopDensity,POP10,Area",
          f: "geojson",
          resultRecordCount: "5"
        }
      },
      {
        name: "FIXED - With FID",
        params: {
          where: "1=1",
          outFields: "FID,PopDensity,POP10,Area",
          f: "geojson",
          resultRecordCount: "5"
        }
      }
    ];

    const results = [];

    for (const testCase of tests) {
      const params = new URLSearchParams(testCase.params);
      const url = `${baseUrl}?${params.toString()}`;
      const resp = await fetch(url);
      const data = await resp.json();

      results.push({
        name: testCase.name,
        success: !data.error,
        featureCount: data.features?.length || 0,
        sampleProperties: data.features?.[0]?.properties
      });
    }

    return results;
  });

  console.log('\n=== FIX VERIFICATION ===\n');
  result.forEach(r => {
    const status = r.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${status}: ${r.name}`);
    console.log(`   Features returned: ${r.featureCount}`);
    if (r.sampleProperties) {
      console.log(`   Sample properties:`, JSON.stringify(r.sampleProperties, null, 2));
    }
    console.log('');
  });
});
