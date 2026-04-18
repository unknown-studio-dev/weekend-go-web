# Research v2 — Mobile Carousel UX for Weekend-Go-Web

> Scope: inform the A/B/C responsive decision for the 5-phone 3D coverflow at `<480px`.
> Current design: 5 iPhone screenshots, CSS `rotateY + translateX + scale`, fixed `height: 440px`.
> Candidates: (A) 1 phone + swipe, (B) 3 phones (center + 2 peeks), (C) 5 phones with tighter spacing.
> Research date: April 2026.

---

## Executive summary

- **Choose option B (center phone + narrow peek of prev/next).** It is the single pattern that the industry (App Store, Instagram, Google Play) converges on for mobile carousels, and it is the only candidate that simultaneously (a) uncramps the layout at 390–430 px, (b) communicates "there are more items, swipe me," and (c) keeps a single primary focal point for thumb-driven interaction.
- Option A (pure single item) loses the swipe-affordance signal — Baymard/NN/g both flag that users frequently miss carousel content when no edge of the next slide is visible. Option C (keep 5) survives visually only below ~70 % scale per phone, which drops tap targets under 44 px and compounds the 3D-rotation motion-sickness risk.
- **Drop the 3D `rotateY` on mobile.** WCAG 2.3.3 and `prefers-reduced-motion` guidance explicitly call out 3D plane shifts as a vestibular trigger; a 2D scale + opacity peek reads as "coverflow-ish" without the rotational axis that triggers symptoms. Keep the rotateY on desktop, gate it behind `@media (prefers-reduced-motion: no-preference) and (min-width: 768px)`.
- **Fixed `height: 440px` is unsafe on iOS Safari** once the dynamic toolbar enters/leaves. Replace with an aspect-ratio-driven height on mobile and use `svh` (not `vh`) if any viewport-relative sizing is needed. Full `dvh` causes jank because it recomputes on every toolbar nudge.
- **Concrete numbers to adopt:** peek width 8–12 % of viewport per side; swipe distance threshold `max(25 px, 15 % of carousel width)`; velocity threshold ~0.3 px/ms; `touch-action: pan-y` on the track; passive `touchstart`/`touchmove`; dots visible but non-interactive (decorative progress only).

---

## 1. iOS Safari viewport quirks

**Evidence**

- MDN / Bram.us (Bramus) — "The Large, Small, and Dynamic Viewports": `svh` is the **smallest** viewport (toolbars assumed visible), `lvh` the **largest** (toolbars assumed retracted), `dvh` dynamically shifts between the two as Safari's URL bar animates in/out. All three reached **Baseline Widely Available in June 2025** (Chrome 108+, Firefox 101+, Safari 15.4+). (bram.us, MDN)
- WebKit bug **#261185** and Apple Developer Forum thread 803987 — on recent iOS, `100dvh` containers can leave a gap at the bottom of the screen when the toolbar retracts; `svh`/`dvh` sometimes report equal values when the tab bar is not visible. Still unresolved as of iOS 18/26 reports. (bugs.webkit.org, developer.apple.com)
- iifx.dev — "Using `dvh` triggers layout recalculation each time the browser toolbar changes size. For simple elements this is negligible, but applying it to complex layouts with many children can cause visible jank." Recommendation: default to `svh`; reserve `dvh` for hero sections that *must* fill to the bottom.
- MDN `VisualViewport` — `window.visualViewport.resize` fires reliably on toolbar show/hide on iOS Safari 13+, but **does not fire on virtual keyboard open** (an independent overlay layer, not a viewport change). Safari 15 "supports visual viewport but [is] useless" for keyboard cases per WICG issue #79.

**Synthesis for us**

