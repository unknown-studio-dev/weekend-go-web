---
spec_version: "1.0"
project: "weekend-go-web"
component: "responsive-carousel"
language: "javascript"
task_type: "feat"
category: "code"
status: "draft"
---

## Overview

[feat]: Responsive carousel — CoverFlow 3D trên Desktop, Scale Center trên Mobile/Tablet

### Goal

Tách biệt behavior carousel theo 2 breakpoints: Desktop (>=1024px) giữ 3D CoverFlow, Mobile+Tablet (<1024px) chuyển sang Scale Center (chỉ scale + opacity, không rotation 3D). Đồng thời loại bỏ scroll-snap mode và reorder ảnh theo thứ tự mới.

### Context

Carousel hiện tại có 3 modes: Desktop (CoverFlow 3D), Tablet (CoverFlow nhẹ), Mobile (scroll-snap với clone nodes). Trên mobile, scroll-snap mode phức tạp (clone nodes, scroll interpolation, mode switching logic ~100 lines) và rotateY+perspective trên tablet tạo hiệu ứng 3D không phù hợp màn hình nhỏ. Scale Center đơn giản hơn: ảnh trung tâm nổi bật, 2 ảnh bên thu nhỏ + mờ nhẹ, không gây rối mắt.

### Requirements

#### Behavior

- **[REQ-01]** Desktop (>=1024px): CoverFlow 3D — 5 items visible, rotateY ±40°/±55°, perspective 3000px, z-index layering (giữ nguyên `POSITIONS_DESKTOP`)
- **[REQ-02]** Mobile/Tablet (<1024px): Scale Center — 3 items visible (center ± 1, slot 0 và 4 ẩn opacity 0), không có rotateY, chỉ scale + opacity + translateX responsive (txRatio)
- **[REQ-03]** Breakpoint chuyển đổi real-time khi resize browser — `getViewportMode()` đọc `window.innerWidth` trên mỗi `applyPositions()` call
- **[REQ-04]** Autoplay, prev/next buttons, swipe gestures giữ nguyên behavior — chỉ thay đổi visual transform
- **[REQ-05]** Loại bỏ hoàn toàn scroll-snap mode: `initScrollMode()`, `destroyScrollMode()`, clone nodes, CSS scroll-snap, scroll event listeners
- **[REQ-06]** Prev/next buttons hiển thị trên mọi breakpoint (không ẩn trên mobile nữa)
- **[REQ-07]** Dots indicator clickable trên mọi breakpoint (bỏ `pointer-events: none` trên mobile)

#### Images

- **[REQ-08]** Reorder ảnh items 6-8 theo thứ tự: create-post → weekend-plan → plan-list
- **[REQ-09]** JS tự detect `total = phones.length` — không hardcode số lượng

#### Image List (thứ tự mới)

| # | File | Alt text |
|---|------|----------|
| 1 | `assets/images/preview-venue-detail.png` | Chi tiết địa điểm |
| 2 | `assets/images/preview-newsfeed.png` | Bảng tin |
| 3 | `assets/images/preview-user-profile.png` | Hồ sơ người dùng |
| 4 | `assets/images/preview-share-review.jpeg` | Chia sẻ trải nghiệm |
| 5 | `assets/images/preview-AI-review.png` | Tổng hợp mẹo từ AI |
| 6 | `assets/images/preview-create-post.png` | Tạo bài đăng |
| 7 | `assets/images/preview-weekend-plan.png` | Lập kế hoạch cuối tuần |
| 8 | `assets/images/preview-plan-list.png` | Bộ sưu tập kế hoạch |

### Out of Scope

- Không thêm pagination dots / swipe gesture mới
- Không thay đổi section header hay layout bao ngoài
- Không thêm thư viện JS
- Không thay đổi markup cấu trúc `.phone-item` (chỉ reorder)
- Không convert ảnh `preview-*` sang WebP

---

## Types / Data Models

Vanilla JS — không có types mới. Thay đổi constants:

