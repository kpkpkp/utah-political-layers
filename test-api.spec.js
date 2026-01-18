import { test, expect } from '@playwright/test';

test('Test ArcGIS API directly', async ({ page }) => {
  console.log('\n=== TESTING ARCGIS API DIRECTLY ===\n');

  // Go to the page to use its fetch
  await page.goto('http://localhost:8080');

  // Capture all network activity
  const requests = [];
  const responses = [];

  page.on('request', req => {
    if (req.url().includes('arcgis')) {
      requests.push({
        url: req.url(),
        method: req.method()
      });
      console.log(`\n[REQUEST] ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', async resp => {
    if (resp.url().includes('arcgis')) {
      const contentType = resp.headers()['content-type'] || '';
      let body = '';
      try {
        if (contentType.includes('json')) {
          const json = await resp.json();
          body = JSON.stringify(json, null, 2).substring(0, 500);
        } else {
          body = await resp.text();
          body = body.substring(0, 500);
        }
      } catch (e) {
        body = `[Could not parse: ${e.message}]`;
      }

      responses.push({
        url: resp.url(),
        status: resp.status(),
        body
      });

      console.log(`[RESPONSE] ${resp.status()} ${resp.url()}`);
      console.log(`Content-Type: ${contentType}`);
      console.log(`Body preview:\n${body}\n`);
    }
  });

  // Test the API call directly
  const result = await page.evaluate(async () => {
    const baseUrl =
      "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    // First, try to get the count
    console.log('Fetching count...');
    const countParams = new URLSearchParams({
      where: "1=1",
      returnCountOnly: "true",
      f: "json"
    });

    let countResult;
    try {
      const countResp = await fetch(`${baseUrl}?${countParams.toString()}`);
      countResult = {
        ok: countResp.ok,
        status: countResp.status,
        data: await countResp.json()
      };
      console.log('Count result:', countResult);
    } catch (error) {
      countResult = { error: error.message };
    }

    // Then try to get some actual features
    console.log('Fetching features...');
    const featParams = new URLSearchParams({
      where: "1=1",
      outFields: "OBJECTID,PopDensity,POP10,Area",
      outSR: "4326",
      f: "geojson",
      resultOffset: "0",
      resultRecordCount: "10"
    });

    let featuresResult;
    try {
      const featResp = await fetch(`${baseUrl}?${featParams.toString()}`);
      featuresResult = {
        ok: featResp.ok,
        status: featResp.status,
        data: await featResp.json()
      };
      console.log('Features result:', featuresResult);
    } catch (error) {
      featuresResult = { error: error.message };
    }

    return { countResult, featuresResult };
  });

  console.log('\n=== EVALUATION RESULTS ===');
  console.log('Count result:', JSON.stringify(result.countResult, null, 2));
  console.log('\nFeatures result:');
  if (result.featuresResult.data) {
    console.log('  Status:', result.featuresResult.status);
    console.log('  Feature count:', result.featuresResult.data.features?.length || 0);
    if (result.featuresResult.data.features?.length > 0) {
      console.log('  First feature:', JSON.stringify(result.featuresResult.data.features[0], null, 2).substring(0, 300));
    } else {
      console.log('  Full response:', JSON.stringify(result.featuresResult.data, null, 2).substring(0, 500));
    }
  } else {
    console.log('  Error:', result.featuresResult.error);
  }

  console.log(`\n=== NETWORK SUMMARY ===`);
  console.log(`Total requests: ${requests.length}`);
  console.log(`Total responses: ${responses.length}`);
});
