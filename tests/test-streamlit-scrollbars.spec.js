import { test, expect } from '@playwright/test';

test('Check Streamlit app for unnecessary scrollbars', async ({ page }) => {
  console.log('\n=== CHECKING STREAMLIT APP FOR SCROLLBARS ===\n');

  await page.goto('https://utah-political-layers.streamlit.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Get viewport info
  const viewportSize = page.viewportSize();
  console.log(`Viewport: ${viewportSize.width}x${viewportSize.height}`);

  // Check if scrollbars are present
  const scrollbarInfo = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;

    return {
      htmlScrollWidth: html.scrollWidth,
      htmlClientWidth: html.clientWidth,
      htmlOverflow: window.getComputedStyle(html).overflow,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyOverflow: window.getComputedStyle(body).overflow,
      hasVerticalScroll: html.scrollHeight > html.clientHeight,
      hasHorizontalScroll: html.scrollWidth > html.clientWidth,
      windowInnerHeight: window.innerHeight,
      documentHeight: html.scrollHeight,
      windowInnerWidth: window.innerWidth,
      documentWidth: html.scrollWidth
    };
  });

  console.log('Scrollbar Analysis:');
  console.log(JSON.stringify(scrollbarInfo, null, 2));

  // Take full page screenshot
  await page.screenshot({ path: 'screenshots/streamlit-scrollbars.png', fullPage: true });
  console.log('\n✓ Screenshot saved: streamlit-scrollbars.png');

  // Check main content elements
  const elements = await page.evaluate(() => {
    const main = document.querySelector('main');
    const iframe = document.querySelector('iframe');
    const sections = document.querySelectorAll('section');

    return {
      mainExists: !!main,
      mainHeight: main?.scrollHeight,
      mainClientHeight: main?.clientHeight,
      mainWidth: main?.scrollWidth,
      mainClientWidth: main?.clientWidth,
      mainOverflow: main ? window.getComputedStyle(main).overflow : null,
      iframeExists: !!iframe,
      iframeHeight: iframe?.style.height,
      iframeWidth: iframe?.style.width,
      sectionsCount: sections.length,
      rootHeight: document.querySelector('[data-testid="stAppViewContainer"]')?.scrollHeight
    };
  });

  console.log('\nMain Elements:');
  console.log(JSON.stringify(elements, null, 2));

  // Check for overflow containers
  const overflowElements = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const overflowing = [];

    for (let el of allElements) {
      const style = window.getComputedStyle(el);
      if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
        const scrollable = el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
        if (scrollable && el.clientHeight > 0) {
          overflowing.push({
            tag: el.tagName,
            class: el.className,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            overflow: style.overflow,
            overflowY: style.overflowY,
            overflowX: style.overflowX
          });
        }
      }
    }

    return overflowing.slice(0, 10); // First 10
  });

  console.log('\nOverflowing Elements:');
  console.log(JSON.stringify(overflowElements, null, 2));
});
