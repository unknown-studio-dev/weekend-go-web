---
spec_version: "1.0"
project: "weekend-go-web"
component: "company_logo_square"
language: "html-tailwindcss"
task_type: "design"
category: "code"
status: "draft"
---

## Overview
[design]: Company logo trong footer "Về chúng tôi" thành hình vuông, cùng size LinkedIn SVG

### Goal
Logo `<img>` công ty (line 1299 `index.html`) hiển thị đúng 16×16px vuông, không viền — visual đồng bộ với SVG icon LinkedIn của Khang Trương / Văn Thân kế bên.

### Context
Sau commit `fbee29b`, footer link "Về chúng tôi" đã hiển thị logo Unknown Studio nhưng dạng tròn (`rounded-full`) + viền xám (`border border-gray-600`). 2 link sibling (Khang Trương line 1305, Văn Thân line 1313) dùng SVG `w-4 h-4` không viền không bo tròn — visual ba item không đồng nhất.

### Requirements
- [REQ-01] `<img>` tag tại line ~1299 không còn class `rounded-full`.
- [REQ-02] `<img>` tag tại line ~1299 không còn class `border` hay `border-gray-600`.
- [REQ-03] `<img>` tag vẫn giữ class `w-4 h-4` và `object-cover`.
- [REQ-04] `alt="Unknown Studio"` và `src="assets/images/company_logo.jpg"` không thay đổi.

### Out of Scope
- Đụng các social SVG khác (Facebook/Instagram dùng `w-5 h-5`)
- Thay đổi 2 LinkedIn SVG
- Refactor classes của parent `<a>` (giữ `flex items-center gap-2`)

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Class cuối cùng: `w-4 h-4 object-cover` | Đủ để render image vuông 16×16 không viền không bo | LOCKED |
| 2 | Giữ `object-cover` thay vì xóa | `company_logo.jpg` hiện là 1:1 nên `object-cover` no-op, nhưng giữ phòng ngừa user thay file source khác tỉ lệ → tránh méo | LOCKED |

### Affected Files
| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `index.html` | MODIFY (1 line) | Line 1299: rút class từ `w-4 h-4 rounded-full object-cover border border-gray-600` → `w-4 h-4 object-cover` | N/A (markup only) |

### Snippet trước/sau

```diff
- <img src="assets/images/company_logo.jpg" alt="Unknown Studio" class="w-4 h-4 rounded-full object-cover border border-gray-600">
+ <img src="assets/images/company_logo.jpg" alt="Unknown Studio" class="w-4 h-4 object-cover">
```

---

## Open Questions
*(none)*

## Constraints
- Không break responsive (parent dùng `flex items-center gap-2`, không phụ thuộc rounded shape của icon)
- Không thay đổi color contrast / a11y

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | `grep -c 'company_logo.jpg.*rounded-full' index.html` | 0 |
| REQ-02 | `grep -c 'company_logo.jpg.*border' index.html` | 0 |
| REQ-03 | `grep -q 'src="assets/images/company_logo.jpg" alt="Unknown Studio" class="w-4 h-4 object-cover"' index.html` | match (exit 0) |
| REQ-04 | `grep -q 'src="assets/images/company_logo.jpg"' index.html && grep -q 'alt="Unknown Studio"' index.html` | match (exit 0) |

### Overall
1. Mở `index.html` trong trình duyệt → footer → list "Liên hệ" → 3 item "Về chúng tôi" / "Khang Trương" / "Văn Thân" có icon vuông cùng size 16×16, không viền, alignment thẳng hàng.
2. Inspect element → `<img>` không có border-radius hay border style.
