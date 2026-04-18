# Context: Fix 3 carousel visual bugs

## Task Type
fix

## Language
vi

## Spec Language
vi

## Tech Stack
HTML, CSS, JavaScript (Vanilla), TailwindCSS

## User Input
Fix 3 bugs phát hiện từ visual review sau khi refactor carousel:
1. Mobile Scale Center — side items chồng lên center item (txRatio quá nhỏ)
2. Desktop CoverFlow — spacing đều thay vì Apple-style (compressed sides)
3. Prev/Next buttons — parent div thiếu `relative`, buttons bị float

## Discussion Log
Không cần deep-dive — bugs đã phân tích từ screenshots trong conversation trước.

## Decisions Made
| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Tăng Scale Center txRatio từ ±0.18 → ±0.30 | Side items cần tách xa center hơn để không overlap | FLEXIBLE |
| 2 | Desktop CoverFlow: ±1 txRatio 0.20→0.30, ±2 txRatio 0.37→0.38 | Apple-style: big center gap, compressed sides | FLEXIBLE |
| 3 | Thêm `relative` class cho parent div wrapping buttons + carousel | Buttons `absolute` cần relative parent | LOCKED |

## Out of Scope
- Không thay đổi autoplay, swipe, dots behavior
- Không thay đổi image order
- Không thay đổi test file (values flexible, sẽ test visual)
