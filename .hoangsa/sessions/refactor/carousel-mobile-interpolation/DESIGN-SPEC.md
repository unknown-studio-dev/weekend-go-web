---
spec_version: "1.0"
project: "weekend-go-web"
component: "carousel_mobile_interpolation"
language: "HTML/CSS/JavaScript"
task_type: "refactor"
category: "code"
status: "draft"
---

## Overview
[refactor]: Real-time interpolation cho carousel mobile

### Goal
Thay thế toggle class `.is-center` bằng JS-driven interpolation real-time, giúp scale/opacity thay đổi mượt mà theo vị trí cuộn thay vì nhảy on/off khi scroll dừng.

### Context
Carousel mobile hiện dùng CSS class `.is-center` toggle sau `scrollend` → hiệu ứng giật, không mượt. User kỳ vọng scale/opacity biến đổi liên tục theo scroll offset giống native app carousel.

### Requirements
- [REQ-01] Scroll-snap: `scroll-snap-type: x mandatory`, item gần center tự snap vào giữa
- [REQ-02] Real-time interpolation: scale/opacity thay đổi mượt mà theo khoảng cách tới center X trong lúc cuộn
- [REQ-03] Giá trị: center `scale(1.0) opacity(1.0)`, hai bên `scale(0.85) opacity(0.5)`, nội suy tuyến tính theo distance
- [REQ-04] Infinite loop: clone approach `[Last, ...items, First]`, scrollTo instant khi chạm boundary
- [REQ-05] Dot indicator: cập nhật active dot khớp với item đang ở center
- [REQ-06] Performance: scroll handler phải dùng `requestAnimationFrame` để tránh jank
- [REQ-07] Desktop/tablet không bị ảnh hưởng — chỉ thay đổi mobile mode (<768px)

### Out of Scope
- Desktop coverflow carousel
- Tablet mode
- Autoplay trên mobile
- CSS scroll-driven animations
- Thêm swipe gestures mới

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Bỏ `.is-center` CSS class toggle, dùng JS inline style | CSS `!important` chặn interpolation; JS cần full control | LOCKED |
| 2 | Scroll listener + rAF cho interpolation | Browser support rộng, mượt nhất, kiểm soát tốt | LOCKED |
| 3 | Linear interpolation dựa trên distance / itemWidth | Đơn giản, predictable, dễ tune | FLEXIBLE |
| 4 | Bỏ `!important` trên mobile .phone-item transform/opacity | Để JS override được | LOCKED |
| 5 | Giữ nguyên scroll-snap CSS, thêm JS layer phía trên | Snap behavior vẫn do CSS, visual feedback do JS | LOCKED |

### Logic interpolation

```javascript
// Trong scroll handler + rAF:
function interpolateItems() {
  const containerCenter = carousel.scrollLeft + carousel.offsetWidth / 2;
  const items = Array.from(carousel.children);
  
  items.forEach(item => {
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const distance = Math.abs(itemCenter - containerCenter);
    const itemWidth = item.offsetWidth;
    
    // ratio: 0 = ở center, 1 = cách 1 item width
    const ratio = Math.min(distance / itemWidth, 1);
    
    // Linear interpolation
    const scale = 1.0 - ratio * (1.0 - 0.85);   // 1.0 → 0.85
    const opacity = 1.0 - ratio * (1.0 - 0.5);   // 1.0 → 0.5
    
    item.style.transform = `scale(${scale})`;
    item.style.opacity = opacity;
  });
}
```

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `assets/js/carousel.js` | MODIFY | Thêm `interpolateItems()`, gọi trong scroll listener + rAF, bỏ `updateCenterClass()` cho mobile | d=1 |
| `assets/css/carousel.css` | MODIFY | Bỏ `!important` trên transform/opacity của `.phone-item` mobile, bỏ `.is-center` rules, giữ transition | d=1 |
| `tests/visual/carousel-mobile.spec.js` | MODIFY | Cập nhật tests: bỏ test is-center class, thêm test interpolation values | d=1 |

### Flow thay đổi

**Trước (hiện tại):**
```
scroll → debounceScrollEnd (100ms) → handleScrollEnd → updateCenterClass → CSS transition 300ms
```

**Sau (mới):**
```
scroll → rAF → interpolateItems() (mỗi frame) → inline style scale/opacity
scrollend → handleScrollEnd → cập nhật centerIndex + dots (không đổi)
```

---

## Open Questions
- Không có

## Constraints
- Không dùng `!important` trong CSS cho transform/opacity mobile
- `requestAnimationFrame` phải được dùng (không gọi trực tiếp trong scroll handler)
- Phải giữ `prefers-reduced-motion` support — khi reduced motion, bỏ interpolation animation

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | `npx playwright test --grep "scroll-snap"` | scroll-snap-type: x mandatory trên mobile |
| REQ-02 | `npx playwright test --grep "interpolation"` | Item giữa có scale ≈ 1.0, item bên cạnh < 1.0 |
| REQ-03 | `npx playwright test --grep "scale\|opacity"` | Center: scale 1.0/opacity 1.0, sides: ~0.85/~0.5 |
| REQ-04 | `npx playwright test --grep "clone"` | Clones tồn tại với aria-hidden |
| REQ-05 | `npx playwright test --grep "dots"` | Dots cập nhật active state |
| REQ-06 | Manual: scroll trên mobile, không có jank | 60fps smooth |
| REQ-07 | `npx playwright test --project=desktop` | Desktop tests vẫn pass |

### Overall
```bash
npx playwright test tests/visual/carousel-mobile.spec.js && npx playwright test --project=desktop
```
