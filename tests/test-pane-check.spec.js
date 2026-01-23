import { test } from '@playwright/test';

test('Find all panes and check their properties', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  const panes = await page.evaluate(() => {
    const allPanes = {};
    const mapContainer = document.querySelector('#map');
    if (!mapContainer) return {};

    const paneElements = mapContainer.querySelectorAll('[class*="pane"]');
    paneElements.forEach((el) => {
      const classes = Array.from(el.classList);
      const styles = window.getComputedStyle(el);
      allPanes[classes.join(' ')] = {
        zIndex: styles.zIndex,
        pointerEvents: styles.pointerEvents,
        position: styles.position,
        display: styles.display
      };
    });

    return allPanes;
  });

  console.log('All panes found:');
  console.log(JSON.stringify(panes, null, 2));
});
