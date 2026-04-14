# Research: A11y deep (Theme 4)

## Source
`.hoangsa/sessions/chore/audit-full-codebase/findings/architecture-quality.md` (ARCH-003, CQ-006), `findings/tests-docs-dx.md` (A11Y-002/003/004)

## Locations matrix

### A11Y-002 — Carousel motion
- `assets/js/carousel.js:144-163` — `startAutoPlay()` chạy `setInterval(goNext, 3000)` không guard
- `assets/css/carousel.css` — chứa transitions 600ms cubic-bezier 3D rotation
- Cần thêm:
  - JS check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → skip autoplay
  - CSS `@media (prefers-reduced-motion: reduce) { .phone-item { transition: none !important; } }`
  - HTML: visible pause/play toggle button (gần carousel container, có aria-label)

### A11Y-003 — Skip link
- 4 HTML pages: `index.html`, `terms.html`, `privacy.html`, `community-standards.html`
- Mỗi page có `<main>` element nhưng không có `id` và không có skip link
- Add: `<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded">Bỏ qua đến nội dung</a>` ngay sau `<body>` open tag
- Add `id="main"` lên `<main>` mỗi page

### A11Y-004 / CQ-006 — Dead social links
- `index.html:1322` — Facebook `<a href="#!" aria-disabled="true" ... aria-label="Facebook">`
- `index.html:1327` — Instagram (same pattern)
- Replace với:
  ```html
  <span class="text-gray-500 cursor-not-allowed" role="img" aria-label="Facebook (sắp ra mắt)" title="Facebook (sắp ra mắt)">
    <svg aria-hidden="true" class="w-5 h-5" ...>...</svg>
  </span>
  ```

### ARCH-003 — phone-transition dead class
- `src/input.css:32-34`:
  ```css
  .phone-transition {
    transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
  }
  ```
- `index.html:911,921,931,941,951,961,971` — 7 `<div class="phone-item phone-transition">` elements
- `assets/js/carousel.js:76-79` — inline `phone.style.transition = 'transform 600ms cubic-bezier(...)';` (overrides class always)
- → JS wins, CSS class is dead. Delete CSS rule + remove class from 7 elements
- Note: timing constant `600ms` ở JS sẽ là single source of truth

⚠ **Coordination**: Nếu Theme 2 partial extraction xảy ra TRƯỚC, carousel slides sẽ là JSON-driven; class removal phải happen ở source HTML/JSON template + JS render

## Files affected
**MODIFY:**
- `assets/js/carousel.js` (add prefers-reduced-motion check, expose pause/play toggle)
- `assets/css/carousel.css` (add `@media (prefers-reduced-motion: reduce)` block)
- `index.html` (skip link, replace 2 social spans, remove `phone-transition` × 7, add pause/play button near carousel)
- `terms.html`, `privacy.html`, `community-standards.html` (skip link only)
- `src/input.css` (delete `.phone-transition` rule)

**Tailwind rebuild required:** Yes, vì delete CSS rule trong `src/input.css` → cần `npm run build`

## Risk
- LOW-MEDIUM
- Carousel pause toggle là feature mới, cần thiết kế UI đơn giản (có thể là button text hoặc icon)
- Skip link cần test với real screen reader (NVDA / VoiceOver) — visual test không đủ
- Nếu Theme 2 chưa merge, work duplicates với partial extraction (skip link cần thêm vào partials/header.html sau này)

## Coordination note
- **Theme 1 đã cover**: A11Y-001 (h4 typos), A11Y-005 (text-gray contrast), A11Y-006 (carousel button labels)
- **Theme 4 cover**: A11Y-002 (motion), A11Y-003 (skip), A11Y-004 (dead social), ARCH-003 (phone-transition dead class)
- Nếu Theme 2 (partials) merge trước → 4 skip links → 1 skip link trong `partials/header.html`. Spec này assume Theme 2 CHƯA merge — sẽ document cả 2 patterns trong DESIGN-SPEC
