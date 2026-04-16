---
tests_version: "1.0"
spec_ref: "carousel_scroll_snap-spec-v1.0"
component: "carousel_scroll_snap"
category: "code"
strategy: "visual"
language: "JavaScript / Playwright"
---

## Test Environment
Playwright config: mobile (375), tablet (768), desktop (1280), wide (1440).

File: `tests/visual/carousel-mobile.spec.js` — **rewrite** (replaces T-07 version).

---

## Integration Tests

### Test: mobile_scroll_snap_active
- **Covers**: [REQ-01], [REQ-13]
- **Project**: `mobile`
- **Assertions**:
  - `getComputedStyle(#phone-carousel).scrollSnapType` contains `x mandatory`
  - `getComputedStyle(.phone-item).position` === `static`

### Test: mobile_peek_layout
- **Covers**: [REQ-02], [REQ-03], [REQ-04]
- **Assertions**:
  - `.phone-item` width ≈ 75% of container (±5%)
  - Center item fully in view, adjacent items partially visible
  - `.phone-item img` border-radius = `20px`

### Test: mobile_dots_update_on_scroll
- **Covers**: [REQ-07]
- **Steps**: scroll `#phone-carousel` horizontally to next item, wait 500ms
- **Expected**: dot #1 has `.active` (index shift from 0 to 1)

### Test: mobile_arrows_hidden
- **Covers**: [REQ-08]
- **Expected**: `#carousel-prev` display = `none`

### Test: mobile_infinite_loop_forward
- **Covers**: [REQ-06]
- **Steps**: scroll to last real item, then scroll one more
- **Expected**: `data-center-index` wraps to `0`

### Test: mobile_infinite_loop_backward
- **Covers**: [REQ-06]
- **Steps**: from first item, scroll backward
- **Expected**: `data-center-index` wraps to last index

### Test: mobile_height_auto
- **Covers**: related to layout
- **Expected**: `#phone-carousel` height is content-driven (not fixed 360px)

### Test: desktop_coverflow_unchanged
- **Covers**: [REQ-10], [REQ-13]
- **Project**: `desktop`
- **Assertions**:
  - `scrollSnapType` is NOT `x mandatory` (default/none)
  - `.phone-item` position = `absolute`
  - 5 visible phones with opacity > 0
  - `data-viewport-mode` = `desktop`

### Test: resize_768_to_375_switches_mode
- **Covers**: [REQ-11]
- **Steps**: load at 1280, resize to 375
- **Expected**: scroll-snap activates, transforms removed

### Test: mobile_smooth_scroll
- **Covers**: [REQ-05]
- **Expected**: `getComputedStyle(#phone-carousel).scrollBehavior` = `smooth`

---

## Edge Cases

| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Resize 375→1280 | window resize | Clones removed, absolute positioning restored | REQ-11 |
| Clone a11y | inspect clone elements | `aria-hidden="true"`, `tabindex="-1"` | REQ-06 |
| Autoplay on mobile | wait 3s | `scrollLeft` changes | REQ-09 |
| Reduced-motion mobile | `reducedMotion: 'reduce'` | scroll still works (native) | REQ-12 |
| Fast swipe mobile | touch swipe quickly | snaps to next center item (native) | REQ-01 |

---

## Overall

```bash
npm run build
npx playwright test tests/visual/carousel-mobile.spec.js --update-snapshots
npx playwright test tests/visual/pages.spec.js --project=mobile --update-snapshots
npx playwright test
```
