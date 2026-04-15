# Context: Tối ưu responsive mobile cho carousel "Xem trước ứng dụng"

## Task Type
fix

## Language
vi

## Spec Language
vi

## Tech Stack
HTML / Tailwind CSS / Vanilla JavaScript

## User Input
> Tối ưu cho respon mobile chỗ này cái (kèm screenshot iPhone ~390px width show section "Xem trước ứng dụng")

## Observations từ screenshot
- Section: "Xem trước ứng dụng" (carousel coverflow 7 phones, 5 visible)
- Trên mobile (~390px viewport):
  - 5 phones hiển thị chen chúc trong không gian hẹp
  - 2 side phones (±230px * spread) và 2 far-side phones (±420px * spread) bị thu nhỏ nhiều, không rõ nội dung
  - Center phone tuy là focus nhưng vẫn nhỏ so với màn hình
- Nút Prev/Next overlay ở 2 bên — vẫn tap được

## Discussion Log

### [Q1] Task type
- Chosen: fix (sửa lỗi responsive)

### [Q2] Số phone hiển thị trên mobile
- Options: 3 phones / 1 phone full width / giữ 5 phones
- Chosen: **1 phone (full width)** — chỉ hiện center, swipe/nhấn để đổi
- Reason: Đơn giản, tận dụng màn hình, center phone to rõ

### [Q3] Center phone size trên mobile
- Options: ~192px (giữ nguyên) / ~240px (to hơn) / flexible clamp
- Chosen: **~240px** (w-60)
- Reason: Thấy rõ màn hình app hơn, vẫn đủ margin 2 bên

### [Q4] Nút Prev/Next
- Chosen: **Giữ nút overlay** (co nhỏ, sát cạnh)
- Reason: User quen UX này

### [Q5] Breakpoint chuyển 1→3→5 phones
- Chosen: **< 480px = 1, 480-768 = 3, ≥ 768 = 5**
- Reason: 3 tầng mượt hơn — mobile nhỏ / tablet nhỏ / desktop

### [Q6] Swipe gesture
- Chosen: **Có swipe** (touchstart/touchend → goNext/goPrev)
- Reason: Native mobile UX

### [Q7] Branching
- Chosen: Giữ nguyên `refactor/split-js-css-carousel`
- Reason: Task overlap trực tiếp với refactor carousel đang làm, gộp commit hợp lý

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Mobile (<480px) chỉ hiện 1 phone center, ẩn 4 phone còn lại | Không gian chật | LOCKED |
| 2 | Center phone ~240px width trên mobile (w-60) | User thấy rõ hơn | LOCKED |
| 3 | Breakpoints: <480 (1), 480-768 (3), ≥768 (5) | 3 tầng responsive | LOCKED |
| 4 | Thêm swipe gesture touch events | Mobile UX chuẩn | LOCKED |
| 5 | Giữ nút Prev/Next overlay | User quen | LOCKED |
| 6 | Work on existing branch `refactor/split-js-css-carousel` | Overlap với refactor | LOCKED |
| 7 | Cơ chế ẩn 4 phone phụ = dùng `HIDDEN_POSITION` có sẵn | Không đổi cấu trúc JS | FLEXIBLE |

## Out of Scope
- Không thay đổi carousel animation (transition, cubic-bezier)
- Không thay đổi autoplay behavior
- Không thêm dots indicator
- Không redesign header/text phần "Xem trước ứng dụng"
- Không thay ảnh phone
