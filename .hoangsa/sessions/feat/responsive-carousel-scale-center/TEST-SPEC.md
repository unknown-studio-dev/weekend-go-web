---
tests_version: "1.0"
spec_ref: "responsive-carousel-spec-v1.0"
component: "responsive-carousel"
category: "code"
strategy: "mixed"
language: "javascript"
---

## Unit Tests

### Test: scale-center positions có đúng 5 slots, slot 0 và 4 hidden
- **Covers**: [REQ-02]
- **Input**: `POSITIONS_SCALE_CENTER` array
- **Expected**: length = 5, index 0 và 4 có `opacity: 0, zIndex: 0`, index 2 có `scale: 1.0, opacity: 1.0`
- **Verify**: Kiểm tra trực tiếp trong JS hoặc unit test

### Test: getViewportMode() trả về 'coverflow' khi width >= 1024
- **Covers**: [REQ-01], [REQ-03]
- **Input**: `window.innerWidth = 1024`
- **Expected**: `getViewportMode()` returns `'coverflow'`
- **Verify**: Playwright evaluate với viewport 1024px

### Test: getViewportMode() trả về 'scale-center' khi width < 1024
- **Covers**: [REQ-02], [REQ-03]
- **Input**: `window.innerWidth = 1023`
- **Expected**: `getViewportMode()` returns `'scale-center'`
- **Verify**: Playwright evaluate với viewport 1023px

### Test: getPositions() trả về POSITIONS_DESKTOP trên desktop
- **Covers**: [REQ-01]
- **Input**: viewport 1280px
- **Expected**: positions array có `rotateY` values khác 0
- **Verify**: Playwright evaluate `getPositions()`

### Test: getPositions() trả về POSITIONS_SCALE_CENTER trên mobile
- **Covers**: [REQ-02]
- **Input**: viewport 375px
- **Expected**: positions array tất cả `rotateY: 0`
- **Verify**: Playwright evaluate `getPositions()`

## Integration Tests

### Test: desktop coverflow mode — perspective và rotateY active
- **Covers**: [REQ-01]
- **Setup**: Playwright desktop viewport (1280x720)
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Check `#phone-carousel` computed style
  3. Check visible items có `rotateY` trong transform
- **Expected**:
  - `perspective` !== 'none'
  - `transform-style` = 'preserve-3d'
  - 5 items visible (opacity > 0)
  - Center item: rotateY(0deg), scale(1.0)
  - Side items: rotateY có giá trị khác 0
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js --project=desktop`

### Test: scale-center mode — no rotation, chỉ scale + opacity
- **Covers**: [REQ-02]
- **Setup**: Playwright mobile viewport (375x667)
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Check `#phone-carousel` computed style
  3. Check items — center scale ~1.0, side scale < 1.0, no rotateY
- **Expected**:
  - Items position = 'absolute' (không phải 'static')
  - Không có `scroll-snap-type`
  - 3 items visible (opacity > 0): center + left + right
  - 2 items hidden (opacity = 0): index 0 và 4
  - Tất cả items: rotateY = 0 (hoặc không có rotateY trong transform)
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js --project=mobile`

### Test: tablet scale-center mode (768px viewport)
- **Covers**: [REQ-02]
- **Setup**: Playwright viewport 768x1024
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Check viewport mode = 'scale-center'
  3. Check items có absolute positioning, no rotateY
- **Expected**: Giống mobile — Scale Center active, no scroll-snap
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js --project=tablet`

### Test: resize qua 1024px boundary chuyển mode real-time
- **Covers**: [REQ-03]
- **Setup**: Playwright desktop viewport (1280x720)
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Assert viewport mode = 'coverflow'
  3. Resize viewport to 1023x720
  4. Wait 200ms (debounce)
  5. Assert viewport mode = 'scale-center'
  6. Check items: no rotateY, perspective = none
  7. Resize back to 1280x720
  8. Wait 200ms
  9. Assert viewport mode = 'coverflow'
- **Expected**: Mode chuyển seamlessly, không layout jump
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js`

### Test: prev/next buttons visible trên mobile
- **Covers**: [REQ-06]
- **Setup**: Playwright mobile viewport (375x667)
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Check #carousel-prev và #carousel-next display
- **Expected**: display !== 'none', buttons visible
- **Verify**: `npx playwright test --project=mobile`

### Test: prev/next navigation hoạt động trên scale-center
- **Covers**: [REQ-04], [REQ-06]
- **Setup**: Playwright mobile viewport (375x667)
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Get centerIndex (= 0)
  3. Click #carousel-next
  4. Wait animation (600ms)
  5. Get centerIndex (= 1)
- **Expected**: centerIndex tăng sau click next
- **Verify**: `npx playwright test --project=mobile`

### Test: dots clickable trên mobile
- **Covers**: [REQ-07]
- **Setup**: Playwright mobile viewport (375x667)
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Click dot thứ 3
  3. Wait animation
  4. Check centerIndex = 2
- **Expected**: Dots navigate carousel trên mobile
- **Verify**: `npx playwright test --project=mobile`

### Test: scroll-snap code hoàn toàn removed
- **Covers**: [REQ-05]
- **Setup**: Playwright mobile viewport
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Check `#phone-carousel` computed scrollSnapType
  3. Check no `.clone` elements exist
  4. Check items position = 'absolute'
