---
spec_version: "1.0"
project: "weekend-go-web"
component: "carousel_scroll_snap"
language: "HTML / Tailwind CSS / Vanilla JavaScript"
task_type: "refactor"
category: "code"
status: "draft"
---

## Overview
[refactor]: Chuyển carousel mobile sang CSS scroll-snap native, giữ nguyên desktop coverflow

### Goal
Mobile (<768px): native scroll-snap carousel (1 center card + 2 peeks 10-15%), snap-to-center, 300ms smooth, infinite loop. Desktop (≥768px): giữ nguyên 5-phone JS coverflow.

### Context
Carousel hiện tại (sau fix/carousel-mobile-responsive) dùng JS transforms cho cả mobile lẫn desktop. User muốn mobile chuyển sang CSS scroll-snap native — mượt hơn, đúng convention mobile, không cần JS swipe handler.

### Requirements
- [REQ-01] Mobile `<768px`: CSS `scroll-snap-type: x mandatory` trên container, `scroll-snap-align: center` trên items.
- [REQ-02] Center card hiển thị 100% trong vùng an toàn. Side cards hiển thị 10-15% (peek).
- [REQ-03] Item width mobile: ~75% container width (để lại ~12.5% peek mỗi bên).
- [REQ-04] Border-radius: 20px trên phone images (mobile).
- [REQ-05] Scroll behavior: `scroll-behavior: smooth` (300ms native).
- [REQ-06] Infinite loop: clone first/last items. Khi scroll đến clone → instant jump về item thật.
- [REQ-07] Dots cập nhật theo scroll position (via `scrollend` hoặc `IntersectionObserver` fallback).
- [REQ-08] Arrows ẩn trên mobile (<768px).
- [REQ-09] Autoplay mobile: dùng `carousel.scrollTo()` thay vì transforms.
- [REQ-10] Desktop `≥768px`: giữ nguyên JS coverflow 5 phones — **không đổi behavior**.
- [REQ-11] Resize handler: khi cross 768px, chuyển đổi giữa scroll-snap mode ↔ transform mode.
- [REQ-12] `prefers-reduced-motion`: mobile vẫn hoạt động (scroll là native), desktop giữ CSS gate.
- [REQ-13] `.phone-item` trên mobile: `position: static` (in flow), trên desktop: `position: absolute` (out of flow).

### Out of Scope
- Thêm external library (Swiper.js, Framer Motion)
- Render HTML content cards (vẫn dùng ảnh)
- Đổi ảnh phone, đổi autoplay interval

---

## Types / Data Models

```js
// carousel.js — thêm

// Mode detection reuse getViewportMode() đã có
// Mobile mode = scroll-snap, Desktop mode = transform coverflow

// Clone tracking
let cloneFirst = null;  // DOM node clone of first item
let cloneLast = null;   // DOM node clone of last item

// Scroll tracking
let isScrollMode = false;  // true khi mobile, false khi desktop
```

---

## Interfaces / APIs

