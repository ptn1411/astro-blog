# Hướng dẫn build WASM cho browser

## Bước 1: Chạy lệnh build (PowerShell)

```powershell
cd C:\Users\NAM\Code\rust\ai-security-project\wasm-security
$env:APP_SECRET="fe8ecad6f6f7c2e84822686b012f2f16"
wasm-pack build --target web --out-dir pkg-web --release
```

## Bước 2: Copy output vào astro-blog/public/wasm

```powershell
New-Item -ItemType Directory -Force "C:\Users\NAM\Code\rust\astro-blog\public\wasm"
Copy-Item "pkg-web\wasm_security_bg.wasm" "C:\Users\NAM\Code\rust\astro-blog\public\wasm\"
Copy-Item "pkg-web\wasm_security.js"      "C:\Users\NAM\Code\rust\astro-blog\public\wasm\"
```

## Hoặc chạy cả 2 bước cùng lúc:

```powershell
cd C:\Users\NAM\Code\rust\ai-security-project\wasm-security; $env:APP_SECRET="fe8ecad6f6f7c2e84822686b012f2f16"; wasm-pack build --target web --out-dir pkg-web --release; New-Item -ItemType Directory -Force "C:\Users\NAM\Code\rust\astro-blog\public\wasm"; Copy-Item "pkg-web\wasm_security_bg.wasm" "C:\Users\NAM\Code\rust\astro-blog\public\wasm\"; Copy-Item "pkg-web\wasm_security.js" "C:\Users\NAM\Code\rust\astro-blog\public\wasm\"
```
