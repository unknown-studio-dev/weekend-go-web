# Audit Report

**Project:** weekend-go-web (Cuối Tuần Đi Đâu — Landing Page)
**Date:** 2026-04-17
**Target:** Toàn bộ project
**Scope:** Full audit (9 dimensions)
**Depth:** Deep
**Tech Stack:** Vanilla HTML/CSS/JS + TailwindCSS v3.4.19 + Playwright visual tests

---

## Executive Summary

The weekend-go-web landing page is a small, well-structured static site with a custom carousel component as its centerpiece. The codebase is clean for its size but has several systemic issues that will compound as the project grows:

**Critical concerns:** (1) Carousel preview images ship as unoptimised PNG/JPEG totalling ~11 MB — the single biggest user-facing performance issue. (2) No CI/CD pipeline means all tests are manual-only, providing zero automated quality gate. (3) A stuck git worktree inside `assets/images/` pollutes the project with 2.2 MB of duplicate files.

**Structural patterns:** The carousel JS (`carousel.js`) concentrates all logic in ~260 lines of global-scope code with duplicated transform logic, magic values, and a god function (`applyPositions`) that handles layout, events, and state in one pass. The build system generates HTML and CSS from source templates, but the generated outputs are committed to git alongside the sources, creating a dual-source-of-truth problem. Developer tooling (linter, formatter, pre-commit hooks, CI) is entirely absent.

**Positive notes:** The site has a working CSP policy, proper image lazy loading for below-fold content, a solid SVG sprite system, and a Playwright visual regression test suite — a better foundation than most static sites at this stage.

### Health Score

| Dimension | Score | Issues |
|-----------|-------|--------|
| Architecture & Structure | :red_circle: | 11 findings |
| :arrow_right_hook: Overengineering | :green_circle: | 0 findings |
| :arrow_right_hook: Dead Code | :red_circle: | 3 findings |
| :arrow_right_hook: Bloated Files | :yellow_circle: | 1 finding |
| Code Quality | :red_circle: | 12 findings |
| :arrow_right_hook: Magic Values | :yellow_circle: | 3 findings |
| Security | :yellow_circle: | 6 findings |
| Performance | :red_circle: | 12 findings |
| Dependencies | :yellow_circle: | 4 findings |
| Tests | :red_circle: | 11 findings |
| Documentation | :red_circle: | 10 findings |
| Developer Experience | :red_circle: | 13 findings |
| Simplify Scan | :yellow_circle: | 8 findings |
| :arrow_right_hook: Standards Compliance | :green_circle: | 85% compliant |
| :arrow_right_hook: Clarity | :yellow_circle: | MEDIUM |
| :arrow_right_hook: Balance | :green_circle: | OK (one over-complex spot) |

---

## Critical & High Priority Issues

### PERF-001: Carousel images served as PNG/JPEG — ~11 MB total payload

- **Severity:** CRITICAL
- **Dimension:** Performance
- **Location:** `assets/images/preview-*.png`, `assets/images/preview-*.jpeg`
- **Evidence:**
  ```
  preview-user-profile.png    3.3 MB
  preview-newsfeed.png        2.6 MB
  preview-venue-detail.png    2.1 MB
  preview-plan-list.png       ~1.5 MB
  preview-create-post.png     ~1.2 MB
  preview-weekend-plan.png    ~0.8 MB
  preview-AI-review.png       ~0.5 MB
  preview-share-review.jpeg   ~0.3 MB
  Total: ~11 MB
  ```
  No WebP variants exist for any of these. The hero banner and app icons already have WebP equivalents (good), but the carousel images — the heaviest assets — do not.
- **Impact:** On a 4G connection (10 Mbps), the first 3 visible carousel images (~8 MB) take ~6s to paint. This is the single largest factor affecting LCP (Largest Contentful Paint) and overall page weight.
- **Suggested Fix:**
  ```bash
  # Convert all preview images to WebP
  for f in assets/images/preview-*.png assets/images/preview-*.jpeg; do
    cwebp -q 80 "$f" -o "${f%.*}.webp"
  done
  ```
  Then wrap each `<img>` in a `<picture>` with `<source type="image/webp">`, matching the pattern already used for hero banners.
