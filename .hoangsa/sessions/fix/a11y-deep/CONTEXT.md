# Context: A11y deep dive (Theme 4)

## Task Type
fix (a11y violations + dead code that confuses users + maintainers)

## Language
vi

## Spec Language
vi

## Tech Stack
HTML5 / TailwindCSS 3 / Vanilla JS

## User Input
> "làm hết các tác vụ trên" — Theme 4 từ AUDIT-REPORT

## Source
`.hoangsa/sessions/chore/audit-full-codebase/AUDIT-REPORT.md` — Theme 4: Accessibility deep dive

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Carousel: skip autoplay nếu `prefers-reduced-motion: reduce`; add visible pause/play toggle button | WCAG 2.2.2 (Pause, Stop, Hide) Level A; vestibular accessibility | LOCKED |
| 2 | Skip-link: text "Bỏ qua đến nội dung", target `#main`; CSS dùng utility `sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 ...` | Pattern chuẩn Tailwind | LOCKED |
| 3 | Dead social FB/IG: replace `<a href="#!">` với `<span role="img" aria-label="Facebook (sắp ra mắt)">` (giữ icon, mất focus) | Đơn giản, không cần tooltip; user expectation: icon ≠ link nếu coming soon | LOCKED |
| 4 | `phone-transition` CSS class dead → giữ JS inline `transition` (timing constant 600ms ở 1 nơi), DELETE class trong `src/input.css` + 7 elements `class="... phone-transition"` | Single source of truth = JS | LOCKED |
| 5 | KHÔNG đụng visible buttons / colors khác | Out of scope — chỉ a11y critical | LOCKED |

## Out of Scope
- Audit a11y khác (form labels, link text "click here") — không có form, không có link "click here" trong site
- Color contrast khác ngoài footer (Theme 1 đã cover)
- Carousel button aria-label (Theme 1 đã cover REQ-08)
- Theme 2 partials affecting visit hierarchy