```js
// NEW
function initScrollMode(): void       // enable scroll-snap, create clones, setup scrollend listener
function destroyScrollMode(): void     // remove clones, restore absolute positioning
function scrollToIndex(idx: number, behavior?: 'smooth' | 'instant'): void  // mobile scroll-based navigation
function handleScrollEnd(): void       // detect current center item, update dots, handle loop jump
function handleIntersection(entries: IntersectionObserverEntry[]): void  // fallback for scrollend

// MODIFIED
function applyPositions(transition): void  // skip transforms when isScrollMode
function goTo(newCenter, direction): void   // on mobile: delegate to scrollToIndex
function goNext(): void    // on mobile: scrollToIndex(centerIndex + 1)
function goPrev(): void    // on mobile: scrollToIndex(centerIndex - 1)
function handleResize(): void  // toggle between scroll/transform modes at 768px boundary
function startAutoPlay(): void // on mobile: use scrollToIndex instead of goTo
```

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | CSS media query switch `position: static` vs `absolute` | Clean separation, no JS class toggling needed | LOCKED |
| 2 | Clone technique for infinite loop | Standard pattern (Slick, Swiper), works with scroll-snap | LOCKED |
| 3 | `scrollend` event with `IntersectionObserver` fallback | Safari 17.4+ baseline; IO fallback covers older Safari | LOCKED |
| 4 | Item width `75vw` on mobile | Gives ~12.5% peek per side = 10-15% range | FLEXIBLE |
| 5 | `scroll-behavior: smooth` CSS (not JS animation) | Native 300ms, matches user spec | LOCKED |
| 6 | Keep ALL existing desktop code paths unchanged | User requirement | LOCKED |
| 7 | Autoplay uses `scrollToIndex()` on mobile | Replaces `goTo()` transform-based approach | LOCKED |
| 8 | Swipe handlers: disabled on mobile (native scroll) | CSS scroll-snap handles touch natively | LOCKED |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| assets/css/carousel.css | MODIFY | Add mobile scroll-snap styles (flex, overflow-x, snap-type, items static); keep desktop absolute | d=1 |
| assets/js/carousel.js | MODIFY | Add scroll mode init/destroy, scrollToIndex, scrollend handler, conditional logic in applyPositions/goTo | d=1 |
| src/index.src.html | MINOR | Possibly adjust carousel HTML wrapper if needed for scroll container | d=1 |
| index.html | REBUILD | npm run build:html | N/A |
| tests/visual/carousel-mobile.spec.js | MODIFY | Rewrite mobile tests for scroll-snap behavior | d=1 |

### CSS changes (carousel.css)

```css
/* Mobile scroll-snap mode */
@media (max-width: 767px) {
  #phone-carousel {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    gap: 0.75rem;
    padding: 0 12.5%;        /* peek: container padding creates visible edges */
    height: auto;             /* let content dictate height */
    perspective: none;
    transform-style: flat;
  }

  .phone-item {
    position: static !important;
    flex: 0 0 75%;
    scroll-snap-align: center;
    transform: none !important;
    opacity: 1 !important;
    /* Reset inline styles from JS */
    z-index: auto !important;
  }

  .phone-item img {
    width: 100%;
    border-radius: 20px;
  }

  /* Hide scrollbar but keep scroll functionality */
  #phone-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  #phone-carousel::-webkit-scrollbar {
    display: none;
  }
}

/* Desktop: keep existing absolute/transform styles */
@media (min-width: 768px) {
  /* existing styles already target min-width breakpoints, unchanged */
}
```

### JS changes (carousel.js)

**initScrollMode()** — called when entering mobile mode:
```js
function initScrollMode() {
  if (isScrollMode) return;
  isScrollMode = true;

  // Remove inline styles set by transform mode
  phones.forEach(phone => {
    phone.style.cssText = '';
  });

  // Create clones for infinite loop
  cloneLast = phones[phones.length - 1].cloneNode(true);
  cloneFirst = phones[0].cloneNode(true);
  cloneLast.classList.add('clone');
  cloneFirst.classList.add('clone');
  carousel.prepend(cloneLast);   // clone of last → before first
  carousel.append(cloneFirst);   // clone of first → after last

  // Scroll to first real item (index 1 because clone-of-last is at index 0)
  requestAnimationFrame(() => {
    scrollToIndex(centerIndex, 'instant');
  });

  // Listen for scroll end
  if ('onscrollend' in window) {
    carousel.addEventListener('scrollend', handleScrollEnd);
  } else {
    // IntersectionObserver fallback
    setupScrollObserver();
  }
}
```

