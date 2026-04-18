---
tests_version: "1.0"
spec_ref: "coverflow-5-visual-bugs-spec-v1.0"
component: "coverflow-5-visual-bugs"
category: "code"
strategy: "mixed"
language: "javascript"
---

## Unit Tests

### Test: Buttons have vertical centering classes
- **Covers**: [REQ-01]
- **Verify**: `grep 'top-1/2' index.html | grep -c 'translate-y'` = 2

### Test: Center scale is 1.0, no translateZ magnification
- **Covers**: [REQ-02]
- **Verify**: `! grep -q 'scale: 1.1' assets/js/carousel.js && grep -q 'scale: 1.0' assets/js/carousel.js`

### Test: Equal spacing desktop
- **Covers**: [REQ-03]
- **Verify**: `grep -q 'txRatio: -0.22' assets/js/carousel.js && grep -q 'txRatio: -0.44' assets/js/carousel.js`

### Test: Fixed height CSS
- **Covers**: [REQ-04]
- **Verify**: `! grep -q 'min-height' assets/css/carousel.css && grep -q 'height: 580px' assets/css/carousel.css`

### Test: Dots removed
- **Covers**: [REQ-05]
- **Verify**: `! grep -q 'carousel-dots' index.html && ! grep -q 'buildDots' assets/js/carousel.js && ! grep -q 'carousel-dot' assets/css/carousel.css`

## Integration Tests

### Test: Visual — buttons centered on desktop
- **Covers**: [REQ-01]
- **Setup**: Desktop 1280px
- **Expected**: Buttons vertically aligned with center phone

### Test: Visual — center phone not oversized
- **Covers**: [REQ-02], [REQ-04]
- **Setup**: Desktop 1280px
- **Expected**: Center phone fits within carousel height, no overlap with header

### Test: Visual — equal spacing between items
- **Covers**: [REQ-03]
- **Setup**: Desktop 1280px
- **Expected**: Gap center→±1 visually equal to ±1→±2
