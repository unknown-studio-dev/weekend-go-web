# Research: Quick wins (Theme 1)

## Phương pháp
Research đã được thực hiện đầy đủ trong AUDIT-REPORT — không scan lại. File này chỉ liệt kê concrete locations + line numbers từ audit findings.

Source: `.hoangsa/sessions/chore/audit-full-codebase/findings/architecture-quality.md`, `findings/security-perf-deps.md`, `findings/tests-docs-dx.md`.

## Locations matrix

| Audit ID | File(s) | Line(s) | Current state | Target state |
|----------|---------|---------|---------------|--------------|
| A11Y-001 / ARCH-002 | `terms.html` | 193, 201 | `<h3 …>X</h4>` | `<h3 …>X</h3>` |
| A11Y-001 / ARCH-002 | `privacy.html` | 209, 217 | same | same |
| A11Y-001 / ARCH-002 | `community-standards.html` | 206, 214 | same | same |
| SEC-001 | `.gitignore` | 1-3 | `CLAUDE.md\n*.DS_Store\n.gitnexus` | thêm `node_modules/`, `.env*`, `.hoangsa/`, `.claude/` |
| CQ-005 / SEC-003 | `index.html` | 70-74 | `<style>body { font-family: "Inter", system-ui, sans-serif; }</style>` | xóa toàn bộ block (đã có ở `src/input.css:5-7`) |
| CQ-004 | `terms.html` | 172 | `class="text-[#22c55e] hover:text-[#166534] font-medium underline"` | `class="text-primary hover:text-primary-dark font-medium underline"` |
| CQ-004 | `privacy.html` | 188 | same | same |
| CQ-004 | `community-standards.html` | 162, 185 | same | same |
| A11Y-005 | `index.html` | 1250 | `class="text-xs text-gray-500 mb-2"` | `class="text-xs text-gray-400 mb-2"` |
| DOC-004 / SIMPLIFY-001 | `assets/js/carousel.js` | 97 | `const totalPositions = VISIBLE_POSITIONS.length + (total - VISIBLE_POSITIONS.length);` | `const totalPositions = total;` |
| SIMPLIFY-003 | `assets/js/carousel.js` | 144-163 (`startAutoPlay`) | không guard `autoTimer` | thêm `if (autoTimer) clearInterval(autoTimer);` đầu function |
| A11Y-006 | `index.html` | 881-898 (prev btn) | button không `aria-label`, SVG inside không `aria-hidden` | thêm `aria-label="Ảnh trước"` lên button + `aria-hidden="true"` lên SVG |
| A11Y-006 | `index.html` | 977-1000 (next btn) | same | thêm `aria-label="Ảnh tiếp"` + `aria-hidden="true"` |
| DOC-003 | `index.html` | 26, 39 | `og:image` / `twitter:image` = `.webp` | đổi sang `.png` (= `hero-banner-desktop.png`) |
| DOC-003 | `privacy.html`, `terms.html`, `community-standards.html` | 16, 22 | đã `.png` rồi | giữ nguyên |

## Files affected (tổng)
- `index.html` (5 chỗ: line 26, 39, 70-74, 881-898, 977-1000, 1250)
- `terms.html` (3 chỗ: line 172, 193, 201)
- `privacy.html` (3 chỗ: line 188, 209, 217)
- `community-standards.html` (4 chỗ: line 162, 185, 206, 214)
- `assets/js/carousel.js` (2 chỗ: line 97, line 144-163)
- `.gitignore` (4 lines added)

Tổng: 6 files, ~21 chỗ edit.

## Risk
- LOW — markup + class swaps + JS micro-cleanup, không thay đổi logic flow
- Carousel `aria-label` không động vào behavior (chỉ thêm attribute)
- Inline style removal: rule trùng đã tồn tại trong styles.css → không thay đổi visual
- `.gitignore` thêm → nếu user đã `git add node_modules` trước đó cần `git rm -r --cached node_modules` (chưa add nên N/A)