**destroyScrollMode()** — called when entering desktop mode:
```js
function destroyScrollMode() {
  if (!isScrollMode) return;
  isScrollMode = false;

  // Remove clones
  if (cloneLast?.parentNode) cloneLast.remove();
  if (cloneFirst?.parentNode) cloneFirst.remove();
  cloneLast = null;
  cloneFirst = null;

  carousel.removeEventListener('scrollend', handleScrollEnd);

  // Re-apply transform positions
  reorderDOM();
  applyPositions(false);
}
```

**handleScrollEnd()** — detect center item + loop jump:
```js
function handleScrollEnd() {
  const scrollLeft = carousel.scrollLeft;
  const containerWidth = carousel.offsetWidth;
  const items = Array.from(carousel.children);

  // Find item closest to center
  let closestIdx = 0;
  let closestDist = Infinity;
  items.forEach((item, i) => {
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const dist = Math.abs(itemCenter - (scrollLeft + containerWidth / 2));
    if (dist < closestDist) { closestDist = dist; closestIdx = i; }
  });

  const item = items[closestIdx];

  // Check if clone → jump to real item
  if (item.classList.contains('clone')) {
    if (item === cloneLast) {
      centerIndex = phones.length - 1;
    } else {
      centerIndex = 0;
    }
    scrollToIndex(centerIndex, 'instant');
  } else {
    // Map back to phones array index
    centerIndex = phones.indexOf(item);
  }

  updateDots(centerIndex);
  carousel.dataset.centerIndex = String(centerIndex);
}
```

**Modified goTo / goNext / goPrev:**
```js
function goTo(newCenter, direction) {
  if (isScrollMode) {
    centerIndex = newCenter;
    scrollToIndex(newCenter, 'smooth');
    updateDots(newCenter);
    return;
  }
  // ... existing transform logic unchanged ...
}
```

**Modified handleResize:**
```js
function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const current = getViewportMode();
    if (current !== lastViewportMode) {
      lastViewportMode = current;
      if (current === 'desktop') {
        destroyScrollMode();
      } else {
        initScrollMode();
      }
    }
  }, 150);
}
```

---

## Constraints
- `scrollend` fallback: IntersectionObserver with `threshold: 0.5` on each item.
- Clone nodes need `aria-hidden="true"` and `tabindex="-1"` (a11y).
- Autoplay `scrollTo()` must check `document.hidden` (already done via visibilitychange).
- `scroll-behavior: smooth` ≈ 300ms is browser-controlled — cannot guarantee exactly 300ms.
- `!important` on `.phone-item` mobile styles needed to override JS inline styles if switching mid-session.

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected |
|-----|-------------|----------|
| REQ-01 | `getComputedStyle(#phone-carousel).scrollSnapType` at viewport 375 | `x mandatory` |
| REQ-02 | Center item fully visible, side items partially visible | Visual check |
| REQ-03 | `.phone-item` width ≈ 75% of container | `offsetWidth / parentWidth ≈ 0.75` |
| REQ-04 | `getComputedStyle(.phone-item img).borderRadius` at mobile | `20px` |
| REQ-05 | `getComputedStyle(#phone-carousel).scrollBehavior` | `smooth` |
| REQ-06 | Scroll to last item → scroll further → lands on first real item | `centerIndex === 0` |
| REQ-07 | Scroll to item 3 → dot 3 has `.active` | Correct dot active |
| REQ-08 | `#carousel-prev` display at 375px | `none` |
| REQ-09 | Autoplay on mobile: carousel scrolls to next item | `scrollLeft` changes |
| REQ-10 | Viewport 1280: 5 phones with rotateY transforms | Visual + computed style |
| REQ-11 | Resize 1280→375: scroll-snap mode activates | `scrollSnapType` present |
| REQ-12 | `prefers-reduced-motion`: scroll still works | User can scroll |
| REQ-13 | `.phone-item` position at 375 = `static`, at 1280 = `absolute` | Computed style |

### Overall
```bash
npm run build
npx playwright test tests/visual/carousel-mobile.spec.js --update-snapshots
npx playwright test
```
