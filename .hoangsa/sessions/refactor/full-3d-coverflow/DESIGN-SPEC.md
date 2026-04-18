---
spec_version: "1.0"
project: "weekend-go-web"
component: "full-3d-coverflow"
language: "javascript"
task_type: "refactor"
category: "code"
status: "draft"
---

## Overview

[refactor]: Nâng cấp Carousel sang Full 3D CoverFlow đa thiết bị

### Goal

Chuyển carousel từ hiệu ứng phẳng (Scale Center) trên mobile sang Full 3D CoverFlow trên cả desktop và mobile. Desktop hiện 5 items, mobile hiện 3 items — cả 2 đều có rotateY 3D, perspective, và translateZ depth.

### Context

Carousel hiện tại: Desktop dùng 3D CoverFlow (rotateY ±45°/50°), Mobile dùng Scale Center phẳng (rotateY: 0). Trên mobile, side items quá mờ và thiếu depth, trông flat. User muốn full 3D CoverFlow trên mọi thiết bị, với fix các bug UI: clipping, responsive scaling, container height, click-to-navigate.

### Requirements

- **[REQ-01]** Desktop (≥1024px): 3D CoverFlow — 5 items visible, rotateY ±45°/±55°, perspective 1200px, translateZ depth, center scale(1.1)
- **[REQ-02]** Mobile/Tablet (<1024px): 3D CoverFlow nhẹ — 3 items visible, rotateY ±35°, perspective 1200px, translateZ depth, center scale(1.1), slots 0,4 hidden (opacity 0, pointer-events none)
- **[REQ-03]** Overflow visible: `#phone-carousel` và section parent không clip 3D items
- **[REQ-04]** Container height responsive: dùng `min-height` theo vh thay fixed px, đủ chứa phone khi scale(1.1)
- **[REQ-05]** Click side items: click vào ảnh bên cạnh (non-center) để navigate đến item đó
- **[REQ-06]** Autoplay pause on hover: hover carousel → pause, leave → resume
- **[REQ-07]** Resize luôn re-apply positions (responsive txRatio recalc)
- **[REQ-08]** Hidden items: `pointer-events: none` để không block clicks

### Out of Scope

- Không thêm thư viện JS
- Không thay đổi image order
- Không thêm swipe gesture mới (đã hoạt động)
- Không thay đổi dots behavior

---

## Types / Data Models

Thêm `translateZ` vào position config objects:

```javascript
// Trước
{ scale, rotateY, txRatio, opacity, zIndex }

// Sau
{ scale, rotateY, txRatio, translateZ, opacity, zIndex }
```

---

## Interfaces / APIs

### Position configs mới

#### Desktop (≥1024px) — 5 items, full 3D

```javascript
const POSITIONS_DESKTOP = [
  { scale: 0.7,  rotateY: 55,  txRatio: -0.38, translateZ: 0,   opacity: 0.4, zIndex: 2  },
  { scale: 0.85, rotateY: 45,  txRatio: -0.25, translateZ: 50,  opacity: 0.8, zIndex: 5  },
  { scale: 1.1,  rotateY: 0,   txRatio: 0,     translateZ: 150, opacity: 1.0, zIndex: 10 },
  { scale: 0.85, rotateY: -45, txRatio: 0.25,  translateZ: 50,  opacity: 0.8, zIndex: 5  },
  { scale: 0.7,  rotateY: -55, txRatio: 0.38,  translateZ: 0,   opacity: 0.4, zIndex: 2  },
];
```

#### Mobile/Tablet (<1024px) — 3 items visible, 3D nhẹ

```javascript
const POSITIONS_MOBILE = [
  { scale: 0.5,  rotateY: 0,   txRatio: 0,     translateZ: 0,   opacity: 0,   zIndex: 0  },
  { scale: 0.85, rotateY: 35,  txRatio: -0.28, translateZ: 30,  opacity: 0.7, zIndex: 5  },
  { scale: 1.1,  rotateY: 0,   txRatio: 0,     translateZ: 120, opacity: 1.0, zIndex: 10 },
  { scale: 0.85, rotateY: -35, txRatio: 0.28,  translateZ: 30,  opacity: 0.7, zIndex: 5  },
  { scale: 0.5,  rotateY: 0,   txRatio: 0,     translateZ: 0,   opacity: 0,   zIndex: 0  },
];
```

#### Hidden slot

```javascript
const HIDDEN = { scale: 0.5, rotateY: 0, txRatio: 0, translateZ: 0, opacity: 0, zIndex: 0 };
```

### Transform string (updated)

