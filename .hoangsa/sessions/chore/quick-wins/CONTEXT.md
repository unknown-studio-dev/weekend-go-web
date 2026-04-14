# Context: Quick wins từ AUDIT-REPORT (Theme 1)

## Task Type
chore (cleanup batch — 9 micro-fixes ≤ 30 min mỗi cái)

## Language
vi

## Spec Language
vi

## Tech Stack
HTML5 / TailwindCSS 3 / Vanilla JS

## User Input
> "làm hết các tác vụ trên" (5 themes từ AUDIT-REPORT, batch theo theme)

## Source
`.hoangsa/sessions/chore/audit-full-codebase/AUDIT-REPORT.md` — Theme 1: Quick wins

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Bundle 9 fixes vào 1 spec / 1 commit | Tất cả ≤ 30 min, không có dependencies giữa các fix; 1 PR cleanup gọn | LOCKED |
| 2 | Đổi `text-[#22c55e] hover:text-[#166534]` → `text-primary hover:text-primary-dark` ở 4 mailto links | Loại bỏ inline hex, dùng theme token (CQ-004) | LOCKED |
| 3 | Đổi `text-gray-500` → `text-gray-400` (KHÔNG dùng -300) | -400 đã pass WCAG AA và đã được dùng nhất quán ở footer (consistency) | LOCKED |
| 4 | Standardize OG image về `.png` (KHÔNG `.webp`) | Index hiện dùng `.webp` nhưng Facebook crawler historically thiếu hỗ trợ webp; PNG safer cho social sharing | LOCKED |
| 5 | Skip-link / partial extraction / CSP / a11y carousel motion → defer sang theme khác | Quá lớn cho "quick win" | LOCKED |

## Out of Scope
- HTML partials extraction (Theme 2)
- Carousel a11y (prefers-reduced-motion, pause button) → Theme 4
- Dead `phone-transition` CSS class → Theme 4
- Self-host Inter font, CSP headers → Theme 5
- Delete unused PNGs → Theme 5
- Tailwind v4 migration → Theme 6 (backlog)
