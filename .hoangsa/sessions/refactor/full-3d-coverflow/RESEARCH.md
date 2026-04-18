# Research: Full 3D CoverFlow

## 1. Code hiện tại cần thay đổi

### carousel.js (276 lines)

**MODIFY — Position arrays:**
- `POSITIONS_DESKTOP` (line 23-29): Thêm `translateZ`, update scale/rotateY/txRatio
- `POSITIONS_SCALE_CENTER` → rename `POSITIONS_MOBILE` (line 31-37): Thêm rotateY 3D, translateZ
- `HIDDEN` (line 19): Thêm translateZ: 0

**MODIFY — getViewportMode()** (line 47-49):
- Rename return values: 'coverflow' → 'desktop', 'scale-center' → 'mobile' (hoặc giữ coverflow cho cả 2)

**MODIFY — applyPositions()** (line 105-121):
- Transform string cần thêm `translateZ(${pos.translateZ}px)`
- Hidden items cần `pointer-events: none`

**ADD — Click side items:**
- Thêm click handler cho .phone-item (non-center) → navigate to that item

**ADD — Hover pause autoplay:**
- `carousel.addEventListener('mouseenter', stopAutoPlay)`
- `carousel.addEventListener('mouseleave', startAutoPlay)`

**MODIFY — handleResize()** (line 225-235):
- Luôn re-apply positions khi resize (không chỉ khi mode change) vì txRatio responsive

### carousel.css (86 lines)

**MODIFY — #phone-carousel:**
- Height: fixed px → `min-height: 50vh` (mobile) / `min-height: 60vh` (desktop)
- Thêm `overflow: visible`
- Perspective: 1200px cho cả 2 modes (không chỉ desktop)
- `transform-style: preserve-3d` cho cả 2 modes

**REMOVE — @media (max-width: 1023px):**
- Xoá `perspective: none; transform-style: flat;` — mobile giờ cũng 3D

**ADD — .phone-item hidden state:**
- `pointer-events: none` cho hidden items

**ADD — section overflow:**
- Section parent cần `overflow: visible` hoặc `overflow: clip` (không `hidden`) để 3D items không bị cắt

### index.html + src/index.src.html

**MODIFY — Section carousel:**
- `overflow-hidden` → `overflow-visible` trên section tag (line 685)

## 2. Transform string mới

Hiện tại:
```javascript
`translate(-50%, -50%) translateX(${tx}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`
```

Cần thành:
```javascript
`translate(-50%, -50%) translateX(${tx}px) translateZ(${pos.translateZ}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`
```

**Lưu ý**: Thứ tự transform matters trong 3D. `translateZ` trước `rotateY` tạo hiệu ứng khác so với sau. Đặt `translateZ` trước `scale` và `rotateY` để center item "nhô ra" trước khi rotate.

## 3. Position values mới (từ spec user)

### Desktop (≥1024px) — 5 items visible
| Slot | scale | rotateY | txRatio | translateZ | opacity | zIndex |
|------|-------|---------|---------|-----------|---------|--------|
| 0 (far-left) | 0.7 | 55 | -0.38 | 0 | 0.4 | 2 |
| 1 (left) | 0.85 | 45 | -0.25 | 50 | 0.8 | 5 |
| 2 (center) | 1.1 | 0 | 0 | 150 | 1.0 | 10 |
| 3 (right) | 0.85 | -45 | 0.25 | 50 | 0.8 | 5 |
| 4 (far-right) | 0.7 | -55 | 0.38 | 0 | 0.4 | 2 |

### Mobile/Tablet (<1024px) — 3 items visible
| Slot | scale | rotateY | txRatio | translateZ | opacity | zIndex |
|------|-------|---------|---------|-----------|---------|--------|
| 0 (hidden) | 0.5 | 0 | 0 | 0 | 0 | 0 |
| 1 (left) | 0.85 | 35 | -0.28 | 30 | 0.7 | 5 |
| 2 (center) | 1.1 | 0 | 0 | 120 | 1.0 | 10 |
| 3 (right) | 0.85 | -35 | 0.28 | 30 | 0.7 | 5 |
| 4 (hidden) | 0.5 | 0 | 0 | 0 | 0 | 0 |

## 4. Risks

- `overflow: visible` có thể gây layout issues với sections bên dưới
- `translateZ` + `perspective` tạo visual size khác với `scale` — center item sẽ trông lớn hơn expected
- Mobile 3D rotation có thể gây performance issues trên thiết bị yếu
- `section overflow-hidden → overflow-visible` ảnh hưởng layout nếu có absolute elements khác
