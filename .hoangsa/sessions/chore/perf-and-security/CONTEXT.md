# Context: Performance + security headers (Theme 5)

## Task Type
chore (asset cleanup, image optimization, font self-hosting, CSP via meta)

## Language
vi

## Spec Language
vi

## Tech Stack
HTML5 / TailwindCSS 3 / asset binaries (PNG/WebP/woff2)

## User Input
> "làm hết các tác vụ trên" — Theme 5 từ AUDIT-REPORT

## Source
`.hoangsa/sessions/chore/audit-full-codebase/AUDIT-REPORT.md` — Theme 5: Performance + Security headers

## Discussion Log

### [Q1] CSP delivery method (Theme 3 skipped, không có hosting config)
- Options: A. `<meta http-equiv>` per page / B. Skip CSP / C. Defer until Theme 3
- Chosen: **A — `<meta http-equiv>`** (assume — flag for review)
- Reason: Defense in depth tốt hơn không có; meta CSP có limitations (không set `frame-ancestors`, không set HTTP-only directives) nhưng work cho `default-src`, `script-src`, `style-src`, `img-src`, etc.

⚠ **Flag**: Khi Theme 3 (deploy/CI) chọn xong platform, recommend chuyển CSP từ meta sang HTTP headers (vercel.json `headers`, netlify.toml `[[headers]]`, hoặc `_headers` file).

### [Q2] OG image creation
- Options:
  - A. Generate dedicated 1200×630 JPG/PNG file (cần design tool — manual)
  - B. Reuse `hero-banner-desktop.png` (544 KB) — current state, large for sharing
  - C. Resize hero PNG bằng `ffmpeg`/`sharp` → 1200×630 cropped/scaled
- Chosen: **C — generate via script** (assume)
- Reason: No-design-tool needed; deterministic; result ~80-150 KB

### [Q3] Self-host Inter font scope
- Options: A. Tất cả 6 weights / B. Chỉ weights actually used (400, 500, 600, 700) / C. Subset Latin-only
- Chosen: **B + C** (assume — used weights, Latin subset)
- Reason: Site Tiếng Việt nhưng Inter glyph set Latin Extended cover Vietnamese diacritics; subset cuts size dramatically

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Delete 4 unreferenced PNGs: ai-review.png, plan-list.png, share-review.png, weekend-plan.png | ~4.76 MB repo weight, 0 bytes served | LOCKED |
| 2 | Tạo `assets/images/og-cover.{jpg,png}` 1200×630 ~100KB | Social share preview consistent + nhỏ | LOCKED |
| 3 | Self-host Inter font ở `assets/fonts/inter-{400,500,600,700}.woff2` | Eliminate Google Fonts request, GDPR-safer | LOCKED |
| 4 | Re-encode company_logo.jpg → company_logo.webp (32×32 retina) | 53KB → ~2KB cho 16×16 render | LOCKED |
| 5 | CSP via `<meta http-equiv>` trên cả 4 pages | Defense in depth không cần hosting config | LOCKED |
| 6 | KHÔNG migrate Tailwind v4 (Theme 6 backlog) | Breaking change, scope khác | LOCKED |
| 7 | Build script regen tailwind sau khi update HTML font-family references | Đảm bảo style.css đồng bộ | FLEXIBLE |

## Out of Scope
- Image lazy loading (đã có)
- Service worker / PWA caching
- HTTP/2 server push
- DNS prefetch (current state đã tối ưu — chỉ 2 origins)
- HTTP security headers khác (X-Frame-Options, Permissions-Policy) — chỉ làm CSP qua meta vì Theme 3 skip