```javascript
const tx = Math.round(pos.txRatio * carousel.offsetWidth);
phone.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateZ(${pos.translateZ}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`;
```

### Click side items handler

```javascript
// Trong applyPositions() hoặc sau reorderDOM()
items.forEach((phone, domIndex) => {
  if (domIndex === 2) {
    phone.style.cursor = 'default';
    phone.style.pointerEvents = 'auto';
  } else if (pos.opacity > 0) {
    phone.style.cursor = 'pointer';
    phone.style.pointerEvents = 'auto';
    phone.onclick = () => {
      const direction = domIndex < 2 ? -1 : 1;
      goNext(); // or goPrev() based on direction
      resetAutoPlay();
    };
  } else {
    phone.style.pointerEvents = 'none';
    phone.onclick = null;
  }
});
```

### Hover pause autoplay

```javascript
carousel.addEventListener('mouseenter', stopAutoPlay);
carousel.addEventListener('mouseleave', () => { if (!isPaused) startAutoPlay(); });
```

### CSS changes

```css
/* Base — perspective cho cả 2 modes */
#phone-carousel {
  perspective: 1200px;
  transform-style: preserve-3d;
  overflow: visible;
  min-height: 50vh;
  touch-action: pan-y;
}

/* Desktop — taller */
@media (min-width: 1024px) {
  #phone-carousel {
    min-height: 60vh;
  }
}

/* REMOVE: @media (max-width: 1023px) { perspective: none; transform-style: flat; } */
```

### Section overflow fix

```html
<!-- Trước -->
<section class="py-16 lg:py-24 bg-gray-50 overflow-hidden">

<!-- Sau -->
<section class="py-16 lg:py-24 bg-gray-50 overflow-x-clip">
```

---

## Implementations

### Design Decisions

| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Mobile cũng 3D (rotateY ±35°) | Full CoverFlow experience, không flat nữa | LOCKED |
| 2 | Perspective 1200px cho cả 2 modes | Chiều sâu ổn định, user spec | LOCKED |
| 3 | Center scale(1.1) + translateZ(150/120) | Nổi bật, depth effect | LOCKED |
| 4 | min-height vh thay fixed px | Container luôn đủ cao cho phone khi scale(1.1) | LOCKED |
| 5 | overflow: visible trên carousel | 3D items cần render ngoài container bounds | LOCKED |
| 6 | overflow-x-clip trên section | Ngăn horizontal scroll nhưng cho phép vertical 3D | LOCKED |
| 7 | Click side items navigate | UX: click ảnh bên → chuyển đến item đó | LOCKED |
| 8 | Hover pause autoplay | UX: đang xem → không tự chuyển | LOCKED |
| 9 | Rename POSITIONS_SCALE_CENTER → POSITIONS_MOBILE | Phản ánh đúng content (3D CoverFlow, không phải Scale Center) | LOCKED |
| 10 | txRatio responsive giữ nguyên pattern | Proven approach từ code hiện tại | LOCKED |
| 11 | Desktop txRatio ±0.25/±0.38 (Apple-style compressed sides) | Giữ Apple-style spacing đã proven | LOCKED |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `assets/js/carousel.js` | MODIFY | New position arrays + translateZ + click handlers + hover pause | d=1 |
| `assets/css/carousel.css` | MODIFY | Perspective cả 2 modes, min-height vh, overflow visible | d=1 |
| `index.html` | MODIFY | Section overflow-hidden → overflow-x-clip | d=1 |
| `src/index.src.html` | MODIFY | Same as index.html | d=1 |

---

## Acceptance Criteria

### Per-Requirement

| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | Desktop 1280px: inspect items rotateY + translateZ | 5 items visible, center translateZ(150px), sides rotateY ±45°/±55° |
| REQ-02 | Mobile 375px: inspect items | 3 visible (rotateY ±35°), slots 0,4 opacity 0 + pointer-events none |
| REQ-03 | Check computed overflow on #phone-carousel | overflow: visible |
| REQ-04 | Check #phone-carousel min-height | min-height contains vh unit |
| REQ-05 | Click side item on desktop | Carousel navigates to clicked item |
| REQ-06 | Hover carousel → check autoplay | Paused on enter, resumed on leave |
| REQ-07 | Resize browser → check positions recalc | translateX values change with viewport width |
| REQ-08 | Check hidden items (opacity 0) | pointer-events: none |

### Overall

```bash
# JS checks
grep -q 'translateZ' assets/js/carousel.js && \
grep -q 'POSITIONS_MOBILE' assets/js/carousel.js && \
grep -q 'mouseenter' assets/js/carousel.js && \
grep -q 'pointer-events' assets/js/carousel.js && \
echo "JS PASS" || echo "JS FAIL"

# CSS checks
grep -q 'perspective: 1200px' assets/css/carousel.css && \
grep -q 'overflow: visible' assets/css/carousel.css && \
grep -q 'min-height' assets/css/carousel.css && \
echo "CSS PASS" || echo "CSS FAIL"

# HTML checks
grep -q 'overflow-x-clip' index.html && echo "HTML PASS" || echo "HTML FAIL"
```
