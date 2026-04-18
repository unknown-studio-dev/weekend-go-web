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
  expect(['none', '']).toContain(snapType);
});

test('scale-center: 3 visible items (center + 2 sides)', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const visible = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#phone-carousel .phone-item'))
      .filter(el => parseFloat(el.style.opacity || getComputedStyle(el).opacity || '0') > 0).length;
  });
  expect(visible).toBe(3);
});

test('scale-center: center item has scale >= 0.9', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const scale = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    const centerItem = items[1]; // mobile: 3 visible slots, center is index 1
    if (!centerItem) return null;
    const transform = centerItem.style.transform || getComputedStyle(centerItem).transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
  });
  expect(scale).toBeGreaterThanOrEqual(0.9);
});

test('scale-center: side items have reduced scale', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const scales = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    return [0, 2].map(i => { // mobile: 3 visible slots, sides are 0 and 2
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

test('scale-center: viewport mode is scale-center on mobile', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  await expect(p.locator('#phone-carousel')).toHaveAttribute('data-viewport-mode', 'scale-center');
});

test('scale-center: prev/next buttons visible', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const display = await p.evaluate(() => getComputedStyle(document.getElementById('carousel-prev')).display);
  expect(display).not.toBe('none');
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
    return [0, 2].some(i => { // mobile: sides are index 0 and 2
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
    const centerItem = items[1]; // mobile center is index 1
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
  expect(['none', '']).toContain(snapType);
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

test('desktop: perspective is 1200px', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const perspective = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).perspective);
  expect(perspective).toBe('1200px');
});

test('desktop: center has translateZ(0px)', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const transform = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    const centerItem = items[2]; // desktop center is index 2
    if (!centerItem) return '';
    return centerItem.style.transform || getComputedStyle(centerItem).transform;
  });
  expect(transform).toContain('translateZ(0px)');
});

// --- Interaction tests ---

test('click side item navigates', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const initialIndex = await p.evaluate(() => {
    return parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0');
  });
  // Click the right side item (index 3)
  await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    const rightItem = items[3];
    if (rightItem) rightItem.click();
  });
  // Wait for data attribute to change instead of fixed timeout
  await p.waitForFunction(
    (prev) => document.getElementById('phone-carousel').dataset.centerIndex !== String(prev),
    initialIndex,
    { timeout: 2000 }
  );
  const newIndex = await p.evaluate(() => {
    return parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0');
  });
  expect(newIndex).not.toBe(initialIndex);
});

test('hover pauses autoplay', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await setup(p);
  const carousel = p.locator('#phone-carousel');
  const indexBefore = await p.evaluate(() => {
    return parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0');
  });
  // Hover over carousel to pause autoplay
  await carousel.dispatchEvent('mouseenter');
  // Wait longer than autoplay interval (3000ms) to confirm it stays paused
  await p.waitForTimeout(3500);
  const indexAfter = await p.evaluate(() => {
    return parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0');
  });
  expect(indexAfter).toBe(indexBefore);
});

test('hidden items have pointer-events none', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const hiddenItems = await p.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#phone-carousel .phone-item'));
    // Items beyond visible slots (mobile has 3 visible, rest are hidden)
    return items.slice(3).map(item => item.style.pointerEvents || getComputedStyle(item).pointerEvents);
  });
  hiddenItems.forEach(pe => {
    expect(pe).toBe('none');
  });
});

test('overflow visible on carousel', async ({ page: p }) => {
  await setup(p);
  const overflow = await p.evaluate(() => getComputedStyle(document.getElementById('phone-carousel')).overflow);
  expect(overflow).toBe('visible');
});

test('carousel has fixed px height', async ({ page: p }) => {
  await setup(p);
  const height = await p.evaluate(() => {
    const h = getComputedStyle(document.getElementById('phone-carousel')).height;
    return parseInt(h);
  });
  expect(height).toBeGreaterThanOrEqual(360);
});

// --- Swipe / Touch tests ---

test('swipe left triggers goNext on mobile', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const initialIndex = await p.evaluate(() =>
    parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0')
  );
  const box = await p.locator('#phone-carousel').boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  // Swipe left (finger moves right to left)
  await p.touchscreen.tap(centerX + 80, centerY);
  await p.mouse.move(centerX + 80, centerY);
  await p.dispatchEvent('#phone-carousel', 'touchstart', {
    touches: [{ clientX: centerX + 80, clientY: centerY }],
  });
  await p.dispatchEvent('#phone-carousel', 'touchend', {
    changedTouches: [{ clientX: centerX - 80, clientY: centerY }],
  });
  await p.waitForTimeout(700);
  const newIndex = await p.evaluate(() =>
    parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0')
  );
  expect(newIndex).not.toBe(initialIndex);
});

test('swipe right triggers goPrev on mobile', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  // First navigate forward so we can go back
  await p.evaluate(() => {
    document.querySelector('#carousel-next').click();
  });
  await p.waitForTimeout(700);
  const initialIndex = await p.evaluate(() =>
    parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0')
  );
  const box = await p.locator('#phone-carousel').boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  // Swipe right (finger moves left to right)
  await p.dispatchEvent('#phone-carousel', 'touchstart', {
    touches: [{ clientX: centerX - 80, clientY: centerY }],
  });
  await p.dispatchEvent('#phone-carousel', 'touchend', {
    changedTouches: [{ clientX: centerX + 80, clientY: centerY }],
  });
  await p.waitForTimeout(700);
  const newIndex = await p.evaluate(() =>
    parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0')
  );
  expect(newIndex).not.toBe(initialIndex);
});

test('short swipe does not navigate', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await setup(p);
  const initialIndex = await p.evaluate(() =>
    parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0')
  );
  const box = await p.locator('#phone-carousel').boundingBox();
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  // Short swipe (< SWIPE_DISTANCE_MIN_PX = 25px)
  await p.dispatchEvent('#phone-carousel', 'touchstart', {
    touches: [{ clientX: centerX, clientY: centerY }],
  });
  await p.dispatchEvent('#phone-carousel', 'touchend', {
    changedTouches: [{ clientX: centerX - 10, clientY: centerY }],
  });
  await p.waitForTimeout(700);
  const newIndex = await p.evaluate(() =>
    parseInt(document.getElementById('phone-carousel').dataset.centerIndex || '0')
  );
  expect(newIndex).toBe(initialIndex);
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
