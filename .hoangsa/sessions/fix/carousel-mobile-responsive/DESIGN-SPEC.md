---
spec_version: "2.0"
project: "weekend-go-web"
component: "phone_carousel_mobile_responsive"
language: "HTML / Tailwind CSS / Vanilla JavaScript"
task_type: "fix"
category: "code"
status: "draft"
supersedes: "v1.0"
---

## Overview
[fix]: Responsive carousel "Xem trước ứng dụng" theo mobile UX patterns chuẩn (App Store / Play Store / Instagram), a11y-safe cho vestibular users.

### Goal
Layout 3 tầng: `<480px` 1 center + 2 peeks (flat), `480-767px` 3 phones (nhẹ rotation), `≥768px` giữ 5 phones 3D coverflow như cũ. Swipe + dots + a11y.

### Context
DESIGN-SPEC v1 đã approve pure-1-phone mode cho mobile. Research sâu (RESEARCH-v2.md, 30 sources) cho thấy:
- App Store/Play Store/Instagram đều dùng "peek pattern" chứ không 1-phone pure → user cần edge peek để biết "swipe được".
- Side arrow buttons ở mid-line carousel = Hard zone thumb cho one-handed usage (Hoober 2024-2025 data).
- `rotateY` coverflow = WCAG 2.3.3 vestibular trigger (3D plane shift) → cần tắt hoặc gate behind `prefers-reduced-motion`.
- iOS Safari dynamic toolbar + `dvh` causes jitter → dùng fixed px hoặc `svh`.

### Requirements
- [REQ-01] Mobile `<480px`: 1 phone center (72-78% viewport width) + 2 peek cards (8-12% per side), **rotateY = 0°** (flat).
- [REQ-02] Tablet `480-767px`: 3 phones (center + left + right), rotateY ±15° (nhẹ hơn desktop), far-left/far-right ẩn.
- [REQ-03] Desktop `≥768px`: giữ nguyên 5 phones với rotateY ±45°/±25° hiện tại.
- [REQ-04] Mobile: **ẩn hoàn toàn nút `#carousel-prev` và `#carousel-next`**. Tablet + Desktop: vẫn hiển thị.
- [REQ-05] Thêm dots indicator (7 dots cho 7 phones) dưới carousel, visible ở mọi viewport. Mobile: decorative (không tap — kích thước quá nhỏ theo Baymard). Desktop/Tablet: clickable để jump.
- [REQ-06] Swipe: distance threshold `max(25px, 15% carousel width)`, velocity threshold `0.3 px/ms` (flick).
- [REQ-07] `touch-action: pan-y` trên `#phone-carousel`, passive listeners, **không gọi `preventDefault`** trong touchmove.
- [REQ-08] Directional lock: 10px deadzone — nếu 10px đầu di chuyển dọc > ngang → không trigger swipe (cho phép page scroll).
- [REQ-09] Window resize: re-compute layout, debounced 150ms.
- [REQ-10] `@media (prefers-reduced-motion: no-preference)` gates tất cả rotateY transforms. Khi user prefers reduced: rotateY = 0° ở mọi viewport.
- [REQ-11] Carousel height: mobile 360px, tablet 500px, desktop 580px — tất cả fixed px (không `vh`/`dvh`).
- [REQ-12] Center phone image size mobile: base width CSS đổi từ 10rem → 15rem (240px) để đủ lớn khi scale = 1.0.

### Out of Scope
- CSS scroll-snap (vẫn dùng JS transform)
- Keyboard arrow navigation (task follow-up)
- Changing autoplay interval/behavior
- Changing section header, background, text

---

## Types / Data Models

```js
// assets/js/carousel.js

const BREAKPOINT_XS = 480;
const BREAKPOINT_SM = 640;
const BREAKPOINT_MD = 768;   // tablet boundary
const BREAKPOINT_LG = 1024;

// Viewport mode
type ViewportMode = 'mobile' | 'tablet' | 'desktop';

// Position config (scale, rotateY, translateX, opacity, zIndex)
// Different POSITIONS_* arrays per mode
const POSITIONS_DESKTOP = [...]; // 5 visible — current
const POSITIONS_TABLET  = [...]; // 3 visible + 2 hidden
const POSITIONS_MOBILE  = [...]; // 1 center + 2 peeks + 4 hidden (flat)

// Swipe tuning
const SWIPE_DISTANCE_MIN_PX = 25;
const SWIPE_DISTANCE_RATIO = 0.15;  // 15% of carousel width
const SWIPE_VELOCITY_FLICK = 0.3;   // px/ms
const SWIPE_DEADZONE_PX = 10;
const SWIPE_LOCK_RATIO = 1.2;       // |dx|/|dy| > ratio → horizontal lock

// Swipe state
let touchStart: { x: number; y: number; t: number } | null;
let touchLock: 'none' | 'horizontal' | 'vertical';
```

