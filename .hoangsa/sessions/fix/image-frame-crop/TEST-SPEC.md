---
tests_version: "1.0"
spec_ref: "carousel_image_frame-spec-v1.0"
component: "carousel_image_frame"
category: "code"
strategy: "mixed"
language: "HTML, CSS, TailwindCSS"
---

## Integration Tests

### Test: Hình ảnh không có border frame
- **Covers**: [REQ-01], [REQ-02]
- **Setup**: Mở trang trên Chrome desktop
- **Steps**:
  1. Scroll đến section carousel
  2. Inspect `.phone-item img` trong DevTools
- **Expected**: 
  - `border: none` (hoặc `border-style: none`)
  - `border-radius: 0px`
  - Không có `box-shadow`
  - Hình ảnh hiển thị không có khung bao quanh

### Test: Blur fade-out ở viền hình
- **Covers**: [REQ-03]
- **Setup**: Mở trang trên Chrome desktop
- **Steps**:
  1. Scroll đến section carousel
  2. Quan sát hình ảnh center
- **Expected**:
  - Hình rõ nét ở giữa
  - 4 cạnh mờ dần (fade-out) — không bị cắt sắc nét
  - Kiểm tra DevTools: có `mask-image` hoặc `-webkit-mask-image` property

### Test: Desktop CoverFlow mode
- **Covers**: [REQ-04]
- **Setup**: Mở trang ở viewport >= 768px
- **Steps**:
  1. Carousel hiển thị dạng CoverFlow 3D
  2. Click arrow next/prev
  3. Quan sát hình center và side items
- **Expected**:
  - Hình center: rõ nét, fade-out ở viền, không frame
  - Hình side: scale nhỏ hơn, rotateY, opacity thấp hơn — nhưng cũng không frame
  - 3D transforms hoạt động bình thường

### Test: Mobile scroll-snap mode
- **Covers**: [REQ-04]
- **Setup**: Mở trang ở viewport < 768px (hoặc Chrome DevTools responsive)
- **Steps**:
  1. Carousel hiển thị dạng scroll-snap
  2. Swipe trái/phải
  3. Quan sát hình center và side items
- **Expected**:
  - Hình center: scale 1.0, opacity 1.0, fade-out ở viền, không frame
  - Hình side: scale 0.85, opacity 0.5, không frame
  - Scroll-snap hoạt động, dots update đúng

### Test: Navigation không bị ảnh hưởng
- **Covers**: [REQ-05]
- **Setup**: Mở trang trên desktop + mobile
- **Steps**:
  1. Desktop: click arrows, click dots, autoplay chạy
  2. Mobile: swipe trái/phải, infinite scroll (clone wrapping)
- **Expected**: Tất cả navigation hoạt động bình thường — CSS change không ảnh hưởng JS logic

### Test: Hình ảnh ngoài carousel không bị ảnh hưởng
- **Covers**: [REQ-06]
- **Setup**: Mở trang và scroll qua các sections
- **Steps**:
  1. Kiểm tra hình ảnh trong hero section
  2. Kiểm tra hình ảnh trong cards
  3. Kiểm tra hình ảnh trong footer
- **Expected**: Tất cả hình ảnh ngoài carousel giữ nguyên style, không có mask-image/fade effect

## Cross-Browser Tests

### Test: Safari mask-image compatibility
- **Covers**: [REQ-03]
- **Setup**: Mở trang trên Safari (macOS hoặc iOS)
- **Steps**:
  1. Scroll đến carousel
  2. Kiểm tra fade-out effect
- **Expected**: 
  - `-webkit-mask-image` hoạt động trên Safari
  - `-webkit-mask-composite: destination-in` hoạt động đúng
  - Hiệu ứng tương tự Chrome

## Edge Cases
| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Hình chưa load (lazy) | Scroll nhanh đến carousel | Hình placeholder không có frame, fade khi load xong | REQ-01, REQ-03 |
| Resize desktop → mobile | Thay đổi viewport width | Chuyển mode mượt, không frame ở cả hai mode | REQ-04 |
| Resize mobile → desktop | Thay đổi viewport width | Chuyển mode mượt, CoverFlow 3D hoạt động | REQ-04 |
| Prefers-reduced-motion | Bật accessibility setting | Fade effect vẫn hiển thị (mask là visual, không phải animation) | REQ-03 |

## Coverage Target
- Target: 100% — tất cả REQ phải verify được bằng visual inspection
- Critical paths: Desktop CoverFlow + Mobile scroll-snap
