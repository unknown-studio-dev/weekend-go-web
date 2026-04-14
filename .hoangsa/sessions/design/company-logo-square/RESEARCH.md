# Research: Company logo class swap

## Phương pháp
- Đọc trực tiếp `index.html` lines 1297–1318 (footer "Liên hệ" list)
- So sánh class của 3 sibling items: company logo (`<img>`), Khang Trương (`<svg>`), Văn Thân (`<svg>`)
- Skip GitNexus reindex (single-line markup change, no symbol impact)

## Class hiện tại
| Element | Line | Classes |
|---------|------|---------|
| Company logo `<img>` | 1299 | `w-4 h-4 rounded-full object-cover border border-gray-600` |
| LinkedIn Khang `<svg>` | 1305 | `w-4 h-4` |
| LinkedIn Văn `<svg>` | 1313 | `w-4 h-4` |

## Khác biệt
- `rounded-full` → tạo hình tròn (border-radius: 9999px)
- `border border-gray-600` → viền 1px, làm element render thành 18×18 thay vì 16×16
- LinkedIn SVG render thẳng tắp 16×16 không viền

## Class đích sau sửa
```
w-4 h-4 object-cover
```

## Files affected
- 1 file (`index.html`), 1 line (1299), 1 class attribute change

## Risk
- LOW — markup-only, không động execution flow
- Không ảnh hưởng layout (`flex items-center gap-2` ở `<a>` parent kiểm soát alignment)
- Không ảnh hưởng accessibility (alt text giữ nguyên)
