---
spec_version: "1.0"
project: "weekend-go-web"
component: "a11y_deep"
language: "html-tailwindcss-js"
task_type: "fix"
category: "code"
status: "draft"
---

## Overview
[fix]: Theme 4 — accessibility deep dive

### Goal
Carousel respects `prefers-reduced-motion`, có visible pause/play; mọi page có skip-to-content link; dead `<a href="#!">` social → `<span role="img">`; xóa dead `phone-transition` CSS class.

### Context
AUDIT: WCAG 2.2.2 (Pause/Stop/Hide) Level A vi phạm; 4 pages thiếu skip link làm keyboard users tab qua 5+ nav links mỗi trang; dead `aria-disabled` trên `<a>` không được browser respect; dead CSS class confuses maintainers.

### Requirements
- [REQ-01] Carousel autoplay skip nếu `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`
- [REQ-02] CSS `@media (prefers-reduced-motion: reduce)` disable `.phone-item` transitions trong `assets/css/carousel.css`
- [REQ-03] Visible pause/play toggle button gần carousel — `aria-label="Tạm dừng tự động chuyển ảnh"` / `"Tiếp tục tự động chuyển ảnh"`, toggle text dựa state
- [REQ-04] Skip-link element là first child của `<body>` trên 4 pages, target `<main id="main">`
- [REQ-05] `<main>` element có `id="main"` trên 4 pages
- [REQ-06] 2 dead social FB/IG `<a href="#!">` thay bằng `<span role="img" aria-label="X (sắp ra mắt)" title="X (sắp ra mắt)">` với SVG aria-hidden
- [REQ-07] Xóa `.phone-transition` CSS rule khỏi `src/input.css`
- [REQ-08] Xóa class `phone-transition` khỏi 7 `<div class="phone-item phone-transition">` trong `index.html`
- [REQ-09] Rebuild `assets/css/styles.css` (Tailwind compile sau khi sửa input.css)

### Out of Scope
- Theme 1 quick wins (đã cover h4, contrast, carousel button labels)
- Theme 2 partials
- Form/link a11y khác (không có form trong site)

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Pause/play toggle là `<button>` với 2 SVG icon swap (pause / play), text via aria-label | Native button = native a11y; SVG icon đẹp hơn text-only | LOCKED |
| 2 | Pause toggle position: ngay dưới carousel container, center-align | Phù hợp với design hiện tại; user dễ thấy | LOCKED |
| 3 | Skip-link styling: `sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded` | Pattern Tailwind chuẩn; hidden by default, visible khi focus | LOCKED |
| 4 | Replace social `<a>` với `<span>` thay vì `<button disabled>` | `<button disabled>` vẫn focusable; `<span>` non-focusable, đúng semantics cho "not yet available" | LOCKED |
| 5 | Pause state mặc định = playing (autoplay on) khi reduced-motion = false | Giữ behavior cũ cho 95% users; chỉ adapt khi user request | LOCKED |
| 6 | Pause state mặc định = paused khi reduced-motion = true | Người dùng đã opt out motion, không nên auto-resume | LOCKED |

### Affected Files
| File | Action | Description |
|------|--------|-------------|
| `assets/js/carousel.js` | MODIFY | Wrap `startAutoPlay()` với reduced-motion check; expose `pause()` / `resume()` API; bind to toggle button |
| `assets/css/carousel.css` | MODIFY | Add `@media (prefers-reduced-motion: reduce) { .phone-item { transition: none !important; } }` |
| `src/input.css` | MODIFY | Delete `.phone-transition` rule (lines 32-34) |
| `index.html` | MODIFY (~10 chỗ) | Add skip-link (after `<body>`); add `id="main"` lên `<main>`; remove `phone-transition` × 7 from `.phone-item`; add pause/play toggle button below carousel; replace 2 social `<a>` → `<span>` |
| `terms.html`, `privacy.html`, `community-standards.html` | MODIFY (2 chỗ each) | Skip-link + `id="main"` |
| `assets/css/styles.css` | REGENERATE | `npm run build` |

### Key snippets

