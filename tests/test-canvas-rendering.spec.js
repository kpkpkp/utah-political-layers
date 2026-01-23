import { test } from '@playwright/test';

test('Debug canvas rendering', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Leaflet') && !text.includes('Download')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  // Enable population layer
  const popToggle = page.locator('#toggle-population');
  await popToggle.check();

  console.log('Waiting for population to load...\n');

  // Wait for completion
  await page.waitForTimeout(20000);

  const canvasInfo = await page.evaluate(() => {
    // Find all canvases
    const canvases = document.querySelectorAll('canvas');

    const canvasData = Array.from(canvases).map((canvas, idx) => {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');

      // Try to detect if canvas has been drawn on
      const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      const hasPixels = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0); // Check alpha channel

      return {
        index: idx,
        width: canvas.width,
        height: canvas.height,
        visibleWidth: rect.width,
        visibleHeight: rect.height,
        className: canvas.className,
        parentClassName: canvas.parentElement?.className,
        hasDrawing: hasPixels,
        top: rect.top,
        left: rect.left,
        zIndex: window.getComputedStyle(canvas).zIndex,
        display: window.getComputedStyle(canvas).display
      };
    });

    // Check panes
    const panes = document.querySelectorAll('.leaflet-pane');
    const paneInfo = Array.from(panes).map(pane => ({
      className: pane.className,
      zIndex: window.getComputedStyle(pane).zIndex,
      childCount: pane.children.length,
      firstChildTag: pane.children[0]?.tagName
    }));

    // Check population renderer
    const rendererInfo = {
      exists: !!window.populationRenderer,
      type: window.populationRenderer?.constructor?.name,
      canvas: window.populationRenderer?._container?.tagName
    };

    // Check if markers have the renderer
    const layers = window.populationLayer?.getLayers() || [];
    const sampleMarker = layers[0];
    const markerInfo = sampleMarker ? {
      hasRenderer: !!sampleMarker.options?.renderer,
      rendererType: sampleMarker.options?.renderer?.constructor?.name,
      hasContainer: !!sampleMarker.options?.renderer?._container
    } : null;

    return {
      canvasCount: canvases.length,
      canvases: canvasData,
      panes: paneInfo,
      rendererInfo,
      markerInfo,
      markerCount: layers.length
    };
  });

  console.log('\n=== CANVAS DEBUG INFO ===');
  console.log(JSON.stringify(canvasInfo, null, 2));

  // Zoom into SLC area where there should be lots of markers
  await page.evaluate(() => {
    window.map.setView([40.7608, -111.891], 12);
  });

  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'screenshots/canvas-rendering-slc-zoom.png', fullPage: false });
  console.log('\nScreenshot saved: canvas-rendering-slc-zoom.png');

  // Check canvas after zoom
  const canvasAfterZoom = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    return Array.from(canvases).map(canvas => {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      const hasPixels = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0);
      return {
        className: canvas.className,
        hasDrawing: hasPixels
      };
    });
  });

  console.log('\n=== CANVAS AFTER ZOOM ===');
  console.log(JSON.stringify(canvasAfterZoom, null, 2));
});