- **Effort:** M

---

### TEST-009: No CI/CD pipeline — tests never run automatically

- **Severity:** CRITICAL
- **Dimension:** Tests / Developer Experience
- **Location:** `.github/workflows/` (missing)
- **Evidence:** No `.github/workflows/` directory exists. `playwright.config.js` contains `reuseExistingServer: !process.env.CI` suggesting CI was planned but never implemented. `package.json` has `test:visual` script but it is never invoked by automation.
- **Impact:** All test coverage is moot — broken code can ship without any quality gate. Visual regression snapshots drift undetected. The Playwright tests are effectively ornamental.
- **Suggested Fix:**
  Create `.github/workflows/test.yml`:
  ```yaml
  name: Tests
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 18 }
        - run: npm ci
        - run: npx playwright install --with-deps
        - run: npm run build
        - run: npm run test:visual
  ```
- **Effort:** M
- **Related:** DX-011

---

### ARCH-001: Stuck git worktree inside assets/images/

- **Severity:** CRITICAL
- **Dimension:** Architecture / DX
- **Location:** `assets/images/.claude/worktrees/strange-solomon/`
- **Evidence:** A full project copy (2.2 MB) exists at this path — a git worktree for branch `claude/strange-solomon` that was never pruned. The `.gitignore` excludes `.claude/` at root but NOT at nested paths.
- **Impact:** Risks being accidentally served as static files, pollutes asset directory, confuses build tooling and image optimization scripts.
- **Suggested Fix:**
  ```bash
  git worktree remove assets/images/.claude/worktrees/strange-solomon --force
  # Update .gitignore to cover nested .claude/ dirs:
  # Change `.claude/` to `**/.claude/`
  ```
- **Effort:** S
- **Related:** DX-002

---

### SEC-001: HTTP security headers missing — CSP only via meta tag

- **Severity:** HIGH
- **Dimension:** Security
- **Location:** `index.html:6`
- **Evidence:** `<meta http-equiv="Content-Security-Policy">` is the only security mechanism. No `vercel.json`, `_headers` file, or server config exists. Missing: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security. CSP via `<meta>` cannot set `frame-ancestors` (clickjacking protection).
- **Impact:** Page can be iframed by attackers (clickjacking). No MIME sniffing protection. No HSTS.
- **Suggested Fix:**
  Create `vercel.json` with headers:
  ```json
  {
    "headers": [{
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }]
  }
  ```
- **Effort:** S

---

### PERF-002: Layout thrash — offsetWidth read inside forEach that writes styles

- **Severity:** HIGH
- **Dimension:** Performance
- **Location:** `assets/js/carousel.js:82`
- **Evidence:**
  ```js
  items.forEach((phone, domIndex) => {
    const tx = Math.round(pos.txRatio * carousel.offsetWidth); // reads layout
    phone.style.transform = `...${tx}px...`; // writes style
  });
  ```
  Reading `offsetWidth` forces browser layout; doing it N times per item inside a write loop causes N forced reflows per animation frame.
- **Impact:** Each carousel transition triggers 8-10 sequential read-layout/write cycles. On low-end mobile this causes jank.
- **Suggested Fix:**
  ```js
  const carouselWidth = carousel.offsetWidth; // read once
  items.forEach((phone, domIndex) => {
    const tx = Math.round(pos.txRatio * carouselWidth);
    // ...
  });
  ```
- **Effort:** S

---

### PERF-003: querySelectorAll re-queried every applyPositions and goTo call

