---
tests_version: "2.0"
spec_ref: "phone_carousel_mobile_responsive-spec-v2.0"
component: "phone_carousel_mobile_responsive"
category: "code"
strategy: "visual"
language: "JavaScript / Playwright"
---

## Test Environment

Playwright config sẵn có: `mobile` (375×812), `tablet` (768×1024), `desktop` (1280×800), `wide` (1440×900). maxDiffPixelRatio 0.01. animations disabled.

File mới: `tests/visual/carousel-mobile.spec.js`

## Test helper

Expose state qua data-attribute trên `#phone-carousel`:
```js
// carousel.js — sau mỗi goTo / applyPositions
carousel.dataset.centerIndex = String(centerIndex);
carousel.dataset.viewportMode = getViewportMode();
```

---

## Unit Tests

### Test: swipe_threshold_calculation
- **Covers**: [REQ-06]
- **Setup**: mock `carousel.offsetWidth`
- **Cases**:
  | carousel width | expected threshold |
  |---|---|
  | 100 | 25 (floor by SWIPE_DISTANCE_MIN_PX) |
  | 200 | 30 |
  | 400 | 60 |
  | 1280 | 192 |
- **Verify**: unit test với mock trong `tests/unit/carousel-math.test.js` (nếu setup Jest; nếu không — integration test đủ)

### Test: viewport_mode_resolution
- **Covers**: [REQ-01..03] boundary
- **Cases**:
  | innerWidth | expected mode |
  |---|---|
  | 320 | mobile |
  | 479 | mobile |
  | 480 | tablet |
  | 767 | tablet |
  | 768 | desktop |
  | 1280 | desktop |
- **Verify**: Playwright resize + check `dataset.viewportMode`

---

## Integration Tests

### Test: carousel_mobile_375_peek_pattern
- **Covers**: [REQ-01], [REQ-11], [REQ-12]
- **Project**: `mobile`
- **Setup**: goto `/`, fonts ready, networkidle, stop autoplay
- **Assertions**:
  ```js
  // 3 visible phones (center + 2 peeks)
  const visible = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#phone-carousel .phone-item'))
      .filter(el => parseFloat(el.style.opacity) > 0).length;
  });
  expect(visible).toBe(3);

  // Center phone dimensions
  const center = await p.locator('#phone-carousel .phone-item:nth-child(2)').evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, opacity: parseFloat(el.style.opacity), rotateY: el.style.transform };
  });
  expect(center.width).toBeGreaterThanOrEqual(220);
  expect(center.width).toBeLessThanOrEqual(280);
  expect(center.opacity).toBeCloseTo(1.0, 1);
  expect(center.rotateY).toContain('rotateY(0deg)');

  // Peek phones flat (rotateY 0)
  const leftPeek = await p.locator('#phone-carousel .phone-item:nth-child(1)').getAttribute('style');
  expect(leftPeek).toContain('rotateY(0deg)');
  expect(leftPeek).toContain('opacity: 0.55');

  // Carousel height = 360px
  const carouselHeight = await p.locator('#phone-carousel').evaluate(el => getComputedStyle(el).height);
  expect(carouselHeight).toBe('360px');
  ```

### Test: carousel_mobile_arrows_hidden
- **Covers**: [REQ-04]
- **Project**: `mobile`
- **Assertions**:
  - `getComputedStyle(#carousel-prev).display === 'none'`
  - `getComputedStyle(#carousel-next).display === 'none'`

### Test: carousel_tablet_768_three_phones_soft_rotation
- **Covers**: [REQ-02]
- **Setup**: viewport 600×900 (in tablet range)
- **Assertions**:
  - 3 visible phones
  - Left peek rotateY ≈ 15°, right ≈ -15°
  - Center opacity 1.0, peeks 0.7
  - Arrows visible

### Test: carousel_desktop_1280_unchanged
- **Covers**: [REQ-03]
- **Project**: `desktop`
- **Assertions**:
  - 5 visible phones
  - rotateY values ±45° / ±40° (existing)
  - Arrows visible
  - Screenshot matches baseline `carousel-desktop-1280.png`

### Test: carousel_dots_indicator_exists
- **Covers**: [REQ-05]
- **Project**: `mobile` + `desktop`
- **Assertions**:
  ```js
  const dots = await p.locator('#carousel-dots .carousel-dot').count();
  expect(dots).toBe(7);
  const active = await p.locator('#carousel-dots .carousel-dot.active').count();
  expect(active).toBe(1);
  ```

### Test: carousel_dots_clickable_desktop_only
- **Covers**: [REQ-05]
- **Desktop**: click dot #3 → `centerIndex` = 3
- **Mobile**: click dot #3 → `centerIndex` unchanged (pointer-events: none)

### Test: swipe_distance_triggers_goNext
- **Covers**: [REQ-06]
- **Project**: `mobile`
- **Steps**:
  ```js
  const el = p.locator('#phone-carousel');
  await el.dispatchEvent('touchstart', { touches: [{ clientX: 300, clientY: 400 }] });
  await p.waitForTimeout(100);
  await el.dispatchEvent('touchmove', { touches: [{ clientX: 230, clientY: 400 }] });
  await el.dispatchEvent('touchend', { changedTouches: [{ clientX: 230, clientY: 400 }] });
  ```
