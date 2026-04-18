# Research: Download CTA center + scale

## Files liên quan
| File | Role |
|------|------|
| [src/index.src.html](../../../../src/index.src.html) | Source of truth, line 961-1011 = `#download` section |
| [index.html](../../../../index.html) | Built output (rebuild sau edit) |

## Trạng thái hiện tại

### HTML ([src/index.src.html:984-1009](../../../../src/index.src.html#L984))
```html
<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
  <a href="https://testflight.apple.com/join/abfrzXm7"
     class="inline-block hover:opacity-90 transition-opacity">
    <img src="assets/logos/app-store-badge-vi.svg"
         alt="Tải về từ App Store"
         width="144" height="48"
         loading="lazy"
         class="h-12 w-auto" />
  </a>
  <a href="...v{{APK_VERSION}}/release.apk"
     class="inline-block hover:opacity-90 transition-opacity">
    <img src="assets/logos/GetItOnGooglePlay_Badge_Web_color_Vietnamese.svg"
         alt="Tải ứng dụng trên Google Play"
         width="162" height="48"
         loading="lazy"
         class="h-12 w-auto" />
  </a>
</div>
```

## Root cause canh lệch trên mobile
Flex container dùng `flex-col` mặc định trên mobile. Trong flex-col:
- `justify-*` kiểm soát main-axis (trục DỌC) → không có tác dụng canh giữa ngang
- `items-*` kiểm soát cross-axis (trục NGANG) → default là `stretch`
- Hậu quả: `<a class="inline-block">` stretch full width của container (nguyên width của `.max-w-7xl` trừ padding), `<img>` bên trong align trái

## Fix minimal
Thêm `items-center` để cross-axis center → anchor không còn stretch, img nằm giữa.

## Prior art
- Cùng pattern ở hero section [src/index.src.html:208](../../../../src/index.src.html#L208): `<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">` — **KHÔNG** trong scope task này
- Sticky bottom banner [src/index.src.html](../../../../src/index.src.html): dùng flex horizontal — cũng không bị lỗi này

## Impact
- Chỉ 1 section bị đổi. Không ảnh hưởng component khác. Risk: minimal.
- Rebuild `index.html` cần thiết sau edit src.
