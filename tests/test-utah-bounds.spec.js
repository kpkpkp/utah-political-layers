import { test } from '@playwright/test';

test('Verify map is centered on Utah', async ({ page }) => {
  // Clear localStorage to start fresh
  await page.goto('http://localhost:8080');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  const mapInfo = await page.evaluate(() => {
    const center = window.map.getCenter();
    const zoom = window.map.getZoom();

    // Utah bounds: roughly 37-42°N, -114 to -109°W
    const utahBounds = {
      minLat: 37,
      maxLat: 42,
      minLng: -114.05,
      maxLng: -109.04
    };

    const isInUtah =
      center.lat >= utahBounds.minLat &&
      center.lat <= utahBounds.maxLat &&
      center.lng >= utahBounds.minLng &&
      center.lng <= utahBounds.maxLng;

    return {
      center: [center.lat, center.lng],
      zoom,
      isInUtah
    };
  });

  console.log('Map info:', mapInfo);
  console.log(`Map centered on Utah: ${mapInfo.isInUtah ? 'YES' : 'NO'}`);

  // Now click at the center
  const mapBounds = await page.locator('#map').boundingBox();
  const clickX = mapBounds.x + mapBounds.width / 2;
  const clickY = mapBounds.y + mapBounds.height / 2;

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);

  const popupExists = await page.locator('.leaflet-popup').count();
  console.log(`Popup shown: ${popupExists > 0 ? 'YES' : 'NO'}`);

  if (popupExists > 0) {
    const popupText = await page.locator('.leaflet-popup-content').textContent();
    console.log(`Popup content: ${popupText}`);
  }
});