- **Expected**: `centerIndex` += 1 (dx = -70 > threshold 60 on 400px carousel)

### Test: swipe_velocity_flick_triggers
- **Covers**: [REQ-06]
- **Steps**: quick swipe dx=-15, dt=30ms → velocity 0.5 px/ms > 0.3
- **Expected**: goNext triggered despite dx < distance threshold

### Test: swipe_below_both_thresholds_no_trigger
- **Covers**: [REQ-06]
- **Steps**: dx=10, dt=500ms → velocity 0.02
- **Expected**: no change

### Test: swipe_direction_lock_vertical_no_trigger
- **Covers**: [REQ-08]
- **Steps**: touchstart (200,300) → move (205,400) → end (210,500) — mostly vertical
- **Expected**: `centerIndex` unchanged, page scroll allowed (verify scrollY changed)

### Test: swipe_deadzone_no_premature_lock
- **Covers**: [REQ-08]
- **Steps**: touchstart → move <10px (within deadzone) → touchend
- **Expected**: no lock, no trigger

### Test: carousel_touch_action_pan_y
- **Covers**: [REQ-07]
- **Assertions**: `getComputedStyle(#phone-carousel).touchAction === 'pan-y'`

### Test: carousel_resize_1280_to_375_rebuilds
- **Covers**: [REQ-09]
- **Steps**:
  1. Load at 1280 → `dataset.viewportMode` = `desktop`, 5 visible
  2. `setViewportSize({ width: 375, height: 812 })`
  3. `waitForTimeout(250)` > debounce 150
  4. Check `dataset.viewportMode` = `mobile`, 3 visible, height = 360px

### Test: reduced_motion_kills_rotateY
- **Covers**: [REQ-10]
- **Setup**: launch browser with `reducedMotion: 'reduce'`
- **Project**: `desktop` (would normally have rotateY ±45°)
- **Assertions**:
  - All phones' `rotateY` = 0° regardless of position
  - No `transition` CSS property

---

## Visual regression

### Test: screenshots_mobile_tablet_desktop
- **Covers**: REQ-01..03 overall visual
- **Setup**: full section screenshot
- **Baselines**:
  - `carousel-mobile-375.png`
  - `carousel-tablet-768.png`
  - `carousel-desktop-1280.png`

### Test: pages_index_mobile_regenerate
- **Covers**: existing pages.spec.js
- **Note**: Mobile snapshot đã thay đổi → regenerate lần đầu
- **Command**: `npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots`

---

## Edge Cases

| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Viewport 479→480 boundary | resize | mode mobile→tablet, arrows appear | REQ-09 |
| Viewport 767→768 boundary | resize | mode tablet→desktop | REQ-09 |
| Orientation change iPhone | rotate portrait→landscape (390→844) | mode mobile→desktop, layout rebuild | REQ-09 |
| iOS toolbar show/hide | scroll triggers visualViewport resize | carousel height stays 360px (fixed px, không `vh`) | REQ-11 |
| Swipe velocity exactly 0.3 | dx=15 dt=50ms | triggers (≥ threshold) | REQ-06 |
| Multi-finger touch | 2+ touches | chỉ dùng touches[0] | REQ-07 |
| User prefers-reduced-motion mid-session | MediaQuery listener | rotateY immediately = 0° | REQ-10 |
| Dots tap trên mobile | click dot | no-op (pointer-events: none) | REQ-05 |
| Button tap desktop | click dot #5 | goTo(5) | REQ-05 |

---

## Build Verification

```bash
# 1. Build
npm run build

# 2. Lint check CSS + JS
grep -n "touch-action: pan-y" assets/css/carousel.css     # ≥1 match
grep -n "preventDefault" assets/js/carousel.js            # should NOT appear in touch handlers
grep -n "POSITIONS_MOBILE\|POSITIONS_TABLET\|POSITIONS_DESKTOP" assets/js/carousel.js  # all 3

# 3. Dots rendered in DOM
grep -n "carousel-dots" index.html                        # section exists after carousel
```

## Overall

```bash
npm run build
npx playwright test tests/visual/carousel-mobile.spec.js --update-snapshots  # first run
npx playwright test tests/visual/carousel-mobile.spec.js                      # rerun
npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots
npx playwright test  # full pass

# Manual smoke:
npx serve -l 5173 .
# → iPhone SE/14 (375×667, 390×844): peek visible, arrows hidden, dots below
# → iPad (768×1024): 3 phones rotateY ±15°, arrows visible
# → Desktop: giữ nguyên
# → Chrome DevTools → Rendering → Emulate prefers-reduced-motion → reduce → rotateY=0 mọi mode
```

---

## Coverage Target
- Per-REQ: 100% (12/12 có ≥1 test)
- Visual regression: 3 viewports chính
- Swipe: 6 scenarios (distance, velocity, direction lock, deadzone, multi-finger, boundary value)
- Edge cases: 9 scenarios
