---
spec_version: "1.0"
project: "weekend-go-web"
component: "quick_wins"
language: "html-tailwindcss-js"
task_type: "chore"
category: "code"
status: "draft"
---

## Overview
[chore]: Theme 1 quick wins — 9 micro-fixes từ AUDIT-REPORT

### Goal
Clear toàn bộ "quick win" findings (≤ 30 min mỗi cái) trong 1 PR cleanup gọn: HTML invalid fix, .gitignore safety, brand color tokens, contrast fix, carousel a11y labels, JS micro-cleanup, OG image consistency.

### Context
AUDIT-REPORT (Theme 1) gom 9 fixes tách rời, tổng ~1 giờ. Không có dependency giữa chúng → batch trong 1 spec.

### Requirements
- [REQ-01] Sửa 6 chỗ `<h3 …>X</h4>` thành `<h3 …>X</h3>` ở 3 legal pages.
- [REQ-02] Bổ sung `.gitignore`: `node_modules/`, `.env*`, `.hoangsa/`, `.claude/`.
- [REQ-03] Xóa inline `<style>body { font-family… }</style>` block tại `index.html:70-74`.
- [REQ-04] Đổi 4 mailto links từ `text-[#22c55e] hover:text-[#166534]` → `text-primary hover:text-primary-dark`.
- [REQ-05] Đổi `text-gray-500` → `text-gray-400` tại `index.html:1250`.
- [REQ-06] Inline `totalPositions` tại `carousel.js:97` (= `total`).
- [REQ-07] Guard `autoTimer` đầu `startAutoPlay()` tại `carousel.js`.
- [REQ-08] Thêm `aria-label="Ảnh trước"` / `aria-label="Ảnh tiếp"` cho 2 carousel nav buttons; thêm `aria-hidden="true"` cho 2 SVG bên trong.
- [REQ-09] Standardize `og:image` + `twitter:image` ở `index.html` về `.png` (đã consistency với 3 legal pages).

### Out of Scope
- Skip-link, prefers-reduced-motion → Theme 4
- Partial extraction → Theme 2
- CSP, self-host font, delete unused PNGs → Theme 5

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | 1 commit duy nhất "chore: theme 1 quick wins" | All atomic, all low-risk, không có downstream blocker | LOCKED |
| 2 | Dùng `text-primary hover:text-primary-dark` thay vì giữ hex | Theme tokens trong `tailwind.config.js` (DEFAULT=`#22c55e`, dark=`#16a34a`) | LOCKED |
| 3 | OG image = `.png` thay vì `.webp` | Index hiện dùng `.webp` nhưng FB historically thiếu support; PNG safer | LOCKED |

### Affected Files
| File | Action | Description |
|------|--------|-------------|
| `index.html` | MODIFY (5 chỗ) | OG image (lines 26, 39), inline style block (70-74), carousel buttons (881-898, 977-1000), text-gray (1250) |
| `terms.html` | MODIFY (3 chỗ) | h4 typos (193, 201), mailto class (172) |
| `privacy.html` | MODIFY (3 chỗ) | h4 typos (209, 217), mailto class (188) |
| `community-standards.html` | MODIFY (4 chỗ) | h4 typos (206, 214), mailto class (162, 185) |
| `assets/js/carousel.js` | MODIFY (2 chỗ) | totalPositions inline (97), autoTimer guard (~144) |
| `.gitignore` | MODIFY | Append 4 ignore patterns |

### Snippets quan trọng

**REQ-08 carousel button:**
```diff
- <button class="..." onclick="...">
+ <button class="..." aria-label="Ảnh trước" onclick="...">
    <svg class="..." viewBox="0 0 24 24">
+   <svg aria-hidden="true" class="..." viewBox="0 0 24 24">
```

**REQ-07 startAutoPlay guard:**
```diff
function startAutoPlay() {
+   if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(goNext, 3000);
}
```

---

## Constraints
- KHÔNG thay đổi visual layout (chỉ class swap + cleanup)
- KHÔNG break carousel autoplay behavior
- KHÔNG động `assets/css/styles.css` (compiled output, sẽ rebuild ở Theme khác nếu cần)

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected |
|-----|-------------|----------|
| REQ-01 | `grep -E '<h3[^>]*>[^<]*</h4>' terms.html privacy.html community-standards.html | wc -l` | `0` |
| REQ-02 | `grep -q "^node_modules/" .gitignore && grep -q "^.env" .gitignore && grep -q "^.hoangsa/" .gitignore && grep -q "^.claude/" .gitignore` | exit 0 |
| REQ-03 | `grep -c '<style>' index.html` | `0` |
| REQ-04 | `grep -c 'text-\[#22c55e\] hover:text-\[#166534\]' terms.html privacy.html community-standards.html | awk -F: '{s+=$2} END {print s}'` | `0` |
| REQ-05 | `grep -c 'text-xs text-gray-500 mb-2' index.html` | `0` |
| REQ-06 | `grep -q 'const totalPositions = total;' assets/js/carousel.js` | exit 0 |
| REQ-07 | `grep -B1 'autoTimer = setInterval' assets/js/carousel.js | grep -q 'clearInterval(autoTimer)'` | exit 0 |
| REQ-08 | `grep -c 'aria-label="Ảnh trước"\|aria-label="Ảnh tiếp"' index.html` | `2` |
| REQ-09 | `grep -E 'og:image|twitter:image' index.html | grep -q '.webp'` | exit 1 (no match — OG should be .png) |

### Overall
1. Mở 4 HTML pages trong browser → no console errors, layout không đổi
2. Carousel auto-rotate vẫn hoạt động bình thường
3. Validate HTML: `npx html-validate index.html terms.html privacy.html community-standards.html` (nếu có) — 0 errors
