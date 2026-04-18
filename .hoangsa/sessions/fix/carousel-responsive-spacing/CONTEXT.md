# Context: Carousel Responsive Spacing

## Task Type
fix

## Tech Stack
HTML, CSS, JavaScript

## User Input
Fix khoảng cách giữa các phone items trong carousel khi responsive. Hiện tại translateX dùng giá trị pixel cố định → phone chồng lên nhau ở viewport nhỏ, cách xa ở viewport lớn.

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Dùng translateX responsive theo viewport width | Tự động scale mượt mà, không cần tune từng breakpoint | LOCKED |
| 2 | Tính translateX dựa trên carousel.offsetWidth | Chính xác hơn viewport width vì carousel có max-width | LOCKED |

## Out of Scope
- Mobile scroll-snap mode (đã có gap CSS, không dùng translateX)
- Thay đổi scale, rotateY, opacity values
- Thay đổi animations hay transitions