- **Severity:** HIGH
- **Dimension:** Performance
- **Location:** `assets/js/carousel.js:76, 115`
- **Evidence:** `carousel.querySelectorAll('.phone-item')` called at line 76 (applyPositions) and line 115 (goTo). Both run on every autoplay tick (3s), every user interaction, and every resize. Module-level `phones` array already holds all elements.
- **Impact:** Unnecessary DOM queries creating new NodeList objects every 3 seconds. Compounds with PERF-002 layout thrash.
- **Suggested Fix:** Use the existing `phones` array instead of re-querying. After `reorderDOM()`, update the phones reference or maintain a separate ordered array.
- **Effort:** S

---

### PERF-004: onclick closures re-created every applyPositions call

- **Severity:** HIGH
- **Dimension:** Performance
- **Location:** `assets/js/carousel.js:89-101`
- **Evidence:** `phone.onclick = () => { goPrev(); ... }` and `phone.onclick = () => { goNext(); ... }` assigned inside `forEach` of `applyPositions()`. Called every 3s by autoplay = ~2880 new closures/hour.
- **Impact:** Continuous allocation pressure. On long page stays, thousands of short-lived closures created and GC'd.
- **Suggested Fix:** Use event delegation on the carousel container:
  ```js
  carousel.addEventListener('click', e => {
    const item = e.target.closest('.phone-item');
    if (!item) return;
    const idx = [...carousel.children].indexOf(item);
    // navigate based on idx vs center
  });
  ```
- **Effort:** M

---

### SMELL-001: Duplicated transform string construction

- **Severity:** HIGH
- **Dimension:** Code Quality
- **Location:** `assets/js/carousel.js:83, 122`
- **Evidence:** Identical template literal `translate(-50%, -50%) translateX(${tx}px) translateZ(${pos.translateZ}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)` appears in both `applyPositions` and `goTo`.
- **Impact:** Any transform change must be updated in two places. Divergence risk.
- **Suggested Fix:** Extract a helper:
  ```js
  function buildTransform(pos, width) {
    const tx = Math.round(pos.txRatio * width);
    return `translate(-50%, -50%) translateX(${tx}px) translateZ(${pos.translateZ}px) scale(${pos.scale}) rotateY(${pos.rotateY}deg)`;
  }
  ```
- **Effort:** S

---

### SMELL-002: applyPositions is a god function

- **Severity:** HIGH
- **Dimension:** Code Quality
- **Location:** `assets/js/carousel.js:75-106`
- **Evidence:** Single function handles: CSS transforms, transition strings, opacity, zIndex, pointerEvents, cursor, onclick event wiring, AND dataset state writes. 32 lines mixing 3+ concerns.
- **Impact:** Cannot re-style without re-wiring click handlers. Resize calls re-wire all events unnecessarily.
- **Suggested Fix:** Split into: `applyTransforms(transition)` for CSS, event delegation (one-time setup), and `exposeState()` for dataset writes.
- **Effort:** M

---

### SMELL-003: goTo duplicates applyPositions logic

- **Severity:** HIGH
- **Dimension:** Code Quality
- **Location:** `assets/js/carousel.js:108-134`
- **Evidence:** `goTo()` manually iterates items, calls `getPosition`, builds the same transform string, sets opacity and zIndex — all steps that `applyPositions` already does. Only difference is the from-index offset.
- **Impact:** Two separate code paths compute positions; a bug fix in one silently diverges from the other.
- **Suggested Fix:** Introduce `applyPhysicalPos(phone, pos, transition)` used by both functions.
- **Effort:** M

---

### SMELL-004: Module-level throw crashes entire page if carousel missing

- **Severity:** HIGH
- **Dimension:** Code Quality
- **Location:** `assets/js/carousel.js:37`
- **Evidence:**
  ```js
  if (!carousel) throw new Error('Carousel element #phone-carousel not found');
  ```
  Executed at parse/eval time. On pages without `#phone-carousel`, this crashes all JS including `menu.js`.
- **Impact:** If carousel section is ever removed or script is shared across pages, mobile menu and copyright year (menu.js) will fail.
- **Suggested Fix:** Replace with soft exit: `if (!carousel) { console.warn('Carousel not found'); return; }` wrapped in IIFE.
- **Effort:** S

