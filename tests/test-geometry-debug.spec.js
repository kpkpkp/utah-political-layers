import { test } from '@playwright/test';

test('Debug geometry data from API', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    const params = new URLSearchParams({
      where: "1=1",
      outFields: "FID,PopDensity,POP10,Area",
      f: "geojson",
      resultRecordCount: "3"
    });

    const resp = await fetch(`${baseUrl}?${params.toString()}`);
    const data = await resp.json();

    return {
      featureCount: data.features?.length || 0,
      firstFeature: data.features?.[0] ? {
        type: data.features[0].type,
        properties: data.features[0].properties,
        geometryType: data.features[0].geometry?.type,
        geometrySample: JSON.stringify(data.features[0].geometry).substring(0, 500)
      } : null
    };
  });

  console.log('\n=== GEOMETRY DEBUG ===\n');
  console.log('Features returned:', result.featureCount);
  console.log('\nFirst feature:');
  console.log('  Type:', result.firstFeature?.type);
  console.log('  Properties:', JSON.stringify(result.firstFeature?.properties, null, 2));
  console.log('  Geometry type:', result.firstFeature?.geometryType);
  console.log('  Geometry sample (first 500 chars):');
  console.log(result.firstFeature?.geometrySample);
});
