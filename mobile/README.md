# AI Food Recommendation — Mobile UI Demo

Frontend Ionic Vue untuk demo antarmuka dan kebutuhan screenshot laporan tugas
akhir. Versi ini menggunakan data dummy lokal dan belum terhubung ke backend.

## Screenshot aplikasi

Galeri lengkap tampilan aplikasi, status pengembangan, dan dokumentasi proyek
tersedia pada [README utama](../README.md#tampilan-aplikasi).

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Buka URL yang ditampilkan Vite. Route utama aplikasi adalah `/app/home`.

## Pemeriksaan kualitas

```bash
npm run build
npm run lint
```

## Struktur utama

```text
src/
├── assets/       # Foto makanan, ilustrasi, dan ikon lokal
├── components/   # Komponen layout dan UI yang dapat digunakan ulang
├── mocks/        # Data dummy untuk demo
├── pages/        # Halaman aplikasi
├── router/       # Konfigurasi route
├── stores/       # State Pinia
├── theme/        # Token dan style global
└── types/        # Model domain TypeScript
```

Jangan menyimpan API key atau credential produksi di dalam frontend.
