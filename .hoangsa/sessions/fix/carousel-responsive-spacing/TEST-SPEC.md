---
tests_version: "1.0"
spec_ref: "carousel_responsive_spacing-spec-v1.0"
component: "carousel_responsive_spacing"
category: "code"
strategy: "mixed"
language: "JavaScript (Playwright)"
---

## Unit Tests

### Test: desktop — 5 visible phones (existing)
- **Covers**: [REQ-04]
- **Verify**: `npx playwright test --grep "5 visible" --project=desktop`

### Test: desktop — coverflow mode (existing)
- **Covers**: [REQ-04]
- **Verify**: `npx playwright test --grep "coverflow" --project=desktop`

### Test: mobile — scroll-snap active (existing)
- **Covers**: [REQ-03]
- **Verify**: `npx playwright test --grep "scroll-snap" --project=mobile`

## Integration Tests

### Test: all existing carousel tests pass
- **Covers**: [REQ-01] through [REQ-04]
- **Verify**: `npx playwright test tests/visual/carousel-mobile.spec.js`

## Coverage Target
- All existing tests must pass
- Visual baselines may need update