### POSITIONS configs

```js
// DOM indices 0..4 → slots -2, -1, 0, +1, +2 (center is DOM index 2)

// Desktop: current behavior (unchanged)
const POSITIONS_DESKTOP = [
  { scale: 0.45, rotateY: 45,  translateX: -420, opacity: 0.4, zIndex: 2  }, // -2
  { scale: 0.6,  rotateY: 40,  translateX: -230, opacity: 0.7, zIndex: 5  }, // -1
  { scale: 0.8,  rotateY: 0,   translateX: 0,    opacity: 1.0, zIndex: 10 }, //  0
  { scale: 0.6,  rotateY: -40, translateX: 230,  opacity: 0.7, zIndex: 5  }, // +1
  { scale: 0.45, rotateY: -45, translateX: 420,  opacity: 0.4, zIndex: 2  }, // +2
];

// Tablet: 3 visible — softer rotation
const POSITIONS_TABLET = [
  HIDDEN,                                                                     // -2
  { scale: 0.88, rotateY: 15,  translateX: -180, opacity: 0.7, zIndex: 5  }, // -1
  { scale: 1.0,  rotateY: 0,   translateX: 0,    opacity: 1.0, zIndex: 10 }, //  0
  { scale: 0.88, rotateY: -15, translateX: 180,  opacity: 0.7, zIndex: 5  }, // +1
  HIDDEN,                                                                     // +2
];

// Mobile: center + 2 peeks, flat (no rotateY)
// Center phone ≈ 240px wide (75% of 320px safe viewport).
// Peek offset = center_width/2 + peek_visible_width (peek visible ~28px = ~10% of 280px)
const POSITIONS_MOBILE = [
  HIDDEN,                                                                     // -2
  { scale: 0.82, rotateY: 0,   translateX: -170, opacity: 0.55, zIndex: 5 }, // -1 peek
  { scale: 1.0,  rotateY: 0,   translateX: 0,    opacity: 1.0,  zIndex: 10 },//  0 center
  { scale: 0.82, rotateY: 0,   translateX: 170,  opacity: 0.55, zIndex: 5 }, // +1 peek
  HIDDEN,                                                                     // +2
];

const HIDDEN = { scale: 0.5, rotateY: 0, translateX: 0, opacity: 0, zIndex: 0 };
```

---

## Interfaces / APIs

```js
// New
function getViewportMode(): 'mobile' | 'tablet' | 'desktop'
function getPositions(): Position[]            // returns POSITIONS_* for current mode
function getSwipeThreshold(): number           // max(25, 0.15 * carouselWidth)
function handleResize(): void                  // debounced 150ms
function handleTouchStart(e: TouchEvent): void // passive
function handleTouchMove(e: TouchEvent): void  // passive, direction lock only (no preventDefault)
function handleTouchEnd(e: TouchEvent): void   // passive, trigger swipe if threshold met
function buildDots(): void                     // create dot elements
function updateDots(activeIndex: number): void

// Modified
function applyPositions(transition: boolean): void  // uses getPositions()
function goTo(newCenter, direction): void           // also calls updateDots()
```

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | 3 arrays `POSITIONS_*` per mode thay vì mutate 1 array | Clearer, immutable, easier to debug | LOCKED |
| 2 | Mobile peek translateX = 170px | Center 240px + peek visible ~30px + gap ≈ 170px offset từ center | LOCKED |
| 3 | Mobile flat (rotateY 0) regardless of reduced-motion | Double safety + clean peek look | LOCKED |
| 4 | Dots: 7 dots (= total phones), positioned `absolute bottom-4 left-1/2` | Canh giữa, gần bottom-easy-zone thumb | LOCKED |
| 5 | Dots mobile: `pointer-events: none` + reduced opacity để nhấn mạnh decorative | Baymard: dots quá nhỏ cho tap | LOCKED |
| 6 | Prev/Next buttons ẩn bằng CSS `@media (max-width: 479px) { display: none }` | Giữ HTML, tránh JS complexity | LOCKED |
| 7 | touchmove chỉ dùng để direction-lock, KHÔNG `preventDefault` | passive listener safe + `touch-action: pan-y` handles scroll intent | LOCKED |
| 8 | Velocity = dx/dt dựa trên timestamp của touchstart và touchend | Đơn giản, không cần rAF | LOCKED |
| 9 | `@media (prefers-reduced-motion: no-preference)` wrap CSS transforms (qua JS hoặc CSS var) | WCAG 2.3.3 AAA | LOCKED |
| 10 | Image base CSS width mobile: 10rem → 15rem (240px) | Center scale=1.0 đủ to | LOCKED |
| 11 | Desktop/tablet behavior unchanged khi reduced-motion | Mobile đã flat rồi, chỉ tablet/desktop gate rotateY | LOCKED |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| [assets/js/carousel.js](../../../../assets/js/carousel.js) | MODIFY | Add `BREAKPOINT_MD`, 3 POSITIONS arrays, `getViewportMode()`, `getPositions()`, swipe handlers với direction lock + velocity, dots builder/updater, resize handler | d=1 |
| [assets/css/carousel.css](../../../../assets/css/carousel.css) | MODIFY | Height 440→360 mobile; `.phone-item img` width 10rem→15rem mobile; `touch-action: pan-y` on `#phone-carousel`; hide `#carousel-prev/next` mobile; dots CSS; `@media (prefers-reduced-motion)` wrapper cho CSS transforms base | d=1 |
| [src/index.src.html](../../../../src/index.src.html) | MODIFY | Thêm `<div id="carousel-dots">` sau carousel, aria-label | d=1 |
| [index.html](../../../../index.html) | REBUILD | `npm run build:html` | N/A |

