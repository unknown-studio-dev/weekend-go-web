# Research: CSS scroll-snap carousel refactor

## Current state (after fix/carousel-mobile-responsive T-01..T-07)

### carousel.js (290 lines)
- **Mobile mode**: JS transforms (translateX, scale, opacity) via `POSITIONS_MOBILE` array
- **Desktop mode**: JS transforms via `POSITIONS_DESKTOP` (5-phone coverflow)
- `getViewportMode()` switches between mobile/tablet/desktop
- Swipe handlers (touch events with direction lock + velocity)
- Dots builder/updater
- Resize handler (debounced 150ms)
- Autoplay (3s interval)

### carousel.css (92 lines)
- Mobile: `height: 360px`, `touch-action: pan-y`, img `width: 15rem`
- Desktop: `height: 580px`, img `width: 18rem`
- All `.phone-item` are `position: absolute; left: 50%; top: 50%`
- Dots styles, arrows hide on mobile, prefers-reduced-motion

### HTML (src/index.src.html, lines 699-852)
- `<div id="phone-carousel">` containing 8 `<div class="phone-item absolute">` wrapping `<img>`
- `<button id="carousel-prev">` and `<button id="carousel-next">` as sibling elements
- `<div id="carousel-dots">` (empty, populated by JS)

## Approach: dual-mode layout

### Mobile (<768px): CSS scroll-snap
- Container: `display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth;`
- Items: `position: static; flex: 0 0 auto; scroll-snap-align: center;`
- Item width: `~75%` of container → leaves ~12.5% peek per side
- Border-radius: 20px on img
- **No JS transforms on mobile** — native scroll handles everything
- Dots: track via `scrollend` event (or `IntersectionObserver` fallback for Safari < 17.4)
- Autoplay: `scrollTo()` with behavior smooth (300ms native)

### Desktop (≥768px): keep current JS transforms
- `position: absolute` + transforms unchanged
- Same `applyPositions()`, `goTo()`, `reorderDOM()`, etc.

### Infinite loop (mobile)
Technique: clone first and last items (like Slick/Swiper):
1. Prepend clone of last item, append clone of first item
2. Initially scroll to position 1 (first real item)
3. On `scrollend`, if scrolled to clone-of-last → instantly jump to real first item. If scrolled to clone-of-first → instantly jump to real last item.
4. Use `scrollTo({ behavior: 'instant' })` for jump (no animation)

### Key JS refactor areas
- `applyPositions()`: on mobile, skip transforms entirely → CSS handles layout
- Swipe handlers: on mobile, disable (native scroll handles swipe)
- `goTo()`: on mobile, use `carousel.scrollTo()` instead of transforms
- `reorderDOM()`: on mobile, skip (items in natural flow order)
- Resize handler: when crossing 768px boundary, toggle between modes

### Browser support
- `scroll-snap-type: x mandatory` — Baseline since 2019 (Safari 11+, Chrome 69+)
- `scrollend` event — Baseline March 2024 (Chrome 114, Firefox 109, Safari 17.4). Fallback: `IntersectionObserver`
- `scroll-behavior: smooth` — Baseline March 2022 (Safari 15.4+)
- `scrollTo({ behavior: 'instant' })` — Baseline Widely Available

## Impact
| File | Change level |
|------|-------------|
| assets/js/carousel.js | MAJOR — add mobile scroll-snap mode, conditional logic |
| assets/css/carousel.css | MAJOR — add flex/scroll-snap mobile styles, keep absolute desktop styles |
| src/index.src.html | MINOR — possibly add wrapper div for scroll container |
| index.html | REBUILD |
| tests/visual/carousel-mobile.spec.js | MAJOR — rewrite mobile tests for scroll-snap |
