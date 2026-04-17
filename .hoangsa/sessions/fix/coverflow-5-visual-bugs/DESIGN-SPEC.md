---
spec_version: "1.0"
project: "weekend-go-web"
component: "coverflow-5-visual-bugs"
language: "javascript"
task_type: "fix"
category: "code"
status: "draft"
---

## Overview

[fix]: Fix 5 visual bugs carousel CoverFlow — buttons, center size, spacing, overflow, dots

### Goal

Sửa 5 bugs visual phát hiện từ screenshot review sau refactor full 3D CoverFlow.

### Context

Carousel vừa được upgrade sang full 3D CoverFlow. Visual review phát hiện: buttons sai vị trí, center quá lớn (translateZ magnification), side items spacing sai, carousel tràn lên header, dots cần bỏ.

### Requirements

- **[REQ-01]** Prev/Next buttons vertically centered trong carousel container, 2 bên trái/phải
- **[REQ-02]** Center item vừa vặn — scale(1.0), translateZ giảm/bỏ để không phóng đại quá
- **[REQ-03]** Side items spacing đều — center→±1 = ±1→±2 (equal spacing, không Apple-style compressed)
- **[REQ-04]** Carousel nằm gọn trong section, không tràn lên header text
- **[REQ-05]** Bỏ dots indicator hoàn toàn — xoá HTML, JS calls, CSS

### Out of Scope

- Không thay đổi click side items, hover pause, swipe, autoplay
- Không thay đổi image order
- Không thay đổi rotateY angles

---

## Interfaces / APIs

### Bug 1 — Buttons vertically centered (index.html + src/index.src.html)

Buttons hiện tại thiếu `top` positioning. Thêm Tailwind classes:

```html
<!-- carousel-prev: thêm top-1/2 -translate-y-1/2 -->
<button id="carousel-prev" class="absolute top-1/2 -translate-y-1/2 left-0 sm:left-2 lg:left-8 z-20 ...">

<!-- carousel-next: thêm top-1/2 -translate-y-1/2 -->
<button id="carousel-next" class="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 lg:right-8 z-20 ...">
```

### Bug 2 — Center item size (carousel.js)

Giảm center magnification — bỏ translateZ lớn, giữ scale(1.0):

```javascript
// POSITIONS_DESKTOP center (slot 2):
{ scale: 1.0, rotateY: 0, txRatio: 0, translateZ: 0, opacity: 1.0, zIndex: 10 }
// Was: scale: 1.1, translateZ: 150

// POSITIONS_MOBILE center (slot 2):
{ scale: 1.0, rotateY: 0, txRatio: 0, translateZ: 0, opacity: 1.0, zIndex: 10 }
// Was: scale: 1.1, translateZ: 120
```

Side items translateZ cũng giảm để tỷ lệ đúng:

```javascript
// Desktop sides: translateZ 50 → 0
// Mobile sides: translateZ 30 → 0
```

### Bug 3 — Equal spacing (carousel.js)

User muốn **khoảng cách đều** giữa các items (không phải Apple-style compressed):

