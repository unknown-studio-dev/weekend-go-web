---
tests_version: "1.0"
spec_ref: "quick_wins-spec-v1.0"
component: "quick_wins"
category: "code"
strategy: "smoke"
language: "html-tailwindcss-js"
---

## Pre-flight Checks
- [ ] Branch up to date
- [ ] No uncommitted changes blocking quick-wins file paths

## Integration Tests (grep + functional)

### REQ-01 — h4 mismatched closers fixed
- **Command**: `grep -cE '<h3[^>]*>[^<]*</h4>' terms.html privacy.html community-standards.html | awk -F: '{s+=$2} END {print s}'`
- **Expected**: `0`

### REQ-02 — .gitignore extended
- **Command**: `for p in 'node_modules/' '.env' '.hoangsa/' '.claude/'; do grep -qF "$p" .gitignore || { echo "MISSING: $p"; exit 1; }; done && echo OK`
- **Expected**: prints `OK`, exit 0

### REQ-03 — inline style block removed from index.html
- **Command**: `grep -c '^[[:space:]]*<style>' index.html`
- **Expected**: `0`

### REQ-04 — mailto links use utility classes
- **Command**: `grep -cE 'text-\[#22c55e\][[:space:]]+hover:text-\[#166534\]' terms.html privacy.html community-standards.html | awk -F: '{s+=$2} END {print s}'`
- **Expected**: `0`
- **Bonus**: `grep -c 'text-primary hover:text-primary-dark' terms.html privacy.html community-standards.html | awk -F: '{s+=$2} END {print s}'` → `4`

### REQ-05 — text-gray-500 contrast fixed
- **Command**: `grep -c 'text-xs text-gray-500 mb-2' index.html`
- **Expected**: `0`

### REQ-06 — carousel.js totalPositions inlined
- **Command**: `grep -q 'const totalPositions = total;' assets/js/carousel.js && ! grep -q 'VISIBLE_POSITIONS\.length + (total - VISIBLE_POSITIONS\.length)' assets/js/carousel.js`
- **Expected**: exit 0

### REQ-07 — startAutoPlay guards autoTimer
- **Command**: `awk '/function startAutoPlay/,/^}/' assets/js/carousel.js | grep -q 'clearInterval(autoTimer)'`
- **Expected**: exit 0

### REQ-08 — carousel buttons accessible
- **Command**: `grep -c 'aria-label="Ảnh trước"' index.html` → `1`; `grep -c 'aria-label="Ảnh tiếp"' index.html` → `1`
- **Bonus**: 2 carousel SVGs have `aria-hidden="true"` near button context

### REQ-09 — index.html OG meta uses .png
- **Command**: `grep -E '(og:image|twitter:image)' index.html | grep -c '.png' && grep -E '(og:image|twitter:image)' index.html | grep -c '.webp'`
- **Expected**: first count ≥ 2, second count = 0

## Visual Checklist (manual)
- [ ] 3 legal pages render without HTML validation errors
- [ ] Footer "Một sản phẩm của" text visible (gray-400 contrast)
- [ ] Carousel autoplay still rotates every 3s
- [ ] Tab through page → screen reader announces "Ảnh trước/Ảnh tiếp" cho 2 button carousel
- [ ] Mailto links có màu xanh `#22c55e`, hover xanh đậm

## Edge Cases
| Scenario | How | Expected |
|----------|-----|----------|
| node_modules đã exist trước khi gitignore | `git status` | node_modules không xuất hiện trong "untracked" |
| Carousel tab-hide rồi unhide nhanh | DevTools → Network throttle + tab switch | Không bị 2 timers (autoTimer guard hoạt động) |
| Social share preview | Facebook debugger / Twitter card validator | Show `.png` 1200×630 fallback, không lỗi WebP |

## Regression
- [ ] Build script `npm run build` vẫn chạy OK
- [ ] `assets/css/styles.css` không cần rebuild (chỉ HTML/JS thay đổi)
- [ ] No JS console errors
