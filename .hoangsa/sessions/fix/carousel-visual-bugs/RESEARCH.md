# Research: Carousel Visual Bugs

## Bugs đã phân tích

### Bug 1: Mobile Scale Center overlap
- File: `assets/js/carousel.js:31-37`
- txRatio ±0.18 → translateX = 67px trên 375px viewport
- Center item half-width = 120px → overlap 53px mỗi bên
- Fix: txRatio ±0.30 → translateX = 112px → gap 26px

### Bug 2: Desktop CoverFlow uniform spacing
- File: `assets/js/carousel.js:23-29`
- center→±1 = 0.20, ±1→±2 = 0.17 (ratio 1.18:1 — nearly equal)
- Apple-style cần ratio ≥3:1
- Fix: ±1 txRatio 0.30, ±2 txRatio 0.38 → ratio 3.75:1

### Bug 3: Button parent missing relative
- File: `index.html:699` — `<div>` wrapping buttons + carousel
- Buttons có class `absolute` nhưng parent thiếu `relative`
- Same issue in `src/index.src.html`

## Affected symbols
- `POSITIONS_SCALE_CENTER` — modify txRatio values
- `POSITIONS_DESKTOP` — modify txRatio + rotateY values
- HTML parent div — add class