---

### ARCH-002: Three unused breakpoint constants polluting global scope

- **Severity:** HIGH
- **Dimension:** Architecture
- **Location:** `assets/js/carousel.js:2-4`
- **Evidence:** `BREAKPOINT_XS (480)`, `BREAKPOINT_SM (640)`, `BREAKPOINT_MD (768)` defined but never referenced. Only `BREAKPOINT_LG (1024)` is used.
- **Impact:** Dead constants + no IIFE = global window pollution. Implies multi-breakpoint logic that doesn't exist.
- **Suggested Fix:** Delete the 3 unused constants.
- **Effort:** S

---

### ARCH-005: Tests reference removed features (dots, translateZ, vh heights)

- **Severity:** HIGH
- **Dimension:** Architecture / Tests
- **Location:** `tests/visual/carousel-mobile.spec.js:22-28, 104-112, 194-205, 276-280`
- **Evidence:** Tests assert `#carousel-dots .carousel-dot` (removed), `translateZ(150px)` (actual: 0), `min-height` containing `'vh'` (actual: fixed px), and `data-viewport-mode === 'coverflow'` on mobile (actual: 'scale-center' at <1024px).
- **Impact:** Tests silently fail or skip, giving false confidence. Documents a design that no longer exists.
- **Suggested Fix:** Delete dots tests, fix translateZ assertion to `0`, fix vh assertion to px, fix viewport mode assertion.
- **Effort:** M
- **Related:** SMELL-013, SMELL-014, SMELL-015, SMELL-016

---

### DX-002: .gitignore only covers root .claude/

- **Severity:** HIGH
- **Dimension:** Developer Experience
- **Location:** `.gitignore:7`
- **Evidence:** Entry is `.claude/` (top-level only). The stuck worktree at `assets/images/.claude/` is NOT matched.
- **Impact:** Future worktrees in subdirectories will not be gitignored.
- **Suggested Fix:** Change `.claude/` to `**/.claude/` in .gitignore.
- **Effort:** S

---

### DX-005: dev script has no HTTP server — no live-reload

- **Severity:** HIGH
- **Dimension:** Developer Experience
- **Location:** `package.json:11`
- **Evidence:** `"dev": "npm run build:html && npm run dev:css"` — builds HTML once, watches CSS only, no server.
- **Impact:** Developer must manually open files or run a separate server. No auto-reload on changes.
- **Suggested Fix:** Add concurrently or npm-run-all to run CSS watch + HTML watch + serve in parallel.
- **Effort:** M

---

### TEST-005: No swipe/touch tests despite complex touch logic

- **Severity:** HIGH
- **Dimension:** Tests
- **Location:** `assets/js/carousel.js:162-199`
- **Evidence:** `handleTouchStart`, `handleTouchMove`, `handleTouchEnd` implement deadzone, velocity flick, direction-lock, and threshold logic. No spec covers any touch event.
- **Impact:** Swipe regressions invisible to the test suite.
- **Suggested Fix:** Add touch interaction tests using Playwright's touchscreen API.
- **Effort:** M

---

### TEST-010: No accessibility tests

- **Severity:** HIGH
- **Dimension:** Tests
- **Location:** `tests/visual/`
- **Evidence:** No keyboard navigation, ARIA role, or focus management tests. `menu.js` toggles visibility without updating `aria-expanded`.
- **Impact:** Accessibility regressions invisible. Fails WCAG 2.1 SC 4.1.2.
- **Suggested Fix:** Add a11y tests with axe-playwright + manual keyboard checks.
- **Effort:** L

---

### DOC-001: README omits the build system entirely

