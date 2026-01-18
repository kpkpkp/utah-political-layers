import { test } from '@playwright/test';

test('Test different ArcGIS parameter combinations', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    const tests = [
      {
        name: "Original params (GeoJSON with outSR=4326)",
        params: {
          where: "1=1",
          outFields: "OBJECTID,PopDensity,POP10,Area",
          outSR: "4326",
          f: "geojson",
          resultOffset: "0",
          resultRecordCount: "5"
        }
      },
      {
        name: "GeoJSON without outSR",
        params: {
          where: "1=1",
          outFields: "OBJECTID,PopDensity,POP10,Area",
          f: "geojson",
          resultOffset: "0",
          resultRecordCount: "5"
        }
      },
      {
        name: "JSON with outSR=4326",
        params: {
          where: "1=1",
          outFields: "OBJECTID,PopDensity,POP10,Area",
          outSR: "4326",
          f: "json",
          resultOffset: "0",
          resultRecordCount: "5"
        }
      },
      {
        name: "JSON without outSR",
        params: {
          where: "1=1",
          outFields: "OBJECTID,PopDensity,POP10,Area",
          f: "json",
          resultOffset: "0",
          resultRecordCount: "5"
        }
      },
      {
        name: "JSON with returnGeometry=true",
        params: {
          where: "1=1",
          outFields: "OBJECTID,PopDensity,POP10,Area",
          f: "json",
          returnGeometry: "true",
          resultOffset: "0",
          resultRecordCount: "5"
        }
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
          hasGeometry: data.features?.[0]?.geometry ? true : false,
          error: data.error?.details?.[0] || null,
          firstFeatureSample: data.features?.[0] ? {
            objectId: data.features[0].properties?.OBJECTID || data.features[0].attributes?.OBJECTID,
            hasGeometry: !!data.features[0].geometry,
            geometryType: data.features[0].geometry?.type
          } : null
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

  console.log('\n=== PARAMETER VARIATION TEST RESULTS ===\n');
  result.forEach(r => {
    console.log(`Test: ${r.name}`);
    console.log(`  Status: ${r.status || 'N/A'}`);
    console.log(`  Success: ${r.success}`);
    console.log(`  Features: ${r.featureCount}`);
    console.log(`  Has geometry: ${r.hasGeometry}`);
    if (r.firstFeatureSample) {
      console.log(`  First feature:`, JSON.stringify(r.firstFeatureSample, null, 2));
    }
    if (r.error) {
      console.log(`  Error: ${r.error}`);
    }
    console.log('');
  });
});
