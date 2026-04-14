# Research: Perf + Security (Theme 5)

## Source
`.hoangsa/sessions/chore/audit-full-codebase/findings/security-perf-deps.md`

## Asset inventory (current state)

### Unused PNGs (PERF-001) — to delete
| File | Size |
|------|------|
| `assets/images/ai-review.png` | 836 KB |
| `assets/images/plan-list.png` | 1.07 MB |
| `assets/images/share-review.png` | 1.47 MB |
| `assets/images/weekend-plan.png` | 1.38 MB |
| **Total** | **~4.76 MB** |

Verified: HTML chỉ reference `.webp` versions (line 936, 946, 956, 966 trong `index.html`).

### OG image (PERF-002) — to create
- Current: `og:image` ở `privacy.html`, `terms.html`, `community-standards.html` trỏ `hero-banner-desktop.png` (544 KB)
- Theme 1 standardize OG về `.png` → cần file ~80-150KB optimized
- Target: `assets/images/og-cover.jpg` 1200×630, ~100KB
- Generation: dùng `sharp` CLI hoặc `ffmpeg` resize hero-banner

### Inter font (PERF-003) — to self-host
- Current: load qua `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap` ở 4 pages
- Used weights: scan HTML — `font-light` (300?), default (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700)
- Target download:
  - `assets/fonts/inter-400.woff2` (Latin Extended subset for Vietnamese)
  - `assets/fonts/inter-500.woff2`
  - `assets/fonts/inter-600.woff2`
  - `assets/fonts/inter-700.woff2`
- Source: https://gwfh.mranftl.com/fonts/inter (Google Webfonts Helper)
- CSS: add `@font-face` rules ở `src/input.css`, set `font-display: swap`
- Remove `<link rel="preconnect">` + `<link rel="stylesheet">` Google Fonts từ 4 HTMLs
- Add `<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-400.woff2" crossorigin>` cho weight critical (400, 600)

### company_logo (PERF-005) — to re-encode
- Current: `assets/images/company_logo.jpg` 52.9 KB
- Render size: 16×16 (retina = 32×32)
- Target: `assets/images/company_logo.webp` ~2 KB at 32×32
- Command: `cwebp -q 80 -resize 32 32 assets/images/company_logo.jpg -o assets/images/company_logo.webp`
- HTML update: `<img src="assets/images/company_logo.webp">` (giữ JPG fallback qua `<picture>` không cần — modern browsers full WebP support)

### CSP (SEC-002)
- Current: zero CSP, zero security headers
- Target: `<meta http-equiv="Content-Security-Policy" content="...">` trên `<head>` mỗi page
- Proposed policy:
  ```
  default-src 'self';
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  script-src 'self';
  object-src 'none';
  base-uri 'self';
  ```
- Note: `unsafe-inline` cho `style-src` cần thiết vì Tailwind có inline `<style>` blocks trong build output
- Note: `font-src 'self'` only (Google Fonts removed sau PERF-003)
- Note: `frame-ancestors` không thể set qua meta — cần HTTP header (defer Theme 3)

## Files affected
**CREATE:**
- `assets/images/og-cover.jpg` (~100KB, 1200×630)
- `assets/images/company_logo.webp` (~2KB)
- `assets/fonts/inter-400.woff2`, `inter-500.woff2`, `inter-600.woff2`, `inter-700.woff2`
- `scripts/generate-og.sh` (or similar — document image gen process)

**MODIFY:**
- `index.html`, `terms.html`, `privacy.html`, `community-standards.html`:
  - Remove Google Fonts `<link>` × 2 per page
  - Add font preload `<link>` cho inter-400, inter-600
  - Add CSP `<meta http-equiv>` ở `<head>`
  - Update `og:image` / `twitter:image` → `og-cover.jpg`
- `index.html` only:
  - Update `<img>` company_logo: src → `.webp`
- `src/input.css`:
  - Add `@font-face` rules cho 4 Inter weights

**DELETE:**
- `assets/images/ai-review.png`
- `assets/images/plan-list.png`
- `assets/images/share-review.png`
- `assets/images/weekend-plan.png`

## Risk
- LOW-MEDIUM
- Self-host font: weight detection sai → site dùng fallback font (system-ui) — visual gần đúng nhưng khác slight
- Mitigation: scan grep all `font-*` Tailwind classes trước khi quyết định weights
- CSP meta: nếu policy quá restrict → break inline styles / Tailwind output
- Mitigation: test browser console "Refused to..." errors sau apply
- WebP company_logo: nếu user chưa update Theme 1 → conflict với edits; coordinate

## Coordination
- Theme 1 đã standardize OG về `.png`. Theme 5 sẽ override `og:image` URL từ `hero-banner-desktop.png` → `og-cover.jpg`.
- Theme 4 không touch perf area.
- Theme 2 partials: nếu merged trước, Google Fonts `<link>` + CSP `<meta>` ở `<head>` không thuộc partial → OK, edit per page như cũ.