### Core logic changes

**1. `getViewportMode()` + `getPositions()`**
```js
function getViewportMode() {
  const w = window.innerWidth;
  if (w < BREAKPOINT_XS) return 'mobile';    // <480
  if (w < BREAKPOINT_MD) return 'tablet';    // 480-767
  return 'desktop';                          // ≥768
}

function getPositions() {
  switch (getViewportMode()) {
    case 'mobile':  return POSITIONS_MOBILE;
    case 'tablet':  return POSITIONS_TABLET;
    default:        return POSITIONS_DESKTOP;
  }
}
```

**2. `applyPositions()` uses `getPositions()`**
```js
function applyPositions(transition) {
  const items = carousel.querySelectorAll(".phone-item");
  const positions = getPositions();
  items.forEach((phone, domIndex) => {
    const pos = domIndex < positions.length ? positions[domIndex] : HIDDEN;
    // spread logic REMOVED — pre-computed translateX in each POSITIONS_* array
    // (scales are already tuned per mode)
    phone.style.transition = transition
      ? `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${ANIMATION_DURATION_MS}ms`
      : 'none';
    phone.style.transform = `translate(-50%, -50%) translateX(${pos.translateX}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`;
    phone.style.opacity = pos.opacity;
    phone.style.zIndex = pos.zIndex;
  });
  updateDots(centerIndex);
}
```

**3. Swipe handlers with direction lock + velocity**
```js
carousel.addEventListener('touchstart', (e) => {
  touchStart = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
    t: performance.now(),
  };
  touchLock = 'none';
}, { passive: true });

carousel.addEventListener('touchmove', (e) => {
  if (!touchStart || touchLock !== 'none') return;
  const dx = Math.abs(e.touches[0].clientX - touchStart.x);
  const dy = Math.abs(e.touches[0].clientY - touchStart.y);
  const d  = Math.max(dx, dy);
  if (d < SWIPE_DEADZONE_PX) return;
  touchLock = (dx / (dy || 0.0001) > SWIPE_LOCK_RATIO) ? 'horizontal' : 'vertical';
  // Note: NO preventDefault — touch-action: pan-y handles scroll intent
}, { passive: true });

carousel.addEventListener('touchend', (e) => {
  if (!touchStart || touchLock !== 'horizontal') { touchStart = null; return; }
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dt = performance.now() - touchStart.t;
  const velocity = Math.abs(dx) / (dt || 1);
  const threshold = Math.max(SWIPE_DISTANCE_MIN_PX, carousel.offsetWidth * SWIPE_DISTANCE_RATIO);
  const triggered = Math.abs(dx) >= threshold || velocity >= SWIPE_VELOCITY_FLICK;
  if (triggered) {
    if (dx < 0) goNext(); else goPrev();
    resetAutoPlay();
  }
  touchStart = null;
  touchLock = 'none';
}, { passive: true });
```

**4. Dots (CSS + JS)**
```js
function buildDots() {
  const container = document.getElementById('carousel-dots');
  if (!container) return;
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Phone ${i + 1}`);
    dot.addEventListener('click', () => {
      if (getViewportMode() === 'mobile') return; // decorative on mobile
      const direction = i > centerIndex ? 1 : -1;
      goTo(i, direction);
      resetAutoPlay();
    });
    container.appendChild(dot);
  }
  updateDots(centerIndex);
}