- **Severity:** HIGH
- **Dimension:** Documentation
- **Location:** `README.md`
- **Evidence:** README says "No build step — static files only" and "Open index.html in a browser." Project now has TailwindCSS build, `build-html.js`, `src/*.src.html` templates, and npm scripts. README is stale and misleading.
- **Impact:** New contributors edit `index.html` directly (gets overwritten on build) or open files without running `npm install`/`npm run build`, seeing broken pages.
- **Suggested Fix:** Update README with: prerequisites, `npm install`, `npm run dev`, `npm run build`, test instructions.
- **Effort:** S
- **Related:** DOC-002, DX-007

---

## Medium Priority Issues

### SEC-002: APK served from public GitHub releases URL
- **Location:** `index.html:222`
- **Impact:** If repo is compromised, users download malicious APK with no integrity check.
- **Suggested Fix:** Distribute via Google Play Store or host on own CDN with SHA-256 hash.
- **Effort:** M

### SEC-003: CSP allows 'unsafe-inline' for styles
- **Location:** `index.html:6`
- **Impact:** Weakens protection against CSS-based data exfiltration. Other pages correctly omit it.
- **Suggested Fix:** Remove `'unsafe-inline'` from `style-src`. JS-driven `element.style` mutations are not blocked by this directive.
- **Effort:** S

### PERF-005: Forced synchronous layout via void carousel.offsetHeight
- **Location:** `assets/js/carousel.js:127`
- **Suggested Fix:** Replace with double rAF: `requestAnimationFrame(() => requestAnimationFrame(() => applyPositions(true)));`
- **Effort:** M

### PERF-006: Resize handler calls reorderDOM unconditionally
- **Location:** `assets/js/carousel.js:215-217`
- **Suggested Fix:** Only re-render if viewport mode or carousel width actually changed.
- **Effort:** S

### PERF-007: Google Play badge has loading='lazy' in above-fold hero
- **Location:** `index.html:229`
- **Suggested Fix:** Remove `loading='lazy'` from hero badge image.
- **Effort:** S

### PERF-008: will-change applied to ALL carousel items permanently
- **Location:** `assets/css/carousel.css:17`
- **Impact:** 8 items promoted to compositor layers = ~4 MB GPU texture memory continuously.
- **Suggested Fix:** Apply `will-change` only during active animation via a CSS class toggled by JS.
- **Effort:** M

### SMELL-006: Magic strings 'coverflow' / 'scale-center' scattered
- **Location:** `assets/js/carousel.js:46, 50, 94, 105`
- **Suggested Fix:** Define constants: `const MODE_COVERFLOW = 'coverflow'; const MODE_SCALE_CENTER = 'scale-center';`
- **Effort:** S

### SMELL-007: Hardcoded cubic-bezier easing string duplicated
- **Location:** `assets/js/carousel.js:80-81`
- **Suggested Fix:** Extract: `const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';`
- **Effort:** S

### SMELL-008: Inline onclick assignment inside layout loop (Feature Envy)
- **Location:** `assets/js/carousel.js:90-101`
- **Suggested Fix:** Use event delegation (see PERF-004).
- **Effort:** M

### SMELL-017: Hardcoded APK download URL with pinned version
- **Location:** `index.html:222, 931`
- **Impact:** Every Android release requires manual HTML edit in 2 places. Build script already supports `{{APK_VERSION}}`.
- **Suggested Fix:** Use `{{APK_VERSION}}` placeholder in `src/index.src.html`.
- **Effort:** S

### ARCH-003: Dead branch in handleResize — if-block has no body action
- **Location:** `assets/js/carousel.js:208`
- **Suggested Fix:** Remove the if-block or add mode-change-specific logic.
- **Effort:** S

### ARCH-004: All carousel state is global — no IIFE or module wrapper
- **Location:** `assets/js/carousel.js:1`
- **Impact:** Any script can read/overwrite `centerIndex`, `animating`, etc.
- **Suggested Fix:** Wrap in IIFE or convert to ES module.
- **Effort:** S

