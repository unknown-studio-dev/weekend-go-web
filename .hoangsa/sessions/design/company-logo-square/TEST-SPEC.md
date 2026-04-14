---
tests_version: "1.0"
spec_ref: "company_logo_square-spec-v1.0"
component: "company_logo_square"
category: "code"
strategy: "smoke"
language: "html-tailwindcss"
---

## Pre-flight Checks
- [ ] File `index.html` tồn tại và chứa `company_logo.jpg`
- [ ] File `assets/images/company_logo.jpg` vẫn tồn tại

## Integration Tests (grep)

### Check: REQ-01 — không còn rounded-full trên img logo
- **Command**: `grep -E 'company_logo\.jpg.*rounded-full' index.html | wc -l`
- **Expected**: `0`
- **Covers**: REQ-01

### Check: REQ-02 — không còn border trên img logo
- **Command**: `grep -E 'company_logo\.jpg.*border' index.html | wc -l`
- **Expected**: `0`
- **Covers**: REQ-02

### Check: REQ-03 — class chính xác
- **Command**: `grep -q 'src="assets/images/company_logo.jpg" alt="Unknown Studio" class="w-4 h-4 object-cover"' index.html`
- **Expected**: exit code 0
- **Covers**: REQ-03

### Check: REQ-04 — src + alt giữ nguyên
- **Command**: `grep -q 'src="assets/images/company_logo.jpg"' index.html && grep -q 'alt="Unknown Studio"' index.html`
- **Expected**: exit code 0
- **Covers**: REQ-04

## Visual Checklist (manual trong trình duyệt)

### [REQ-01–04] Footer "Liên hệ" — 3 icon đồng nhất
- [ ] Icon "Về chúng tôi" hiển thị vuông (không bo tròn)
- [ ] Icon size đúng 16×16px (DevTools → computed: width = height = 16px)
- [ ] Không có border xám xung quanh
- [ ] So với 2 SVG LinkedIn kế bên: cùng kích thước render, alignment thẳng hàng theo `flex items-center`
- [ ] Logo `{U}` neon vẫn rõ trên nền đen footer

## Edge Cases
| Scenario | How to simulate | Expected | Covers |
|----------|----------------|----------|--------|
| Image fail load | DevTools → block `company_logo.jpg` | Alt text "Unknown Studio" hiển thị, không vỡ layout | REQ-04 |
| Zoom 200% | Browser zoom 200% | Icon vẫn vuông 32×32, không méo | REQ-03 |

## Regression Checks
- [ ] Link "Về chúng tôi" vẫn trỏ `https://unknownstudio.dev/team`
- [ ] Hover state link đổi text → màu trắng (như 2 sibling)
- [ ] Không file nào khác bị động vào (chỉ `index.html`)
