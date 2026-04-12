---
tests_version: "1.0"
spec_ref: "split-js-css-spec-v1.0"
component: "split-js-css"
category: "code"
strategy: "mixed"
language: "javascript"
---

## Unit Tests

### Test: File JS tồn tại (covers REQ-01)
- **Input**: Check filesystem
- **Expected**: `assets/js/menu.js` và `assets/js/carousel.js` tồn tại
- **Verify**: `ls assets/js/menu.js assets/js/carousel.js`

### Test: File CSS tồn tại (covers REQ-02)
- **Input**: Check filesystem
- **Expected**: `assets/css/carousel.css` tồn tại, chứa perspective
- **Verify**: `ls assets/css/carousel.css && grep -q 'perspective' assets/css/carousel.css`

### Test: Constants được đặt tên (covers REQ-03)
- **Input**: Đọc carousel.js
- **Expected**: Có BREAKPOINT_XS, BREAKPOINT_SM, BREAKPOINT_LG, SPREAD constants
- **Verify**: `grep -c 'BREAKPOINT_' assets/js/carousel.js`

### Test: Không còn inline script (covers REQ-01)
- **Input**: Đọc index.html
- **Expected**: Không còn `<script>` tag inline (chỉ có script src references)
- **Verify**: `grep -c '<script>' index.html` trả về 0

### Test: Quick wins đã fix (covers REQ-04, REQ-05, REQ-06, REQ-07)
- **Verify**:
  ```bash
  grep -q 'company-logo' index.html && \
  test $(grep -c 'javascript:void' index.html) -eq 0 && \
  grep -q 'twitter:image.*\.webp' index.html
  ```

## Integration Tests

### Test: Carousel hoạt động sau khi tách file (covers REQ-08)
- **Setup**: Mở index.html trong browser
- **Steps**:
  1. Scroll đến section "Xem trước ứng dụng"
  2. Chờ autoplay — ảnh tự chuyển
  3. Click prev/next
- **Expected**: CoverFlow animation mượt, giống behavior trước refactor
- **Verify**: Visual inspection

### Test: Mobile menu hoạt động (covers REQ-08)
- **Setup**: DevTools → mobile viewport
- **Steps**:
  1. Click hamburger menu
  2. Menu xuất hiện
  3. Click link — menu đóng
- **Expected**: Toggle hoạt động bình thường
- **Verify**: Visual inspection