### ARCH-006: Built HTML committed alongside source templates
- **Location:** `index.html`, `src/index.src.html`
- **Impact:** Dual source of truth. Edits to generated files overwritten on build.
- **Suggested Fix:** Add generated HTML files to `.gitignore`; generate in CI.
- **Effort:** M

### ARCH-007: Minified Tailwind output committed to git
- **Location:** `assets/css/styles.css`
- **Suggested Fix:** Add to `.gitignore`; build in CI.
- **Effort:** S

### DEP-001: TailwindCSS v3.4.19 — latest is v4.2.2
- **Location:** `package.json:33`
- **Suggested Fix:** Plan upgrade using `npx @tailwindcss/upgrade`.
- **Effort:** M

### DX-006: dev script doesn't watch HTML/partial changes
- **Location:** `package.json:11`
- **Suggested Fix:** Add nodemon/chokidar-cli watcher for `src/` and `partials/`.
- **Effort:** M

### DX-008: No linter configured
- **Suggested Fix:** Add ESLint with minimal config.
- **Effort:** M

### DX-009: No formatter configured
- **Suggested Fix:** Add Prettier.
- **Effort:** S

### DX-010: No pre-commit hooks
- **Suggested Fix:** Add husky + lint-staged.
- **Effort:** M

### TEST-002: Build script has no tests
- **Location:** `scripts/build-html.js`
- **Suggested Fix:** Add unit tests for partial inclusion, version injection, path traversal guard.
- **Effort:** M

### TEST-003: Flaky timing — waitForTimeout(3500) in autoplay test
- **Location:** `tests/visual/carousel-mobile.spec.js:247`
- **Suggested Fix:** Use Playwright clock API to deterministically advance time.
- **Effort:** M

### SIMP-003: Magic number 2 for center slot index
- **Location:** `assets/js/carousel.js:90`
- **Suggested Fix:** Derive from positions array: `const centerSlot = Math.floor(getPositions().length / 2);`
- **Effort:** S

### SIMP-005: goTo reorder has implicit ordering dependency
- **Location:** `assets/js/carousel.js:115`
- **Suggested Fix:** Add comment block documenting the contract; extract `snapToFromPosition` helper.
- **Effort:** M

### SIMP-015: 5-star rating repeated 15 times with no abstraction
- **Location:** `index.html:577-664`
- **Suggested Fix:** Extract `partials/five-stars.html` and use `@include`.
- **Effort:** S

### DOC-005: POSITIONS_DESKTOP magic numbers undocumented
- **Location:** `assets/js/carousel.js:23`
- **Suggested Fix:** Add block comment explaining slot positions, tuning rationale, and visual intent.
- **Effort:** S

### DOC-006: goTo animation mechanism undocumented
- **Location:** `assets/js/carousel.js:108`
- **Suggested Fix:** Add comment: "Force reflow for FLIP animation pattern."
- **Effort:** S

---

## Low Priority Issues

