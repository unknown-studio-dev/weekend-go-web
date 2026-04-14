---
tests_version: "1.0"
spec_ref: "perf_and_security-spec-v1.0"
component: "perf_and_security"
category: "code"
strategy: "smoke"
language: "html-tailwindcss-binary-assets"
---

## Pre-flight Checks
- [ ] Theme 1 merged (OG → .png standardized)
- [ ] `cwebp` available (`which cwebp`) — `brew install webp` if missing
- [ ] `sharp-cli` or `ffmpeg` available for OG generation
- [ ] Internet connection (font download from gwfh)

## Integration Tests

### REQ-01 — Unused PNGs deleted
- **Command**:
  ```bash
  for f in ai-review plan-list share-review weekend-plan; do
    test ! -f "assets/images/$f.png" || { echo "FAIL: $f.png still exists"; exit 1; }
  done && echo OK
  ```
- **Expected**: `OK`

### REQ-02 — OG cover exists, sized correctly
- **Command**: `test -f assets/images/og-cover.jpg && [ "$(stat -f%z assets/images/og-cover.jpg 2>/dev/null || stat -c%s assets/images/og-cover.jpg)" -lt 200000 ]`
- **Expected**: exit 0
- **Bonus**: `identify assets/images/og-cover.jpg` (ImageMagick) → `1200x630`

### REQ-03 — All 4 pages reference og-cover.jpg
- **Command**:
  ```bash
  for f in index terms privacy community-standards; do
    [ "$(grep -c 'og-cover.jpg' $f.html)" -ge 2 ] || { echo "FAIL: $f"; exit 1; }
  done && echo OK
  ```
- **Expected**: `OK` (each page has `og:image` + `twitter:image`)

### REQ-04 — Inter font files present
- **Command**: `for w in 400 500 600 700; do test -f "assets/fonts/inter-$w.woff2" || exit 1; done && echo OK`
- **Expected**: `OK`

### REQ-05 — @font-face rules in input.css
- **Command**: `[ "$(grep -c '@font-face' src/input.css)" = "4" ] && grep -q "font-display: swap" src/input.css`
- **Expected**: exit 0

### REQ-06 — Google Fonts links removed
- **Command**:
  ```bash
  ! grep -q "fonts.googleapis.com\|fonts.gstatic.com" index.html terms.html privacy.html community-standards.html
  ```
- **Expected**: exit 0

### REQ-07 — Font preload added
- **Command**:
  ```bash
  for f in index terms privacy community-standards; do
    grep -qE 'rel="preload".+inter-400\.woff2' $f.html || exit 1
  done && echo OK
  ```
- **Expected**: `OK`

### REQ-08 — company_logo.webp exists, tiny
- **Command**: `test -f assets/images/company_logo.webp && [ "$(stat -f%z assets/images/company_logo.webp 2>/dev/null || stat -c%s assets/images/company_logo.webp)" -lt 5000 ]`
- **Expected**: exit 0

### REQ-09 — index.html uses .webp logo
- **Command**: `grep -q 'src="assets/images/company_logo.webp"' index.html && ! grep -q 'src="assets/images/company_logo.jpg"' index.html`
- **Expected**: exit 0

### REQ-10 — CSP meta on all pages
- **Command**:
  ```bash
  for f in index terms privacy community-standards; do
    grep -qE 'http-equiv="Content-Security-Policy"' $f.html && \
    grep -qE 'default-src .*self' $f.html || exit 1
  done && echo OK
  ```
- **Expected**: `OK`

### REQ-11 — Tailwind rebuild includes @font-face
- **Command**: `npm run build && grep -q "@font-face" assets/css/styles.css`
- **Expected**: exit 0

## Visual Checklist (browser + DevTools)

### Network panel (DevTools)
- [ ] Reload với cache disabled
- [ ] 0 requests tới `fonts.googleapis.com`, `fonts.gstatic.com`
- [ ] 4× requests tới `assets/fonts/inter-{400,500,600,700}.woff2` (or fewer if not all weights triggered)
- [ ] `inter-400.woff2` request có `Initiator: preload` 
- [ ] No 404s

### Console panel (DevTools)
- [ ] 0 CSP errors ("Refused to...")
- [ ] 0 mixed-content warnings
- [ ] No "Failed to decode" cho company_logo.webp

### Visual
- [ ] Body text renders với Inter font (fallback to system-ui flash acceptable, then swap)
- [ ] Footer "Về chúng tôi" icon (company_logo.webp) hiển thị đúng 16×16 với border xám + bo nhẹ
- [ ] No layout shift (CLS = 0) khi font load complete
- [ ] OG share preview (test với https://opengraph.dev/ hoặc Facebook debugger) → hiển thị og-cover.jpg

### Lighthouse
- [ ] Performance score ≥ 95 (vs baseline)
- [ ] LCP < 2.5s (Inter preload helps)
- [ ] Total Blocking Time < 200ms

## Edge Cases
| Scenario | How | Expected |
|----------|-----|----------|
| User in privacy mode (no google fetch ability) | Browser settings block 3rd-party | Site fonts vẫn load (self-hosted) |
| Slow 3G | DevTools throttle Slow 3G | Inter preload arrives early; FOUT minimal vì swap |
| woff2 không support browser | Edge/Firefox very old | Falls back to system-ui (defined trong stack) |
| CSP violation report | DevTools Console | 0 violations với current policy |

## Regression
- [ ] Repo size: `du -sh .` giảm ≥ 4.5 MB từ baseline
- [ ] Theme 1, 2, 4 tests vẫn pass
- [ ] Carousel autoplay, FAQ, mobile menu vẫn hoạt động
- [ ] Build pipeline (npm run build) thời gian không tăng đáng kể
- [ ] No new npm deps required (cwebp + sharp-cli là dev-time tools, not runtime)
