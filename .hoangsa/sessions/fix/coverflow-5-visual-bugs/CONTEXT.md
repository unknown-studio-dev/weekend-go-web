# Context: Fix 5 CoverFlow visual bugs

## Task Type
fix

## Language
vi

## Tech Stack
HTML, CSS, JavaScript (Vanilla), TailwindCSS

## User Input
Fix 5 bugs: buttons vị trí, center quá lớn, spacing sai, tràn header, bỏ dots.

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Buttons top-1/2 -translate-y-1/2 | Vertical centering standard | LOCKED |
| 2 | Bỏ translateZ cho tất cả items, center scale 1.0 | Tránh perspective magnification | LOCKED |
| 3 | Equal spacing (không Apple-style) | User yêu cầu rõ ràng | LOCKED |
| 4 | Fixed height thay vh | Controllable, proven | LOCKED |
| 5 | Xoá dots hoàn toàn | User request | LOCKED |

## Out of Scope
- Không thay đổi click sides, hover pause, swipe, autoplay
- Không thay đổi rotateY angles
- Không thay đổi image order
