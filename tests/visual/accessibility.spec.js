const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const PAGES = [
  { path: '/', name: 'index' },
  { path: '/privacy.html', name: 'privacy' },
  { path: '/terms.html', name: 'terms' },
  { path: '/community-standards.html', name: 'community-standards' },
];

for (const page of PAGES) {
  test(`${page.name}: no critical a11y violations`, async ({ page: p }) => {
    test.skip(test.info().project.name !== 'desktop');
    await p.goto(page.path);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: p })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // skip color contrast (design decision)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (critical.length > 0) {
      const summary = critical
        .map((v) => `${v.impact}: ${v.id} — ${v.help} (${v.nodes.length} nodes)`)
        .join('\n');
      expect(critical.length, `A11y violations:\n${summary}`).toBe(0);
    }
  });
}

test('carousel: prev/next buttons have accessible labels', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await p.goto('/');
  await p.waitForLoadState('networkidle');

  const prevLabel = await p.getAttribute('#carousel-prev', 'aria-label');
  const nextLabel = await p.getAttribute('#carousel-next', 'aria-label');
  expect(prevLabel).toBeTruthy();
  expect(nextLabel).toBeTruthy();
});

test('mobile menu: toggle has aria-expanded', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'mobile');
  await p.goto('/');
  await p.waitForLoadState('networkidle');

  const toggle = p.locator('#menu-toggle');
  // Initially closed
  await toggle.click();
  const expanded = await toggle.getAttribute('aria-expanded');
  expect(expanded).toBe('true');

  // Click again to close
  await toggle.click();
  const collapsed = await toggle.getAttribute('aria-expanded');
  expect(collapsed).toBe('false');
});

test('skip-to-content link exists', async ({ page: p }) => {
  test.skip(test.info().project.name !== 'desktop');
  await p.goto('/');
  await p.waitForLoadState('networkidle');

  const skipLink = p.locator('a[href="#main"]');
  await expect(skipLink).toHaveCount(1);
});
