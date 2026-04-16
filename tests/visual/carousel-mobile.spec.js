const { test, expect } = require('@playwright/test');

async function setup(p) {
  await p.goto('/');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForLoadState('networkidle');
  // Stop autoplay
  await p.evaluate(() => {
    const toggle = document.getElementById('carousel-toggle');
    if (toggle && toggle.dataset.state === 'playing') toggle.click();
  });
}

// --- Mobile tests (viewport < 768) ---

test('mobile: scroll-snap active', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const snapType = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).scrollSnapType);
  expect(snapType).toContain('x');
  expect(snapType).toContain('mandatory');
});

test('mobile: items are static (not absolute)', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const pos = await p.evaluate(() => {
    const item = document.querySelector('#phone-carousel .phone-item:not(.clone)');
    return getComputedStyle(item).position;
  });
  expect(pos).toBe('static');
});

test('mobile: item width ~75% of container', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const ratio = await p.evaluate(() => {
    const container = document.getElementById('phone-carousel');
    const item = container.querySelector('.phone-item:not(.clone)');
    return item.offsetWidth / container.offsetWidth;
  });
  expect(ratio).toBeGreaterThan(0.5);
  expect(ratio).toBeLessThan(0.9);
});

test('mobile: image border-radius is 20px', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const radius = await p.evaluate(() => {
    const img = document.querySelector('#phone-carousel .phone-item:not(.clone) img');
    return getComputedStyle(img).borderRadius;
  });
  expect(radius).toBe('20px');
});

test('mobile: scroll-behavior is smooth', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const behavior = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).scrollBehavior);
  expect(behavior).toBe('smooth');
});

test('mobile: arrows hidden', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const display = await p.evaluate(() => getComputedStyle(document.getElementById('carousel-prev')).display);
  expect(display).toBe('none');
});

test('mobile: dots exist and one is active', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const dots = await p.locator('#carousel-dots .carousel-dot').count();
  expect(dots).toBeGreaterThanOrEqual(3);
  const active = await p.locator('#carousel-dots .carousel-dot.active').count();
  expect(active).toBe(1);
});

test('mobile: clones exist with aria-hidden', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const clones = await p.evaluate(() => {
    const items = document.querySelectorAll('#phone-carousel .clone');
    return Array.from(items).map(el => ({
      ariaHidden: el.getAttribute('aria-hidden'),
      tabIndex: el.tabIndex
    }));
  });
  expect(clones.length).toBe(2);
  clones.forEach(c => {
    expect(c.ariaHidden).toBe('true');
    expect(c.tabIndex).toBe(-1);
  });
});

// --- Desktop tests ---

test('desktop: coverflow mode (no scroll-snap)', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const snapType = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).scrollSnapType);
  // Desktop should NOT have scroll-snap
  expect(snapType === 'none' || snapType === '').toBeTruthy();
});

test('desktop: items are absolute', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const pos = await p.evaluate(() => {
    const item = document.querySelector('#phone-carousel .phone-item');
    return getComputedStyle(item).position;
  });
  expect(pos).toBe('absolute');
});

test('desktop: 5 visible phones', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const visible = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#phone-carousel .phone-item'))
      .filter(el => parseFloat(el.style.opacity || '0') > 0).length;
  });
  expect(visible).toBe(5);
});

test('desktop: viewport mode is desktop', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-viewport-mode', 'desktop');
});
