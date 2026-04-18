---
spec_version: "1.0"
project: "weekend-go-web"
component: "carousel_responsive_spacing"
language: "JavaScript"
task_type: "fix"
category: "code"
status: "draft"
---

## Overview
[fix]: Responsive translateX cho carousel phone items

### Goal
Thay thế translateX pixel cố định bằng giá trị tương đối theo carousel width, giúp khoảng cách giữa các phone items scale đều ở mọi viewport.

### Context
POSITIONS_DESKTOP, POSITIONS_TABLET, POSITIONS_MOBILE dùng translateX cố định (420px, 230px, 180px, 170px). Trên viewport nhỏ (480-767px), phone chồng lên nhau. Trên viewport lớn (>1280px), phone cách quá xa.

### Requirements
- [REQ-01] translateX phải scale theo carousel container width (không phải viewport width)
- [REQ-02] Khoảng cách giữa các phone proportional ở mọi viewport (desktop, tablet)
- [REQ-03] Mobile scroll-snap mode không bị ảnh hưởng (dùng CSS gap, không translateX)
- [REQ-04] Desktop/tablet visual không bị vỡ — vẫn coverflow effect đẹp

### Out of Scope
- Mobile scroll-snap spacing
- Scale/rotateY/opacity values
- Animation changes

---

## Implementations

### Approach

Thay vì hardcode translateX trong POSITIONS arrays, store chúng như tỉ lệ (ratio) của carousel width. Trong `applyPositions()` và `goTo()`, nhân ratio với `carousel.offsetWidth` để lấy translateX thực.

```javascript
// Thay translateX: 230 → translateXRatio: 0.20 (20% of carousel width)
// Ví dụ: carousel width 1140px → translateX = 228px
// Ví dụ: carousel width 600px → translateX = 120px

const POSITIONS_DESKTOP = [
  { scale: 0.55, rotateY: 55,  translateXRatio: -0.37, opacity: 0.4, zIndex: 2  },
  { scale: 0.75, rotateY: 40,  translateXRatio: -0.20, opacity: 0.7, zIndex: 5  },
  { scale: 1.0,  rotateY: 0,   translateXRatio: 0,     opacity: 1.0, zIndex: 10 },
  { scale: 0.75, rotateY: -40, translateXRatio: 0.20,  opacity: 0.7, zIndex: 5  },
  { scale: 0.55, rotateY: -55, translateXRatio: 0.37,  opacity: 0.4, zIndex: 2  },
];
```

### Ratios derived from original values

Original reference: carousel max-width ~1140px (lg:max-w-5xl)

| Position | Original px | Ratio (px / 1140) | Rounded |
|----------|------------|-------------------|---------|
| Far ±2 | 420 | 0.368 | 0.37 |
| Near ±1 | 230 | 0.202 | 0.20 |
| Tablet ±1 | 180 | 0.158 | 0.25 (bump up) |
| Mobile ±1 | 170 | N/A | N/A (scroll-snap) |

### Affected Files

| File | Action | Description |
|------|--------|-------------|
| `assets/js/carousel.js` | MODIFY | Rename translateX → translateXRatio, update applyPositions/goTo to multiply by carousel width |

---

## Acceptance Criteria

| Req | Verification | Expected |
|-----|-------------|----------|
| REQ-01 | Resize browser, phone spacing scales proportionally | No overlap, no excessive gaps |
| REQ-02 | `npx playwright test --project=desktop --project=tablet` | Tests pass |
| REQ-03 | `npx playwright test --project=mobile` | Mobile tests still pass |
| REQ-04 | Visual check on desktop | Coverflow effect looks good |