| ID | Title | Location | Effort | Suggested Fix |
|----|-------|----------|--------|---------------|
| SEC-004 | External links missing `rel="noreferrer"` | `index.html:211` | S | Add `rel="noopener noreferrer"` to TestFlight and APK links |
| SEC-005 | CSP missing `form-action` and `frame-src` | `index.html:6` | S | Add `form-action 'none'; frame-src 'none'` |
| SEC-006 | Build path traversal guard path-separator dependent | `build-html.js:17` | S | Normalise with `path.resolve()` before comparing |
| PERF-009 | CSS filter with drop-shadow on all items | `carousel.css:32` | S | Replace with `box-shadow` (cheaper GPU) |
| PERF-010 | Event listeners never removed (minor leak risk) | `carousel.js:256` | M | Expose `destroy()` function for cleanup |
| PERF-011 | carousel.css unminified (1.3 KB) | `carousel.css` | S | Include in Tailwind build or separate minify step |
| PERF-012 | company_logo.webp missing width/height (CLS) | `index.html:1030` | S | Add `width="16" height="16"` |
| SMELL-006 (dup) | Cubic-bezier easing duplicated | `carousel.js:80` | S | Extract constant |
| SMELL-010 | Duplicate dataset writes at init | `carousel.js:252` | S | Remove redundant lines 252-253 |
| SMELL-011 | Layout thrash via void offsetHeight | `carousel.js:127` | S | Use double rAF |
| SMELL-012 | menu.js missing aria-expanded state | `menu.js:1` | S | Add `aria-expanded` toggle |
| SMELL-018 | 5 star SVGs repeated 15 times | `index.html:577` | S | Extract partial |
| SMELL-019 | Feature cards repeated 6 times no template | `index.html:328` | M | Template in build script |
| ARCH-008 | Inline SVGs mixed with sprite system | `index.html:237` | M | Extract to `partials/icons.svg` symbols |
| ARCH-009 | nav-link CSS class defined but never used | `src/input.css:39` | S | Apply to nav or delete |
| ARCH-010 | Build strips ALL HTML comments | `build-html.js:32` | S | Document or preserve `<!--! -->` syntax |
| ARCH-011 | Tailwind `absolute` redundant on phone-items | `index.html:713` | S | Remove; carousel.css already sets it |
| DEP-002 | `serve` dependency unused | `package.json:32` | S | Remove or add `preview` script |
| DEP-003 | All versions use `^` ranges | `package.json` | S | Use `npm ci` in CI |
| DEP-004 | No explicit `!package-lock.json` in .gitignore | `.gitignore` | S | Add negation rule |
| TEST-001 | menu.js has zero test coverage | `menu.js` | S | Add menu toggle tests |
| TEST-004 | Click test uses waitForTimeout(500) | `carousel-mobile.spec.js:229` | S | Wait for data attribute change |
| TEST-006 | Tablet/wide viewports untested | `carousel-mobile.spec.js:12` | M | Add test blocks or document skip |
| TEST-007 | scale-center visible items assertion too loose | `carousel-mobile.spec.js:54` | S | Change `>=3` to `toBe(3)` |
| TEST-008 | No visual regression screenshots in carousel tests | `carousel-mobile.spec.js` | M | Add screenshot assertions |
| TEST-011 | Loose truthy assertion for snap-type | `carousel-mobile.spec.js:43` | S | Use `toContain` with array |
| DOC-002 | README has no testing instructions | `README.md` | S | Add Testing section |
| DOC-003 | No CONTRIBUTING guide | `README.md` | S | Add Contributing section |
| DOC-004 | Viewport mode inconsistency undocumented | `carousel.js:45` | S | Add comment explaining mode names |
| DOC-007 | Touch direction-lock algorithm unexplained | `carousel.js:162` | S | Add inline comment |
| DOC-009 | No JSDoc on any carousel function | `carousel.js` | M | Add JSDoc to main entry points |
| DOC-010 | {{APK_VERSION}} mechanism undocumented | `README.md` | S | Document in README |
| SIMP-004 | Direction inference uses intermediate -1/1 var | `carousel.js:94` | S | Use boolean `isLeft` |
| SIMP-006 | Inline transition string not extracted | `carousel.js:79` | S | Extract transition builder |
| SIMP-007 | Division guard uses magic 0.0001 | `carousel.js:177` | S | Add comment or use Infinity |
| SIMP-008 | dt=0 guard biases velocity to maximum | `carousel.js:190` | S | Clamp to `Math.max(dt, 16)` |
| SIMP-010 | carousel.css comment says 240px for 15rem | `carousel.css:21` | S | Make font-size assumption explicit |
| SIMP-011 | sm breakpoint shrinks image (counter-intuitive) | `carousel.css:39` | S | Add comment explaining intent |
| SIMP-012 | -webkit-optimize-contrast is deprecated | `carousel.css:29` | S | Remove or use `image-rendering: auto` |
| SIMP-014 | Hardcoded hex color instead of Tailwind token | `input.css:40` | S | Use `theme()` function |
| SIMP-016 | TestFlight URL on production page | `index.html:210` | S | Replace with App Store URL when available |
| DX-012 | Visual tests don't build before serving | `playwright.config.js:8` | S | Change webServer command to include build |
| DX-013 | No 'clean' script | `package.json` | S | Add `"clean": "rm -f ..."` script |

