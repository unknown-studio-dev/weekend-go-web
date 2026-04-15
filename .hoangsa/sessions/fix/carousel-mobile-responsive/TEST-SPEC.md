---
tests_version: "1.0"
spec_ref: "phone_carousel_mobile_responsive-spec-v1.0"
component: "phone_carousel_mobile_responsive"
category: "code"
strategy: "visual"
language: "JavaScript / Playwright"
---

## Test Environment

- Dev server: `npx serve -l 5173 .` (auto-started bởi playwright config)
- Playwright projects có sẵn: `mobile` (375×812), `tablet` (768×1024), `desktop` (1280×800), `wide` (1440×900)
- maxDiffPixelRatio: 0.01 (1%)
- animations: disabled

## Tests ghi vào file mới

File: `tests/visual/carousel-mobile.spec.js`

---

## Visual Tests

### Test: carousel_mobile_375_single_phone
- **Covers**: [REQ-01], [REQ-04]
- **Project**: `mobile` (viewport 375×812)
- **Setup**:
  - Goto `/`
  - `await p.evaluate(() => document.fonts.ready)`
  - `await p.waitForLoadState('networkidle')`
  - Stop autoplay: click `#carousel-toggle` nếu đang playing
  - Scroll section "Xem trước ứng dụng" vào view
- **Assertions**:
  - Screenshot `#phone-carousel` → match baseline `carousel-mobile-375.png`
  - `#phone-carousel .phone-item:not([style*="opacity: 0"])` count === 1
  - Center image `getBoundingClientRect().width` ∈ [220, 260]
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js --project=mobile --grep "375_single_phone"`

### Test: carousel_tablet_768_three_phones
- **Covers**: [REQ-02]
- **Project**: `tablet` (768×1024)
- **Setup**: như trên
- **Assertions**:
  - Screenshot `#phone-carousel` → match baseline `carousel-tablet-768.png`
  - Visible phones count === 3
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js --project=tablet --grep "768_three_phones"`

### Test: carousel_mobile_boundary_480_three_phones
- **Covers**: [REQ-02] boundary
- **Setup**: viewport override `{ width: 480, height: 800 }`
- **Assertions**: visible count === 3 (ngay tại 480px đã sang 3-phone mode)
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js --grep "boundary_480"`

### Test: carousel_desktop_1280_five_phones
- **Covers**: [REQ-03]
- **Project**: `desktop`
- **Assertions**:
  - Visible phones count === 5
  - Screenshot KHÔNG bị regress so với baseline `carousel-desktop-1280.png` (hành vi giữ nguyên)
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js --project=desktop --grep "1280_five_phones"`

---

## Integration Tests

### Test: carousel_mobile_375_swipe_left_goes_next
- **Covers**: [REQ-05]
- **Project**: `mobile`
- **Steps**:
  1. Goto `/`, scroll section vào view, stop autoplay
  2. Lưu `const initialCenter = await p.evaluate(() => window.__carouselCenterIndex)` — _cần expose `window.__carouselCenterIndex` trong carousel.js cho test_
  3. Swipe: dùng `page.dispatchEvent()` hoặc `page.touchscreen`:
     ```js
     await p.locator('#phone-carousel').dispatchEvent('touchstart', { touches: [{ clientX: 300, clientY: 400 }] });
     await p.locator('#phone-carousel').dispatchEvent('touchend', { changedTouches: [{ clientX: 100, clientY: 400 }] });
     ```
  4. Đợi 700ms (> ANIMATION_DURATION_MS)
- **Expected**:
  - `window.__carouselCenterIndex === (initialCenter + 1) % 7`
- **Verify**: `npx playwright test --project=mobile --grep "swipe_left"`

### Test: carousel_mobile_375_swipe_right_goes_prev
- **Covers**: [REQ-05]
- **Steps**: ngược chiều (100 → 300)
- **Expected**: `centerIndex` giảm 1 (modulo 7)

### Test: carousel_mobile_375_vertical_swipe_no_trigger
- **Covers**: [REQ-05] negative
- **Steps**: touchstart (200,300) → touchend (220,600) — swipe dọc dx=20 dy=300
- **Expected**: `centerIndex` KHÔNG đổi (|dx| < threshold VÀ tỷ lệ dy > dx)

### Test: carousel_mobile_375_prev_next_buttons
- **Covers**: [REQ-07]
- **Steps**: click `#carousel-next` rồi `#carousel-prev`
- **Expected**: `centerIndex` +1 rồi -1, về giá trị ban đầu