```javascript
// Giữ nguyên
const BREAKPOINT_LG = 1024;

// REMOVE: POSITIONS_TABLET, POSITIONS_MOBILE, MOBILE_SCALE_*, MOBILE_OPACITY_*

// ADD: Position config cho Scale Center mode
const POSITIONS_SCALE_CENTER = [
  { scale: 0.5, rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },  // hidden
  { scale: 0.72, rotateY: 0, txRatio: -0.18, opacity: 0.6, zIndex: 5  },  // left
  { scale: 1.0,  rotateY: 0, txRatio: 0,     opacity: 1.0, zIndex: 10 },  // center
  { scale: 0.72, rotateY: 0, txRatio: 0.18,  opacity: 0.6, zIndex: 5  },  // right
  { scale: 0.5, rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },  // hidden
];
```

---

## Interfaces / APIs

### Position configs

#### CoverFlow (Desktop >=1024px) — giữ nguyên `POSITIONS_DESKTOP`

```javascript
const POSITIONS_DESKTOP = [
  { scale: 0.55, rotateY: 55,  txRatio: -0.37, opacity: 0.4, zIndex: 2  },
  { scale: 0.75, rotateY: 40,  txRatio: -0.20, opacity: 0.7, zIndex: 5  },
  { scale: 1.0,  rotateY: 0,   txRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.75, rotateY: -40, txRatio: 0.20,  opacity: 0.7, zIndex: 5  },
  { scale: 0.55, rotateY: -55, txRatio: 0.37,  opacity: 0.4, zIndex: 2  },
];
```

#### Scale Center (Mobile/Tablet <1024px) — mới

```javascript
const POSITIONS_SCALE_CENTER = [
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
  { scale: 0.72, rotateY: 0, txRatio: -0.18, opacity: 0.6, zIndex: 5  },
  { scale: 1.0,  rotateY: 0, txRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.72, rotateY: 0, txRatio: 0.18,  opacity: 0.6, zIndex: 5  },
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
];
```

> **Note**: Scale Center dùng cùng 5 DOM slots và `txRatio` responsive pattern như CoverFlow. DOM index 0 và 4 ẩn (opacity 0). txRatio ±0.18 ≈ 120px trên viewport 667px, scale tự nhiên.

### Viewport mode function (cập nhật)

```javascript
function getViewportMode() {
  return window.innerWidth >= BREAKPOINT_LG ? 'coverflow' : 'scale-center';
}

function getPositions() {
  return getViewportMode() === 'coverflow' ? POSITIONS_DESKTOP : POSITIONS_SCALE_CENTER;
}
```

### CSS — perspective conditional

```css
/* Base: no perspective */
#phone-carousel {
  height: 360px;
  touch-action: pan-y;
}

/* Desktop: enable 3D */
@media (min-width: 1024px) {
  #phone-carousel {
    height: 580px;
    perspective: 3000px;
    transform-style: preserve-3d;
  }
}

/* Mobile/Tablet: explicit flat (override) */
@media (max-width: 1023px) {
  #phone-carousel {
    perspective: none;
    transform-style: flat;
  }
}
```

---

## Implementations

### Design Decisions

| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Bỏ scroll-snap, dùng Scale Center transform-based cho toàn bộ <1024px | Đơn giản 2-mode architecture, bỏ ~100 lines scroll-snap code. Trade-off: mất native scroll feel | LOCKED |
| 2 | Dùng cùng 5 DOM slots cho cả 2 mode | Tránh thay đổi `reorderDOM()` — chỉ swap position config | LOCKED |
| 3 | Scale Center ẩn DOM index 0 và 4 (opacity 0) | DOM structure nhất quán — không cần branching logic | LOCKED |
| 4 | `getViewportMode()` đọc `window.innerWidth` runtime | Real-time resize, checked mỗi `applyPositions()` call | LOCKED |
| 5 | Perspective chỉ trên desktop qua media query CSS | rotateY 3D chỉ có depth khi có perspective; mobile flat | LOCKED |
| 6 | Scale Center dùng txRatio responsive (±0.18) thay vì px cố định | Nhất quán pattern hiện tại, scale theo carousel width | LOCKED |
| 7 | Reorder ảnh: create-post (#6) → weekend-plan (#7) → plan-list (#8) | User flow logic | LOCKED |
| 8 | Prev/next buttons + dots clickable trên mọi breakpoint | Scale Center dùng transform-based nên buttons cần thiết | LOCKED |
| 9 | Viewport mode values đổi: 'coverflow' / 'scale-center' | Phản ánh đúng behavior, không confuse với device type | FLEXIBLE |
| 10 | txRatio ±0.18 cho Scale Center side items | ~120px trên 667px viewport — ảnh bên chỉ ló ra một phần | FLEXIBLE |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `assets/js/carousel.js` | MODIFY | Thêm `POSITIONS_SCALE_CENTER`, xoá scroll-snap logic (~100 lines), simplify `getViewportMode()` | d=1 |
| `assets/css/carousel.css` | MODIFY | Tách perspective ra media query, xoá scroll-snap CSS block, xoá hide buttons rule | d=1 |
| `index.html` | MODIFY | Reorder items 6-8 (create-post, weekend-plan, plan-list) | d=1 |
| `src/index.src.html` | MODIFY | Reorder items 6-8 (same as index.html) | d=1 |

### Chi tiết thay đổi

#### 1. `assets/js/carousel.js`

**Xoá constants (lines 12-15):**
```javascript
// REMOVE: MOBILE_SCALE_CENTER, MOBILE_SCALE_SIDE, MOBILE_OPACITY_CENTER, MOBILE_OPACITY_SIDE
```

**Xoá position arrays (lines 37-51):**
```javascript
// REMOVE: POSITIONS_TABLET, POSITIONS_MOBILE
```

**Thêm Scale Center positions (sau POSITIONS_DESKTOP):**
```javascript
const POSITIONS_SCALE_CENTER = [
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
  { scale: 0.72, rotateY: 0, txRatio: -0.18, opacity: 0.6, zIndex: 5  },
  { scale: 1.0,  rotateY: 0, txRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.72, rotateY: 0, txRatio: 0.18,  opacity: 0.6, zIndex: 5  },
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
];
```

**Simplify getViewportMode() (line 65-70):**
```javascript
function getViewportMode() {
  return window.innerWidth >= BREAKPOINT_LG ? 'coverflow' : 'scale-center';
}
```

**Simplify getPositions() (line 72-78):**
```javascript
function getPositions() {
  return getViewportMode() === 'coverflow' ? POSITIONS_DESKTOP : POSITIONS_SCALE_CENTER;
}
```

**Xoá variables (lines 60-63):**
```javascript
// REMOVE: isScrollMode, cloneFirst, cloneLast, rafId
```

**Xoá buildDots() mobile guard (line 97):**
```javascript
// REMOVE: if (getViewportMode() === 'mobile') return;
```

**Xoá toàn bộ scroll-snap functions (lines 114-250):**
```javascript
// REMOVE: interpolateItems, handleScrollInterpolation, initScrollMode,
//         destroyScrollMode, scrollToIndex, handleScrollEnd,
//         updateCenterClass, scrollEndTimer, debounceScrollEnd
```

**Simplify applyPositions() — xoá scroll branch:**
```javascript
function applyPositions(transition) {
  // REMOVE: if (isScrollMode) { ... return; } block
  const items = carousel.querySelectorAll(".phone-item");
  items.forEach((phone, domIndex) => {
    const pos = getPosition(domIndex);
    phone.style.transition = transition
      ? `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${ANIMATION_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
      : 'none';
    const tx = Math.round(pos.txRatio * carousel.offsetWidth);
    phone.style.transform = `translate(-50%, -50%) translateX(${tx}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`;
    phone.style.opacity = pos.opacity;
    phone.style.zIndex = pos.zIndex;
  });
  carousel.dataset.centerIndex = String(centerIndex);
  carousel.dataset.viewportMode = getViewportMode();
  updateDots(centerIndex);
}
```

**Simplify goTo() — xoá scroll branch:**
```javascript
function goTo(newCenter, direction) {
  // REMOVE: if (isScrollMode) { ... return; } block
  if (animating || newCenter === centerIndex) return;
  // ... rest unchanged
}
```

**Simplify touch handlers — xoá isScrollMode guards:**
```javascript
function handleTouchStart(e) {
  // REMOVE: if (isScrollMode) return;
  touchStart = { ... };
  touchLock = 'none';
}
// Same for handleTouchMove, handleTouchEnd
```

**Simplify handleResize():**
```javascript
function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const current = getViewportMode();
    if (current !== lastViewportMode) {
      lastViewportMode = current;
      // REMOVE: if (current === 'desktop') destroyScrollMode(); else initScrollMode();
      reorderDOM();
      applyPositions(false);
    }
  }, 150);
}
```

**Simplify initial render:**
```javascript
reorderDOM();
applyPositions(false);
buildDots();
updateDots(centerIndex);
// REMOVE: if (getViewportMode() !== 'desktop') { initScrollMode(); }
```

#### 2. `assets/css/carousel.css`

**Xoá `perspective` và `transform-style` khỏi base rule (#phone-carousel line 2-3)**

**Thêm perspective vào desktop media query:**
```css
@media (min-width: 1024px) {
  #phone-carousel {
    height: 580px;
    perspective: 3000px;
    transform-style: preserve-3d;
  }
}
```

**Thêm explicit flat cho mobile/tablet:**
```css
@media (max-width: 1023px) {
  #phone-carousel {
    perspective: none;
    transform-style: flat;
  }
}
```

**Xoá toàn bộ @media (max-width: 767px) block cho #phone-carousel (line 38-72):**
- scroll-snap rules, flex layout, scrollbar hide, .phone-item static positioning

**Xoá @media (max-width: 767px) cho prev/next buttons (line 90-95)**

**Xoá @media (max-width: 767px) cho .carousel-dot pointer-events (line 118-122)**

#### 3. `index.html` + `src/index.src.html`

**Reorder items 6-8:**

Hiện tại (line 758-784):
```
6: preview-weekend-plan.png
7: preview-plan-list.png
8: preview-create-post.png
```

Thành:
```
6: preview-create-post.png   alt="Tạo bài đăng"
7: preview-weekend-plan.png  alt="Lập kế hoạch cuối tuần"
8: preview-plan-list.png     alt="Bộ sưu tập kế hoạch"
```

---

## Open Questions

Không có — tất cả decisions đã LOCKED.

## Constraints

- Không thêm thư viện JS
- Phải giữ responsive txRatio pattern (không px cố định)
- Perspective chỉ CSS media query (không JS-driven)
- Swipe gesture thresholds giữ nguyên tuning

---

## Acceptance Criteria

### Per-Requirement

| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | Mở browser >=1024px, inspect #phone-carousel | `perspective: 3000px`, items có `rotateY` values |
| REQ-02 | Resize browser <1024px, inspect items | Không có `rotateY`, chỉ scale + opacity + translateX |
| REQ-03 | Resize browser qua/lại 1024px boundary | Carousel chuyển mode ngay lập tức, không cần reload |
| REQ-04 | Click prev/next, đợi autoplay | Navigation hoạt động trên cả 2 modes |
| REQ-05 | Grep `initScrollMode\|destroyScrollMode\|scrollToIndex\|isScrollMode` trong JS | 0 kết quả |
| REQ-06 | Resize <1024px, kiểm tra prev/next buttons | Buttons visible và clickable |
| REQ-07 | Resize <1024px, click dots | Dots navigate carousel |
| REQ-08 | Xem DOM order trong #phone-carousel | Item 6 = create-post, 7 = weekend-plan, 8 = plan-list |
| REQ-09 | Thêm/bớt `.phone-item` trong HTML | JS tự detect total mới, carousel vẫn hoạt động |

### Overall

```bash
# 1. Check scroll-snap code removed
grep -r "initScrollMode\|destroyScrollMode\|scrollToIndex\|isScrollMode\|cloneFirst\|cloneLast" assets/js/carousel.js
# Expected: 0 matches

# 2. Check scroll-snap CSS removed
grep -r "scroll-snap\|overflow-x.*auto\|scrollbar-width" assets/css/carousel.css
# Expected: 0 matches

# 3. Check perspective only in desktop media query
grep -A2 "perspective" assets/css/carousel.css
# Expected: only inside @media (min-width: 1024px) block

# 4. Visual test — open index.html, resize between 1023px and 1024px
# Expected: smooth mode switch, no layout jump
```