Our `height: 440px` is stable (doesn't react to toolbar), which is *safe* but wastes space: on a 390 × 844 iPhone 15 the carousel consumes 52 % of the visible height when toolbars are shown. More importantly, any switch to viewport units must use `svh`, not `vh` or `dvh`. Recommendation: keep a **fixed pixel height but reduce** from 440 px → 360–380 px at `<480px`, driven by phone-screenshot aspect ratio (`aspect-ratio: 9/19.5` per phone card) × the visible peek math below. Do *not* chase the toolbar with `dvh` — the jitter is worse than the empty space.

---

## 2. Touch handling best practices

**Evidence**

- MDN — `touch-action: pan-y` "enables single-finger vertical panning gestures; may be combined with pan-x, pan-left, pan-right and/or pinch-zoom." Without it, the browser reserves both axes and any JS `preventDefault` on `touchmove` is required to claim horizontal — which is expensive and triggers passive-listener warnings.
- Chrome Developers — "Making touch scrolling fast by default": since Chrome 56 (and matched by Safari/WebKit), `touchstart`/`touchmove` listeners are **passive by default** on document-level targets. Calling `preventDefault()` inside a passive listener is a no-op and logs a console warning. You must either (a) pass `{passive: false}` explicitly when you need to preventDefault, or (b) use CSS `touch-action` to declare intent up-front.
- CSS-Tricks — "If you have a horizontal carousel consider applying `touch-action: pan-y pinch-zoom` to it so that the user can still scroll vertically and zoom as normal." This is the idiomatic pattern.
- @use-gesture docs — warn that `touch-action: pan-y` on an element can block "L-shaped" diagonal gestures (user starts horizontal then wants to scroll); the mitigation is directional lock in JS with a small deadzone (~10 px) before committing to the axis.

**Synthesis for us**

Apply `touch-action: pan-y` to the carousel **track only** (not parents, not children). Use passive listeners for `touchstart`/`touchmove` and *never* call `preventDefault` on touchmove from our JS — the CSS declaration is load-bearing. Implement a 10 px deadzone: if the first 10 px of movement is more vertical than horizontal, release the gesture back to the page scroll; otherwise, lock into horizontal. This is what Framer-motion, Swiper.js, and Embla all do internally.

---

## 3. Carousel UX patterns (2025–2026)

**Evidence**

- Nielsen Norman Group, *Carousels on Mobile Devices* — "Most people stop after viewing 3–4 different pages in the carousel … users should be able to reach the last item in the carousel in 3–4 steps." Five items = right at the limit. Also: "Not supporting [swipe] is completely unexpected and makes for a bad user experience."
- Baymard, *10 UX Requirements for Homepage Carousels* — carousels on mobile are discouraged by default. When used: "Indicators visible by default are essential to signal [the carousel's] availability," but Baymard warns **dots are too small as tap targets** on mobile — use them as progress *indicators*, not controls. Thumbnails of the actual content outperform abstract dots for discoverability.
- Smashing Magazine, *Usability Guidelines For Better Carousels UX* (Vitaly Friedman, 2022, still canonical) — key rules: show a **peek of the next item** to communicate "more exists," support swipe, avoid auto-advance on mobile, keep index 3–4 max.
- Mobbin glossary — documents "iTunes-cover-flow-style carousel with a large central element and two partial elements on the periphery" as a named pattern; most-used by App Store, Google Play, Netflix row previews.
- Slick Carousel docs — default swipe threshold `5 px` is too low; TinyGesture uses `max(25 px, 15 % viewport)` which is what modern carousels converge on. Glide.js uses 80 ms velocity window + 0.3 px/ms flick threshold.

**Synthesis for us**

- "5 items is the upper end" from NN/g aligns with our 5 screenshots — so the *count* is OK, but the *simultaneous visibility* is not. Show 1 main + partial peeks = still 5 items in the deck, just 3 visible.
- Swipe threshold: adopt **max(25 px, 15 % of carousel width)** ≈ 60 px on a 400 px viewport. Plus velocity flick at 0.3 px/ms so a quick flick counts even under the distance threshold.
- Dots: keep them visible as *progress indicator only* (decorative, `aria-hidden` is wrong — use `role="tablist"` or just text `2 / 5`). Do not make them the primary nav on mobile per Baymard.

---

## 4. Thumb zones / reachability

**Evidence**

- Steven Hoober (Smashing Magazine, *Designing For Mobile Users*, updated 2024–2025 data via Medium/Heyflow syntheses) — analyzed 1,300+ users in the wild. **75 % navigate primarily with thumbs; 49 % operate one-handed.** Three zones: Easy (bottom-center), Stretch (top-center, bottom-edges), Hard (top-corners, far side). Hoober 2025 thumb-zone heat maps for 6.7"+ phones show the *entire top third* is in the Hard zone for one-handed use.
- Heyflow / Webdesignerindia case studies — "conversion rate improvements of 35–55 % within 90 days" after moving CTAs and primary nav into the bottom thumb-easy zone.
- Parachute Design / Themeignite 2025 guides — for 390–430 px wide phones, the "comfortable arc" for the right thumb is roughly a 120 px radius from the bottom-right corner, spanning the bottom ~45 % of the screen.
- Material Design 3 — prev/next FABs at the horizontal middle of a carousel are *not* recommended for mobile; instead, swipe is the primary gesture and any buttons move to the bottom.

**Synthesis for us**

**Kill the side prev/next arrow buttons on mobile.** They sit at the vertical mid-line of the carousel (~220 px from the top of a 440 px-tall section) — this is *exactly* the Hard zone for one-handed thumbs on a 390 × 844 phone. If we keep controls at all, move them to a single pair of bottom-center dots/arrows below the carousel in the Easy zone. Better: remove arrow buttons entirely on `<480px` and rely on swipe + decorative dots.

---

## 5. Peek/preview pattern for single-phone mobile carousel

**Evidence**

- Smashing Magazine — "peek of the next slide's design element can encourage the initial swipe. This technique leverages psychology — when a user sees half an image, their brain wants to see the rest, subconsciously prompting the swipe action."
- Baymard mobile e-commerce research — product image galleries that show the edge of the next image (~10–15 % peek) **significantly reduce** the "users thought there was only one image" failure mode vs. pure single-item galleries.
- Contentstudio / Stackinfluence Instagram 2026 guides — Instagram carousels average 0.55 % engagement/post, highest of any format. A major factor cited: "if a user doesn't interact with your carousel the first time, the algorithm may show it to them again but this time … displays the second image." The peek on the edge is what prompts the first swipe.
- iOS App Store screenshots row — canonical example: 1 primary screenshot ~85 % width, 7.5 % peek on each side, snap-to-center on release. No 3D rotation. This is Apple's own HIG-endorsed pattern.
- Google Play — similar: full screenshot + ~8 % peek, no rotation, dots below, no side arrows.

**Synthesis for us**

Option B wins on direct evidence: *every* major surface showing app screenshots (App Store, Google Play, Product Hunt, Microsoft Store) uses the "1 hero + edge peek" pattern, not pure coverflow on mobile. Concrete numbers: center phone **~72–78 % of viewport width**, peek slices **8–12 % per side** showing the adjacent phone at ~60 % opacity and 85 % scale. No rotateY on the peeks.

---

## 6. Coverflow accessibility concerns

**Evidence**

- MDN, `@media (prefers-reduced-motion)` — "Users indicate they prefer an interface that removes or replaces the types of motion-based animation that trigger discomfort for those with vestibular motion disorders." Query values: `reduce` (user has opted in) vs `no-preference`.
- WCAG 2.1 SC 2.3.3 (Animation from Interactions, AAA) — "Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed." 3D card flips and plane shifts are explicitly named in the W3C technique examples.
- a11y-101 / Educational Voice / CSS-Tricks — "Examples of excessive motion can include: mouse-triggered scaling, **3D zoom**, blur, parallax effects, variable speed scrolling, **plane-shifted scrolling**, and flashing content." rotateY coverflow hits *two* of those (3D + plane shift).
- Webflow blog — estimates 35 % of users over 40 experience some degree of motion sensitivity; 3 % have diagnosed vestibular disorders (~10M people in the US alone).
- Addy Osmani, *Cover Flow with Modern CSS: Scroll-Driven Animations* (2024) — his own demo explicitly guards the rotation behind `@media (prefers-reduced-motion: no-preference)` and falls back to a flat scroll-snap carousel.

**Synthesis for us**

The `rotateY` rotation is the single highest-risk element of the current design for vestibular users, and it is *not* essential to the information conveyed (the phones would read just as clearly in 2D). Required: wrap the rotateY transforms in `@media (prefers-reduced-motion: no-preference)`. Recommended: *on mobile*, drop the rotateY entirely regardless of preference — smaller screens mean the rotation's arc subtends a larger angle of visual field, worsening the vestibular trigger, and the space cost on a 390 px viewport is severe.

---

## Recommendation for our case

**Adopt option B (center + 2 peeks) with these specifics, replacing option C's tight-5:**

| Aspect | Desktop (≥768 px) | Tablet (480–767 px) | Mobile (<480 px) |
|---|---|---|---|
| Phones visible | 5 (current) | 3 | 1 centered + 2 edge peeks |
| Center phone width | ~22 % viewport | ~40 % viewport | **72–78 % viewport** |
| Peek width per side | n/a (full siblings) | ~15 % (partial) | **8–12 %** |
| Peek opacity / scale | 1.0 / 1.0 → 0.9 | 0.7 / 0.88 | **0.55 / 0.82** |
| `rotateY` on peeks | ±45° / ±25° (current) | ±15° | **0° (flat, no 3D)** |
| Carousel height | current (440 px) | 400 px | **360 px fixed px, not `vh`** |
| Prev/next arrow buttons | visible sides | visible sides | **hidden — swipe only** |
| Dots indicator | hidden | 5 dots, below | **5 dots, below, decorative** |
| Swipe threshold (distance) | n/a | 60 px | **max(25 px, 15 % carousel width)** |
| Swipe threshold (velocity) | n/a | 0.3 px/ms flick | **0.3 px/ms flick** |
| `touch-action` | default | `pan-y` on track | **`pan-y` on track** |
| Passive listeners | — | yes | **yes, never `preventDefault`** |
| Motion guard | `@media (prefers-reduced-motion: no-preference)` around rotateY | same | **rotateY off regardless** |
| Viewport units | `vh` OK | `svh` for any viewport sizing | **`svh` only (never `dvh`/`vh`)** |

**Why not A (single phone only):** Loses the "more exists" affordance. Users commonly think the single screenshot is *the* screenshot. Baymard data confirms this misread.

**Why not C (keep 5 tight):** Requires scaling each phone below ~70 % to fit five across 390 px — drops tap targets below the 44 × 44 px WCAG/HIG minimum and intensifies the 3D rotation vestibular load at a higher per-pixel angular velocity. Also collides with NN/g's 3–4 swipe rule as a visual-complexity cognitive-load proxy.

**Option B delivers:** industry convention (App Store, Play Store, Instagram), proven affordance for swipe via edge peek, thumb-friendly (no side buttons), vestibular-friendly (flat peeks), viewport-safe (fixed px height below 480 px), WCAG-compliant swipe targets (center phone 280–310 px wide).

---

## Sources

1. Bramus, "The Large, Small, and Dynamic Viewports" — https://www.bram.us/2021/07/08/the-large-small-and-dynamic-viewports/
2. MDN, `VisualViewport` — https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
3. WebKit bug 261185 — https://bugs.webkit.org/show_bug.cgi?id=261185
4. Apple Developer Forum, iOS Safari dvh issue — https://developer.apple.com/forums/thread/803987
5. iifx.dev, "Fixing iOS Safari's Shifting UI with dvh" — https://iifx.dev/en/articles/460170745/fixing-ios-safari-s-shifting-ui-with-dvh
6. MDN, `touch-action` — https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
7. Chrome for Developers, "Making touch scrolling fast by default" — https://developer.chrome.com/blog/scrolling-intervention
8. CSS-Tricks, `touch-action` almanac — https://css-tricks.com/almanac/properties/t/touch-action/
9. @use-gesture, L-shape gestures discussion — https://github.com/pmndrs/use-gesture/discussions/640
10. Nielsen Norman Group, *Carousels on Mobile Devices* — https://www.nngroup.com/articles/mobile-carousels/
11. Nielsen Norman Group, *Designing Effective Carousels* — https://www.nngroup.com/articles/designing-effective-carousels/
12. Baymard, *10 UX Requirements for Homepage Carousels* — https://baymard.com/blog/homepage-carousel
13. Baymard, *State of Mobile E-Commerce Search and Navigation* — https://baymard.com/blog/mobile-ecommerce-search-and-navigation
14. Baymard, *Always Use Thumbnails to Represent Additional Product Images* — https://baymard.com/blog/always-use-thumbnails-additional-images
15. Smashing Magazine (Vitaly Friedman), *Usability Guidelines For Better Carousels UX* — https://www.smashingmagazine.com/2022/04/designing-better-carousel-ux/
16. Mobbin, Carousel UI glossary — https://mobbin.com/glossary/carousel
17. Glide.js swipe docs — https://glidejs.com/docs/components/swipe/
18. TinyGesture library — https://github.com/sciactive/tinygesture
19. Steven Hoober via Smashing Magazine, *The Thumb Zone: Designing For Mobile Users* — https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/
20. Medium / Bootcamp, *The Thumb Zone UX in 2025* — https://medium.com/design-bootcamp/the-thumb-zone-ux-in-2025-why-your-mobile-app-needs-to-rethink-ergonomics-now-9d1828f42bd9
21. Heyflow, *Mastering the Thumb Zone* — https://heyflow.com/blog/mastering-the-thumb-zone/
22. Parachute Design, *Mastering the Thumb Zone* — https://parachutedesign.ca/blog/thumb-zone-ux/
23. MDN, `prefers-reduced-motion` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
24. CSS-Tricks, `prefers-reduced-motion` almanac — https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/
25. a11y-101, Reduced motion — https://a11y-101.com/development/reduced-motion
26. Webflow Blog, Motion and accessibility — https://webflow.com/blog/motion-and-accessibility
27. Addy Osmani, *Cover Flow with Modern CSS* — https://addyosmani.com/blog/coverflow/
28. Contentstudio, *Instagram carousel 2025 guide* — https://contentstudio.io/blog/instagram-carousel
29. AdSpyder, *Instagram Carousel Ads 2026* — https://adspyder.io/blog/instagram-carousel-ads/
30. WICG visual-viewport issue #79 (Safari 15) — https://github.com/WICG/visual-viewport/issues/79
