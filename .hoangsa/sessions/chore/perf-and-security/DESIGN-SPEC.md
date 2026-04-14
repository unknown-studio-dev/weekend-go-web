---
spec_version: "1.0"
project: "weekend-go-web"
component: "perf_and_security"
language: "html-tailwindcss-binary-assets"
task_type: "chore"
category: "code"
status: "draft"
---

## Overview
[chore]: Theme 5 — perf optimization + security headers via meta

### Goal
Repo lighter ~4.76 MB (delete unused PNGs); social previews fast (dedicated 100KB OG image); zero 3rd-party font requests (self-host Inter); company logo 2KB instead of 53KB; defense in depth via meta CSP.

### Context
AUDIT Theme 5: 4 raw PNGs never served (4.76 MB dead weight); legal pages OG points to 544 KB hero PNG; Google Fonts blocking + GDPR concerns; tiny logo with disproportionate payload; zero CSP.

### Requirements
- [REQ-01] Delete 4 unused PNGs (`ai-review.png`, `plan-list.png`, `share-review.png`, `weekend-plan.png`)
- [REQ-02] Tạo `assets/images/og-cover.jpg` 1200×630 ~80-150KB (resize từ hero-banner-desktop)
- [REQ-03] Update `og:image` + `twitter:image` ở 4 HTMLs trỏ tới `og-cover.jpg`
- [REQ-04] Self-host Inter font: download `inter-{400,500,600,700}.woff2` (Latin Extended subset) vào `assets/fonts/`
- [REQ-05] Add `@font-face` rules cho 4 weights vào `src/input.css` với `font-display: swap`
- [REQ-06] Remove Google Fonts `<link rel="preconnect">` + `<link rel="stylesheet">` từ 4 HTMLs
- [REQ-07] Add font preload `<link rel="preload" as="font" type="font/woff2" href="assets/fonts/inter-400.woff2" crossorigin>` cho weight 400 (LCP critical) trên 4 pages
- [REQ-08] Re-encode `company_logo.jpg` → `company_logo.webp` 32×32 ~2KB
- [REQ-09] Update `index.html:1299` → `<img src="assets/images/company_logo.webp">` (giữ alt + classes)
- [REQ-10] Add CSP `<meta http-equiv="Content-Security-Policy" content="...">` vào `<head>` của 4 HTMLs
- [REQ-11] Rebuild `assets/css/styles.css` (cần update vì input.css thêm @font-face)
- [REQ-12] Smoke check: browser DevTools không có console errors về CSP refusal

### Out of Scope
- HTTP security headers khác (X-Frame-Options, Permissions-Policy) — Theme 3
- Service worker / offline support
- Image subresource integrity
- Tailwind v4 (Theme 6)

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | OG image format = JPG (not WebP) | FB historically ignores WebP og; JPG safe everywhere | LOCKED |
| 2 | OG image generation = scripted (sharp/ffmpeg), commit binary | Reproducible; document command; small file fine in git | LOCKED |
| 3 | Self-host Inter weights: 400, 500, 600, 700 only | Audit grep showed `font-light`(300) chỉ dùng 1 chỗ optional; 4 weights cover 99% UI | LOCKED |
| 4 | Latin Extended subset (covers Vietnamese) | Site Tiếng Việt; subset cuts size ~50% | LOCKED |
| 5 | Preload chỉ inter-400 (not all 4 weights) | Avoid bandwidth bloat; 400 = body text = LCP candidate | LOCKED |
| 6 | CSP via meta tag (not HTTP header) | Theme 3 skipped; meta works for most directives | LOCKED |
| 7 | CSP includes `style-src 'unsafe-inline'` | Tailwind compiled CSS có inline `<style>` blocks; tighten later | LOCKED |
| 8 | company_logo.webp single source (no `<picture>` fallback) | Modern browsers full WebP support 2026; tiny render = không cần JPG fallback | LOCKED |

### Affected Files

**CREATE:**
| File | Source | Size target |
|------|--------|-------------|
| `assets/images/og-cover.jpg` | resize từ hero-banner-desktop.png | ~100KB |
| `assets/images/company_logo.webp` | re-encode company_logo.jpg | ~2KB |
| `assets/fonts/inter-400.woff2` | Google Webfonts Helper, Latin Extended | ~30KB |
| `assets/fonts/inter-500.woff2` | same | ~30KB |
| `assets/fonts/inter-600.woff2` | same | ~30KB |
| `assets/fonts/inter-700.woff2` | same | ~30KB |
| `scripts/generate-og.sh` | bash one-liner using sharp/ffmpeg | docs |

**MODIFY:**
| File | Changes |
|------|---------|
| `src/input.css` | Add 4 `@font-face` rules; remove Inter Google Fonts import comment if any |
| `index.html` | OG meta swap (lines 26, 39 — Theme 1 đã set .png, swap target now), Google Fonts links remove, add CSP meta + font preload, company_logo src swap |
| `terms.html`, `privacy.html`, `community-standards.html` | OG meta swap, Google Fonts remove, add CSP meta + font preload |

