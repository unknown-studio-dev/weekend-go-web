---
spec_version: "1.0"
project: "weekend-go-web"
component: "phone_carousel_mobile_responsive"
language: "HTML / Tailwind CSS / Vanilla JavaScript"
task_type: "fix"
category: "code"
status: "draft"
---

## Overview
[fix]: Tối ưu responsive mobile cho carousel "Xem trước ứng dụng"

### Goal
Trên mobile <480px chỉ hiển thị 1 phone (center, to ~240px), 480-768px hiển thị 3 phones, ≥768px giữ nguyên 5 phones như hiện tại; kèm swipe gesture native.

### Context
Carousel coverflow hiện tại hiển thị 5 phones ở mọi viewport ≥320px, chỉ scale translateX xuống (0.38x). Hậu quả trên iPhone ~390px: 5 phones chen chúc, side phones thu nhỏ còn ~60px, nội dung không rõ. Center phone 160px * 0.8 = 128px, nhỏ hơn mong muốn.

### Requirements
- [REQ-01] Viewport `< 480px`: chỉ 1 phone center visible, 4 phone còn lại `opacity: 0`, không ảnh hưởng click/tap.
- [REQ-02] Viewport `480-767px`: 3 phones visible (center + 2 side), 2 far-side ẩn.
- [REQ-03] Viewport `≥ 768px`: giữ nguyên hành vi 5 phones.
- [REQ-04] Center phone trên mobile (<480px): hiển thị ~240px width (image size).
- [REQ-05] Swipe trái/phải (touchstart→touchend distance ≥ 40px theo chiều X) trigger `goPrev()`/`goNext()`.
- [REQ-06] Window resize: carousel tự tính lại positions (breakpoint thay đổi → visible count thay đổi).
- [REQ-07] Nút Prev/Next giữ overlay, vẫn hoạt động bình thường trên mọi viewport.
- [REQ-08] `prefers-reduced-motion`: swipe vẫn hoạt động nhưng không thêm animation phụ ngoài transition đang có.

### Out of Scope
- Không thêm dots indicator
- Không thay đổi autoplay interval
- Không redesign nút Prev/Next (chỉ có thể co nhỏ nếu cần)
- Không thay ảnh phone

---

## Types / Data Models

```js
// assets/js/carousel.js — bổ sung

const BREAKPOINT_XS = 480;
const BREAKPOINT_SM = 640;
const BREAKPOINT_MD = 768;   // NEW — tablet boundary
const BREAKPOINT_LG = 1024;

// Số phone visible theo viewport
// < 480   → 1 (single-mode)
// 480-767 → 3
// ≥ 768   → 5
type VisibleCount = 1 | 3 | 5;

// Config tĩnh 5 vị trí (giữ nguyên structure hiện tại) + hidden
// getPosition(domIndex) nhận thêm tham số visibleCount để quyết định ẩn slot nào
function getPosition(domIndex: number, visibleCount: VisibleCount): Position;
function getVisibleCount(): VisibleCount;

// Swipe state
let touchStartX: number | null;
let touchStartY: number | null;
const SWIPE_THRESHOLD_PX = 40;
const SWIPE_MAX_VERTICAL_RATIO = 1.5; // |dx| / |dy| phải > ratio này để coi là swipe ngang
```

---

## Interfaces / APIs

```js
// Existing — KHÔNG đổi signature public, chỉ đổi behavior internal:
function getSpreadScale(): number                 // giữ nguyên
function applyPositions(transition: boolean): void // giữ nguyên, bên trong gọi getVisibleCount()
function goTo(newCenter: number, direction: -1|1): void  // giữ nguyên
function goNext(): void                            // giữ nguyên
function goPrev(): void                            // giữ nguyên

// NEW — mobile helpers:
function getVisibleCount(): 1 | 3 | 5
function getPosition(domIndex: number, visibleCount: number): Position
function handleResize(): void   // debounced, gọi applyPositions(false) khi viewport bracket đổi
function handleTouchStart(e: TouchEvent): void
function handleTouchEnd(e: TouchEvent): void
```

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Dùng `getVisibleCount()` thay vì mở rộng `VISIBLE_POSITIONS` | Giữ data immutable, chỉ đổi mapping | LOCKED |
| 2 | Mobile <480px: position center dùng `scale: 1.5` (thay vì 0.8) để image 160px → ~240px | Không cần đổi CSS base width, chỉ logic | LOCKED |
| 3 | 4 phone phụ khi mobile: dùng `HIDDEN_POSITION` | Không reveal layout | LOCKED |
| 4 | 3-phone mode (480-767): far-left/far-right dùng `HIDDEN_POSITION`, left/center/right giữ | Reuse config hiện tại | LOCKED |
| 5 | BREAKPOINT_SM không đổi (640) nhưng logic tablet dùng BREAKPOINT_MD (768) | Align với Tailwind `md:` | LOCKED |
| 6 | Swipe threshold 40px, dùng touchstart/touchend, không cần touchmove để tránh e.preventDefault | Đơn giản, không chặn scroll dọc | LOCKED |
| 7 | Resize handler debounced 150ms | Tránh re-render khi xoay máy | LOCKED |
| 8 | Reset autoplay sau mỗi swipe | Đồng bộ với nút Prev/Next | LOCKED |
| 9 | Không đổi CSS image width — chỉ đổi scale trong JS | Reduce diff, centralize logic | FLEXIBLE |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| [assets/js/carousel.js](../../../../assets/js/carousel.js) | MODIFY | Thêm `BREAKPOINT_MD`, `getVisibleCount()`, đổi `getPosition()` nhận `visibleCount`, resize handler, swipe handlers | d=1 (self-contained) |
| [assets/css/carousel.css](../../../../assets/css/carousel.css) | MODIFY | Thêm `touch-action: pan-y` trên `#phone-carousel` để tránh chặn scroll dọc; (tùy chọn) thu nhỏ nút Prev/Next trên <480px | d=1 |
| [src/index.src.html](../../../../src/index.src.html) | NO CHANGE | HTML structure giữ nguyên 7 `.phone-item` | N/A |
| [index.html](../../../../index.html) | REBUILD | Auto-sinh sau `npm run build:html` nếu src/ không đổi thì không đổi | N/A |

