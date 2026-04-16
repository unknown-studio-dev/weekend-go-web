# Context: Refactor carousel mobile sang CSS scroll-snap

## Task Type
refactor

## Language / Spec Language
vi / vi

## Tech Stack
HTML / Tailwind CSS / Vanilla JavaScript

## User Input
> Thay thế carousel JS transforms trên mobile bằng CSS scroll-snap native. Desktop giữ nguyên 5-phone coverflow.

## Discussion Log

### [Q1] Overlap với fix/carousel-mobile-responsive
- Chosen: **Thay thế hoàn toàn** implementation T-01..T-07

### [Q2] Task type
- Chosen: **refactor**

### [Q3] Card content
- Chosen: vẫn dùng phone screenshot images, hiển thị 1 center to + 2 bên cắt 10-15%

### [Q4] Infinite loop
- Chosen: **Có**

### [Q5] Desktop
- Chosen: **Giữ nguyên** 5-phone coverflow như hiện tại

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Mobile (<768px): CSS `scroll-snap-type: x mandatory` thay thế JS transforms | Native, performant, user spec yêu cầu | LOCKED |
| 2 | Desktop (≥768px): giữ nguyên 5-phone coverflow JS transforms | User yêu cầu không đổi | LOCKED |
| 3 | Card peek 10-15% hai bên | User spec | LOCKED |
| 4 | Center card 100% safe-area width | User spec | LOCKED |
| 5 | Border-radius 20px (middle of 16-24px range) | Modern feel | FLEXIBLE |
| 6 | Transition 300ms ease-in-out (scroll-behavior: smooth) | User spec | LOCKED |
| 7 | Infinite loop: clone first/last items + JS scroll-position jump | Native scroll-snap không hỗ trợ loop | LOCKED |
| 8 | Dots indicator giữ lại | User spec (optional nhưng đã implement) | LOCKED |
| 9 | Arrows ẩn trên mobile (giữ nguyên) | Đã implement, user approved | LOCKED |
| 10 | Swipe: native scroll gesture (không cần JS swipe handler trên mobile) | CSS scroll-snap tự handle | LOCKED |

## Out of Scope
- Không render HTML content cards (vẫn dùng ảnh)
- Không thay đổi ảnh phone
- Không thêm Swiper.js hay external library
- Không thay đổi desktop behavior
- Không thay đổi autoplay logic (vẫn JS-driven)
