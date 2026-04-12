---
spec_version: "1.0"
project: "weekend-go-web"
component: "coverflow-carousel"
language: "javascript"
task_type: "feat"
category: "code"
status: "draft"
---

## Overview
[feat]: CoverFlow carousel cho section "Xem trước ứng dụng"

### Goal
Thay đổi carousel từ kiểu trượt ngang đơn giản thành CoverFlow style (kiểu Apple iTunes) — hiển thị 5 ảnh cùng lúc, ảnh giữa to nhất đối diện, 2 bên nghiêng vào trong với rotateY, ảnh xa nhỏ dần và mờ đi.

### Context
Carousel hiện tại chỉ hiển thị 3 ảnh với scale + opacity đơn giản. Với 6 ảnh app screenshots, CoverFlow sẽ tạo hiệu ứng chiều sâu hấp dẫn hơn, cho phép user thấy được nhiều màn hình ứng dụng cùng lúc.

### Requirements
- [REQ-01] Hiển thị 5 ảnh cùng lúc theo CoverFlow layout, ảnh thứ 6 ẩn
- [REQ-02] Ảnh trung tâm: scale lớn nhất, đối diện (rotateY=0), opacity=1, z-index cao nhất
- [REQ-03] Ảnh bên cạnh (±1): nghiêng vào trong (rotateY ±40°), scale nhỏ hơn, opacity giảm
- [REQ-04] Ảnh xa (±2): nghiêng nhiều hơn (rotateY ±55°), scale nhỏ nhất, opacity thấp nhất
- [REQ-05] Prev/Next/Autoplay hoạt động bình thường — ảnh xoay mượt theo vòng tròn
- [REQ-06] Container có CSS perspective để tạo hiệu ứng 3D
- [REQ-07] Responsive — hoạt động tốt trên mobile, tablet, desktop

### Out of Scope
- Pagination dots
- Touch/swipe gestures
- Thay đổi HTML markup của phone-items
- Thay đổi section header

---

## Types / Data Models

Không có types mới — chỉ dùng vanilla JS.

## Interfaces / APIs

### Carousel State
```javascript
// Constants
const ANIMATION_DURATION_MS = 600;   // tăng từ 500 → 600 cho mượt hơn
const AUTOPLAY_INTERVAL_MS = 3000;   // giữ nguyên
const VISIBLE_COUNT = 5;             // mới — số ảnh hiển thị

// Positions relative to center (DOM order after reorder)
// 0: far-left (-2)  |  1: left (-1)  |  2: center  |  3: right (+1)  |  4: far-right (+2)
// Item 6 (hidden): không có trong DOM visible order
```

### CoverFlow Transform Map
```javascript
const COVERFLOW_POSITIONS = {
  center:    { scale: 1.0,  rotateY: 0,    translateX: '0%',    opacity: 1.0, zIndex: 10 },
  left1:     { scale: 0.8,  rotateY: 40,   translateX: '-20%',  opacity: 0.7, zIndex: 5  },
  right1:    { scale: 0.8,  rotateY: -40,  translateX: '20%',   opacity: 0.7, zIndex: 5  },
  left2:     { scale: 0.65, rotateY: 55,   translateX: '-35%',  opacity: 0.4, zIndex: 2  },
  right2:    { scale: 0.65, rotateY: -55,  translateX: '35%',   opacity: 0.4, zIndex: 2  },
  hidden:    { scale: 0.5,  rotateY: 0,    translateX: '0%',    opacity: 0,   zIndex: 0  },
};
```

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Dùng CSS transform 3D (rotateY + perspective) | CoverFlow cần 3D depth — rotateY tạo hiệu ứng nghiêng | LOCKED |
| 2 | Absolute positioning thay vì flexbox | 5 items overlap nhau cần absolute + translateX | LOCKED |
| 3 | Reorder DOM hiển thị 5 items, ẩn 1 item | Giữ logic circular đơn giản | LOCKED |
| 4 | Tăng animation duration lên 600ms | CoverFlow cần transition mượt hơn linear slide | FLEXIBLE |
| 5 | Transform values có thể tinh chỉnh | rotateY, scale, translateX là FLEXIBLE — tune theo mắt | FLEXIBLE |

### Affected Files
| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `index.html` | MODIFY | Thay đổi CSS của `#phone-carousel` container + viết lại toàn bộ JS carousel logic | d=1 |

### Chi tiết thay đổi

#### 1. CSS Container (sửa class của `#phone-carousel`)
```css
/* Bỏ: flex justify-center items-center gap-0 sm:-space-x-4 lg:-space-x-8 */
/* Thêm: relative + perspective */
#phone-carousel {
  position: relative;
  perspective: 1200px;
  height: 600px; /* hoặc tính theo viewport */
  width: 100%;
}

.phone-item {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1),
              opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 2. JS — Hàm `reorderDOM()` mới
Thay vì chỉ giữ 3 items, giờ sắp xếp 5 items visible + 1 hidden:
```javascript
function reorderDOM() {
  const positions = [];
  for (let i = -2; i <= 2; i++) {
    positions.push((centerIndex + i + total) % total);
  }
  // Item thứ 6 (hidden)
  const hiddenIndex = (centerIndex + 3) % total;
  
  // Append theo thứ tự: far-left, left, center, right, far-right, hidden
  positions.forEach(idx => carousel.appendChild(phones[idx]));
  carousel.appendChild(phones[hiddenIndex]);
}
```

#### 3. JS — Hàm `applyByDOMPosition()` mới
Apply CoverFlow transforms theo position:
```javascript
function applyByDOMPosition() {
  const items = carousel.querySelectorAll(".phone-item");
  const posMap = [
    COVERFLOW_POSITIONS.left2,   // DOM 0
    COVERFLOW_POSITIONS.left1,   // DOM 1
    COVERFLOW_POSITIONS.center,  // DOM 2
    COVERFLOW_POSITIONS.right1,  // DOM 3
    COVERFLOW_POSITIONS.right2,  // DOM 4
    COVERFLOW_POSITIONS.hidden,  // DOM 5
  ];
  
  items.forEach((phone, domIndex) => {
    const pos = posMap[domIndex];
    const img = phone.querySelector("img");
    phone.style.transform = 
      `translateX(-50%) translateY(-50%) translateX(${pos.translateX}) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`;
    phone.style.opacity = pos.opacity;
    phone.style.zIndex = pos.zIndex;
  });
}
```

#### 4. JS — Hàm `goTo()` cập nhật
Giữ logic tương tự nhưng adapt cho 5 items.

---

## Constraints
- Chỉ dùng vanilla JS + CSS — không thêm thư viện
- Performance: transform + opacity là GPU-accelerated, tránh layout thrashing
- Mobile: giảm perspective và translateX trên viewport nhỏ

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | Đếm items visible (opacity > 0) trong DOM | 5 items visible, 1 hidden |
| REQ-02 | Inspect center item transform | rotateY(0deg) scale(1.0) opacity=1 |
| REQ-03 | Inspect ±1 items transform | rotateY(±40deg) scale(0.8) opacity=0.7 |
| REQ-04 | Inspect ±2 items transform | rotateY(±55deg) scale(0.65) opacity=0.4 |
| REQ-05 | Click next 6 lần | Quay đủ 1 vòng, quay lại ảnh ban đầu |
| REQ-06 | Inspect `#phone-carousel` CSS | Có perspective property |
| REQ-07 | Resize browser 375px → 1440px | Layout không bị vỡ |

### Overall
Mở `index.html` trong browser → section "Xem trước ứng dụng" hiển thị 5 ảnh CoverFlow, autoplay xoay mượt, prev/next hoạt động.
