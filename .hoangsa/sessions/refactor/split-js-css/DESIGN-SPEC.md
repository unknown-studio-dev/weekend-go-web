---
spec_version: "1.0"
project: "weekend-go-web"
component: "split-js-css"
language: "javascript"
task_type: "refactor"
category: "code"
status: "draft"
---

## Overview
[refactor]: Tách JS/CSS ra file riêng + quick wins cleanup

### Goal
Giảm kích thước index.html từ ~1507 dòng xuống ~1200 dòng bằng cách tách inline JS và CSS ra file riêng. Đồng thời fix các quick win issues từ audit.

### Context
Audit report phát hiện index.html là "God File" chứa tất cả: markup + CSS + JS. Refactoring này tách code theo concern: HTML markup riêng, CSS riêng, JS riêng.

### Requirements
- [REQ-01] Tách inline `<script>` (mobile menu + carousel) ra 2 file JS riêng
- [REQ-02] Tách inline `<style>` (carousel CSS) ra file CSS riêng
- [REQ-03] Đặt tên constants cho magic numbers trong carousel JS
- [REQ-04] Fix company_logo.jpeg — di chuyển vào assets/images/, đổi tên kebab-case, thêm alt text
- [REQ-05] Fix social links — xóa `javascript:void(0)`, thêm comment placeholder
- [REQ-06] Fix copyright year — dynamic bằng JS
- [REQ-07] Fix twitter:image — đổi `.png` sang `.webp` thống nhất với og:image
- [REQ-08] Behavior giữ nguyên 100% — không thay đổi gì về chức năng

### Out of Scope
- SVG sprite / dedup
- JS-render cho FAQ/feature cards
- Rebuild Tailwind

---

## Types / Data Models

Không áp dụng — vanilla JS, không có types mới.

## Interfaces / APIs

### File structure sau refactor:
```
assets/
  css/
    styles.css          (giữ nguyên — Tailwind compiled)
    carousel.css        (MỚI — carousel custom styles)
  js/
    menu.js             (MỚI — mobile menu toggle)
    carousel.js         (MỚI — CoverFlow carousel logic)
  images/
    company-logo.jpeg   (MỚI — moved + renamed)
```

### Constants trong carousel.js:
```javascript
// Breakpoints (match Tailwind)
const BREAKPOINT_XS = 480;
const BREAKPOINT_SM = 640;
const BREAKPOINT_LG = 1024;

// Spread scale factors per breakpoint
const SPREAD_XS = 0.38;
const SPREAD_SM = 0.5;
const SPREAD_LG = 0.7;
const SPREAD_DEFAULT = 1.0;

// Animation
const ANIMATION_DURATION_MS = 600;
const AUTOPLAY_INTERVAL_MS = 3000;
```

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | 2 file JS (menu.js + carousel.js) thay vì 1 | Separation of concerns — menu logic independent of carousel | LOCKED |
| 2 | `<script>` tags đặt cuối body với `defer` | Giữ behavior hiện tại — DOM ready khi script chạy | LOCKED |
| 3 | Không dùng ES modules | Project nhỏ, static site, không cần bundler | FLEXIBLE |

### Affected Files
| File | Action | Description |
|------|--------|-------------|
| `index.html` | MODIFY | Xóa inline script + style, thêm link/script tags, fix quick wins |
| `assets/js/menu.js` | CREATE | Mobile menu toggle logic (~15 dòng) |
| `assets/js/carousel.js` | CREATE | CoverFlow carousel logic (~120 dòng) |
| `assets/css/carousel.css` | CREATE | Carousel custom styles (~20 dòng) |
| `assets/images/company-logo.jpeg` | CREATE | Moved from root `company_logo.jpeg` |
| `company_logo.jpeg` | DELETE | Moved to assets/images/ |

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | `ls assets/js/menu.js assets/js/carousel.js` | Cả 2 file tồn tại |
| REQ-02 | `ls assets/css/carousel.css` | File tồn tại |
| REQ-03 | `grep -c 'BREAKPOINT_' assets/js/carousel.js` | >= 3 |
| REQ-04 | `grep 'company-logo' index.html` + `ls assets/images/company-logo.jpeg` | Path đúng + file tồn tại |
| REQ-05 | `grep -c 'javascript:void' index.html` | 0 |
| REQ-06 | `grep 'getFullYear' index.html` hoặc `grep 'getFullYear' assets/js/menu.js` | Có |
| REQ-07 | `grep 'twitter:image.*\.webp' index.html` | Có |
| REQ-08 | Mở browser — carousel, menu, links hoạt động bình thường | Visual check |

### Overall
```bash
cd weekend-go-web && \
  test -f assets/js/menu.js && \
  test -f assets/js/carousel.js && \
  test -f assets/css/carousel.css && \
  test $(grep -c '<script>' index.html) -eq 0 && \
  test $(grep -c 'javascript:void' index.html) -eq 0 && \
  echo "ALL PASS"
```
