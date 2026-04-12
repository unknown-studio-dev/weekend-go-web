---
tests_version: "1.0"
spec_ref: "coverflow-carousel-spec-v1.0"
component: "coverflow-carousel"
category: "code"
strategy: "mixed"
language: "javascript"
---

## Unit Tests

### Test: DOM có đủ 6 phone-items (covers REQ-01)
- **Input**: Load index.html
- **Expected**: `querySelectorAll('.phone-item').length === 6`
- **Verify**: `grep -c 'class="phone-item' index.html` trả về 6

### Test: Container có perspective CSS (covers REQ-06)
- **Input**: Inspect `#phone-carousel` styles
- **Expected**: Có `perspective` property trong inline style hoặc class
- **Verify**: `grep -c 'perspective' index.html` >= 1

### Test: CoverFlow transform values đúng (covers REQ-02, REQ-03, REQ-04)
- **Input**: Load page, inspect JS code
- **Expected**: 
  - Center: `rotateY(0deg)` + `scale(1.0)` + `opacity: 1`
  - ±1: `rotateY(±40deg)` + `scale(0.8)` + `opacity: 0.7`
  - ±2: `rotateY(±55deg)` + `scale(0.65)` + `opacity: 0.4`
- **Verify**: `grep 'rotateY' index.html` trả về matches

### Test: Carousel xoay vòng tròn (covers REQ-05)
- **Input**: Click next 6 lần liên tiếp
- **Expected**: Quay đủ 1 vòng, centerIndex trở về giá trị ban đầu
- **Verify**: Visual test — mở browser, click 6 lần

## Integration Tests

### Test: Autoplay hoạt động với CoverFlow (covers REQ-05)
- **Setup**: Mở index.html trong browser
- **Steps**:
  1. Chờ 3 giây — ảnh tự chuyển
  2. Click next — autoplay reset
  3. Chờ thêm 3 giây — autoplay tiếp tục
- **Expected**: Autoplay xoay mượt, không giật
- **Verify**: Visual inspection

### Test: Responsive trên mobile (covers REQ-07)
- **Setup**: DevTools → toggle device toolbar → iPhone 14 (390px)
- **Steps**:
  1. Scroll đến section "Xem trước ứng dụng"
  2. Kiểm tra 5 ảnh hiển thị không bị tràn
  3. Click prev/next
- **Expected**: Layout không vỡ, ảnh không bị cắt, animation mượt
- **Verify**: Visual inspection

## Edge Cases
| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Click next liên tục nhanh | Spam click 10 lần | Không bị lỗi, `animating` lock ngăn overlap | REQ-05 |
| Resize giữa animation | Resize browser khi đang animate | Không crash, layout tự adjust | REQ-07 |
| Tab inactive rồi quay lại | Switch tab 30s rồi quay lại | Autoplay tiếp tục bình thường | REQ-05 |
