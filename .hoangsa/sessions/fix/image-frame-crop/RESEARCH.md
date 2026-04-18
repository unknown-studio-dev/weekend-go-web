# Research: Fix hình ảnh carousel bị cắt trong khung

## Codebase Analysis

### Carousel Structure
- **HTML**: `src/index.src.html` (lines 762-838) — 8 `.phone-item` wrappers, mỗi wrapper chứa 1 `<img>`
- **CSS**: `assets/css/carousel.css` — styling cho container, items, images, dots
- **JS**: `assets/js/carousel.js` — CoverFlow 3D (desktop), scroll-snap + interpolation (mobile/tablet)

### Root Cause — CSS gây hiệu ứng "khung cắt hình"

**File: `assets/css/carousel.css`, lines 19-35:**

```css
.phone-item img {
  border: 3px solid #1d1d1f;       /* ← Khung đen bao quanh */
  border-radius: 1.75rem;          /* ← Bo góc cắt hình ở 4 góc */
  background: #000;                /* ← Nền đen lộ khi hình chưa load */
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.08),  /* ← Viền sáng giả phone */
    0 0 0 1px rgba(0,0,0,0.35);               /* ← Shadow ngoài */
}
```

**Responsive overrides:**
- Mobile `@media (max-width: 767px)`: `border-radius: 20px`
- Tablet `@media (min-width: 640px)`: `border-width: 4px; border-radius: 2.25rem`
- Desktop `@media (min-width: 1024px)`: `border-width: 5px; border-radius: 2.75rem`

### Tổng hợp nguyên nhân
1. `border` + `border-radius` tạo "phone frame" giả — cắt 4 góc hình
2. `box-shadow inset` tạo hiệu ứng viền điện thoại — trông giống mockup device
3. Không có `object-fit` hoặc `aspect-ratio` → hình bị ép theo width cố định
4. Kết hợp tất cả → hình ảnh trông như bị "nhét vào khung" và cắt lỗi

### Affected Files
| File | Lines | Vai trò |
|------|-------|---------|
| `assets/css/carousel.css` | 19-35, 68-71, 74-79, 81-86 | CSS gây khung cắt |
| `src/index.src.html` | 766-838 | HTML structure (không cần sửa) |
| `assets/js/carousel.js` | Toàn file | JS logic (không cần sửa) |

### Kỹ thuật CSS cho blur fade-out

**Approach: CSS `mask-image` + `backdrop-filter`**

Để tạo hiệu ứng hình rõ ở giữa, mờ dần ra viền:

1. **Option A: `mask-image` gradient** — đơn giản nhất, chỉ fade-to-transparent
   - Pro: performant, 1 dòng CSS
   - Con: chỉ fade, không blur thật sự

2. **Option B: pseudo-element + `backdrop-filter: blur()`** — blur thật ở viền
   - Pro: hiệu ứng đẹp hơn, blur thật
   - Con: cần pseudo-element, phức tạp hơn

3. **Option C: Kết hợp A+B** — gradient mask cho fade + backdrop-filter cho blur
   - Pro: hiệu ứng đẹp nhất
   - Con: phức tạp nhất, cần test performance

**Khuyến nghị: Option A** — `mask-image` gradient cho fade-out ở viền. Đơn giản, performant, và tạo được hiệu ứng mong muốn. Nếu cần blur thêm thì upgrade sang Option C sau.
