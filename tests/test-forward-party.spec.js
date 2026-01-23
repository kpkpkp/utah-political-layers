import { test, expect } from '@playwright/test';

test('Forward Party displays with purple color', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  console.log('Testing Forward Party display...\n');

  // Check that Forward party is in the legend
  const legendText = await page.locator('.legend').textContent();
  console.log('Legend contains Forward:', legendText.includes('Forward') ? 'YES' : 'NO');
  expect(legendText).toContain('Forward');

  // Check the Forward party swatch color
  const forwardSwatchColor = await page.evaluate(() => {
    const swatch = document.querySelector('.swatch.forward');
    if (!swatch) return null;
    return window.getComputedStyle(swatch).backgroundColor;
  });

  console.log('Forward swatch background color:', forwardSwatchColor);

  // Check Senate District 11 (Emily Buss - Forward)
  const district11Info = await page.evaluate(() => {
    const senateLayer = window.layerState.senate;
    if (!senateLayer) return null;

    let found = null;
    senateLayer.eachLayer((layer) => {
      const district = String(layer.feature.properties.DIST);
      if (district === '11') {
        const style = layer.options;
        found = {
          district,
          fillColor: style.fillColor,
          popup: layer.getPopup()?.getContent()
        };
      }
    });
    return found;
  });

  console.log('\nSenate District 11:');
  console.log('  Fill color:', district11Info?.fillColor);
  console.log('  Expected: #8b5cf6 (purple)');

  // Click on Senate District 11 to verify popup
  await page.evaluate(() => {
    const senateLayer = window.layerState.senate;
    senateLayer.eachLayer((layer) => {
      const district = String(layer.feature.properties.DIST);
      if (district === '11') {
        const bounds = layer.getBounds();
        const center = bounds.getCenter();
        layer.fire('click', { latlng: center });
      }
    });
  });

  await page.waitForTimeout(500);
  const popupContent = await page.locator('.leaflet-popup-content').textContent();
  console.log('  Popup:', popupContent.trim());

  expect(popupContent).toContain('Senate District 11');
  expect(popupContent).toContain('Forward');
  expect(popupContent).toContain('Buss, Emily');

  // Verify purple color is being used (rgb(139, 92, 246) = #8b5cf6)
  expect(district11Info?.fillColor).toBe('#8b5cf6');

  console.log('\n✅ Forward Party displays correctly with purple color!');
});
