---
spec_version: "1.0"
project: "weekend-go-web"
component: "carousel-visual-bugs"
language: "javascript"
task_type: "fix"
category: "code"
status: "draft"
---

## Overview

[fix]: Sửa 3 bugs visual carousel — mobile overlap, desktop spacing, button positioning

### Goal

Fix 3 visual bugs phát hiện từ screenshot review sau refactor carousel.

### Context

Sau khi refactor carousel (feat/responsive-carousel-scale-center), visual review phát hiện 3 issues:
1. Scale Center trên mobile — side items chồng lên center vì translateX quá nhỏ
2. Desktop CoverFlow — khoảng cách đều giữa 5 items thay vì Apple-style (center tách biệt, sides dồn lại)
3. Prev/Next buttons dùng `absolute` nhưng parent div thiếu `relative`

### Requirements

- **[REQ-01]** Mobile Scale Center: side items KHÔNG chồng lên center item — phải có gap visible giữa center và side items
- **[REQ-02]** Desktop CoverFlow: center-to-±1 gap phải lớn hơn ±1-to-±2 gap rõ ràng (Apple-style compressed sides)
- **[REQ-03]** Prev/Next buttons phải nằm đúng vị trí tương đối với carousel container trên mọi breakpoint

### Out of Scope

- Không thay đổi autoplay, swipe, dots behavior
- Không thay đổi image order
- Không thay đổi carousel height hoặc img width

---

## Interfaces / APIs

### Bug 1 — Scale Center txRatio (carousel.js)

```javascript
// BEFORE
const POSITIONS_SCALE_CENTER = [
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
  { scale: 0.72, rotateY: 0, txRatio: -0.18, opacity: 0.6, zIndex: 5  },
  { scale: 1.0,  rotateY: 0, txRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.72, rotateY: 0, txRatio: 0.18,  opacity: 0.6, zIndex: 5  },
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
];

// AFTER — txRatio ±0.18 → ±0.30 (wider separation)
const POSITIONS_SCALE_CENTER = [
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
  { scale: 0.72, rotateY: 0, txRatio: -0.30, opacity: 0.6, zIndex: 5  },
  { scale: 1.0,  rotateY: 0, txRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.72, rotateY: 0, txRatio: 0.30,  opacity: 0.6, zIndex: 5  },
  { scale: 0.5,  rotateY: 0, txRatio: 0,     opacity: 0,   zIndex: 0  },
];
```

Tính toán: 0.30 × 375px = 112px offset. Side item 240×0.72 = 173px → half = 86px. Center half = 120px. Gap = 112 - 86 = 26px visible gap. Trước: 67 - 86 = -19px (overlap 19px).

### Bug 2 — Desktop CoverFlow spacing (carousel.js)

```javascript
// BEFORE — uniform spacing
const POSITIONS_DESKTOP = [
  { scale: 0.55, rotateY: 55,  txRatio: -0.37, opacity: 0.4, zIndex: 2  },
  { scale: 0.75, rotateY: 40,  txRatio: -0.20, opacity: 0.7, zIndex: 5  },
  { scale: 1.0,  rotateY: 0,   txRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.75, rotateY: -40, txRatio: 0.20,  opacity: 0.7, zIndex: 5  },
  { scale: 0.55, rotateY: -55, txRatio: 0.37,  opacity: 0.4, zIndex: 2  },
];
// center→±1 = 0.20, ±1→±2 = 0.17 (nearly equal)

// AFTER — Apple-style compressed sides
const POSITIONS_DESKTOP = [
  { scale: 0.55, rotateY: 50,  txRatio: -0.38, opacity: 0.4, zIndex: 2  },
  { scale: 0.75, rotateY: 45,  txRatio: -0.30, opacity: 0.7, zIndex: 5  },
  { scale: 1.0,  rotateY: 0,   txRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.75, rotateY: -45, txRatio: 0.30,  opacity: 0.7, zIndex: 5  },
  { scale: 0.55, rotateY: -50, txRatio: 0.38,  opacity: 0.4, zIndex: 2  },
];
// center→±1 = 0.30, ±1→±2 = 0.08 (3.75x ratio — Apple-style)
```

### Bug 3 — Button parent positioning (index.html)

```html
<!-- BEFORE — missing relative on parent div -->
<div>
  <button id="carousel-prev" class="absolute ...">

<!-- AFTER — add relative -->
<div class="relative">
  <button id="carousel-prev" class="absolute ...">
```

---

## Implementations

### Design Decisions

| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Scale Center txRatio ±0.30 | 26px visible gap trên 375px mobile | FLEXIBLE |
| 2 | Desktop ±1 txRatio 0.30, ±2 txRatio 0.38 | center→±1 gap 3.75x lớn hơn ±1→±2 gap | FLEXIBLE |
| 3 | RotateY ±1: 40°→45°, ±2: 55°→50° | Side items gần nhau hơn về góc xoay (Apple-style) | FLEXIBLE |
| 4 | Parent div thêm `relative` class | Buttons absolute cần relative container | LOCKED |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `assets/js/carousel.js` | MODIFY | Update POSITIONS_SCALE_CENTER txRatio + POSITIONS_DESKTOP values | d=1 |
| `index.html` | MODIFY | Thêm `relative` class cho parent div wrapping carousel + buttons | d=1 |
| `src/index.src.html` | MODIFY | Same change as index.html | d=1 |

---

## Acceptance Criteria

### Per-Requirement

| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | Inspect mobile (375px): check side items translateX > center item half-width | Side items không overlap center — visible gap |
| REQ-02 | Inspect desktop: compare center→±1 vs ±1→±2 txRatio difference | center→±1 (0.30) >> ±1→±2 (0.08) |
| REQ-03 | Inspect parent div of carousel buttons | Has class `relative` |

### Overall

```bash
# Check txRatio values
grep 'txRatio: -0.30' assets/js/carousel.js && grep 'txRatio: 0.30' assets/js/carousel.js && grep 'txRatio: -0.38' assets/js/carousel.js && echo "JS PASS" || echo "JS FAIL"

# Check relative class on parent div
grep -B1 'id="carousel-prev"' index.html | grep -q 'relative' && echo "HTML PASS" || echo "HTML FAIL"
```