### Core logic changes

**1. `getVisibleCount()` — NEW**
```js
function getVisibleCount() {
  const w = window.innerWidth;
  if (w < BREAKPOINT_XS) return 1;         // <480
  if (w < BREAKPOINT_MD) return 3;         // 480-767
  return 5;                                // ≥768
}
```

**2. `getPosition(domIndex, visibleCount)` — MODIFY**
```js
function getPosition(domIndex, visibleCount) {
  // domIndex 0..4 map tới vị trí -2,-1,0,+1,+2
  if (visibleCount === 5) {
    return domIndex < VISIBLE_POSITIONS.length ? VISIBLE_POSITIONS[domIndex] : HIDDEN_POSITION;
  }
  if (visibleCount === 3) {
    // chỉ domIndex 1,2,3 visible (left, center, right)
    if (domIndex === 1 || domIndex === 2 || domIndex === 3) return VISIBLE_POSITIONS[domIndex];
    return HIDDEN_POSITION;
  }
  // visibleCount === 1 — chỉ center, center scale tăng lên 1.5
  if (domIndex === 2) {
    return { ...VISIBLE_POSITIONS[2], scale: 1.5 };
  }
  return HIDDEN_POSITION;
}
```

**3. `applyPositions()` — MODIFY call site**
```js
function applyPositions(transition) {
  const items = carousel.querySelectorAll(".phone-item");
  const spread = getSpreadScale();
  const visibleCount = getVisibleCount();  // NEW
  items.forEach((phone, domIndex) => {
    const pos = getPosition(domIndex, visibleCount);  // pass visibleCount
    // ... rest unchanged
  });
}
```

**4. Resize handler — NEW**
```js
let lastVisibleCount = getVisibleCount();
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const current = getVisibleCount();
    if (current !== lastVisibleCount) {
      lastVisibleCount = current;
      applyPositions(true);
    } else {
      // Just spread change (e.g. 480→640 within same visible=3 bracket)
      applyPositions(false);
    }
  }, 150);
});
```

**5. Swipe handlers — NEW**
```js
carousel.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

carousel.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  touchStartX = null;
  touchStartY = null;
  // Chỉ accept horizontal swipe
  if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
  if (Math.abs(dy) > 0 && Math.abs(dx) / Math.abs(dy) < SWIPE_MAX_VERTICAL_RATIO) return;
  if (dx < 0) goNext(); else goPrev();
  resetAutoPlay();
}, { passive: true });
```

**6. CSS bổ sung**
```css
#phone-carousel {
  /* ... existing */
  touch-action: pan-y;  /* cho phép scroll dọc, swipe ngang do JS xử lý */
}

/* Tùy chọn: co nút Prev/Next trên mobile rất nhỏ */
@media (max-width: 479px) {
  #carousel-prev, #carousel-next { width: 2.25rem; height: 2.25rem; }
}
```

---

## Open Questions
_Không còn — mọi quyết định đã locked trong CONTEXT.md_

## Constraints
- Performance: resize handler debounced 150ms, swipe dùng passive listeners → không block scroll.
- Compatibility: touch events standard (iOS Safari, Chrome Android).
- Không breaking desktop (viewport ≥768px identical behavior).
- Respect `prefers-reduced-motion`: đã có `@media` trong CSS vô hiệu hoá transition; swipe chỉ trigger `goTo()` tuân thủ flag này.

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | `npx playwright test tests/visual/carousel-mobile.spec.ts --grep "mobile-375"` | Screenshot chỉ có 1 phone visible, opacity 4 phones khác = 0 |
| REQ-02 | `npx playwright test tests/visual/carousel-mobile.spec.ts --grep "tablet-640"` | Screenshot show 3 phones (left/center/right) visible |
| REQ-03 | `npx playwright test tests/visual/carousel-mobile.spec.ts --grep "desktop-1280"` | Screenshot show 5 phones (giữ nguyên hiện tại) |
| REQ-04 | `getBoundingClientRect().width` của center img tại viewport 390px | ≥ 220 và ≤ 260 |
| REQ-05 | Playwright `page.touchscreen.swipe(...)` từ x=300 đến x=100 | `centerIndex` tăng 1 (goNext được gọi) |
| REQ-06 | Resize viewport 1200→375 | `visibleCount` đổi từ 5→1, applyPositions chạy lại |
| REQ-07 | Click `#carousel-next` ở viewport 375 | goNext chạy bình thường, phone center đổi |
| REQ-08 | Set `prefers-reduced-motion: reduce`, swipe | goTo chạy, không có transition extra |

### Overall
1. `npm run build` — không lỗi.
2. `npx playwright test tests/visual/` — tất cả snapshot pass hoặc có diff < 0.1% (update nếu cần).
3. Smoke test manual: mở `index.html` qua `python3 -m http.server`, DevTools device mode iPhone SE/12/14 → xác nhận hiển thị 1 phone, swipe được, click button được.