---

## Refactoring Roadmap

### Phase 1: Critical Fixes (do immediately)

| Priority | ID | Task | Effort |
|----------|----|------|--------|
| 1 | ARCH-001 + DX-002 | Remove stuck worktree, fix .gitignore pattern | S |
| 2 | PERF-001 | Convert carousel images to WebP + `<picture>` | M |
| 3 | TEST-009 | Set up GitHub Actions CI with build + test | M |

### Phase 2: High Priority (next sprint)

| Priority | ID | Task | Effort |
|----------|----|------|--------|
| 4 | PERF-002+003 | Cache offsetWidth and phones array, remove redundant querySelectorAll | S |
| 5 | SMELL-004 | Replace throw with soft guard + IIFE wrapper (fixes ARCH-004 too) | S |
| 6 | SMELL-001+003 | Extract `buildTransform` and `applyPhysicalPos` helpers | M |
| 7 | PERF-004 + SMELL-008 | Event delegation on carousel container | M |
| 8 | SEC-001 | Create vercel.json with security headers | S |
| 9 | ARCH-005 | Fix/remove stale test assertions | M |
| 10 | ARCH-002 | Delete unused breakpoint constants | S |
| 11 | DOC-001+002 | Update README with build system, test instructions | S |
| 12 | DX-005+006 | Improve dev script with server + HTML watcher | M |

### Phase 3: Medium Priority (planned work)

| Priority | ID | Task | Effort |
|----------|----|------|--------|
| 13 | DX-008+009+010 | Add ESLint + Prettier + husky pre-commit hooks | M |
| 14 | ARCH-006+007 | Gitignore generated files, build in CI | M |
| 15 | SMELL-002 | Refactor applyPositions into focused functions | M |
| 16 | TEST-005 | Add swipe/touch interaction tests | M |
| 17 | SMELL-006+007 | Extract magic strings and easing constants | S |
| 18 | PERF-008 | Scope will-change to animation-only via CSS class toggle | M |
| 19 | DEP-001 | Plan TailwindCSS v3 → v4 upgrade | M |
| 20 | SMELL-017 | Use {{APK_VERSION}} placeholder for APK URLs | S |

### Phase 4: Low Priority (opportunistic — fix when touching nearby code)

All LOW-severity findings (40 items) — fix when working in the relevant file. Key quick wins:
- Remove unused `nav-link` CSS class
- Add `rel="noopener noreferrer"` to external links
- Add `width/height` attributes to images
- Remove deprecated `-webkit-optimize-contrast`
- Add JSDoc to main carousel functions
- Extract star rating partial

---

## Dependency Audit Summary

| Package | Status | Current | Latest | Risk |
|---------|--------|---------|--------|------|
| tailwindcss | 2 majors behind | 3.4.19 | 4.2.2 | MEDIUM — v4 has breaking config changes |
| @playwright/test | up to date | 1.59.1 | 1.59.1 | LOW |
| serve | unused | 14.2.6 | 14.2.6 | LOW — not referenced in any script |

**npm audit:** 0 vulnerabilities (clean)

---

## Statistics

- Total files scanned: 15 source files + 4 config files
- Total issues found: 65 (after deduplication)
  - Critical: 3
  - High: 15
  - Medium: 22
  - Low: 25
- Estimated total refactoring effort: ~40-50 hours
- Most problematic files:
  1. `assets/js/carousel.js` — 25 findings
  2. `index.html` — 12 findings
  3. `tests/visual/carousel-mobile.spec.js` — 10 findings
  4. `package.json` / DX config — 8 findings
  5. `assets/css/carousel.css` — 5 findings
