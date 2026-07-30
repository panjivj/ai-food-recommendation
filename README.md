# AI Food Recommendation

Prototipe aplikasi mobile rekomendasi makanan harian berdasarkan profil, target
kalori, dan preferensi pengguna. Aplikasi Ionic Vue telah terhubung ke backend
Express dan SQLite untuk autentikasi serta profil pengguna.

> [!NOTE]
> Registrasi, login, sesi, dan profil pengguna sudah terintegrasi dengan API.
> Backend katalog menu, perhitungan kalori, dan recommendation engine versi
> pertama sudah tersedia. Halaman rekomendasi harian dan detail menu Ionic
> sudah memakai API. Pencarian dan pemilihan menu pengganti juga sudah
> terintegrasi dan dipersistenkan sebagai snapshot SQLite yang mendukung
> riwayat. Feedback suka, tidak suka, dan konsumsi juga sudah persisten.
> Detail rekomendasi memiliki Penjelasan AI melalui OpenRouter; beranda masih
> memakai data dummy selama integrasi bertahap.

## Fitur aplikasi

- Login dan registrasi pengguna
- Pengaturan, tampilan, dan penyuntingan profil
- Beranda dengan ringkasan target kalori
- Rekomendasi menu harian
- Detail makanan dan informasi makronutrisi
- Pilihan alternatif dan penggantian menu
- Asisten AI untuk menerjemahkan permintaan penggantian menjadi filter bahan
- Rencana otomatis dan ringkasan menu tujuh hari tanpa pengulangan
- Feedback suka, tidak suka, dan sudah dikonsumsi
- Penjelasan AI sesuai profil, target, nilai gizi, dan skor rekomendasi
- Loading, empty, dan error state
- Navigasi mobile dengan bottom navigation

## Tampilan aplikasi

### Autentikasi

| Login | Registrasi |
| :---: | :---: |
| <img src="screenshoots/04-login.png" alt="Halaman login" width="260"> | <img src="screenshoots/05-register.png" alt="Halaman registrasi" width="260"> |

### Beranda dan rekomendasi

| Beranda | Rekomendasi harian |
| :---: | :---: |
| <img src="screenshoots/01-beranda.png" alt="Halaman beranda" width="260"> | <img src="screenshoots/07-rekomendasi-harian.png" alt="Halaman rekomendasi harian" width="260"> |

### Detail dan feedback menu

| Detail menu | Feedback suka |
| :---: | :---: |
| <img src="screenshoots/02-detail-menu.png" alt="Halaman detail menu" width="260"> | <img src="screenshoots/03-detail-menu-feedback-suka.png" alt="Feedback suka pada detail menu" width="260"> |

### Penggantian rekomendasi

| Pilihan alternatif | Setelah menu diganti |
| :---: | :---: |
| <img src="screenshoots/08-pilihan-alternatif-menu.png" alt="Pilihan alternatif menu" width="260"> | <img src="screenshoots/09-kondisi-setelah-menu-diganti.png" alt="Kondisi setelah menu diganti" width="260"> |

### Profil pengguna

| Pengaturan profil | Profil | Edit profil |
| :---: | :---: | :---: |
| <img src="screenshoots/06-pengaturan-profil.png" alt="Halaman pengaturan profil" width="230"> | <img src="screenshoots/10-profil.png" alt="Halaman profil" width="230"> | <img src="screenshoots/11-edit-profil.png" alt="Halaman edit profil" width="230"> |

### System states

| Loading | Empty | Error |
| :---: | :---: | :---: |
| <img src="screenshoots/12a-loading-state.png" alt="Loading state" width="230"> | <img src="screenshoots/12b-empty-state.png" alt="Empty state" width="230"> | <img src="screenshoots/12c-error-state.png" alt="Error state" width="230"> |

## Teknologi

### Aplikasi mobile

- Ionic Framework 8
- Vue 3
- TypeScript
- Vue Router
- Pinia
- Capacitor
- Vite

