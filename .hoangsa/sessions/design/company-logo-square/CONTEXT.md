# Context: Company logo vuông + cùng size LinkedIn SVG

## Task Type
design (UI tweak — class swap để đồng bộ visual với SVG icon kế bên)

## Language
vi

## Spec Language
vi

## Tech Stack
HTML5 / TailwindCSS 3

## User Input
> update logo cty thành hình vuông cùng size với linked in logo

## Discussion Log

### [Q1] Bỏ luôn border để match LinkedIn 100%?
- Options: Bỏ cả border / Giữ border
- Chosen: Bỏ cả border
- Reason: LinkedIn SVG (line 1305, 1313) không có border. Border 1px hiện tại của `<img>` làm logo công ty trông to hơn 2px so với SVG kế bên — visual không cùng size.

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Remove `rounded-full` từ class của `<img>` line 1299 | Đổi từ tròn → vuông như SVG LinkedIn | LOCKED |
| 2 | Remove `border border-gray-600` | Match chính xác kích thước render của LinkedIn (16×16 không có viền thừa) | LOCKED |
| 3 | Giữ `w-4 h-4` | Đã đúng size LinkedIn (`w-4 h-4`) | LOCKED |
| 4 | Giữ `object-cover` | Defensive — đảm bảo image (square 1:1) không bị méo nếu file source thay đổi tỉ lệ | LOCKED |

## Out of Scope
- Resize toàn bộ icon list (giữ `w-4 h-4`)
- Đổi nguồn ảnh `company_logo.jpg`
- Tối ưu image size hoặc generate `.webp`
- Đụng các icon khác (Facebook/Instagram social links — class riêng `w-5 h-5`)
