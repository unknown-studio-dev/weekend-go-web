# Context: Carousel Mobile Real-time Interpolation

## Task Type
refactor

## Language
vi

## Spec Language
vi

## Tech Stack
HTML, CSS, JavaScript, TailwindCSS

## User Input
Refactor carousel mobile responsive:

1. **Scroll Snapping** — `scroll-snap-type: x mandatory`, item gần tâm phải tự snap vào giữa
2. **Focus & Visual Feedback** — Interpolation real-time dựa trên scroll offset:
   - Center: scale 1.0, opacity 1.0
   - Hai bên: scale 0.85, opacity 0.5
   - Chuyển đổi mượt mà theo khoảng cách tới center X
3. **Infinite Loop** — Clone approach: [D, A, B, C, D, A], scrollTo instant khi chạm ranh giới
4. **Dot Indicator** — Cập nhật active dot khớp với item đang ở giữa

## Discussion Log
### [Q1] Loại task?
- Options: refactor / feat / fix
- Chosen: refactor
- Reason: Cải thiện carousel mobile hiện tại, không thay đổi behavior tổng thể

### [Q2] Cách thực hiện interpolation?
- Options: JS scroll listener + rAF / CSS scroll-driven animation / IntersectionObserver + CSS var
- Chosen: JS scroll listener + rAF
- Reason: Mượt nhất, kiểm soát tốt nhất, browser support rộng

### [Q3] Giá trị scale/opacity?
- Options: 0.85/0.5 / 0.9/0.6 / 0.85/0.7
- Chosen: scale 0.85 / opacity 0.5
- Reason: Tương phản rõ ràng, đúng spec gốc

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | JS scroll + rAF cho interpolation | Browser support rộng, mượt nhất | LOCKED |
| 2 | Center scale 1.0, sides scale 0.85 | Spec gốc, tương phản rõ | LOCKED |
| 3 | Center opacity 1.0, sides opacity 0.5 | Spec gốc | LOCKED |
| 4 | Clone approach cho infinite loop | Đã có sẵn trong code hiện tại | LOCKED |
| 5 | Chỉ áp dụng trên mobile (<768px) | Desktop giữ nguyên coverflow mode | LOCKED |

## Out of Scope
- Desktop coverflow carousel (giữ nguyên)
- Tablet mode (giữ nguyên)
- Autoplay trên mobile
- Thêm animations mới (swipe indicator, parallax, etc.)