### Test: carousel_resize_1280_to_375
- **Covers**: [REQ-06]
- **Steps**:
  1. Goto `/` viewport 1280×800, wait visible count === 5
  2. `await p.setViewportSize({ width: 375, height: 812 })`
  3. `await p.waitForTimeout(250)` (> debounce 150ms)
- **Expected**:
  - Visible phones count === 1
  - Center phone vẫn cùng `centerIndex`

### Test: carousel_reduced_motion_swipe_works
- **Covers**: [REQ-08]
- **Setup**: launch với `colorScheme` và `reducedMotion: 'reduce'`
- **Steps**: swipe như test 1
- **Expected**: `centerIndex` đổi, CSS transition bị disabled bởi `@media (prefers-reduced-motion)` đã có

---

## Edge Cases

| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Viewport ngay 480px (boundary SM-XS) | resize 479→480 | visible 1→3, applyPositions chạy 1 lần | REQ-06 |
| Viewport ngay 768px (boundary MD-SM) | resize 767→768 | visible 3→5 | REQ-06 |
| Swipe dx=39 (dưới threshold) | touchstart 200 → touchend 161 | Không trigger goNext/goPrev | REQ-05 |
| Swipe dx=41 (trên threshold) | touchstart 200 → touchend 159 | Trigger goPrev | REQ-05 |
| Tap nhanh không drag | touchstart 200 → touchend 200 (cùng điểm) | Không trigger swipe | REQ-05 |
| Multi-finger | 2+ touches trong touchstart | Dùng touches[0], vẫn chỉ xử lý touch đầu tiên | REQ-05 |

---

## Test helpers

Trong `carousel.js` expose (chỉ để test, không public API):
```js
// Cuối file
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__carouselCenterIndex', {
    get: () => centerIndex,
  });
}
```
> Hoặc dùng `data-center-index` attribute trên `#phone-carousel` update mỗi khi `goTo` chạy — tránh global. FLEXIBLE.

---

## Baselines cần tạo

Sau khi implement, chạy `npx playwright test --update-snapshots` để generate:
- `tests/visual/carousel-mobile.spec.js-snapshots/carousel-mobile-375-<browser>.png`
- `tests/visual/carousel-mobile.spec.js-snapshots/carousel-tablet-768-<browser>.png`
- `tests/visual/carousel-mobile.spec.js-snapshots/carousel-desktop-1280-<browser>.png`

Existing `pages.spec.js-snapshots/index-mobile-*.png` **sẽ đổi** vì mobile giờ chỉ show 1 phone thay vì 5 — cần update snapshots cho mobile viewport:
```bash
npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots
```

---

## Coverage Target
- Per-REQ: 100% — mỗi REQ có ≥1 test case
- Visual regression: 3 viewports chính (mobile/tablet/desktop)
- Interaction: swipe (2 chiều + negative), nút Prev/Next, resize

---

## Overall verification sequence

```bash
# 1. Build
npm run build

# 2. Chạy visual tests mới (cần baseline lần đầu)
npx playwright test tests/visual/carousel-mobile.spec.js --update-snapshots  # first run
npx playwright test tests/visual/carousel-mobile.spec.js                      # subsequent runs

# 3. Update existing mobile snapshots (vì mobile giờ khác)
npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots

# 4. Chạy toàn bộ để verify không regress
npx playwright test

# 5. Manual smoke test
npx serve -l 5173 .
# Mở http://localhost:5173, DevTools → device mode → iPhone SE, iPhone 14, iPad
# Verify: 1/3/5 phones tương ứng, swipe được, click button được
```