```javascript
// Desktop: center→±1 = ±1→±2 = 0.22 mỗi gap
const POSITIONS_DESKTOP = [
  { scale: 0.7,  rotateY: 55,  txRatio: -0.44, translateZ: 0, opacity: 0.4, zIndex: 2  },
  { scale: 0.85, rotateY: 45,  txRatio: -0.22, translateZ: 0, opacity: 0.8, zIndex: 5  },
  { scale: 1.0,  rotateY: 0,   txRatio: 0,     translateZ: 0, opacity: 1.0, zIndex: 10 },
  { scale: 0.85, rotateY: -45, txRatio: 0.22,  translateZ: 0, opacity: 0.8, zIndex: 5  },
  { scale: 0.7,  rotateY: -55, txRatio: 0.44,  translateZ: 0, opacity: 0.4, zIndex: 2  },
];
// center→±1 = 0.22, ±1→±2 = 0.22 (equal)

// Mobile: center→±1 = 0.28 (giữ nguyên, chỉ 3 items)
const POSITIONS_MOBILE = [
  { scale: 0.5,  rotateY: 0,   txRatio: 0,     translateZ: 0, opacity: 0,   zIndex: 0  },
  { scale: 0.85, rotateY: 35,  txRatio: -0.28, translateZ: 0, opacity: 0.7, zIndex: 5  },
  { scale: 1.0,  rotateY: 0,   txRatio: 0,     translateZ: 0, opacity: 1.0, zIndex: 10 },
  { scale: 0.85, rotateY: -35, txRatio: 0.28,  translateZ: 0, opacity: 0.7, zIndex: 5  },
  { scale: 0.5,  rotateY: 0,   txRatio: 0,     translateZ: 0, opacity: 0,   zIndex: 0  },
];
```

### Bug 4 — Container height (carousel.css)

`min-height: 50vh` quá cao khi center không còn scale(1.1). Quay lại fixed height approach đã proven:

```css
#phone-carousel {
  perspective: 1200px;
  transform-style: preserve-3d;
  overflow: visible;
  height: 360px;
  touch-action: pan-y;
}
@media (min-width: 480px)  { #phone-carousel { height: 440px; } }
@media (min-width: 640px)  { #phone-carousel { height: 500px; } }
@media (min-width: 1024px) { #phone-carousel { height: 580px; } }
```

### Bug 5 — Remove dots (HTML + JS + CSS)

**HTML**: Xoá `<div id="carousel-dots" ...></div>` từ index.html và src/index.src.html

**JS**: Xoá `buildDots()` function, `updateDots()` function, và các calls: `buildDots()`, `updateDots(centerIndex)`, `updateDots(centerIndex)` trong applyPositions

**CSS**: Xoá toàn bộ dots styles (#carousel-dots, .carousel-dot, .carousel-dot.active)

---

## Implementations

### Design Decisions

| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Buttons top-1/2 -translate-y-1/2 | Tailwind standard vertical centering | LOCKED |
| 2 | Center scale(1.0), translateZ: 0 | Bỏ magnification kép, giữ size tự nhiên | LOCKED |
| 3 | All translateZ: 0 | Perspective depth qua rotateY đã đủ, translateZ gây size issues | LOCKED |
| 4 | Equal spacing txRatio ±0.22/±0.44 | User yêu cầu khoảng cách đều, không Apple-style | LOCKED |
| 5 | Fixed height thay vh | Proven approach, controllable, không tràn | LOCKED |
| 6 | Xoá dots hoàn toàn | User request — chỉ dùng buttons + click sides | LOCKED |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `assets/js/carousel.js` | MODIFY | Position values, xoá buildDots/updateDots | d=1 |
| `assets/css/carousel.css` | MODIFY | Fixed height, xoá dots CSS | d=1 |
| `index.html` | MODIFY | Button classes, xoá dots div | d=1 |
| `src/index.src.html` | MODIFY | Same as index.html | d=1 |

---

## Acceptance Criteria

| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | Inspect button classes | Contains `top-1/2 -translate-y-1/2` |
| REQ-02 | grep scale values in JS | Center scale: 1.0, no 1.1 |
| REQ-03 | Check txRatio values | Desktop: ±0.22 and ±0.44 (equal gap) |
| REQ-04 | Check CSS height | Fixed px values, no vh |
| REQ-05 | grep carousel-dots in HTML + JS | 0 matches |

```bash
grep -q 'top-1/2' index.html && \
! grep -q 'scale: 1.1' assets/js/carousel.js && \
grep -q 'txRatio: 0.22' assets/js/carousel.js && \
! grep -q 'min-height' assets/css/carousel.css && \
! grep -q 'carousel-dots' index.html && \
! grep -q 'buildDots' assets/js/carousel.js && \
echo PASS || echo FAIL
```
