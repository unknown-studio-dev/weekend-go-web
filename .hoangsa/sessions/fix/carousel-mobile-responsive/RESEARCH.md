# Research: Carousel responsive mobile

## Scope
Chỉ phạm vi component **#phone-carousel** trong section "Xem trước ứng dụng" — [index.html:685-810](../../../../index.html#L685) và source tương ứng [src/index.src.html](../../../../src/index.src.html).

## Files liên quan

| File | Role | Key symbols |
|------|------|-------------|
| [src/index.src.html](../../../../src/index.src.html) | Source template — build thành index.html | `<section>` preview, `#phone-carousel`, `.phone-item`, `#carousel-prev`, `#carousel-next` |
| [index.html](../../../../index.html) | Built output (sinh bởi `npm run build:html`) | Đồng bộ với src/ |
| [assets/css/carousel.css](../../../../assets/css/carousel.css) | Style & responsive size | `#phone-carousel`, `.phone-item`, `.phone-item img` |
| [assets/js/carousel.js](../../../../assets/js/carousel.js) | Logic coverflow, autoplay, nav buttons | `VISIBLE_POSITIONS`, `HIDDEN_POSITION`, `getSpreadScale()`, `goTo/goNext/goPrev`, `reorderDOM` |

## Trạng thái hiện tại

### JS — [assets/js/carousel.js](../../../../assets/js/carousel.js)
```js
const BREAKPOINT_XS = 480;
const BREAKPOINT_SM = 640;
const BREAKPOINT_LG = 1024;

const SPREAD_XS = 0.38;  // < 480px
const SPREAD_SM = 0.5;   // 480-640
const SPREAD_LG = 0.7;   // 640-1024
const SPREAD_DEFAULT = 1.0; // ≥ 1024

VISIBLE_POSITIONS = [
  // far-left (-2): scale 0.45, rotateY 45°, tx -420, op 0.4
  // left   (-1):  scale 0.6,  rotateY 40°, tx -230, op 0.7
  // center ( 0):  scale 0.8,  rotateY 0°,  tx 0,    op 1.0
  // right  (+1):  scale 0.6,  rotateY -40°, tx 230,  op 0.7
  // far-right (+2): scale 0.45, rotateY -45°, tx 420, op 0.4
]
HIDDEN_POSITION = { scale: 0.5, opacity: 0, zIndex: 0 }
```

Flow: `reorderDOM()` đặt 5 DOM items quanh center → `applyPositions(transition)` tính `translateX = pos.translateX * spread` → set `transform/opacity/zIndex` inline.

### CSS — [assets/css/carousel.css](../../../../assets/css/carousel.css)
```css
.phone-item img { width: 10rem; }  /* < 640px = 160px */
@media (min-width: 640px)  { .phone-item img { width: 14rem; } }  /* 224px */
@media (min-width: 1024px) { .phone-item img { width: 18rem; } }  /* 288px */

#phone-carousel { height: 440px; }
@media (min-width: 640px)  { height: 500px; }
@media (min-width: 1024px) { height: 580px; }
```

**Lưu ý specificity:** `.phone-item img` (0,1,1) > Tailwind `.w-48` (0,1,0) → CSS file control size thực tế, các class `w-48 sm:w-64 lg:w-80` trên `<img>` không có hiệu lực.

### HTML — [index.html:711-790](../../../../index.html#L711)
7 `<div class="phone-item absolute">` trong `#phone-carousel`. 5 cái đầu visible, 2 cái cuối hidden (theo logic JS). Buttons `#carousel-prev`/`#carousel-next` là sibling, `absolute left-0/right-0`.

## Gap so với mục tiêu

| Mục tiêu | Hiện tại | Gap |
|----------|----------|-----|
| Mobile <480px chỉ show 1 phone center | Show 5 phones (spread=0.38) | Cần force chỉ 1 visible, ẩn 4 còn lại |
| Center ~240px trên mobile | 160px base * scale 0.8 = 128px hiển thị | Cần tăng base image size mobile HOẶC scale |
| 480-768px show 3 phones | Show 5 phones (spread=0.5) | Cần chuyển center ± 1 thành visible, ± 2 thành hidden |
| ≥768px giữ 5 phones | ≥640px đã show 5 (spread=0.5, 0.7) | BREAKPOINT_SM=640 cần đổi thành 768 |
| Swipe gesture mobile | Không có | Cần thêm touchstart/touchend listeners |

## Impact analysis (GitNexus)

| Symbol | Direct callers | Impact |
|--------|---------------|--------|
| `VISIBLE_POSITIONS` | `getPosition()` | Không đổi structure, chỉ data |
| `getSpreadScale()` | `applyPositions()`, `goTo()` | Có thể thêm return value mới (ví dụ `null` = mobile-single-mode) |
| `reorderDOM()` | `goTo()`, init | Logic chọn visible items có thể cần mobile-aware |
| `applyPositions()` | `goTo()`, init, resize (cần thêm) | Cần thêm resize listener |

## Constraints kỹ thuật

1. **Không breaking desktop**: Breakpoint ≥768px phải giữ hành vi hiện tại y hệt (5 phones).
2. **Transition smooth khi resize**: Khi user xoay máy/resize, cần `applyPositions()` tính lại mà không animate lệch.
3. **Prefers-reduced-motion**: Swipe gesture cũng phải respect setting này nếu nó gây animation phụ.
4. **Touch không trigger drag ảnh native**: Cần `e.preventDefault()` trong touchmove hoặc `touch-action: pan-y` CSS.
5. **Avoid horizontal scroll**: Carousel đã overflow-hidden ở `<section>` parent — vẫn an toàn.

## Prior art trong codebase
- Breakpoints đã align với Tailwind (`BREAKPOINT_SM=640`, `BREAKPOINT_LG=1024`) → tiếp tục dùng convention này, thêm **BREAKPOINT_MD=768**.
- Không có swipe handler nào sẵn → cần viết mới, minimal logic.