- **Expected**:
  - scrollSnapType = 'none' hoặc ''
  - `.clone` count = 0
  - Tất cả items position = 'absolute'
- **Verify**: `npx playwright test --project=mobile`

### Test: image order đúng theo spec
- **Covers**: [REQ-08]
- **Setup**: Playwright any viewport
- **Steps**:
  1. Navigate to `/`
  2. Get all `.phone-item img` src attributes theo DOM order
- **Expected**:
  1. preview-venue-detail.png
  2. preview-newsfeed.png
  3. preview-user-profile.png
  4. preview-share-review.jpeg
  5. preview-AI-review.png
  6. preview-create-post.png
  7. preview-weekend-plan.png
  8. preview-plan-list.png
- **Verify**: `npx playwright test`

### Test: desktop 5 visible items
- **Covers**: [REQ-01]
- **Setup**: Playwright desktop viewport (1280x720)
- **Steps**:
  1. Navigate to `/`, wait for load
  2. Count items with opacity > 0
- **Expected**: 5 items visible
- **Verify**: `npx playwright test --project=desktop`

### Test: viewport mode attribute đúng
- **Covers**: [REQ-01], [REQ-02]
- **Setup**: Both desktop and mobile viewports
- **Steps**:
  1. Desktop: check `data-viewport-mode` = 'coverflow'
  2. Mobile: check `data-viewport-mode` = 'scale-center'
- **Expected**: Attribute reflects correct mode
- **Verify**: `npx playwright test`

## Edge Cases

| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Resize liên tục qua lại 1024px | Resize 10 lần nhanh | Debounce 150ms, mode cuối đúng | REQ-03 |
| Autoplay trên scale-center | Đợi 3000ms trên mobile | Auto advance hoạt động | REQ-04 |
| Swipe trên scale-center | Touch swipe trái trên mobile | goNext() triggered, item next hiện | REQ-04 |
| First item center (index 0) + goPrev | Click prev khi centerIndex = 0 | Wrap to last item (index 7) | REQ-04 |
| Last item center + goNext | Click next khi centerIndex = 7 | Wrap to first item (index 0) | REQ-04, REQ-09 |

## Tests cần xoá từ file hiện tại

Các tests trong `tests/visual/carousel-mobile.spec.js` cần xoá vì scroll-snap removed:

| Test | Lý do xoá |
|------|-----------|
| `mobile: scroll-snap active` (line 16-22) | Scroll-snap removed |
| `mobile: items are static (not absolute)` (line 24-32) | Items giờ absolute |
| `mobile: item width ~75% of container` (line 34-44) | Flex 75% removed |
| `mobile: scroll-behavior is smooth` (line 56-61) | Scroll mode removed |
| `mobile: arrows hidden` (line 63-68) | Arrows giờ visible |
| `mobile: clones exist with aria-hidden` (line 79-94) | Clones removed |
| `mobile: center item has scale ~1.0` (line 96-122) | Logic đổi hoàn toàn |
| `mobile: side items have reduced scale` (line 124-152) | Logic đổi hoàn toàn |

### Tests cần update

| Test | Thay đổi |
|------|----------|
| `desktop: viewport mode is desktop` (line 184-188) | Đổi expected value từ 'desktop' → 'coverflow' |
| `setup()` function (line 8-11) | Xoá carousel-toggle reference (không tồn tại) |

### Tests giữ nguyên

| Test | Lý do |
|------|-------|
| `mobile: image border-radius is 20px` (line 46-54) | Border-radius vẫn đúng — nhưng cần bỏ `:not(.clone)` selector |
| `mobile: dots exist and one is active` (line 70-77) | Dots vẫn hoạt động |
| `desktop: coverflow mode (no scroll-snap)` (line 156-162) | Vẫn đúng |
| `desktop: items are absolute` (line 164-172) | Vẫn đúng |
| `desktop: 5 visible phones` (line 174-182) | Vẫn đúng |

## Coverage Target

- Target: >= 80%
- Critical paths: 100%
  - Mode switching (desktop ↔ scale-center)
  - Navigation (prev/next/dots) trên cả 2 modes
  - Image order
  - Scroll-snap removal verification
