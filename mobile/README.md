# AI Food Recommendation — Mobile

Frontend Ionic Vue untuk AI Food Recommendation System. Alur registrasi, login,
pengaturan profil, tampilan profil, dan edit profil telah terhubung ke REST API.
Halaman rekomendasi harian telah terhubung ke recommendation engine dan detail
menu rekomendasi telah memakai API katalog. Pencarian serta pemilihan menu
pengganti juga telah menggunakan endpoint alternatif dan hasilnya disimpan
sebagai snapshot SQLite melalui backend. Service riwayat sudah tersedia;
feedback pada detail menu juga sudah persisten. Panel Penjelasan AI tersedia
pada detail rekomendasi dan dibuat sesuai permintaan pengguna melalui backend.
Beranda masih menggunakan data demo lokal selama proses integrasi bertahap.

## Screenshot aplikasi

Galeri lengkap tampilan aplikasi, status pengembangan, dan dokumentasi proyek
tersedia pada [README utama](../README.md#tampilan-aplikasi).

## Menjalankan aplikasi

```bash
npm install
cp .env.example .env
npm run dev
```

Pastikan backend berjalan pada `http://localhost:3000`, lalu buka URL yang
ditampilkan Vite. URL API dapat diubah melalui:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Untuk target Android/iOS, gunakan alamat backend yang dapat dijangkau perangkat,
bukan `localhost`. Setelah menambah atau memperbarui plugin Capacitor, jalankan
`npx cap sync`.

Access token disimpan melalui Capacitor Preferences jika pengguna memilih
`Ingat saya`. Tanpa pilihan tersebut, token hanya disimpan selama aplikasi
masih berjalan.

## Alur yang terhubung

- Registrasi email dan kata sandi
- Login serta pemulihan sesi
- Route guard untuk halaman pengguna dan tamu
- Pembuatan, pembacaan, dan pembaruan profil pengguna
- Rekomendasi harian untuk tanggal lokal pengguna dengan empat slot makan
- Ringkasan tujuh hari dengan 28 menu unik dan akses ke detail setiap tanggal
- Detail menu API berisi bahan, porsi, seluruh nilai gizi, tag, dan alergen
- Alasan rekomendasi, target slot, dan rincian komponen skor
- Penjelasan AI berbasis snapshot rekomendasi dengan loading, error, dan retry
- Pencarian alternatif aman per slot, pilihan batch berikutnya tanpa
  pengulangan, dan penggantian menu
- Asisten penggantian AI dengan input bahasa alami dan chip filter sementara
- Persistensi penggantian serta service riwayat rekomendasi
- Feedback suka, tidak suka, dan konsumsi yang tersimpan di backend
- Penanganan khusus ketika tidak tersedia kombinasi menu yang aman
- Penanganan loading, kesalahan API, sesi kedaluwarsa, dan profil yang belum ada
- Sinkronisasi profil API ke halaman yang masih memakai store demo

## Pemeriksaan kualitas

```bash
npm run build
npm run lint
npm run test:unit -- --run
```

Pengujian end-to-end memerlukan backend dan frontend yang sedang berjalan:

```bash
npm run test:e2e
```

## Struktur utama

```text
src/
├── assets/       # Foto makanan, ilustrasi, dan ikon lokal
├── components/   # Komponen layout dan UI yang dapat digunakan ulang
├── mocks/        # Data dummy untuk demo
├── pages/        # Halaman aplikasi
├── router/       # Konfigurasi route
├── services/     # API client dan penyimpanan sesi
├── stores/       # State Pinia autentikasi, profil, rekomendasi, dan demo transisi
├── theme/        # Token dan style global
└── types/        # Model domain TypeScript
```

Jangan menyimpan API key atau credential produksi di dalam frontend.
