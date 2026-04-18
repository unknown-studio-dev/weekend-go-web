---
tests_version: "1.0"
spec_ref: "carousel-visual-bugs-spec-v1.0"
component: "carousel-visual-bugs"
category: "code"
strategy: "mixed"
language: "javascript"
---

## Unit Tests

### Test: Scale Center txRatio values correct
- **Covers**: [REQ-01]
- **Input**: POSITIONS_SCALE_CENTER array
- **Expected**: index 1 txRatio = -0.30, index 3 txRatio = 0.30
- **Verify**: `grep 'txRatio: -0.30' assets/js/carousel.js`

### Test: Desktop CoverFlow Apple-style spacing
- **Covers**: [REQ-02]
- **Input**: POSITIONS_DESKTOP array
- **Expected**: ±1 txRatio = ±0.30, ±2 txRatio = ±0.38, center→±1 gap (0.30) > ±1→±2 gap (0.08)
- **Verify**: `grep 'txRatio: -0.38' assets/js/carousel.js`

### Test: Button parent has relative class
- **Covers**: [REQ-03]
- **Input**: HTML parent div of #carousel-prev
- **Expected**: class contains "relative"
- **Verify**: `grep -B1 'id="carousel-prev"' index.html | grep 'relative'`

## Integration Tests

### Test: Visual — mobile side items don't overlap center
- **Covers**: [REQ-01]
- **Setup**: Browser 375px viewport
- **Steps**: Open page, inspect carousel items
- **Expected**: Visible gap between center and side items

### Test: Visual — desktop CoverFlow Apple-style
- **Covers**: [REQ-02]
- **Setup**: Browser 1280px viewport
- **Steps**: Open page, inspect carousel items
- **Expected**: Center item clearly separated, side items compressed together

## Edge Cases
| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Resize 1023→1024 | Cross breakpoint | Spacing switches from Scale Center to CoverFlow | REQ-01, REQ-02 |
| Tablet 768px | Medium viewport | Scale Center with wider translateX | REQ-01 |