**Skip-link (insert after `<body>` open):**
```html
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded">
  Bỏ qua đến nội dung
</a>
```

**Pause/play button (after carousel container):**
```html
<div class="flex justify-center mt-4">
  <button id="carousel-toggle" type="button" class="text-text-secondary hover:text-text-primary inline-flex items-center gap-2" aria-label="Tạm dừng tự động chuyển ảnh">
    <svg id="carousel-toggle-icon" aria-hidden="true" class="w-5 h-5">
      <!-- pause icon by default; replaced with play when paused -->
      <use href="#icon-pause"/>
    </svg>
  </button>
</div>
```

**carousel.js additions:**
```js
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let isPaused = reducedMotion; // default paused if user opt-out

function startAutoPlay() {
  if (autoTimer) clearInterval(autoTimer);
  if (isPaused) return;
  autoTimer = setInterval(goNext, 3000);
}

function togglePause() {
  isPaused = !isPaused;
  const btn = document.getElementById('carousel-toggle');
  btn.setAttribute('aria-label', isPaused ? 'Tiếp tục tự động chuyển ảnh' : 'Tạm dừng tự động chuyển ảnh');
  // swap icon via <use href="#icon-play"/> or "#icon-pause"
  if (isPaused) clearInterval(autoTimer);
  else startAutoPlay();
}

document.getElementById('carousel-toggle')?.addEventListener('click', togglePause);
```

**carousel.css addition:**
```css
@media (prefers-reduced-motion: reduce) {
  .phone-item {
    transition: none !important;
  }
}
```

**Dead social replacement (index.html:1322,1327):**
```diff
- <a href="#!" aria-disabled="true" class="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
-   <svg ...>...</svg>
- </a>
+ <span class="text-gray-500 cursor-not-allowed" role="img" aria-label="Facebook (sắp ra mắt)" title="Facebook (sắp ra mắt)">
+   <svg aria-hidden="true" class="w-5 h-5" ...>...</svg>
+ </span>
```

---

## Constraints
- KHÔNG break carousel autoplay cho user thông thường (default = playing nếu không reduced-motion)
- KHÔNG hide pause button — visible cho mọi user
- Skip-link KHÔNG affect visual layout (chỉ visible khi focus)

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected |
|-----|-------------|----------|
| REQ-01 | `grep -q "prefers-reduced-motion" assets/js/carousel.js && grep -q "matchMedia" assets/js/carousel.js` | exit 0 |
| REQ-02 | `grep -q "prefers-reduced-motion" assets/css/carousel.css` | exit 0 |
| REQ-03 | `grep -q 'id="carousel-toggle"' index.html && grep -q "togglePause" assets/js/carousel.js` | exit 0 |
| REQ-04 | `for f in index terms privacy community-standards; do grep -q 'href="#main"' $f.html || exit 1; done` | exit 0 |
| REQ-05 | `for f in index terms privacy community-standards; do grep -qE '<main[^>]*id="main"' $f.html || exit 1; done` | exit 0 |
| REQ-06 | `! grep -q 'href="#!" aria-disabled="true"' index.html && grep -c 'aria-label="Facebook (sắp ra mắt)"' index.html` | second part = 1 |
| REQ-07 | `! grep -q '\.phone-transition' src/input.css` | exit 0 |
| REQ-08 | `! grep -q 'phone-item phone-transition' index.html && grep -c 'class="phone-item' index.html` | second = 7 |
| REQ-09 | `npm run build` exits 0; `assets/css/styles.css` mtime updated; not contains `.phone-transition` | observed |

### Overall
1. Browser DevTools → emulate `prefers-reduced-motion: reduce` → carousel KHÔNG autoplay; pause icon shows "play"
2. Tab into page from address bar → first Tab focus reveals "Bỏ qua đến nội dung" link top-left; Enter jumps to `<main>`
3. Click pause toggle → autoplay stops; click again → resumes
4. Hover Facebook/Instagram icons → cursor `not-allowed`, tooltip "sắp ra mắt"; cannot click/focus
5. Screen reader (VoiceOver/NVDA) announces pause button purpose
