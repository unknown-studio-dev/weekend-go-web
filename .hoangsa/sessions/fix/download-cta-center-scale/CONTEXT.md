# Context: Canh giữa + scale 2 button trong section "Tải ứng dụng ngay"

## Task Type
fix

## Language
vi

## Spec Language
vi

## Tech Stack
HTML / Tailwind CSS

## User Input
> bổ sung vào đoạn sau canh giữa và scale 2 button sau (kèm screenshot CTA "Tải ứng dụng ngay" — 2 button App Store + Google Play đang align trái trên mobile)

## Observations từ screenshot + code
- Section: `#download` tại [src/index.src.html:961-1011](../../../../src/index.src.html#L961)
- Container: `<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">`
- Trên mobile (<640px) = flex-col mode:
  - `justify-center` áp lên main-axis (vertical) — không center horizontal
  - Không có `items-center` → cross-axis default `stretch` → `<a class="inline-block">` stretch full width → img nằm bên trái của anchor width
- Trên desktop (≥640px) = flex-row mode: `justify-center` canh ngang đúng — OK
- Button hiện tại: `class="h-12 w-auto"` = 48px cao

## Discussion Log

### [Q1] Scale target
- Chosen: **h-14 (~56px, +16%)**
- Reason: Tăng vừa đủ, không phá proportion

### [Q2] Scale scope
- Chosen: **Tất cả viewport**
- Reason: Đồng nhất, CTA nổi bật hơn

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Thêm `items-center` vào flex container | Fix canh giữa mobile | LOCKED |
| 2 | Đổi `h-12` → `h-14` trên cả 2 `<img>` badge | Scale theo yêu cầu | LOCKED |
| 3 | Áp dụng cho cả mobile + desktop | Đồng nhất | LOCKED |
| 4 | Không đổi width attribute HTML (giữ 144/162) | Browser tự scale tỷ lệ | LOCKED |
| 5 | Edit ở `src/index.src.html` rồi rebuild | Source of truth | LOCKED |

## Out of Scope
- Không thay đổi section header (h2, p)
- Không thay đổi bg-primary, spacing py-16
- Không thay badge SVG
- Không đổi cùng patterns ở hero section (index.src.html:208) — chỉ fix CTA download
