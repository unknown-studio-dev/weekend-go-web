# Context: Tách JS/CSS ra file riêng + cleanup

## Task Type
refactor

## Language
vi

## Spec Language
vi

## Tech Stack
HTML, CSS, JavaScript (vanilla), TailwindCSS

## User Input
Refactoring task từ audit findings ARCH-001, ARCH-004, QUAL-002, QUAL-003, QUAL-004, SIMP-003, SIMP-004

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Tách inline JS ra assets/js/carousel.js + assets/js/menu.js | ARCH-001: God File 1507 dòng | LOCKED |
| 2 | Tách inline `<style>` ra assets/css/carousel.css | ARCH-004: CSS giữa HTML | LOCKED |
| 3 | Constants cho magic numbers trong carousel | QUAL-002: Hardcoded breakpoints | LOCKED |
| 4 | Fix quick wins: company_logo, social links, copyright, twitter:image | Phase 1 audit findings | LOCKED |

## Out of Scope
- SVG sprite (Phase 3)
- JS-render cho FAQ/feature cards (Phase 3-4)
- Rebuild Tailwind CSS
