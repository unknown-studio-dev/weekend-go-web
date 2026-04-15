const { test, expect } = require('@playwright/test');

async function setupCarousel(p) {
  await p.goto('/');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForLoadState('networkidle');
  await p.evaluate(() => {
    const toggle = document.getElementById('carousel-toggle');
    if (toggle && toggle.dataset.state === 'playing') toggle.click();
  });
  await p.locator('#phone-carousel').scrollIntoViewIfNeeded();
}

async function countVisiblePhones(p) {
  return p.evaluate(() =>
    Array.from(document.querySelectorAll('#phone-carousel .phone-item'))
      .filter(el => parseFloat(el.style.opacity || '0') > 0).length
  );
}

test('mobile: viewport mode + 3 visible + arrows hidden', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setupCarousel(p);

  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-viewport-mode', 'mobile');

  const visibleCount = await countVisiblePhones(p);
  expect(visibleCount).toBe(3);

  // Center phone rotateY = 0 (flat on mobile)
  const centerTransform = await p.evaluate(() => {
    const items = document.querySelectorAll('#phone-carousel .phone-item');
    const center = Array.from(items).find(el => parseFloat(el.style.opacity || '0') >= 0.99);
    return center ? center.style.transform : '';
  });
  expect(centerTransform).toContain('rotateY(0deg)');

  const prevDisplay = await p.evaluate(
    () => getComputedStyle(document.getElementById('carousel-prev')).display
  );
  expect(prevDisplay).toBe('none');
});

test('tablet: viewport mode + 3 visible + arrows visible', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'tablet');
  // Playwright tablet viewport is 768 which is the "desktop" boundary; resize to 700 (in tablet range 480..767)
  await p.setViewportSize({ width: 700, height: 1024 });
  await setupCarousel(p);

  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-viewport-mode', 'tablet');

  const visibleCount = await countVisiblePhones(p);
  expect(visibleCount).toBe(3);

  const prevDisplay = await p.evaluate(
    () => getComputedStyle(document.getElementById('carousel-prev')).display
  );
  expect(prevDisplay).not.toBe('none');
});

test('desktop: viewport mode + 5 visible + arrows visible', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setupCarousel(p);

  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-viewport-mode', 'desktop');

  const visibleCount = await countVisiblePhones(p);
  expect(visibleCount).toBe(5);

  const prevDisplay = await p.evaluate(
    () => getComputedStyle(document.getElementById('carousel-prev')).display
  );
  expect(prevDisplay).not.toBe('none');
});

test('dots: count matches phone items, exactly 1 active', async ({ page: p }) => {
  test.skip(test.info().project.name === 'wide');
  await setupCarousel(p);

  const phoneCount = await p.locator('#phone-carousel .phone-item').count();
  const dotsCount = await p.locator('#carousel-dots .carousel-dot').count();
  expect(dotsCount).toBe(phoneCount);

  const activeCount = await p.locator('#carousel-dots .carousel-dot.active').count();
  expect(activeCount).toBe(1);
});

test('dots clickable on desktop changes centerIndex', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setupCarousel(p);

  await p.locator('#carousel-dots .carousel-dot').nth(3).click();
  await p.waitForTimeout(100);

  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-center-index', '3');
});

test('dots noop on mobile (pointer-events none)', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setupCarousel(p);

  const before = await p.locator('#phone-carousel').getAttribute('data-center-index');
  await p.locator('#carousel-dots .carousel-dot').nth(3).click({ force: true });
  await p.waitForTimeout(100);
  const after = await p.locator('#phone-carousel').getAttribute('data-center-index');

  expect(after).toBe(before);
});

test('prev/next buttons change center on desktop', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setupCarousel(p);

  const before = parseInt(
    await p.locator('#phone-carousel').getAttribute('data-center-index'),
    10
  );
  await p.locator('#carousel-next').click();
  await p.waitForTimeout(100);
  const after = parseInt(
    await p.locator('#phone-carousel').getAttribute('data-center-index'),
    10
  );

  expect(after).not.toBe(before);
});

test('touch-action on #phone-carousel is pan-y', async ({ page: p }) => {
  test.skip(test.info().project.name === 'wide');
  await setupCarousel(p);

  const touchAction = await p.evaluate(
    () => getComputedStyle(document.getElementById('phone-carousel')).touchAction
  );
  expect(touchAction).toBe('pan-y');
});

test('mobile: carousel height is 360px', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setupCarousel(p);

  const height = await p.evaluate(
    () => getComputedStyle(document.getElementById('phone-carousel')).height
  );
  expect(height).toBe('360px');
});

test('reduced-motion disables transition on phone-item (desktop)', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  const p = await ctx.newPage();
  try {
    await p.goto('/');
    await p.evaluate(() => document.fonts.ready);
    await p.waitForLoadState('networkidle');
    await p.evaluate(() => {
      const toggle = document.getElementById('carousel-toggle');
      if (toggle && toggle.dataset.state === 'playing') toggle.click();
    });
    await p.locator('#phone-carousel').scrollIntoViewIfNeeded();

    const transitionProp = await p.evaluate(() => {
      const item = document.querySelector('#phone-carousel .phone-item');
      return item ? getComputedStyle(item).transitionProperty : '';
    });
    expect(transitionProp).toBe('none');
  } finally {
    await ctx.close();
  }
});
