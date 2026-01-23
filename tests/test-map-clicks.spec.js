import { test } from '@playwright/test';

test('Test if map receives clicks and what gets clicked', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  // Add click handler to map to see if clicks are received
  await page.evaluate(() => {
    window.map.on('click', (e) => {
      console.log(`Map clicked at: ${e.latlng.lat}, ${e.latlng.lng}`);

      // Check what layers are at this point
      const layers = [];
      window.map.eachLayer((layer) => {
        if (layer.getBounds && layer.getBounds().contains(e.latlng)) {
          layers.push(layer.constructor.name);
        }
      });
      console.log(`Layers at click point: ${layers.join(', ')}`);
    });

    // Add click handler to house layer specifically
    if (window.layerState.house) {
      window.layerState.house.on('click', () => {
        console.log('House layer clicked!');
      });
    }

    // Add click handler to senate layer
    if (window.layerState.senate) {
      window.layerState.senate.on('click', () => {
        console.log('Senate layer clicked!');
      });
    }
  });

  console.log('Clicking on map center...\n');

  const mapBounds = await page.locator('#map').boundingBox();
  const clickX = mapBounds.x + mapBounds.width / 2;
  const clickY = mapBounds.y + mapBounds.height / 2;

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(2000);

  console.log('\nNow trying to click on a known district polygon...');

  // Get bounds of first house district and click its center
  const districtClick = await page.evaluate(() => {
    const houseLayer = window.layerState.house;
    if (!houseLayer) return null;

    let firstLayer = null;
    houseLayer.eachLayer((layer) => {
      if (!firstLayer) {
        firstLayer = layer;
        const bounds = layer.getBounds();
        const center = bounds.getCenter();
        console.log(`First district center: ${center.lat}, ${center.lng}`);

        // Trigger click programmatically
        layer.fire('click', { latlng: center });
      }
    });
    return firstLayer ? 'clicked' : 'not found';
  });

  console.log(`District click result: ${districtClick}`);

  await page.waitForTimeout(1000);

  const popupExists = await page.locator('.leaflet-popup').count();
  console.log(`Popup shown after programmatic click: ${popupExists > 0 ? 'YES' : 'NO'}`);
});
