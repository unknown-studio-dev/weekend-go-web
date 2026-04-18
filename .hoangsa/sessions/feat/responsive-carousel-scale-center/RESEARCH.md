# Research: Responsive Carousel Scale Center

## 1. Cấu trúc code hiện tại

**Carousel architecture 3-mode:**
- **Desktop (>=1024px)**: CoverFlow 3D — `perspective: 3000px`, `rotateY`, 5 visible items, absolute positioning, `POSITIONS_DESKTOP`
- **Tablet (768-1023px)**: CoverFlow nhẹ — `POSITIONS_TABLET` (ẩn slot 0,4), rotateY ±15°
- **Mobile (<768px)**: Scroll-snap mode — CSS `scroll-snap-type: x mandatory`, clone nodes, `interpolateItems()` real-time

**Files:**
- `assets/js/carousel.js` — 464 lines, toàn bộ logic render/animation/touch/resize
- `assets/css/carousel.css` — 130 lines, layout + 3 media query blocks
- `index.html` — 8 `.phone-item` với ảnh `preview-*`
- `src/index.src.html` — Template source, cấu trúc giống index.html
- `tests/visual/carousel-mobile.spec.js` — Playwright tests

## 2. Symbols cần thay đổi

### REMOVE (loại bỏ hoàn toàn)

| Symbol | Line | Lý do |
|--------|------|-------|
| `POSITIONS_TABLET` | 37-43 | Gộp vào Scale Center |
| `POSITIONS_MOBILE` | 45-51 | Thay bằng POSITIONS_SCALE_CENTER |
| `MOBILE_SCALE_CENTER/SIDE/OPACITY_*` | 12-15 | Không dùng nữa (Scale Center dùng POSITIONS array) |
| `isScrollMode` | 60 | Scroll-snap removed |
| `cloneFirst`, `cloneLast` | 61-62 | Clone nodes removed |
| `rafId` | 63 | RAF for scroll interpolation removed |
| `interpolateItems()` | 114-134 | Scroll-based interpolation removed |
| `handleScrollInterpolation()` | 136-139 | RAF wrapper removed |
| `initScrollMode()` | 141-169 | Entire scroll-snap init removed |
| `destroyScrollMode()` | 171-195 | Entire scroll-snap destroy removed |
| `scrollToIndex()` | 197-206 | Scroll positioning removed |
| `handleScrollEnd()` | 208-237 | Scroll end detection removed |
| `updateCenterClass()` | 239-244 | Scroll center class removed |
| `scrollEndTimer`, `debounceScrollEnd()` | 246-250 | Scroll debounce removed |

### MODIFY

| Symbol | Line | Thay đổi |
|--------|------|----------|
| `getViewportMode()` | 65-70 | 3 modes → 2: `< BREAKPOINT_LG ? 'scale-center' : 'coverflow'` |
| `getPositions()` | 72-78 | Switch 3 cases → 2 cases |
| `applyPositions()` | 269-291 | Xoá `if (isScrollMode)` branch |
| `goTo()` | 293-327 | Xoá `if (isScrollMode)` branch (scroll logic) |
| `handleResize()` | 408-424 | Xoá init/destroyScrollMode, chỉ re-apply positions |
| Touch handlers | 361-405 | Xoá `if (isScrollMode) return;` guards |
| Initial render | 338-345 | Xoá `if (getViewportMode() !== 'desktop') initScrollMode()` |
| `buildDots()` click | 96-97 | Xoá `if (getViewportMode() === 'mobile') return;` guard |

### ADD (mới)

| Symbol | Mô tả |
|--------|-------|
| `POSITIONS_SCALE_CENTER` | 5-slot array cho <1024px — txRatio responsive, no rotateY |

### KEEP AS-IS

| Symbol | Lý do |
|--------|-------|
| `POSITIONS_DESKTOP` | CoverFlow values giữ nguyên |
| `HIDDEN` | Hidden slot config giữ nguyên |
| `reorderDOM()` | Logic order items vẫn đúng cho cả 2 mode |
| `buildDots()`, `updateDots()` | Dots logic vẫn đúng |
| Autoplay (`start/stop/resetAutoPlay`) | Không thay đổi |
| `BREAKPOINT_LG` (1024) | Vẫn dùng làm threshold |
| Swipe constants | Tuning values vẫn đúng |