function updateDots(active) {
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === active);
    dot.setAttribute('aria-current', i === active ? 'true' : 'false');
  });
}
```

**5. CSS changes**
```css
/* assets/css/carousel.css */

#phone-carousel {
  perspective: 3000px;
  transform-style: preserve-3d;
  height: 360px;               /* was 440px on mobile */
  touch-action: pan-y;         /* NEW */
}
@media (min-width: 480px) { #phone-carousel { height: 440px; } }
@media (min-width: 640px) { #phone-carousel { height: 500px; } }
@media (min-width: 1024px) { #phone-carousel { height: 580px; } }

.phone-item img {
  width: 15rem;                /* was 10rem mobile */
  /* ... */
}
@media (min-width: 640px) { .phone-item img { width: 14rem; } }
@media (min-width: 1024px) { .phone-item img { width: 18rem; } }

/* Hide prev/next on mobile */
@media (max-width: 479px) {
  #carousel-prev, #carousel-next { display: none; }
}

/* Dots */
#carousel-dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}
.carousel-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #d1d5db;
  border: 0;
  padding: 0;
  transition: background 200ms, transform 200ms;
  cursor: pointer;
}
.carousel-dot.active {
  background: var(--color-primary, #10b981);
  transform: scale(1.3);
}
@media (max-width: 479px) {
  .carousel-dot { pointer-events: none; cursor: default; }
}

/* Reduced-motion gate for rotateY — applied via conditional class */
@media (prefers-reduced-motion: reduce) {
  .phone-item {
    transition: none !important;
  }
  /* carousel.js will also set --coverflow-rotation to 0deg via CSS var */
}
```

---

## Constraints
- No JS preventDefault in touch handlers → relies on `touch-action: pan-y` CSS.
- Dots count = total phones (7) regardless of visible count — progress indicator truth.
- `prefers-reduced-motion: reduce`: JS detects and sets rotateY = 0 for all positions on all viewports.
- Center phone mobile width 240px > 44px WCAG AA tap target ✓.
- Performance: passive listeners + debounced resize → no jank on toolbar show/hide.

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected |
|-----|-------------|----------|
| REQ-01 | Playwright mobile 375, measure visible `.phone-item` rects | 3 visible (center + 2 peeks), center width 220-280px, peeks opacity 0.55 ±0.05 |
| REQ-02 | Playwright viewport 640 | 3 visible phones, rotateY ±15°, opacity 0.7/1.0 |
| REQ-03 | Playwright 1280 | 5 visible, rotateY ±45°/±25° (unchanged from current) |
| REQ-04 | Computed `display` of `#carousel-prev` at viewport 375 | `display: none` |
| REQ-05 | `#carousel-dots` visible, 7 dot elements, `.active` matches `centerIndex` | Exactly 7 children, 1 with `.active` |
| REQ-06 | Swipe 60px in 100ms (velocity 0.6) → triggers; 20px in 500ms → no trigger; 10px in 30ms (velocity 0.33) → triggers | 3 scenarios pass |
| REQ-07 | DevTools Protocol check `touch-action` computed on `#phone-carousel` | `pan-y` |
| REQ-08 | Swipe dx=5 dy=50 (vertical motion) | No centerIndex change |
| REQ-09 | Resize 1280→375 | visibleCount 5→3 after 150ms debounce |
| REQ-10 | Launch with `reducedMotion: 'reduce'`, inspect rotateY computed on center phone desktop | rotateY = 0° |
| REQ-11 | Computed `height` của `#phone-carousel` mobile | 360px (not vh/dvh) |
| REQ-12 | Computed `width` của center img mobile | 240px (15rem × 1.0 scale) |

### Overall
```bash
npm run build
npx playwright test tests/visual/carousel-mobile.spec.js --update-snapshots  # first run
npx playwright test tests/visual/carousel-mobile.spec.js
npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots  # regenerate mobile baseline
npx playwright test  # final full run, should all pass

# Manual smoke:
npx serve -l 5173 .
# iPhone SE/14 → carousel flat, peek visible, arrows hidden, dots show
# Xoay máy → resize debounce, layout tự cập nhật
# Swipe + flick → chuyển được cả distance và velocity mode
# Set Chrome DevTools → prefers-reduced-motion reduce → desktop 1280: rotateY = 0
```
