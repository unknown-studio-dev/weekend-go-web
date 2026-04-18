# Context: Full 3D CoverFlow đa thiết bị

## Task Type
refactor

## Language
vi

## Spec Language
vi

## Tech Stack
HTML, CSS, JavaScript (Vanilla), TailwindCSS

## User Input
Nâng cấp carousel từ hiệu ứng phẳng (Scale Center) sang Full 3D CoverFlow trên cả mobile và desktop. Desktop hiện 5 items, mobile hiện 3 items — cả 2 đều dùng 3D rotateY. Fix các bug UI: clipping, responsive scaling, z-index, container height.

## Discussion Log
Không cần deep-dive — user đã cung cấp spec kỹ thuật chi tiết với thông số transform cụ thể.

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Mobile/Tablet cũng dùng 3D rotateY (±35°) thay vì flat | User yêu cầu full 3D CoverFlow đa thiết bị | LOCKED |
| 2 | Perspective: 1200px cho cả 2 modes | User spec — tạo chiều sâu ổn định | LOCKED |
| 3 | Center: scale(1.1) + translateZ(150px) | Nổi bật hơn, tạo depth | LOCKED |
| 4 | Container height: min-height vh thay fixed px | Responsive, không clip ảnh | LOCKED |
| 5 | overflow: visible trên carousel | Tránh cắt ảnh khi scale/rotate | LOCKED |
| 6 | Click side items để navigate | UX improvement | LOCKED |
| 7 | Autoplay pause on hover | Prevent accidental advance khi đang xem | LOCKED |
| 8 | txRatio responsive (giữ pattern hiện tại) | Đã proven hoạt động tốt trên mọi viewport | LOCKED |
| 9 | Giữ renamed mode 'coverflow' cho cả 2 (desktop + mobile đều 3D) | Không còn 'scale-center' — cả 2 đều CoverFlow | FLEXIBLE |

## Out of Scope
- Không thêm thư viện JS
- Không thay đổi image order
- Không thay đổi markup structure (.phone-item)
- Không thêm pagination dots mới
- Không thay đổi swipe gesture logic (đã hoạt động tốt)