## 3. CSS changes

### XOÁ

1. **@media (max-width: 767px) #phone-carousel** (line 38-52) — Toàn bộ scroll-snap block:
   - `display: flex`, `overflow-x: auto`, `scroll-snap-type`, `scroll-behavior: smooth`
   - `.phone-item { position: static !important; flex: 0 0 75%; scroll-snap-align: center; }`
   - Scrollbar hide rules

2. **@media (max-width: 767px) prev/next** (line 90-95) — Buttons giờ luôn visible

3. **@media (max-width: 767px) .carousel-dot** (line 118-122) — Dots giờ clickable trên mọi mode

### SỬA

1. **#phone-carousel** (line 1-6):
   - Xoá `perspective: 3000px; transform-style: preserve-3d;` khỏi base rule
   - Thêm vào `@media (min-width: 1024px)`: `perspective: 3000px; transform-style: preserve-3d;`

2. **@media (max-width: 1023px)** — Thêm mới:
   - `perspective: none; transform-style: flat;` (explicit flat cho mobile/tablet)

### GIỮ NGUYÊN

- Height responsive media queries (480/640/1024)
- `.phone-item` base styles (absolute, left: 50%, top: 50%)
- `.phone-item img` styles (border, border-radius, shadow, filter)
- Responsive img width media queries (640px, 1024px)
- Dots styles
- `@media (prefers-reduced-motion: reduce)` block

## 4. HTML changes

**Thứ tự hiện tại (items 6-8):**
```
6. preview-weekend-plan.png    (line 758-766)
7. preview-plan-list.png       (line 767-775)  
8. preview-create-post.png     (line 776-784)
```

**Thứ tự spec:**
```
6. preview-create-post.png     (Tạo bài đăng)
7. preview-weekend-plan.png    (Lập kế hoạch cuối tuần)
8. preview-plan-list.png       (Bộ sưu tập kế hoạch)
```

Cần reorder: move create-post lên vị trí 6, weekend-plan xuống 7, plan-list xuống 8.

**Cần apply cho cả:** `index.html` và `src/index.src.html`

## 5. Risks & Dependencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mất native scroll-snap feel trên mobile | UX khác biệt — users expect swipe scroll | Transform animation 600ms smooth + swipe gesture vẫn hoạt động |
| `getViewportMode()` return values đổi | Test assertions break | Update tests: 'mobile'/'tablet' → 'scale-center', 'desktop' → 'coverflow' |
| Clone nodes removed | Tests check `.clone` class | Remove scroll-snap tests |
| Prev/next buttons visible on mobile | Buttons chiếm space trên mobile | Buttons đã có responsive sizing (w-10 h-10 trên mobile) |
| Touch handlers luôn active | Desktop users có thể swipe | Threshold tuning (25px + velocity) ngăn accidental triggers |

**Test file impact:** `tests/visual/carousel-mobile.spec.js`
- ~8-10 tests cần xoá (scroll-snap, clone, static position, arrows hidden)
- ~3-4 tests cần update (viewport mode values)
- Cần thêm tests mới cho Scale Center mode

## 6. Patterns hiện tại cần giữ

1. **txRatio responsive** — translateX = txRatio × carousel.offsetWidth
2. **5-slot DOM layout** — Index 0..4 = positions -2, -1, 0, +1, +2
3. **reorderDOM() ordering** — Center ± 2 visible, rest hidden appended after
4. **Animation timing** — 600ms cubic-bezier(0.4, 0, 0.2, 1)
5. **Data attributes** — `data-centerIndex`, `data-viewportMode` for test access
6. **Swipe tuning constants** — Deadzone, velocity, lock ratio
7. **Accessibility** — Aria-labels trên dots, keyboard navigation
8. **Autoplay pause** — Visibility change + reduced motion respect
