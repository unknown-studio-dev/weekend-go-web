# Context: CoverFlow Carousel cho section "Xem trước ứng dụng"

## Task Type
feat

## Language
vi

## Spec Language
vi

## Tech Stack
HTML, CSS, JavaScript (vanilla), TailwindCSS

## User Input
Update behavior of 6 hình được sắp xếp trên một vòng tròn ảo. Khi người dùng click existing prev/next/autoplay logic, các hình sẽ di chuyển theo quỹ đạo vòng cung. Hình ở giữa luôn to nhất, các hình ở xa nhỏ dần và mờ đi. Hiển thị 5 ảnh cùng lúc trên màn hình. Kiểu animation CoverFlow (kiểu Apple).

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Hiển thị 5 ảnh, ẩn 1 phía sau | User chọn | LOCKED |
| 2 | CoverFlow style — ảnh 2 bên nghiêng vào (rotateY) | User chọn, có ảnh tham khảo | LOCKED |
| 3 | Giữ nguyên prev/next buttons + autoplay logic | Chỉ thay đổi rendering, không đổi UX controls | LOCKED |
| 4 | Không thêm pagination dots | Không yêu cầu, giữ đơn giản | FLEXIBLE |

## Out of Scope
- Không thêm pagination dots
- Không thay đổi HTML markup (6 phone-item divs giữ nguyên)
- Không thay đổi section header/layout
- Không touch responsiveness của prev/next buttons
