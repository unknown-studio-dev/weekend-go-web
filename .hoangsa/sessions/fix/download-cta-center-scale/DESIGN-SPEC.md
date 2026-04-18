---
spec_version: "1.0"
project: "weekend-go-web"
component: "download_cta_center_scale"
language: "HTML / Tailwind CSS"
task_type: "fix"
category: "code"
status: "draft"
---

## Overview
[fix]: Canh giữa + scale 2 button App Store / Google Play trong section "Tải ứng dụng ngay"

### Goal
Trên mobile, 2 badge button canh giữa đúng theo chiều ngang; kích thước tăng từ 48px → 56px trên cả mobile và desktop.

### Context
Flex container `flex-col sm:flex-row gap-3 justify-center` trong section `#download` thiếu `items-center` → trên mobile (flex-col), anchors stretch full width, img nằm trái. Button hiện tại `h-12` (48px) — user muốn to hơn cho CTA nổi bật.

### Requirements
- [REQ-01] Trên mobile (<640px), 2 button canh giữa theo chiều ngang của container.
- [REQ-02] Trên desktop (≥640px), 2 button vẫn canh giữa (hiện đã đúng, không regress).
- [REQ-03] Cả 2 badge `<img>` có chiều cao 56px (`h-14`) thay vì 48px (`h-12`).
- [REQ-04] Tỷ lệ badge giữ nguyên (width auto theo aspect ratio SVG).
- [REQ-05] Không đổi URL, alt text, width/height attribute HTML.
- [REQ-06] index.html được rebuild khớp với src/index.src.html.

### Out of Scope
- Không fix hero section download buttons (line 208) — task khác
- Không đổi spacing section (py-16, mt-8)
- Không đổi badge SVG

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Thêm `items-center` vào flex container | Fix cross-axis alignment khi flex-col | LOCKED |
| 2 | `h-12` → `h-14` trên cả 2 `<img>` | Scale theo yêu cầu user | LOCKED |
| 3 | Không thêm breakpoint utility (sm:h-X) | Scale đồng nhất mọi viewport | LOCKED |
| 4 | Không bỏ `class="inline-block"` trên `<a>` | Giữ backward compat, không cần thiết phải đổi | LOCKED |

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| [src/index.src.html](../../../../src/index.src.html) | MODIFY | Line 984: thêm `items-center`. Line 994, 1006: `h-12` → `h-14` | d=1 |
| [index.html](../../../../index.html) | REBUILD | Sinh lại bởi `npm run build:html` | N/A |

### Diff chi tiết

**Line 984** — thêm `items-center`:
```diff
-<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
+<div class="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center">
```

**Line 994** (App Store img) — `h-12` → `h-14`:
```diff
-class="h-12 w-auto"
+class="h-14 w-auto"
```

**Line 1006** (Google Play img) — `h-12` → `h-14`:
```diff
-class="h-12 w-auto"
+class="h-14 w-auto"
```

---

## Constraints
- Không tăng CLS (layout shift): img có `width`/`height` attr đã set → browser reserve đúng aspect ratio, chỉ scale height → reserved box thay đổi một chút, nhưng trong section fixed height không đáng kể.
- Tailwind JIT: `h-14` đã có sẵn trong Tailwind default scale → không cần config.

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected |
|-----|-------------|----------|
| REQ-01 | Mở `index.html` viewport 375px, inspect 2 button | `getBoundingClientRect().left` của 2 img cách đều 2 cạnh container (±2px) |
| REQ-02 | Viewport 1280px | 2 button canh giữa hàng ngang, gap-3 giữa chúng |
| REQ-03 | Inspect `.h-14` computed | `height: 56px` trên cả 2 img |
| REQ-04 | Aspect ratio App Store: `width / height` ≈ 144/48 = 3 | width ≈ 168px khi height = 56 |
| REQ-05 | `git diff src/index.src.html` | Không có thay đổi nào ngoài 3 dòng trên |
| REQ-06 | `npm run build:html` | `index.html` có `items-center` và `h-14` ở section `#download` |

### Overall
```bash
# 1. Build
npm run build

# 2. Verify diff
git diff src/index.src.html
git diff index.html | grep -A2 "download"

# 3. Visual
npx serve -l 5173 .
# Mở http://localhost:5173 → scroll xuống section "Tải ứng dụng ngay"
# DevTools device mode: iPhone SE (375), iPad (768), Desktop (1280)

# 4. Playwright snapshot (nếu có regress)
npx playwright test tests/visual/pages.spec.js --update-snapshots
```
