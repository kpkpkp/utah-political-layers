import { test } from '@playwright/test';

test('Verify Utah data filter', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    // Test with Utah filter
    const utahParams = new URLSearchParams({
      where: "STATEFP10='49'",
      outFields: "FID,STATEFP10,PopDensity,POP10,Area",
      f: "geojson",
      resultRecordCount: "5"
    });

    const utahResp = await fetch(`${baseUrl}?${utahParams.toString()}`);
    const utahData = await utahResp.json();

    // Also get count
    const countParams = new URLSearchParams({
      where: "STATEFP10='49'",
      returnCountOnly: "true",
      f: "json"
    });

    const countResp = await fetch(`${baseUrl}?${countParams.toString()}`);
    const countData = await countResp.json();

    return {
      utah: {
        count: utahData.features?.length || 0,
        totalCount: countData.count || 0,
        features: utahData.features?.map(f => ({
          fid: f.properties.FID,
          state: f.properties.STATEFP10,
          pop: f.properties.POP10,
          coords: f.geometry.coordinates?.[0]?.[0]?.[0]
        })) || []
      }
    };
  });

  console.log('\n=== UTAH FILTER TEST ===\n');
  console.log(`Total Utah population blocks: ${result.utah.totalCount.toLocaleString()}`);
  console.log(`Sample features returned: ${result.utah.count}`);
  console.log('\nFirst 5 features:');
  result.utah.features.forEach((f, i) => {
    console.log(`  ${i+1}. FID: ${f.fid}, State: ${f.state}, Pop: ${f.pop}, Coords: ${JSON.stringify(f.coords)}`);
  });
});