**DELETE:**
- `assets/images/ai-review.png`
- `assets/images/plan-list.png`
- `assets/images/share-review.png`
- `assets/images/weekend-plan.png`

### Key snippets

**`src/input.css` @font-face (4×):**
```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/inter-400.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
}
/* repeat for 500, 600, 700 */
```

**HTML `<head>` swap:**
```diff
- <link rel="preconnect" href="https://fonts.googleapis.com" />
- <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
- <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
+ <link rel="preload" as="font" type="font/woff2" href="assets/fonts/inter-400.woff2" crossorigin>
+ <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';">
```

**`og:image` swap (all 4 pages):**
```diff
- <meta property="og:image" content="https://cuoituandidau.vn/assets/images/hero-banner-desktop.png" />
+ <meta property="og:image" content="https://cuoituandidau.vn/assets/images/og-cover.jpg" />
- <meta name="twitter:image" content="https://cuoituandidau.vn/assets/images/hero-banner-desktop.png" />
+ <meta name="twitter:image" content="https://cuoituandidau.vn/assets/images/og-cover.jpg" />
```

**`scripts/generate-og.sh`:**
```bash
#!/usr/bin/env bash
# Generate 1200x630 OG image from hero banner
# Requires: sharp-cli (npm i -g sharp-cli) or ffmpeg
set -e
INPUT="assets/images/hero-banner-desktop.png"
OUTPUT="assets/images/og-cover.jpg"
# Option 1 (sharp):
npx sharp-cli -i "$INPUT" -o "$OUTPUT" -- resize 1200 630 --fit cover --jpeg-quality 80
# Option 2 (ffmpeg):
# ffmpeg -y -i "$INPUT" -vf "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630" -q:v 5 "$OUTPUT"
echo "✓ Generated $OUTPUT ($(du -h $OUTPUT | cut -f1))"
```

**company_logo re-encode:**
```bash
cwebp -q 80 -resize 32 32 assets/images/company_logo.jpg -o assets/images/company_logo.webp
```

---

## Constraints
- KHÔNG break visual: font swap must look same (Inter same family)
- CSP KHÔNG block existing inline scripts/styles (whitelisting via `'unsafe-inline'` for now)
- OG image dimensions exactly 1200×630 (Facebook recommendation)

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected |
|-----|-------------|----------|
| REQ-01 | `! test -f assets/images/ai-review.png && ! test -f assets/images/plan-list.png && ! test -f assets/images/share-review.png && ! test -f assets/images/weekend-plan.png` | exit 0 |
| REQ-02 | `test -f assets/images/og-cover.jpg && [ "$(stat -f%z assets/images/og-cover.jpg)" -lt 200000 ]` | exit 0 (file < 200KB) |
| REQ-03 | `for f in index terms privacy community-standards; do grep -q 'og-cover.jpg' $f.html || exit 1; done` | exit 0 |
| REQ-04 | `for w in 400 500 600 700; do test -f assets/fonts/inter-$w.woff2 || exit 1; done` | exit 0 |
| REQ-05 | `[ "$(grep -c '@font-face' src/input.css)" = "4" ]` | exit 0 |
| REQ-06 | `for f in index terms privacy community-standards; do ! grep -q 'fonts.googleapis.com' $f.html || exit 1; done` | exit 0 |
| REQ-07 | `for f in index terms privacy community-standards; do grep -q 'preload.*inter-400.woff2' $f.html || exit 1; done` | exit 0 |
| REQ-08 | `test -f assets/images/company_logo.webp && [ "$(stat -f%z assets/images/company_logo.webp)" -lt 5000 ]` | exit 0 (< 5KB) |
| REQ-09 | `grep -q 'src="assets/images/company_logo.webp"' index.html && ! grep -q 'src="assets/images/company_logo.jpg"' index.html` | exit 0 |
| REQ-10 | `for f in index terms privacy community-standards; do grep -q 'http-equiv="Content-Security-Policy"' $f.html || exit 1; done` | exit 0 |
| REQ-11 | `npm run build` exits 0; `assets/css/styles.css` mentions Inter `@font-face` | observed |
| REQ-12 | Open in browser → DevTools Console → 0 CSP "Refused to..." errors | manual |

### Overall
1. Repo size giảm ≥4.5 MB (`du -sh assets/images/`)
2. Network panel: 0 requests tới `fonts.googleapis.com` / `fonts.gstatic.com`
3. Network panel: 4 requests tới `assets/fonts/inter-*.woff2`
4. FB sharing debugger / Twitter card validator: preview hiển thị `og-cover.jpg` correctly
5. Footer logo render đúng (16×16 from .webp)
6. Lighthouse score: Performance ≥ 95 (vs baseline)
