const { test, expect } = require('@playwright/test');

async function setup(p) {
  await p.goto('/');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForLoadState('networkidle');
}

// --- Mobile tests (viewport < 1024) ---

test('mobile: image border-radius is 20px', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const radius = await p.evaluate(() => {
    const img = document.querySelector('#phone-carousel .phone-item img');
    return getComputedStyle(img).borderRadius;
  });
  expect(radius).toBe('20px');
});

test('mobile: dots exist and one is active', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const dots = await p.locator('#carousel-dots .carousel-dot').count();
  expect(dots).toBeGreaterThanOrEqual(3);
  const active = await p.locator('#carousel-dots .carousel-dot.active').count();
  expect(active).toBe(1);
});

// --- CoverFlow tests (mobile viewport, 3D transform-based) ---

test('scale-center: items are absolute positioned', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const pos = await p.evaluate(() => {
    const item = document.querySelector('#phone-carousel .phone-item');
    return getComputedStyle(item).position;
  });
  expect(pos).toBe('absolute');
});

test('scale-center: no scroll-snap', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const snapType = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).scrollSnapType);
  expect(snapType === 'none' || snapType === '').toBeTruthy();
});

test('scale-center: 3 visible items (center + 2 sides)', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const visible = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#phone-carousel .phone-item'))
      .filter(el => parseFloat(el.style.opacity || getComputedStyle(el).opacity || '0') > 0).length;
  });
  expect(visible).toBeGreaterThanOrEqual(3);
});

test('scale-center: center item has scale 1.0', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const scale = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    const centerItem = items[2];
    if (!centerItem) return null;
    const transform = centerItem.style.transform || getComputedStyle(centerItem).transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
  });
  expect(scale).toBeGreaterThan(0.95);
});

test('scale-center: side items have reduced scale', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const scales = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    return [1, 3].map(i => {
      const item = items[i];
      if (!item) return null;
      const transform = item.style.transform || getComputedStyle(item).transform;
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    });
  });
  scales.forEach(s => {
    if (s !== null) expect(s).toBeLessThan(1.0);
  });
});

test('scale-center: viewport mode is coverflow', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-viewport-mode', 'coverflow');
});

test('scale-center: prev/next buttons visible', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const display = await p.evaluate(() => getComputedStyle(document.getElementById('carousel-prev')).display);
  expect(display).not.toBe('none');
});

test('scale-center: dots clickable', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const pointerEvents = await p.evaluate(() => {
    const dot = document.querySelector('#carousel-dots .carousel-dot');
    return dot ? getComputedStyle(dot).pointerEvents : null;
  });
  expect(pointerEvents).not.toBe('none');
});

// --- Mobile 3D CoverFlow tests ---

test('mobile: 3D perspective active', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const perspective = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).perspective);
  expect(perspective).toBe('1200px');
});

test('mobile: side items have rotateY', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const hasRotateY = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    return [1, 3].some(i => {
      const item = items[i];
      if (!item) return false;
      const transform = item.style.transform || getComputedStyle(item).transform;
      return /rotateY\s*\(\s*(?!0deg|0rad|0turn|0grad)/.test(transform);
    });
  });
  expect(hasRotateY).toBe(true);
});

test('mobile: center has translateZ', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const hasTranslateZ = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    const centerItem = items[2];
    if (!centerItem) return false;
    const transform = centerItem.style.transform || getComputedStyle(centerItem).transform;
    return /translateZ/.test(transform);
  });
  expect(hasTranslateZ).toBe(true);
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

test('desktop: viewport mode is coverflow', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-viewport-mode', 'coverflow');
});

test('desktop: perspective is set', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const perspective = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).perspective);
  expect(perspective !== 'none' && perspective !== '').toBeTruthy();
});

test('desktop: center has translateZ(150px)', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const hasTranslateZ150 = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    const centerItem = items[2];
    if (!centerItem) return false;
    const transform = centerItem.style.transform || getComputedStyle(centerItem).transform;
    return /translateZ\s*\(\s*150px\s*\)/.test(transform);
  });
  expect(hasTranslateZ150).toBe(true);
});

test('desktop: perspective is 1200px', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const perspective = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).perspective);
  expect(perspective).toBe('1200px');
});

// --- Interaction tests ---

test('click side item navigates', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const initialIndex = await p.evaluate(() => {
    const carousel = document.getElementById('phone-carousel');
    return parseInt(carousel.dataset.centerIndex || carousel.getAttribute('data-center-index') || '2');
  });
  // Click the right side item (index 3)
  await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    const rightItem = items[3];
    if (rightItem) rightItem.click();
  });
  await p.waitForTimeout(500);
  const newIndex = await p.evaluate(() => {
    const carousel = document.getElementById('phone-carousel');
    return parseInt(carousel.dataset.centerIndex || carousel.getAttribute('data-center-index') || '2');
  });
  expect(newIndex).not.toBe(initialIndex);
});

test('hover pauses autoplay', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const carousel = p.locator('#phone-carousel');
  const indexBefore = await p.evaluate(() => {
    const el = document.getElementById('phone-carousel');
    return parseInt(el.dataset.centerIndex || el.getAttribute('data-center-index') || '2');
  });
  // Hover over carousel to pause autoplay
  await carousel.dispatchEvent('mouseenter');
  await p.waitForTimeout(3500);
  const indexAfter = await p.evaluate(() => {
    const el = document.getElementById('phone-carousel');
    return parseInt(el.dataset.centerIndex || el.getAttribute('data-center-index') || '2');
  });
  expect(indexAfter).toBe(indexBefore);
});

test('hidden items have pointer-events none', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const pointerEvents = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    return [0, 4].map(i => {
      const item = items[i];
      return item ? getComputedStyle(item).pointerEvents : null;
    });
  });
  pointerEvents.forEach(pe => {
    if (pe !== null) expect(pe).toBe('none');
  });
});

test('overflow visible on carousel', async ({ page: p }) => {
  await setup(p);
  const overflow = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).overflow);
  expect(overflow).toBe('visible');
});

test('container uses min-height', async ({ page: p }) => {
  await setup(p);
  const minHeight = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).minHeight);
  expect(minHeight).toContain('vh');
});

// --- Image order tests ---

test('images: correct order', async ({ page: p }) => {
  await setup(p);
  const srcs = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#phone-carousel .phone-item img'))
      .map(img => img.src || img.getAttribute('src'));
  });
  const expected = [
    'venue-detail',
    'newsfeed',
    'user-profile',
    'share-review',
    'AI-review',
    'create-post',
    'weekend-plan',
    'plan-list',
  ];
  expected.forEach((name, i) => {
    expect(srcs[i]).toContain(name);
  });
});
