# Research: Carousel Mobile Interpolation

## Kiến trúc hiện tại

### Dual-mode architecture
- **Desktop** (≥768px): CoverFlow 3D — absolute positioning + rotateY + scale + perspective
- **Mobile** (<768px): Scroll-snap — flex container + overflow-x + scroll-snap-type

### Mobile scroll mode (carousel.js)
- `initScrollMode()` (line 106): chuyển từ desktop → mobile, tạo clones, setup scroll listeners
- `destroyScrollMode()` (line 135): ngược lại khi resize lên desktop
- `handleScrollEnd()` (line 162): tìm item gần center nhất, cập nhật centerIndex, dots, is-center class
- `updateCenterClass()` (line 194): toggle `.is-center` trên item ở giữa
- `debounceScrollEnd()` (line 202): fallback cho browser không có scrollend event, timeout 100ms

### CSS mobile (carousel.css, lines 38-76)
- Container: `display: flex; scroll-snap-type: x mandatory; padding: 0 12.5%`
- Items: `flex: 0 0 75%; scroll-snap-align: center`
- Non-center: `transform: scale(0.85) !important; opacity: 0.5 !important`
- Center (`.is-center`): `transform: scale(1) !important; opacity: 1 !important`
- Transition: `300ms ease-in-out`

### Vấn đề hiện tại
1. **Scale/opacity chỉ toggle sau scrollend** — không interpolate real-time → hiệu ứng giật
2. **CSS !important** trên transform/opacity — không thể override bằng inline style từ JS
3. **debounceScrollEnd 100ms** — có thể miss rapid scrolls

### Clone approach
- `cloneLast` prepend + `cloneFirst` append
- `scrollToIndex(centerIndex, 'instant')` khi chạm clone boundary
- Đang hoạt động tốt

## Files cần sửa
| File | Thay đổi |
|------|----------|
| `assets/js/carousel.js` | Thêm scroll interpolation logic, thay thế is-center toggle |
| `assets/css/carousel.css` | Bỏ `!important` trên scale/opacity, để JS control |
| `tests/visual/carousel-mobile.spec.js` | Cập nhật tests cho interpolation behavior |

## Tests hiện có
- 8 mobile tests: scroll-snap active, static position, 75% width, border-radius, smooth scroll, arrows hidden, dots, clones
- 4 desktop tests: absolute position, coverflow mode, 5 visible phones, viewport mode
- **Không có test cho interpolation behavior** (gap)
