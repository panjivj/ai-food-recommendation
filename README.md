# AI Food Recommendation

Prototipe aplikasi mobile rekomendasi makanan harian berdasarkan profil, target
kalori, dan preferensi pengguna. Aplikasi Ionic Vue telah terhubung ke backend
Express dan SQLite untuk autentikasi serta profil pengguna.

## Tentang dan tujuan aplikasi

AI Food Recommendation atau **NutriChoice** adalah aplikasi edukatif yang
membantu pengguna menyusun kandidat menu harian berdasarkan profil tubuh,
tingkat aktivitas, tujuan berat badan, target kalori, alergi, makanan yang
tidak disukai, dan preferensi makanan. Aplikasi menyediakan empat slot waktu
makan, alternatif pengganti, ringkasan tujuh hari, informasi gizi berbasis
TKPI, serta feedback suka, tidak suka, dan sudah dikonsumsi.

Alur penggunaan utamanya adalah:

1. pengguna membuat akun dan melengkapi profil;
2. backend menghitung kebutuhan dan target kalori;
3. recommendation engine menyaring menu yang tidak aman, memberi skor pada
   kandidat, dan memilih menu untuk setiap waktu makan;
4. pengguna dapat melihat alasan rekomendasi, mengganti menu, dan memberikan
   feedback.

Recommendation engine aplikasi menggunakan aturan, filter, dan scoring dari
profil serta informasi gizi. Eksperimen Decision Tree pada folder `ml/`
merupakan bagian penelitian untuk mengklasifikasikan waktu makan menu dan
belum digunakan sebagai pengganti recommendation engine aplikasi. OpenRouter
bersifat opsional dan hanya menyusun penjelasan berbentuk bahasa alami; angka
gizi dan keputusan filter tetap dihitung oleh backend.

Aplikasi ini bukan alat diagnosis, terapi, atau pengganti konsultasi dengan
tenaga kesehatan.

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

## Lokasi dataset

Paket dataset yang siap diperiksa atau disalin untuk kebutuhan pengumpulan
tersedia di [`data/data-set/`](data/data-set/). Penjelasan skema, jumlah data,
relasi tabel, sumber, dan pemeriksaan integritas tersedia pada
[`data/data-set/README.md`](data/data-set/README.md).

| Lokasi | Isi |
|---|---|
| [`data/data-set/penelitian/`](data/data-set/penelitian/) | `menu_ml.csv` berisi 614 menu serta `train.csv` dan `test.csv` hasil stratified split |
| [`data/data-set/aplikasi/`](data/data-set/aplikasi/) | Ekspor CSV katalog 1.145 bahan pangan, 614 menu approved, kandungan gizi, bahan menu, tag, dan alergen |
| [`data/data-set/sumber-tkpi/`](data/data-set/sumber-tkpi/) | Dokumen Tabel Komposisi Pangan Indonesia 2017 dan 12 berkas JSON hasil normalisasi |
| [`ml/data/`](ml/data/) | Salinan kerja dataset yang digunakan langsung oleh pipeline eksperimen machine learning |

Paket pada `data/data-set/` tidak memuat akun, alamat surel pengguna, password
hash, profil kesehatan pengguna, token, feedback personal, atau riwayat
rekomendasi. Integritas seluruh berkas dapat diperiksa dari dalam folder
tersebut menggunakan:

```bash
cd data/data-set
sha256sum --check SHA256SUMS.txt
```

## Menjalankan aplikasi

### Prasyarat

- Node.js 22 atau lebih baru;
- npm dan Git;
- port `3000` dan `5173` tidak sedang digunakan.

OpenRouter API key tidak wajib. Tanpa API key, seluruh fungsi utama tetap dapat
digunakan kecuali pembuatan penjelasan AI berbentuk bahasa alami.

### Quick start

Clone repositori dan masuk ke root proyek:

```bash
git clone https://github.com/panjivj/ai-food-recommendation.git
cd ai-food-recommendation
```

Jika database lokal sudah diinisialisasi dan berisi katalog, jalankan backend
dan frontend secara otomatis. Untuk clone baru, selesaikan bagian
**Inisialisasi katalog pada clone baru** di bawah terlebih dahulu.

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

Setelah pesan `Aplikasi lokal berjalan` muncul, buka
`http://localhost:5173`. Buat akun melalui halaman registrasi, lengkapi profil,
kemudian buka halaman rekomendasi. Endpoint pemeriksaan backend dan SQLite
tersedia pada `http://localhost:3000/api/v1/health`.

### Inisialisasi katalog pada clone baru

Database SQLite berada di `backend/storage/app.db` dan tidak disimpan di Git.
Pada clone baru, siapkan dependency, environment, dan migration terlebih
dahulu:

```bash
npm run dev:setup
```

Kemudian impor katalog TKPI dan kurasi seluruh batch menu:

```bash
cd backend
npm run db:import-tkpi
npm run db:seed-pilot
npm run db:review-pilot
npm run db:seed-batch-02
npm run db:review-batch-02
npm run db:seed-batch-03
npm run db:review-batch-03
npm run db:seed-batch-04
npm run db:review-batch-04
npm run db:seed-batch-05
npm run db:review-batch-05
npm run db:seed-batch-06
npm run db:review-batch-06
npm run db:seed-batch-07
npm run db:review-batch-07
npm run db:seed-batch-08
npm run db:review-batch-08
npm run db:seed-batch-09
npm run db:review-batch-09
npm run db:seed-batch-10
npm run db:review-batch-10
npm run db:seed-batch-11
npm run db:review-batch-11
npm run db:validate-foods
cd ..
npm run dev
```

Tahap inisialisasi katalog hanya diperlukan sekali untuk database lokal baru.
Hasil akhirnya adalah katalog 1.145 bahan pangan dan 614 menu berstatus
`approved`. Perintah seed dan review aman dijalankan kembali terhadap menu
yang sudah disetujui.

Jika database lokal sebelumnya sudah berisi katalog dan menu, cukup jalankan
`npm run dev`.

### Konfigurasi dan cara manual

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

Dokumentasi backend selengkapnya tersedia di
[`backend/README.md`](backend/README.md), sedangkan petunjuk khusus frontend
tersedia di [`mobile/README.md`](mobile/README.md).

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
├── backend/       # REST API, SQLite, katalog TKPI, dan recommendation engine
├── data/          # Sumber TKPI dan paket dataset siap submit
├── laporan/       # Draft dan referensi laporan tugas akhir
├── ml/            # Dataset kerja, pipeline eksperimen, model, dan hasil
├── mobile/        # Source code aplikasi Ionic Vue
├── screenshoots/  # Hasil screenshot antarmuka
├── scripts/       # Orkestrasi setup dan aplikasi lokal
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
