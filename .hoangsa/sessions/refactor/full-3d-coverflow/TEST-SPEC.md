---
tests_version: "1.0"
spec_ref: "full-3d-coverflow-spec-v1.0"
component: "full-3d-coverflow"
category: "code"
strategy: "mixed"
language: "javascript"
---

## Unit Tests

### Test: POSITIONS_DESKTOP has translateZ values
- **Covers**: [REQ-01]
- **Input**: POSITIONS_DESKTOP array
- **Expected**: center translateZ = 150, side translateZ = 50, far translateZ = 0, center scale = 1.1
- **Verify**: `grep 'translateZ: 150' assets/js/carousel.js`

### Test: POSITIONS_MOBILE has 3D rotateY
- **Covers**: [REQ-02]
- **Input**: POSITIONS_MOBILE array
- **Expected**: slot 1 rotateY = 35, slot 3 rotateY = -35, slots 0,4 opacity = 0
- **Verify**: `grep 'POSITIONS_MOBILE' assets/js/carousel.js && grep 'rotateY: 35' assets/js/carousel.js`

### Test: Transform string includes translateZ
- **Covers**: [REQ-01], [REQ-02]
- **Input**: applyPositions() function
- **Expected**: transform string contains `translateZ(${pos.translateZ}px)`
- **Verify**: `grep 'translateZ' assets/js/carousel.js`

### Test: Perspective 1200px in CSS
- **Covers**: [REQ-01], [REQ-02]
- **Input**: carousel.css
- **Expected**: `perspective: 1200px` present, no `perspective: none`
- **Verify**: `grep 'perspective: 1200px' assets/css/carousel.css && ! grep 'perspective: none' assets/css/carousel.css`

## Integration Tests

### Test: Desktop 3D CoverFlow — 5 items with depth
- **Covers**: [REQ-01]
- **Setup**: Playwright desktop viewport (1280x720)
- **Steps**:
  1. Navigate to `/`
  2. Check #phone-carousel perspective
  3. Count visible items (opacity > 0)
  4. Check center item transform includes translateZ
  5. Check side items have rotateY
- **Expected**: perspective = 1200px, 5 visible items, center has translateZ(150px)

### Test: Mobile 3D CoverFlow — 3 items visible
- **Covers**: [REQ-02]
- **Setup**: Playwright mobile viewport (375x667)
- **Steps**:
  1. Navigate to `/`
  2. Count visible items (opacity > 0)
  3. Check side items have rotateY ≠ 0
  4. Check hidden items (slot 0,4) pointer-events = none
- **Expected**: 3 visible, side rotateY ±35°, hidden pointer-events none

### Test: No clipping — overflow visible
- **Covers**: [REQ-03]
- **Setup**: Any viewport
- **Steps**:
  1. Check #phone-carousel overflow
  2. Check section parent overflow
- **Expected**: carousel overflow = visible, section not overflow-hidden

### Test: Container height responsive
- **Covers**: [REQ-04]
- **Setup**: Mobile + Desktop viewports
- **Steps**:
  1. Check min-height contains vh
  2. Phone image not clipped top/bottom
- **Expected**: min-height uses vh units

### Test: Click side item navigates
- **Covers**: [REQ-05]
- **Setup**: Desktop viewport
- **Steps**:
  1. Navigate to `/`
  2. Get centerIndex (= 0)
  3. Click right side item (DOM index 3)
  4. Wait animation
  5. Get centerIndex
- **Expected**: centerIndex changed to 1

### Test: Hover pauses autoplay
- **Covers**: [REQ-06]
- **Setup**: Desktop viewport
- **Steps**:
  1. Navigate to `/`
  2. Hover carousel
  3. Wait 4s (> autoplay interval)
  4. Check centerIndex unchanged
  5. Mouse leave
  6. Wait 4s
  7. Check centerIndex changed
- **Expected**: No advance during hover, advances after leave

### Test: Hidden items not clickable
- **Covers**: [REQ-08]
- **Setup**: Mobile viewport
- **Steps**:
  1. Check slot 0 and 4 items
  2. Verify pointer-events = none
- **Expected**: Hidden items cannot be clicked

## Edge Cases

| Case | Input | Expected | Covers |
|------|-------|----------|--------|
| Resize across 1024px boundary | Desktop → Mobile | Switch from 5 to 3 visible items, 3D on both | REQ-01, REQ-02 |
| Very small mobile (320px) | Viewport 320px | Side items visible within bounds, not clipped | REQ-02, REQ-03 |
| Autoplay + hover timing | Hover just before autoplay fires | No advance during hover | REQ-06 |
| Click center item | Click on center (DOM index 2) | No navigation, no error | REQ-05 |
| Reduced motion + 3D | prefers-reduced-motion | Transitions disabled, 3D positions still applied | REQ-01 |

## Coverage Target

- Target: >= 80%
- Critical paths: 100%
  - 3D transform rendering (both modes)
  - Click navigation
  - Hover pause/resume
  - Responsive resize
