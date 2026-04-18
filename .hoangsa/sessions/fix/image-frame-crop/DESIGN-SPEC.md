---
spec_version: "1.0"
project: "weekend-go-web"
component: "carousel_image_frame"
language: "HTML, CSS, TailwindCSS"
task_type: "fix"
category: "code"
status: "draft"
---

## Overview
[fix]: Bỏ khung cắt hình trong carousel, thay bằng blur fade-out ở viền

### Goal
Hình ảnh trong carousel hiển thị tràn viền (full-bleed), không padding, không border frame. Viền hình mờ dần (blur fade-out) thay vì bị cắt bởi border-radius.

### Context
Hiện tại hình ảnh carousel đang có `border: 3-5px solid #1d1d1f` + `border-radius: 1.75-2.75rem` + `box-shadow inset` tạo hiệu ứng "phone frame". User cảm nhận hình bị cắt trong khung, trông giống lỗi.

### Requirements
- [REQ-01] Bỏ hoàn toàn border, box-shadow trên `.phone-item img`
- [REQ-02] Bỏ border-radius trên `.phone-item img` ở tất cả breakpoints
- [REQ-03] Thêm hiệu ứng blur fade-out ở viền hình (gradient mask)
- [REQ-04] Hiệu ứng phải hoạt động trên cả desktop (CoverFlow 3D) và mobile (scroll-snap)
- [REQ-05] Không thay đổi logic JS carousel (scroll, snap, navigation, interpolation)
- [REQ-06] Không ảnh hưởng hình ảnh ngoài carousel

### Out of Scope
- Thay đổi JS carousel logic
- Thay đổi hình ảnh trong cards/hero/sections khác
- Thay đổi kích thước/layout tổng thể carousel

---

## Implementations

### Design Decisions
| # | Decision | Reasoning | Type |
|---|----------|-----------|------|
| 1 | Dùng `mask-image: linear-gradient()` cho fade-out | Performant, pure CSS, không cần pseudo-element phức tạp. `mask-image` được hỗ trợ tốt trên modern browsers | LOCKED |
| 2 | Bỏ hoàn toàn border + box-shadow | User yêu cầu rõ ràng: không khung | LOCKED |
| 3 | Giữ `background: #000` → đổi thành `transparent` | Không cần nền đen nữa khi bỏ frame | FLEXIBLE |
| 4 | Thêm subtle `drop-shadow` thay cho box-shadow | Giữ chiều sâu cho carousel items mà không tạo "frame" | FLEXIBLE |
| 5 | Fade gradient: 3% transparent top/bottom, 5% left/right | Tỷ lệ nhỏ để fade tự nhiên, không cắt quá nhiều nội dung | FLEXIBLE |

### CSS Changes

**Base rule — `assets/css/carousel.css` line 19-35:**

```css
/* BEFORE */
.phone-item img {
  width: 15rem;
  height: auto;
  border: 3px solid #1d1d1f;
  border-radius: 1.75rem;
  background: #000;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.35);
  image-rendering: -webkit-optimize-contrast;
  backface-visibility: hidden;
  transform: translateZ(0);
  filter:
    contrast(1.04)
    saturate(1.05)
    drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
}

/* AFTER */
.phone-item img {
  width: 15rem;
  height: auto;
  border: none;
  border-radius: 0;
  background: transparent;
  image-rendering: -webkit-optimize-contrast;
  backface-visibility: hidden;
  transform: translateZ(0);
  filter:
    contrast(1.04)
    saturate(1.05)
    drop-shadow(0 20px 40px rgba(0, 0, 0, 0.2));
  /* Blur fade-out at edges */
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%, black 3%,
    black 97%, transparent 100%
  ),
  linear-gradient(
    to right,
    transparent 0%, black 5%,
    black 95%, transparent 100%
  );
  -webkit-mask-composite: destination-in;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%, black 3%,
    black 97%, transparent 100%
  ),
  linear-gradient(
    to right,
    transparent 0%, black 5%,
    black 95%, transparent 100%
  );
  mask-composite: intersect;
}
```

**Mobile override — line 68-71:**

```css
/* BEFORE */
.phone-item img {
  width: 100%;
  border-radius: 20px;
}

/* AFTER */
.phone-item img {
  width: 100%;
  border-radius: 0;
}
```

**Tablet override — line 74-79:**

```css
/* BEFORE */
.phone-item img {
  width: 14rem;
  border-width: 4px;
  border-radius: 2.25rem;
}

/* AFTER */
.phone-item img {
  width: 14rem;
}
```

**Desktop override — line 81-86:**

```css
/* BEFORE */
.phone-item img {
  width: 18rem;
  border-width: 5px;
  border-radius: 2.75rem;
}

/* AFTER */
.phone-item img {
  width: 18rem;
}
```

### Affected Files

| File | Action | Description | Impact |
|------|--------|-------------|--------|
| `assets/css/carousel.css` | MODIFY | Bỏ border/border-radius/box-shadow, thêm mask-image fade | d=1 — trực tiếp ảnh hưởng visual |

---

## Open Questions
- Tỷ lệ fade gradient (3%/5%) có thể cần điều chỉnh sau khi xem thực tế

## Constraints
- Phải hoạt động trên Safari (cần `-webkit-mask-image` prefix)
- Không ảnh hưởng 3D transform của CoverFlow desktop mode
- `mask-composite: intersect` cần fallback `-webkit-mask-composite: destination-in` cho Safari

---

## Acceptance Criteria

### Per-Requirement
| Req | Verification | Expected Result |
|-----|-------------|----------------|
| REQ-01 | Inspect `.phone-item img` trong DevTools | `border: none`, không `box-shadow` |
| REQ-02 | Inspect ở mobile/tablet/desktop breakpoints | `border-radius: 0` ở tất cả |
| REQ-03 | Visual check — hình ảnh có viền mờ dần | Hình rõ ở giữa, fade-out ở 4 cạnh |
| REQ-04 | Test trên desktop (CoverFlow) + mobile (scroll-snap) | Cả hai mode đều hiển thị đúng |
| REQ-05 | Swipe, click arrows, autoplay | Tất cả navigation hoạt động bình thường |
| REQ-06 | Kiểm tra hình ảnh ngoài carousel | Không bị ảnh hưởng |

### Overall
1. Mở trang trên desktop — carousel CoverFlow 3D, hình không có frame, viền fade
2. Resize về mobile — carousel scroll-snap, hình không có frame, viền fade
3. Swipe/click arrows — navigation hoạt động bình thường
4. Inspect CSS — không còn border/border-radius/box-shadow trên `.phone-item img`
