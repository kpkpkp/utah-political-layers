import { test } from '@playwright/test';

test('Get actual field names from service', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0";

    // Get service metadata
    const metaResp = await fetch(`${baseUrl}?f=json`);
    const metadata = await metaResp.json();

    // Get sample features with all fields
    const queryResp = await fetch(`${baseUrl}/query?where=1=1&outFields=*&f=geojson&resultRecordCount=1`);
    const queryData = await queryResp.json();

    return {
      fields: metadata.fields,
      sampleFeature: queryData.features?.[0]
    };
  });

  console.log('\n=== ACTUAL FIELD NAMES ===\n');
  console.log('Available fields:');
  result.fields.forEach(f => {
    console.log(`  - ${f.name} (${f.type}) ${f.alias ? `"${f.alias}"` : ''}`);
  });

  console.log('\n=== SAMPLE FEATURE PROPERTIES ===');
  if (result.sampleFeature) {
    console.log(JSON.stringify(result.sampleFeature.properties, null, 2));
  }
});
