---
tests_version: "1.0"
spec_ref: "carousel_mobile_interpolation-spec-v1.0"
component: "carousel_mobile_interpolation"
category: "code"
strategy: "mixed"
language: "JavaScript (Playwright)"
---

## Unit Tests

### Test: mobile — scroll-snap vẫn active
- **Covers**: [REQ-01]
- **Input**: Mobile viewport (375px)
- **Setup**: Mở trang index, chờ carousel render
- **Expected**: `scroll-snap-type` = `x mandatory` trên `#phone-carousel`
- **Verify**: `npx playwright test --grep "scroll-snap" --project=mobile`

### Test: mobile — center item có scale ≈ 1.0 sau snap
- **Covers**: [REQ-02], [REQ-03]
- **Input**: Mobile viewport, scroll đến item đầu tiên (snap position)
- **Setup**: Chờ scroll settle (scrollend hoặc 500ms)
- **Expected**: Item ở center có `transform` chứa `scale(1)` (hoặc rất gần 1.0), `opacity` ≈ 1.0
- **Verify**: `npx playwright test --grep "center.*scale" --project=mobile`

### Test: mobile — side items có scale < 1.0
- **Covers**: [REQ-02], [REQ-03]
- **Input**: Mobile viewport, sau khi snap xong
- **Setup**: Đọc transform/opacity của item kế bên center
- **Expected**: Scale ≤ 0.90, opacity ≤ 0.7 (phải nhỏ hơn center rõ rệt)
- **Verify**: `npx playwright test --grep "side.*scale" --project=mobile`

### Test: mobile — clones tồn tại với aria-hidden
- **Covers**: [REQ-04]
- **Input**: Mobile viewport
- **Expected**: 2 clone nodes (đầu và cuối) với `aria-hidden="true"` và `tabIndex=-1`
- **Verify**: `npx playwright test --grep "clone" --project=mobile`

### Test: mobile — dots cập nhật active
- **Covers**: [REQ-05]
- **Input**: Mobile viewport, scroll đến item khác
- **Expected**: Đúng 1 dot có class `active`, khớp với centerIndex
- **Verify**: `npx playwright test --grep "dots" --project=mobile`

### Test: mobile — arrows ẩn
- **Covers**: [REQ-07]
- **Input**: Mobile viewport
- **Expected**: `#carousel-prev` và `#carousel-next` có `display: none`
- **Verify**: `npx playwright test --grep "arrows" --project=mobile`

## Integration Tests

### Test: desktop — coverflow mode không bị ảnh hưởng
- **Covers**: [REQ-07]
- **Input**: Desktop viewport (1280px)
- **Expected**: Items absolute, scroll-snap KHÔNG active, 5 visible phones
- **Verify**: `npx playwright test --project=desktop --grep "desktop"`

### Test: mobile — interpolation giá trị liên tục (không nhảy)
- **Covers**: [REQ-02], [REQ-06]
- **Input**: Mobile viewport, scroll programmatically qua 50% of item width
- **Setup**: `carousel.scrollBy({left: halfItemWidth, behavior: 'instant'})`, đợi 1 rAF
- **Expected**: Item đang rời center có scale GIỮA 0.85 và 1.0 (nội suy, không nhảy trực tiếp)
- **Verify**: `npx playwright test --grep "interpolation.*continuous" --project=mobile`

## Edge Cases
| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Clone boundary wrap | Scroll qua item cuối cùng | scrollTo instant về item thật, không flicker | REQ-04 |
| Rapid scroll | Swipe nhanh qua 3+ items | Interpolation vẫn mượt, không lag | REQ-06 |
| prefers-reduced-motion | Media query active | Bỏ interpolation animation, snap trực tiếp | REQ-07 |
| Resize mobile→desktop | Từ 375px resize lên 1280px | Chuyển sang coverflow, bỏ interpolation | REQ-07 |

## Coverage Target
- Target: ≥ 90% cho carousel scroll mode functions
- Critical paths: interpolateItems, handleScrollEnd, clone boundary — 100%
