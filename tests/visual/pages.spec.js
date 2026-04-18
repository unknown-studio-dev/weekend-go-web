const { test, expect } = require('@playwright/test');

const PAGES = [
  { path: '/',                         name: 'index' },
  { path: '/privacy.html',             name: 'privacy' },
  { path: '/terms.html',               name: 'terms' },
  { path: '/community-standards.html', name: 'community-standards' },
];

for (const page of PAGES) {
  test(`${page.name} visual`, async ({ page: p }) => {
    await p.goto(page.path);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForLoadState('networkidle');
    // Pause carousel autoplay to get consistent screenshots
    await p.evaluate(() => {
      const carousel = document.getElementById('phone-carousel');
      if (carousel) carousel.dispatchEvent(new Event('mouseenter'));
    });
    await expect(p).toHaveScreenshot(`${page.name}.png`, { fullPage: true });
  });
}
