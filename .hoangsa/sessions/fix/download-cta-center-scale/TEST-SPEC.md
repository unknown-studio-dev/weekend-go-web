---
tests_version: "1.0"
spec_ref: "download_cta_center_scale-spec-v1.0"
component: "download_cta_center_scale"
category: "code"
strategy: "visual"
language: "JavaScript / Playwright"
---

## Test Environment

Playwright config đã có sẵn với 4 viewports: `mobile` (375), `tablet` (768), `desktop` (1280), `wide` (1440).

## Integration Tests

### Test: download_cta_mobile_375_centered
- **Covers**: [REQ-01], [REQ-03]
- **Project**: `mobile`
- **Steps**:
  1. Goto `/`
  2. `await page.locator('#download').scrollIntoViewIfNeeded()`
  3. Đo rect của 2 img trong `#download`
- **Assertions**:
  ```js
  const container = await page.locator('#download .flex').boundingBox();
  const appBtn    = await page.locator('#download img[alt*="App Store"]').boundingBox();
  const gpBtn     = await page.locator('#download img[alt*="Google Play"]').boundingBox();

  // REQ-01: canh giữa ngang (mobile = flex-col nên 2 button xếp dọc, mỗi cái center)
  const containerCenterX = container.x + container.width / 2;
  expect(Math.abs((appBtn.x + appBtn.width / 2) - containerCenterX)).toBeLessThan(3);
  expect(Math.abs((gpBtn.x  + gpBtn.width  / 2) - containerCenterX)).toBeLessThan(3);

  // REQ-03: height = 56px
  expect(appBtn.height).toBeCloseTo(56, 1);
  expect(gpBtn.height).toBeCloseTo(56, 1);
  ```
- **Verify**: `npx playwright test --project=mobile --grep "cta_mobile_375"`

### Test: download_cta_desktop_1280_centered_row
- **Covers**: [REQ-02], [REQ-03]
- **Project**: `desktop`
- **Assertions**:
  - 2 button trên cùng 1 hàng ngang (appBtn.y ≈ gpBtn.y)
  - Center của tổng 2 button (midpoint) ≈ center của container
  - Heights = 56px
- **Verify**: `npx playwright test --project=desktop --grep "cta_desktop_1280"`

### Test: download_cta_aspect_ratio_preserved
- **Covers**: [REQ-04]
- **Steps**: đo bounding box App Store img
- **Expected**:
  - `width / height` ≈ 144/48 = 3.0 (±0.05)
  - Tức `width` ≈ 168 ±3px khi `height = 56`

## Visual regression

### Test: pages_index_mobile_regress
- **Covers**: overall
- **Steps**: re-run existing `pages.spec.js` với `--update-snapshots` lần đầu, sau đó verify pass ở các lần sau
- **Verify**:
  ```bash
  npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots
  npx playwright test tests/visual/pages.spec.js
  ```

## Edge Cases

| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Viewport boundary 640 (sm) | resize từ 639 → 640 | Layout đổi col → row, cả 2 state đều centered | REQ-01, REQ-02 |
| Ảnh SVG load failed | Block network SVG | Alt text hiển thị, box size vẫn 56px (reserved) | REQ-03 |

## Build Verification

```bash
# 1. Edit src, rebuild
npm run build:html

# 2. Verify index.html có đúng changes
grep -A2 "download" index.html | grep "items-center"
grep "h-14 w-auto" index.html | wc -l   # ≥ 2 (trong #download section)

# 3. Không có h-12 thừa trong section #download
awk '/<section id="download"/,/<\/section>/' index.html | grep "h-12"  # empty
```

## Overall

```bash
npm run build && \
npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots && \
npx playwright test tests/visual/pages.spec.js
```
