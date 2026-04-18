# Context: Fix hình ảnh carousel bị cắt trong khung

## Task Type
fix

## Language
vi

## Spec Language
vi

## Tech Stack
HTML, CSS, JavaScript, TailwindCSS

## User Input
TÔI KHÔNG MUỐN CÁC HÌNH ẢNH NẰM TRONG KHUNG NHƯ THẾ NÀY GIỐNG NHƯ CẮT BỊ LỖI

Kèm screenshot: Hình ảnh trong carousel đang bị crop trong các khung bo góc, trông giống lỗi cắt hình.

## Discussion Log
### [Q1] Hình ảnh hiển thị như thế nào thay vì bị cắt trong khung?
- Options: Hiển thị full hình / Bỏ khung hoàn toàn / Giữ khung nhưng không crop
- Chosen: Other — hình ảnh tràn viền, không padding, thay vào đó dùng hiệu ứng blur
- Reason: User muốn hình ảnh full-bleed với blur fade-out thay vì hard crop

### [Q2] Hiệu ứng blur áp dụng như thế nào?
- Options: Blur viền (fade-out) / Blur background / Glassmorphism overlay
- Chosen: Blur viền (fade-out)
- Reason: Hình ảnh rõ nét ở giữa, mờ dần ra viền — tạo cảm giác hình hòa vào nền

### [Q3] Phạm vi áp dụng?
- Options: Chỉ carousel/slider / Tất cả hình ảnh / Chỉ trang landing
- Chosen: Chỉ carousel/slider
- Reason: Chỉ cần fix cho phần carousel hiển thị địa điểm

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Hình ảnh carousel tràn viền, không padding | User yêu cầu rõ ràng | LOCKED |
| 2 | Dùng blur fade-out (gradient mask) ở viền | User chọn hiệu ứng này | LOCKED |
| 3 | Chỉ áp dụng cho carousel/slider | Giới hạn scope, không ảnh hưởng components khác | LOCKED |

## Out of Scope
- Không thay đổi hình ảnh trong cards, hero, hoặc phần khác
- Không thay đổi layout/structure tổng thể của carousel
- Không thay đổi logic JS của carousel (scroll, snap, navigation)
