# Context: Tối ưu responsive mobile cho carousel "Xem trước ứng dụng"

## Task Type
fix

## Language
vi

## Spec Language
vi

## Tech Stack
HTML / Tailwind CSS / Vanilla JavaScript

## User Input
> Tối ưu cho respon mobile chỗ này cái (kèm screenshot iPhone ~390px width show section "Xem trước ứng dụng")

## Observations từ screenshot
- Section: "Xem trước ứng dụng" (carousel coverflow 7 phones, 5 visible)
- Trên mobile (~390px viewport):
  - 5 phones hiển thị chen chúc trong không gian hẹp
  - 2 side phones (±230px * spread) và 2 far-side phones (±420px * spread) bị thu nhỏ nhiều, không rõ nội dung
  - Center phone tuy là focus nhưng vẫn nhỏ so với màn hình
- Nút Prev/Next overlay ở 2 bên — vẫn tap được

## Discussion Log

### [Q1] Task type
- Chosen: fix (sửa lỗi responsive)

### [Q2] Số phone hiển thị trên mobile
- Options: 3 phones / 1 phone full width / giữ 5 phones
- Chosen: **1 phone (full width)** — chỉ hiện center, swipe/nhấn để đổi
- Reason: Đơn giản, tận dụng màn hình, center phone to rõ

### [Q3] Center phone size trên mobile
- Options: ~192px (giữ nguyên) / ~240px (to hơn) / flexible clamp
- Chosen: **~240px** (w-60)
- Reason: Thấy rõ màn hình app hơn, vẫn đủ margin 2 bên

### [Q4] Nút Prev/Next
- Chosen: **Giữ nút overlay** (co nhỏ, sát cạnh)
- Reason: User quen UX này

### [Q5] Breakpoint chuyển 1→3→5 phones
- Chosen: **< 480px = 1, 480-768 = 3, ≥ 768 = 5**
- Reason: 3 tầng mượt hơn — mobile nhỏ / tablet nhỏ / desktop

### [Q6] Swipe gesture
- Chosen: **Có swipe** (touchstart/touchend → goNext/goPrev)
- Reason: Native mobile UX

### [Q7] Branching
- Chosen: Giữ nguyên `refactor/split-js-css-carousel`
- Reason: Task overlap trực tiếp với refactor carousel đang làm, gộp commit hợp lý

## Decisions Made (v2 — updated after RESEARCH-v2.md)

Previous v1 decisions superseded based on research findings (App Store/Play Store convention, WCAG 2.3.3, NN/g carousel research, Baymard, thumb zone analysis).

| # | Decision | Reason | Type |
|---|----------|--------|------|
| 1 | Mobile `<480px`: **1 phone center + 2 peeks (8-12% per side)** | App Store/Instagram convention; Baymard — peek prompts swipe affordance | LOCKED |
| 2 | Mobile center phone: **72-78% viewport width** (~280-310px on 390px screen) | WCAG 44px tap target + industry benchmark | LOCKED |
| 3 | Mobile peek: opacity 0.55, scale 0.82, **rotateY 0° (flat)** | Vestibular safety — WCAG 2.3.3 plane shift trigger | LOCKED |
| 4 | Breakpoints: `<480` (1+peek), `480-767` (3), `≥768` (5) | Layered responsive | LOCKED |
| 5 | Tablet (480-767): 3 phones, opacity 0.7/scale 0.88, rotateY ±15° | Softer than desktop, safer vestibular | LOCKED |
| 6 | Desktop (≥768): giữ nguyên 5 phones + rotateY ±45/25° | Đủ không gian, không đổi | LOCKED |
| 7 | **Ẩn nút Prev/Next trên mobile** (<480px) | Side arrows ở mid-line = Hard zone thumb (Hoober data) | LOCKED |
| 8 | **Thêm 5 dots decorative** dưới carousel (không interactive trên mobile) | Baymard: dots quá nhỏ cho tap, dùng làm progress indicator | LOCKED |
| 9 | Swipe threshold: **max(25px, 15% carousel width) + velocity 0.3 px/ms flick** | TinyGesture/Glide.js convention, industry standard | LOCKED |
| 10 | `touch-action: pan-y` trên track, passive listeners, **không preventDefault** | Chrome passive intervention; MDN/CSS-Tricks best practice | LOCKED |
| 11 | Directional lock 10px deadzone (L-shape gesture fix) | Framer-motion/Swiper pattern | LOCKED |
| 12 | Carousel height mobile: **360px fixed** (không `vh`/`dvh`, `svh` nếu cần) | iOS Safari dynamic toolbar jitter; WebKit bug 261185 | LOCKED |
| 13 | Wrap rotateY desktop/tablet trong `@media (prefers-reduced-motion: no-preference)` | WCAG 2.3.3 AAA | LOCKED |
| 14 | Work on existing branch `refactor/split-js-css-carousel` | Overlap với refactor | LOCKED |

## Out of Scope
- Không thay đổi cơ chế autoplay
- Không redesign header/text "Xem trước ứng dụng"
- Không thay ảnh phone
- Không làm snap-to-center với CSS scroll-snap (dùng JS transform như hiện tại — đủ tốt)
- Không support keyboard arrow navigation (out of scope cho fix này, follow-up task nếu cần a11y đầy đủ)
