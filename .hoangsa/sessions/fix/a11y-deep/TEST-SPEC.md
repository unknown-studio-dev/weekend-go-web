---
tests_version: "1.0"
spec_ref: "a11y_deep-spec-v1.0"
component: "a11y_deep"
category: "code"
strategy: "smoke"
language: "html-tailwindcss-js"
---

## Pre-flight Checks
- [ ] Theme 1 merged (carousel button labels exist)
- [ ] `npm install` clean
- [ ] (Optional) Theme 2 partials merged → skip-link goes into `partials/header.html` instead of 4 files

## Integration Tests

### REQ-01 — Carousel respects prefers-reduced-motion (JS)
- **Command**: `grep -q "matchMedia('(prefers-reduced-motion: reduce)')" assets/js/carousel.js`
- **Expected**: exit 0

### REQ-02 — Carousel CSS reduced-motion media query
- **Command**: `grep -A2 "prefers-reduced-motion: reduce" assets/css/carousel.css | grep -q "transition: none"`
- **Expected**: exit 0

### REQ-03 — Pause/play toggle button + handler
- **Command**: `grep -q 'id="carousel-toggle"' index.html && grep -q 'togglePause\|isPaused' assets/js/carousel.js`
- **Expected**: exit 0

### REQ-04, REQ-05 — Skip-link + main id on all 4 pages
- **Command**:
  ```bash
  for f in index terms privacy community-standards; do
    grep -q 'href="#main"' $f.html && grep -qE '<main[^>]*id="main"' $f.html || { echo "FAIL: $f"; exit 1; }
  done && echo OK
  ```
- **Expected**: prints `OK`

### REQ-06 — Dead social links removed
- **Command**:
  ```bash
  ! grep -q 'href="#!" aria-disabled="true"' index.html && \
  [ "$(grep -c 'aria-label="Facebook (sắp ra mắt)"\|aria-label="Instagram (sắp ra mắt)"' index.html)" = "2" ]
  ```
- **Expected**: exit 0

### REQ-07 — phone-transition CSS rule deleted
- **Command**: `! grep -q '\.phone-transition' src/input.css && ! grep -q '\.phone-transition' assets/css/styles.css`
- **Expected**: exit 0 (after rebuild)

### REQ-08 — phone-transition class removed from HTML
- **Command**: `! grep -q 'phone-item phone-transition' index.html && [ "$(grep -c 'class="phone-item' index.html)" -ge 7 ]`
- **Expected**: exit 0

### REQ-09 — Tailwind rebuild produces clean styles.css
- **Command**: `npm run build && test -s assets/css/styles.css`
- **Expected**: exit 0

## Visual Checklist (browser + DevTools)

### Reduced motion path
- [ ] DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" = "reduce"
- [ ] Reload page → carousel KHÔNG autoplay
- [ ] Pause toggle button shows "play" icon (because default paused)
- [ ] Click play → carousel autoplay; click pause → stops
- [ ] CSS transitions between slides instant (no animation)

### Normal path
- [ ] DevTools → Rendering → emulate "no-preference"
- [ ] Carousel autoplay 3s loop
- [ ] Pause toggle = "pause" icon
- [ ] Click pause → autoplay stops, icon swap to play
- [ ] Click play → resume

### Skip-link
- [ ] Reload page → press Tab once → "Bỏ qua đến nội dung" link visible at top-left
- [ ] Press Enter → page scrolls/jumps to `<main>`
- [ ] Press Tab again → focus moves to first nav item (not skip link)

### Social icons
- [ ] Hover Facebook icon → cursor "not-allowed" + tooltip "Facebook (sắp ra mắt)"
- [ ] Tab through footer → focus skips Facebook/Instagram (span is non-focusable)
- [ ] VoiceOver/NVDA announces "Facebook (sắp ra mắt), image" instead of "link"

### Phone-transition cleanup
- [ ] Inspect any `.phone-item` → no `phone-transition` class
- [ ] Computed style → no `transition` from CSS class (only inline from JS)
- [ ] Carousel animation timing unchanged (visual smoke test)

## Edge Cases
| Scenario | How | Expected |
|----------|-----|----------|
| User toggles OS reduced-motion mid-session | Change in System Preferences while page open | Next autoplay tick respects new preference (or document as known limitation, requires reload) |
| Pause button focused → keyboard Space/Enter | Tab to button, press Space | Toggles pause (button native behavior) |
| Skip-link clicked twice | Tab → Enter → Tab → Enter | Focus stays on `<main>` (idempotent) |

## Regression
- [ ] Carousel keyboard nav (prev/next from Theme 1) vẫn hoạt động
- [ ] Pause state KHÔNG persist across page reload (acceptable — fresh state)
- [ ] No console errors
- [ ] Theme 1 quick-wins acceptance vẫn pass
- [ ] All 4 pages validate as HTML (W3C validator)
