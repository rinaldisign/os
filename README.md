# Sketchbook Tools

Landing page carousel kartu 3D (three.js + WebGL2), tema kertas putih bersketsa.

## Edit konten
Buka `content.js`, ubah / tambah objek di array `cards`
(`name`, `photo`, `threads`, `description`). Foto taruh di folder `assets/`.

## Jalankan lokal
Karena memakai ES module, buka lewat server lokal (bukan dobel klik file):

    python3 -m http.server 8000   # lalu buka http://localhost:8000

## Deploy ke GitHub Pages
1. Buat repo baru, upload semua isi folder ini (index.html di root repo).
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Tunggu ±1 menit, situs aktif di `https://username.github.io/nama-repo/`.

Three.js (r170) sudah disertakan di `vendor/`, jadi tidak butuh build step.
Font Caveat & Patrick Hand dimuat dari Google Fonts (ada fallback jika offline).