### Backend dan target deployment

- Express.js, Node.js, dan TypeScript untuk backend
- SQLite sebagai database sementara
- Autentikasi email dan kata sandi melalui backend, tanpa login Google
- API profil pengguna terproteksi untuk data tubuh, tujuan, alergi, dan
  preferensi
- Perhitungan BMR, TDEE, target sesuai tujuan, dan pembagian kalori per waktu
  makan dari profil pengguna
- Recommendation engine harian dengan filter alergi/dislike, skor preferensi
  dan kalori, alasan terstruktur, serta pencegahan menu berulang
- Katalog 1.145 pangan TKPI 2017 serta 614 menu yang seluruhnya telah
  disetujui; target minimum 600 menu approved telah terlampaui dan duplikat
  nama maupun komposisi ditolak oleh database
- API katalog menu approved dengan pencarian, filter kalori/jenis makan,
  pagination, dan detail nilai gizi
- Caddy sebagai reverse proxy dan pengelola HTTPS saat deployment
- OpenRouter API hanya untuk menyusun penjelasan hasil rekomendasi; angka gizi
  dan keputusan filter tetap berasal dari backend

## Menjalankan aplikasi

Pastikan Node.js 22 dan npm sudah tersedia. Untuk menjalankan backend dan
frontend secara otomatis dari root proyek:

```bash
npm run dev
```

Perintah tersebut akan:

- membuat `backend/.env` dan `mobile/.env` dari contoh jika belum tersedia;
- menjalankan `npm install` hanya jika dependency suatu aplikasi belum ada;
- menjalankan migration SQLite;
- memulai backend pada `http://localhost:3000`;
- memulai Ionic pada `http://localhost:5173`;
- memeriksa readiness kedua aplikasi; dan
- menghentikan kedua proses saat `Ctrl+C` ditekan.

Jika hanya ingin menyiapkan dependency, environment, dan database:

```bash
npm run dev:setup
```

Port frontend dapat diubah sementara, misalnya
`LOCAL_FRONTEND_PORT=5174 npm run dev`. Pastikan nilai `CORS_ORIGINS` backend
juga mengizinkan origin tersebut.

Cara manual tetap tersedia:

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Pada terminal lain:

```bash
cd mobile
npm install
cp .env.example .env
npm run dev
```

Buka alamat yang ditampilkan oleh Vite pada browser. Route utama aplikasi
adalah `/app/home`.

Endpoint pemeriksaan API dan SQLite tersedia pada
`http://localhost:3000/api/v1/health`. Dokumentasi backend selengkapnya tersedia
di [`backend/README.md`](backend/README.md).

## Validasi proyek

```bash
cd mobile
npm run build
npm run lint
npm run test:unit -- --run
npm run test:e2e
```

## Struktur proyek

```text
.
├── laporan/       # Draft dan referensi laporan tugas akhir
├── mobile/        # Source code aplikasi Ionic Vue
├── screenshoots/  # Hasil screenshot antarmuka
├── plan.md        # Rencana dan tahapan pengembangan
└── README.md
```

## Status pengembangan

| Tahap | Status | Cakupan |
| --- | --- | --- |
| Demo UI | Tersedia | Beranda dan screenshot |
| Integrated MVP | Sedang dikembangkan | Backend, SQLite, autentikasi, profil, kalkulasi kalori, recommendation engine v1, snapshot dan riwayat rekomendasi, alternatif pengganti, feedback persisten, halaman rekomendasi dan detail menu Ionic, API katalog, serta 614 menu approved tersedia; target minimum 600 telah dilampaui sebanyak 14 menu |
| Pengembangan lanjutan | Direncanakan | Penyempurnaan fitur, pengujian, keamanan, dan deployment |

Proyek ini bersifat edukatif dan tidak ditujukan untuk memberikan diagnosis
atau menggantikan saran dari tenaga kesehatan.
