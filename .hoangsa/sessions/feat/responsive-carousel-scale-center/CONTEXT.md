# Context: Responsive Carousel — CoverFlow Desktop + Scale Center Mobile

## Task Type
feat

## Language
vi

## Spec Language
vi

## Tech Stack
HTML, CSS, JavaScript (Vanilla), TailwindCSS

## User Input
Tách biệt behavior của carousel theo breakpoint:
- Desktop (>=1024px): Giữ 3D CoverFlow (rotateY, perspective) như hiện tại
- Mobile + Tablet (<1024px): Chuyển sang Scale Center — chỉ scale và opacity, không có rotation 3D

Đồng thời reorder ảnh carousel theo thứ tự mới và bỏ scroll-snap mode hiện tại trên mobile.

## Discussion Log

### [Q1] Scroll-snap mode trên mobile (<768px) — giữ hay bỏ?
- Options:
  A. Bỏ scroll-snap, dùng Scale Center cho toàn bộ <1024px
  B. Giữ scroll-snap cho mobile, Scale Center cho tablet (3 modes)
  C. Giữ scroll-snap nhưng đổi breakpoint sang <1024px
- Chosen: A — Bỏ scroll-snap, dùng Scale Center cho toàn bộ <1024px
- Reason: Đơn giản hoá architecture — 2 modes thay vì 3, bỏ clone nodes + CSS scroll-snap. Trade-off: mất native scroll feel trên mobile nhưng UX nhất quán hơn.

### [Q2] Thứ tự ảnh trong carousel
- Options:
  A. Theo spec: #6 create-post, #7 weekend-plan, #8 plan-list
  B. Giữ hiện tại: #6 weekend-plan, #7 plan-list, #8 create-post
- Chosen: A — Theo spec
- Reason: User muốn thứ tự logic theo flow sử dụng app

### [Q3] Scale Center translateX — cố định hay responsive?
- Options:
  A. txRatio responsive (fraction of carousel width)
  B. Giá trị px cố định (±120px)
- Chosen: A — txRatio responsive
- Reason: Nhất quán với pattern code hiện tại, scale tự nhiên theo kích thước viewport

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Bỏ scroll-snap mode, dùng Scale Center transform-based cho <1024px | Đơn giản 2-mode architecture, bỏ clone nodes/scroll-snap complexity | LOCKED |
| 2 | Dùng cùng 5 DOM slots cho cả 2 mode | Tránh thay đổi reorderDOM() — chỉ swap position config | LOCKED |
| 3 | Scale Center ẩn DOM index 0 và 4 (opacity 0) | DOM structure nhất quán | LOCKED |
| 4 | isDesktop() đọc window.innerWidth runtime | Real-time resize không cần listener riêng | LOCKED |
| 5 | Perspective chỉ trên desktop qua media query CSS | rotateY 3D chỉ cần depth khi có perspective | LOCKED |
| 6 | Scale Center dùng txRatio responsive thay vì px cố định | Nhất quán với pattern hiện tại, scale theo viewport | LOCKED |
| 7 | Reorder ảnh theo spec: create-post trước weekend-plan | Flow logic theo UX | LOCKED |
| 8 | Loại bỏ toàn bộ scroll-snap CSS + JS (initScrollMode, destroyScrollMode, clone logic) | Không cần nữa khi Scale Center thay thế | LOCKED |

## Out of Scope
- Không thêm pagination dots / swipe gesture mới
- Không thay đổi section header hay layout bao ngoài
- Không thêm thư viện JS
- Không thay đổi markup cấu trúc .phone-item (chỉ thay `<img>` bên trong)
- Không convert ảnh preview-* sang WebP
