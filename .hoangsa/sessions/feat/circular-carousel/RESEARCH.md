# Research: CoverFlow Carousel

## Codebase hiện tại

### HTML Structure (index.html:902-966)
- `#phone-carousel` chứa 6 `div.phone-item`, mỗi div chứa 1 `<img>`
- Container dùng flexbox: `flex justify-center items-center`
- Prev/Next buttons: `#carousel-prev`, `#carousel-next`

### JS Logic hiện tại (index.html:1337-1450)
- Constants: `SLIDE_OFFSET_PX=50`, `ANIMATION_DURATION_MS=500`, `AUTOPLAY_INTERVAL_MS=3000`
- Biến state: `centerIndex`, `animating`, `autoTimer`
- `reorderDOM()`: Chỉ giữ 3 items trong DOM (left, center, right) — **CẦN THAY ĐỔI** vì cần hiển thị 5
- `applyByDOMPosition()`: Scale center=0.9, sides=0.7, opacity center=1, sides=0.5
- `goTo(newCenter, direction)`: Tắt transition → reorder → set vị trí cũ → bật transition → animate
- `goNext()`/`goPrev()`: Modular increment/decrement centerIndex
- Autoplay: `setInterval(goNext, 3000)` với `resetAutoPlay()`

### CSS hiện tại
- `.phone-transition` class cho transition
- Inline styles set bởi JS: transform, opacity, zIndex

## Approach: CoverFlow 5-visible

### Cần thay đổi
1. **`reorderDOM()`** → Hiển thị 5 items (center ± 2), ẩn item thứ 6
2. **`applyByDOMPosition()`** → CoverFlow transforms:
   - Center: `scale(1.0) rotateY(0deg) translateX(0)` opacity=1 z=10
   - Left-1/Right-1: `scale(0.8) rotateY(±40deg) translateX(∓20%)` opacity=0.7 z=5
   - Left-2/Right-2: `scale(0.6) rotateY(±55deg) translateX(∓35%)` opacity=0.4 z=1
   - Hidden (6th): `display:none` hoặc `opacity:0 scale(0)`
3. **Container CSS** → Thêm `perspective: 1200px` và `transform-style: preserve-3d`
4. **`goTo()`** → Adapt cho 5 items thay vì 3
5. **Container layout** → Bỏ flexbox gap/space-x, dùng absolute positioning hoặc transform-based layout

### Không thay đổi
- `goNext()`, `goPrev()` — vẫn dùng modular arithmetic
- Autoplay logic — giữ nguyên
- Prev/Next button HTML — giữ nguyên
- Phone-item HTML markup — giữ nguyên
