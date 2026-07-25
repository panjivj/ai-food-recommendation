# AI Food Recommendation

Demo antarmuka aplikasi mobile rekomendasi makanan harian berdasarkan profil,
target kalori, dan preferensi pengguna. Aplikasi dibangun menggunakan Ionic Vue
dan TypeScript sebagai bagian dari tugas akhir kuliah.

> [!NOTE]
> Proyek saat ini berada pada tahap **demo UI** untuk dokumentasi dan screenshot
> laporan. Seluruh informasi pengguna, rekomendasi makanan, serta interaksi di
> dalam aplikasi masih menggunakan data dummy lokal. Backend, autentikasi nyata,
> database, dan recommendation engine akan dikembangkan pada tahap berikutnya.

## Fitur demo

- Login dan registrasi pengguna
- Pengaturan, tampilan, dan penyuntingan profil
- Beranda dengan ringkasan target kalori
- Rekomendasi menu harian
- Detail makanan dan informasi makronutrisi
- Pilihan alternatif dan penggantian menu
- Feedback suka, tidak suka, dan sudah dikonsumsi
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

- Ionic Framework 8
- Vue 3
- TypeScript
- Vue Router
- Pinia
- Capacitor
- Vite

## Menjalankan aplikasi

Pastikan Node.js dan npm sudah tersedia, kemudian jalankan:

```bash
cd mobile
npm install
npm run dev
```

Buka alamat yang ditampilkan oleh Vite pada browser. Route utama aplikasi
adalah `/app/home`.

## Validasi proyek

```bash
cd mobile
npm run build
npm run lint
npm run test:unit -- --run
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
| Demo UI | Sedang dikembangkan | Halaman aplikasi, dummy data, interaksi visual, dan screenshot |
| Integrated MVP | Berikutnya | Backend, autentikasi, database, recommendation engine, dan integrasi API |
| Pengembangan lanjutan | Direncanakan | Penyempurnaan fitur, pengujian, keamanan, dan deployment |

Proyek ini bersifat edukatif dan tidak ditujukan untuk memberikan diagnosis
atau menggantikan saran dari tenaga kesehatan.
