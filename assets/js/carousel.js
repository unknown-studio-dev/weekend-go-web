// CoverFlow Carousel — wrapped in IIFE to avoid global scope pollution
(function () {
  'use strict';

  // Breakpoint
  const BREAKPOINT_LG = 1024;

  // Animation
  const ANIMATION_DURATION_MS = 600;
  const AUTOPLAY_INTERVAL_MS = 3000;
  const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // Swipe tuning
  const SWIPE_DISTANCE_MIN_PX = 25;
  const SWIPE_DISTANCE_RATIO = 0.15; // 15% of carousel width
  const SWIPE_VELOCITY_FLICK = 0.3; // px/ms
  const SWIPE_DEADZONE_PX = 10;
  const SWIPE_LOCK_RATIO = 1.2; // |dx|/|dy| threshold for horizontal lock

  // Viewport modes
  const MODE_COVERFLOW = 'coverflow';
  const MODE_SCALE_CENTER = 'scale-center';

  // Hidden slot config
  const HIDDEN = { scale: 0.5, rotateY: 0, txRatio: 0, translateZ: 0, opacity: 0, zIndex: 0 };

  // POSITIONS arrays — indexed by DOM slot 0..N
  // txRatio = translateX as fraction of carousel.offsetWidth (responsive)
  // Desktop: 5 visible slots (-2, -1, center, +1, +2)
  const POSITIONS_DESKTOP = [
    { scale: 0.5, rotateY: 80, txRatio: -0.4, translateZ: 0, opacity: 0.3, zIndex: 2 },
    { scale: 0.7, rotateY: 60, txRatio: -0.23, translateZ: 0, opacity: 0.6, zIndex: 5 },
    { scale: 1.0, rotateY: 0, txRatio: 0, translateZ: 0, opacity: 1.0, zIndex: 10 },
    { scale: 0.7, rotateY: -60, txRatio: 0.23, translateZ: 0, opacity: 0.6, zIndex: 5 },
    { scale: 0.5, rotateY: -80, txRatio: 0.4, translateZ: 0, opacity: 0.3, zIndex: 2 },
  ];

  // Mobile: 3 visible slots (-1, center, +1)
  const POSITIONS_MOBILE = [
    { scale: 0.75, rotateY: 45, txRatio: -0.28, translateZ: 0, opacity: 0.6, zIndex: 5 },
    { scale: 1.0, rotateY: 0, txRatio: 0, translateZ: 0, opacity: 1.0, zIndex: 10 },
    { scale: 0.75, rotateY: -45, txRatio: 0.28, translateZ: 0, opacity: 0.6, zIndex: 5 },
  ];

  const carousel = document.getElementById('phone-carousel');
  if (!carousel) return; // soft guard — skip init if carousel element is absent

  const phones = Array.from(carousel.querySelectorAll('.phone-item'));
  const total = phones.length;
  let centerIndex = 0;
  let animating = false;
  let autoTimer;

  /** @returns {'coverflow'|'scale-center'} Current viewport mode based on window width */
  function getViewportMode() {
    return window.innerWidth >= BREAKPOINT_LG ? MODE_COVERFLOW : MODE_SCALE_CENTER;
  }

  /** @returns {Array<Object>} Position array for the current viewport mode */
  function getPositions() {
    return getViewportMode() === MODE_COVERFLOW ? POSITIONS_DESKTOP : POSITIONS_MOBILE;
  }

  /**
   * Get position config for a DOM slot index.
   * @param {number} domIndex - Index in the current DOM order (0..N)
   * @returns {Object} Position config with scale, rotateY, txRatio, etc. Returns HIDDEN for overflow items.
   */
  function getPosition(domIndex) {
    const positions = getPositions();
    return domIndex < positions.length ? positions[domIndex] : HIDDEN;
  }

  /** Build the CSS transform string for a given position and carousel width */
  function buildTransform(pos, carouselWidth) {
    const tx = Math.round(pos.txRatio * carouselWidth);
    return `translate(-50%, -50%) translateX(${tx}px) translateZ(${pos.translateZ}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`;
  }

  /** Build the CSS transition string */
  function buildTransition() {
    return `transform ${ANIMATION_DURATION_MS}ms ${EASING}, opacity ${ANIMATION_DURATION_MS}ms ${EASING}`;
  }

  /** Reorder DOM children so the 5 visible slots (center ± 2) come first, hidden items after. */
  function reorderDOM() {
    // Place 5 visible items (center ± 2) + remaining hidden
    const order = [];
    const visible = new Set();
    for (let i = -2; i <= 2; i++) {
      const idx = (centerIndex + i + total) % total;
      order.push(idx);
      visible.add(idx);
    }
    for (let i = 0; i < total; i++) {
      if (!visible.has(i)) order.push(i);
    }
    order.forEach((idx) => carousel.appendChild(phones[idx]));
  }

  /**
   * Apply CSS transforms, opacity, and pointer-events to all carousel items.
   * @param {boolean} transition - If true, animate with CSS transitions; if false, snap instantly.
   */
  function applyPositions(transition) {
    const carouselWidth = carousel.offsetWidth; // read once to avoid layout thrash
    const items = Array.from(carousel.children);
    const centerSlot = Math.floor(getPositions().length / 2);

    items.forEach((phone, domIndex) => {
      const pos = getPosition(domIndex);
      phone.style.transition = transition ? buildTransition() : 'none';
      phone.style.transform = buildTransform(pos, carouselWidth);
      phone.style.opacity = pos.opacity;
      phone.style.zIndex = pos.zIndex;

      // pointer-events + cursor based on visibility/position
      if (pos.opacity === 0) {
        phone.style.pointerEvents = 'none';
        phone.style.cursor = 'default';
      } else if (domIndex !== centerSlot) {
        phone.style.pointerEvents = 'auto';
        phone.style.cursor = 'pointer';
      } else {
        phone.style.pointerEvents = 'auto';
        phone.style.cursor = 'default';
      }
    });

    // Expose state for tests
    carousel.dataset.centerIndex = String(centerIndex);
    carousel.dataset.viewportMode = getViewportMode();
  }

  /**
   * Navigate to a new center item with FLIP animation.
   * Sets items to their "from" positions instantly, forces reflow, then animates to final positions.
   * @param {number} newCenter - Index in the phones array to become the new center
   * @param {number} direction - 1 for next (right), -1 for prev (left)
   */
  function goTo(newCenter, direction) {
    if (animating || newCenter === centerIndex) return;
    animating = true;
    centerIndex = newCenter;

    reorderDOM();

    const carouselWidth = carousel.offsetWidth; // read once
    const items = Array.from(carousel.children);
    const shift = direction === 1 ? 1 : -1;

    // Snap items to their "from" positions (no transition) for FLIP animation
    items.forEach((phone, domIndex) => {
      const fromIdx = Math.max(0, Math.min(items.length - 1, domIndex + shift));
      const fromPos = getPosition(fromIdx);
      phone.style.transition = 'none';
      phone.style.transform = buildTransform(fromPos, carouselWidth);
      phone.style.opacity = fromPos.opacity;
      phone.style.zIndex = getPosition(domIndex).zIndex;
    });

    // Force reflow to flush transition:none before re-enabling transitions (FLIP pattern)
    void carousel.offsetHeight;

    applyPositions(true);

    setTimeout(() => {
      animating = false;
    }, ANIMATION_DURATION_MS);
  }

  function goNext() {
    goTo((centerIndex + 1) % total, 1);
  }

  function goPrev() {
    goTo((centerIndex - 1 + total) % total, -1);
  }

  // Initial render
  reorderDOM();
  applyPositions(false);

  // Next / Prev buttons
  document.getElementById('carousel-next')?.addEventListener('click', () => {
    goNext();
    resetAutoPlay();
  });
  document.getElementById('carousel-prev')?.addEventListener('click', () => {
    goPrev();
    resetAutoPlay();
  });

  // Event delegation for side-item clicks (instead of per-item onclick)
  carousel.addEventListener('click', (e) => {
    const phone = e.target.closest('.phone-item');
    if (!phone) return;
    const items = Array.from(carousel.children);
    const domIndex = items.indexOf(phone);
    const centerSlot = Math.floor(getPositions().length / 2);
    if (domIndex < 0 || domIndex === centerSlot || getPosition(domIndex).opacity === 0) return;
    if (domIndex < centerSlot) goPrev();
    else goNext();
    resetAutoPlay();
  });

  // Swipe gestures (mobile + tablet)
  let touchStart = null;
  let touchLock = 'none';

  function handleTouchStart(e) {
    touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: performance.now(),
    };
    touchLock = 'none';
  }

  function handleTouchMove(e) {
    if (!touchStart || touchLock !== 'none') return;
    const dx = Math.abs(e.touches[0].clientX - touchStart.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.y);
    if (Math.max(dx, dy) < SWIPE_DEADZONE_PX) return;
    // Lock direction: horizontal if dx/dy ratio above threshold, else vertical (allow page scroll)
    // dy guard: prevent divide-by-zero; any small epsilon works since we compare ratio > threshold
    touchLock = dx / (dy || 0.0001) > SWIPE_LOCK_RATIO ? 'horizontal' : 'vertical';
  }

  function handleTouchEnd(e) {
    if (!touchStart) return;
    if (touchLock !== 'horizontal') {
      touchStart = null;
      touchLock = 'none';
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dt = performance.now() - touchStart.t;
    // Clamp dt to min 1 frame (16ms) to avoid inflated velocity on instant taps
    const velocity = Math.abs(dx) / Math.max(dt, 16);
    const threshold = Math.max(SWIPE_DISTANCE_MIN_PX, carousel.offsetWidth * SWIPE_DISTANCE_RATIO);
    const triggered = Math.abs(dx) >= threshold || velocity >= SWIPE_VELOCITY_FLICK;
    if (triggered) {
      if (dx < 0) goNext();
      else goPrev();
      resetAutoPlay();
    }
    touchStart = null;
    touchLock = 'none';
  }

  carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
  carousel.addEventListener('touchmove', handleTouchMove, { passive: true });
  carousel.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Resize — debounced, only re-apply when viewport mode or width changes
  let lastViewportMode = getViewportMode();
  let lastWidth = carousel.offsetWidth;
  let resizeTimer = null;

  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const currentMode = getViewportMode();
      const currentWidth = carousel.offsetWidth;
      if (currentMode === lastViewportMode && Math.abs(currentWidth - lastWidth) < 2) return;
      lastViewportMode = currentMode;
      lastWidth = currentWidth;
      reorderDOM();
      applyPositions(false);
    }, 150);
  }
  window.addEventListener('resize', handleResize);

  // Autoplay (respect prefers-reduced-motion)
  const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isPaused = reducedMotionMQ.matches;

  function startAutoPlay() {
    if (autoTimer) clearInterval(autoTimer);
    if (isPaused) return;
    autoTimer = setInterval(goNext, AUTOPLAY_INTERVAL_MS);
  }
  function stopAutoPlay() {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }
  startAutoPlay();

  // Pause autoplay on hover
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', () => {
    if (!isPaused) startAutoPlay();
  });

  // Reduced-motion change listener
  reducedMotionMQ.addEventListener('change', (e) => {
    isPaused = e.matches;
    if (isPaused) stopAutoPlay();
    else startAutoPlay();
  });

  // Pause autoplay when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoPlay();
    else resetAutoPlay();
  });
})();
