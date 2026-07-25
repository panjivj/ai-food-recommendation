# SOFTWARE REQUIREMENTS SPECIFICATION

## Spesifikasi Kebutuhan Perangkat Lunak

### AI Food Recommendation System

**Versi Dokumen:** 0.1 (Draft)  
**Status Pengembangan:** Tahap 1 — Demo Antarmuka Pengguna  
**Nama Mahasiswa:** [Isi nama mahasiswa]  
**NIM:** [Isi NIM]  
**Program Studi:** [Isi program studi]  
**Fakultas/Universitas:** [Isi fakultas dan universitas]  
**Dosen Pembimbing:** [Isi nama dosen pembimbing]  
**Tanggal:** [Isi tanggal penyusunan]

---

> **Catatan status dokumen**
>
> Dokumen ini merupakan draft Spesifikasi Kebutuhan Perangkat Lunak (SKPL)
> untuk AI Food Recommendation System. Tahap pengembangan yang sedang berjalan
> berfokus pada pembuatan demo antarmuka pengguna menggunakan data dummy untuk
> kebutuhan dokumentasi dan screenshot laporan tugas akhir.
>
> Implementasi backend, autentikasi nyata, database, recommendation engine,
> OpenAI API, serta integrasi frontend dan backend secara lengkap direncanakan
> pada tahap pengembangan berikutnya. Bagian yang menjelaskan fungsi tersebut
> menggambarkan kebutuhan sistem target, bukan klaim bahwa seluruh fungsi telah
> diimplementasikan pada versi demo.

---

# Daftar Halaman

1. [Pendahuluan](#1-pendahuluan)
   1. [Visi](#11-visi)
   2. [Misi](#12-misi)
   3. [Tujuan](#13-tujuan)
   4. [Sistematika](#14-sistematika)
   5. [Definisi](#15-definisi)
   6. [Saran Audience dan Bacaan](#16-saran-audience-dan-bacaan)
   7. [Ruang Lingkup Sistem](#17-ruang-lingkup-sistem)
   8. [Referensi](#18-referensi)
2. [Deskripsi Umum Perangkat Lunak](#2-deskripsi-umum-perangkat-lunak)
   1. [Pendahuluan](#21-pendahuluan)
   2. [Perspektif Produk](#22-perspektif-produk)
   3. [Fungsi Produk](#23-fungsi-produk)
   4. [Karakteristik Pengguna](#24-karakteristik-pengguna)
   5. [Operating Environment](#25-operating-environment)
   6. [Design dan Implementasi](#26-design-dan-implementasi)
   7. [Dokumentasi User](#27-dokumentasi-user)
   8. [Asumsi dan Ketergantungan](#28-asumsi-dan-ketergantungan)
3. [Kebutuhan Antarmuka Eksternal](#3-kebutuhan-antarmuka-eksternal)
   1. [Antarmuka Pengguna](#31-antarmuka-pengguna)
   2. [Antarmuka Perangkat Keras](#32-antarmuka-perangkat-keras)
   3. [Antarmuka Perangkat Lunak](#33-antarmuka-perangkat-lunak)
   4. [Antarmuka Komunikasi](#34-antarmuka-komunikasi)
4. [Kebutuhan Fungsional](#4-kebutuhan-fungsional)
   1. [Fungsi Registrasi dan Login](#41-fungsi-registrasi-dan-login)
   2. [Fungsi Profil Pengguna](#42-fungsi-profil-pengguna)
   3. [Fungsi Rekomendasi Makanan Harian](#43-fungsi-rekomendasi-makanan-harian)
   4. [Fungsi Detail dan Penggantian Menu](#44-fungsi-detail-dan-penggantian-menu)
   5. [Fungsi Feedback dan Penjelasan AI](#45-fungsi-feedback-dan-penjelasan-ai)
5. [Kebutuhan Nonfungsional Lain](#5-kebutuhan-nonfungsional-lain)
   1. [Kebutuhan Performansi](#51-kebutuhan-performansi)
   2. [Kebutuhan Keamanan Data](#52-kebutuhan-keamanan-data)
   3. [Keamanan Sistem](#53-keamanan-sistem)
   4. [Atribut Kualitas Antarmuka](#54-atribut-kualitas-antarmuka)
   5. [Tujuan Bisnis](#55-tujuan-bisnis)

> Nomor halaman dapat dibuat secara otomatis ketika dokumen Markdown
> dikonversi ke DOCX atau PDF.

---

# Revision History

| Nama | Tanggal | Alasan Perubahan | Versi |
|---|---|---|---|
| [Nama mahasiswa] | [Tanggal] | Pembuatan draft awal berdasarkan template laporan | 0.1 |
| [Nama] | [Tanggal] | [Isi alasan perubahan] | [Versi] |

---

# 1. Pendahuluan

## 1.1 Visi

Visi AI Food Recommendation System adalah menjadi aplikasi pendamping yang
membantu pengguna memilih menu makanan harian secara lebih terarah berdasarkan
profil tubuh, tujuan pribadi, kondisi kesehatan, alergi, dan preferensi makanan.
Sistem diposisikan sebagai sarana edukasi dan rekomendasi umum, bukan sebagai
alat diagnosis atau pengganti saran tenaga medis.

## 1.2 Misi

Misi pengembangan AI Food Recommendation System adalah:

- Menyediakan antarmuka yang sederhana dan mudah dipahami untuk melihat
  rekomendasi makanan harian.
- Menampilkan informasi kalori, nilai gizi, bahan, dan cara penyajian makanan
  dalam format yang jelas.
- Membantu pengguna menemukan alternatif menu yang sesuai dengan profil dan
  preferensinya.
- Memberikan penjelasan singkat mengenai alasan suatu menu direkomendasikan.
- Mengembangkan sistem secara bertahap, dimulai dari demo UI dan dilanjutkan
  dengan implementasi backend serta recommendation engine.

## 1.3 Tujuan

Tujuan pembuatan sistem ini adalah:

- Membuat aplikasi rekomendasi makanan berbasis mobile menggunakan Ionic dan
  Vue.js.
- Membuat demo antarmuka aplikasi yang menampilkan halaman dan alur fitur utama
  menggunakan data dummy.
- Menyediakan rancangan fitur registrasi, profil pengguna, rekomendasi harian,
  detail makanan, penggantian menu, feedback, dan penjelasan rekomendasi.
- Mendokumentasikan kebutuhan fungsional dan nonfungsional sebagai dasar
  pengembangan MVP terintegrasi pada tahap berikutnya.
- Menghasilkan screenshot halaman penting aplikasi untuk mendukung laporan
  tugas akhir.

## 1.4 Sistematika

Dokumen SKPL ini dibagi menjadi lima bagian utama:

- **Pendahuluan**, berisi visi, misi, tujuan, sistematika, definisi, pembaca
  dokumen, ruang lingkup, dan referensi.
- **Deskripsi Umum Perangkat Lunak**, berisi perspektif produk, fungsi produk,
  karakteristik pengguna, lingkungan operasi, rancangan implementasi,
  dokumentasi pengguna, asumsi, dan ketergantungan.
- **Kebutuhan Antarmuka Eksternal**, berisi kebutuhan antarmuka pengguna,
  perangkat keras, perangkat lunak, dan komunikasi.
- **Kebutuhan Fungsional**, berisi fungsi utama yang harus tersedia pada sistem.
- **Kebutuhan Nonfungsional**, berisi kebutuhan performansi, keamanan, kualitas
  antarmuka, dan tujuan bisnis.

## 1.5 Definisi

| Istilah | Definisi |
|---|---|
| AI Food Recommendation System | Aplikasi mobile yang dirancang untuk memberikan rekomendasi makanan harian berdasarkan data profil dan preferensi pengguna. |
| SKPL/SRS | Dokumen yang menjelaskan spesifikasi kebutuhan perangkat lunak. |
| UI | User Interface atau antarmuka yang digunakan pengguna untuk berinteraksi dengan aplikasi. |
| UX | User Experience atau pengalaman pengguna ketika menggunakan aplikasi. |
| Demo UI | Versi antarmuka untuk mendemonstrasikan halaman, navigasi, dan respons visual aplikasi tanpa mewajibkan backend produksi. |
| Data dummy | Data lokal buatan yang digunakan untuk menampilkan dan menguji antarmuka aplikasi. |
| MVP | Minimum Viable Product, yaitu versi awal produk dengan fungsi utama yang telah terintegrasi. |
| Recommendation Engine | Komponen yang melakukan penyaringan dan penilaian menu untuk menghasilkan rekomendasi. |
| Rule-Based Filtering | Proses menyaring menu berdasarkan batasan seperti alergi atau kondisi kesehatan. |
| Content-Based Scoring | Proses memberikan skor pada menu berdasarkan kecocokan dengan profil pengguna. |
| Feedback | Respons pengguna terhadap menu dalam bentuk suka, tidak suka, atau telah dikonsumsi. |
| AI Explanation | Penjelasan berbentuk bahasa alami mengenai alasan suatu menu direkomendasikan. |
| Supabase | Layanan cloud yang direncanakan untuk autentikasi dan penyimpanan data pada tahap MVP terintegrasi. |
| Ionic Vue | Framework yang digunakan untuk membangun antarmuka aplikasi mobile lintas platform. |

## 1.6 Saran Audience dan Bacaan

Dokumen ini ditujukan kepada:

- Mahasiswa atau tim pengembang sebagai acuan implementasi sistem.
- Dosen pembimbing dan dosen penguji untuk meninjau ruang lingkup serta
  kebutuhan aplikasi.
- Perancang UI/UX sebagai acuan pembuatan halaman dan alur interaksi.
- Penguji perangkat lunak sebagai dasar penyusunan skenario pengujian.
- Stakeholder lain yang memerlukan gambaran fungsi dan batasan sistem.

Pembaca disarankan membaca bagian Pendahuluan dan Deskripsi Umum terlebih
dahulu. Pengembang dapat melanjutkan ke bagian Kebutuhan Antarmuka dan
Kebutuhan Fungsional, sedangkan penguji dapat menggunakan bagian Kebutuhan
Fungsional dan Nonfungsional sebagai acuan validasi.

## 1.7 Ruang Lingkup Sistem

Ruang lingkup AI Food Recommendation System meliputi:

- Menampilkan halaman login dan registrasi pengguna.
- Mengumpulkan data profil seperti usia, jenis kelamin, tinggi badan, berat
  badan, tingkat aktivitas, tujuan, kondisi kesehatan, alergi, dan preferensi
  makanan.
- Menampilkan ringkasan pengguna dan rekomendasi makanan hari ini.
- Menampilkan rekomendasi untuk sarapan, makan siang, dan makan malam.
- Menampilkan detail menu berupa gambar, kalori, informasi gizi, bahan, langkah
  persiapan, dan penjelasan rekomendasi.
- Menyediakan pilihan alternatif untuk mengganti menu rekomendasi.
- Merekam respons suka, tidak suka, dan telah dikonsumsi.
- Menampilkan penjelasan singkat mengenai alasan suatu menu direkomendasikan.

Ruang lingkup tahap pengembangan saat ini dibatasi pada demo antarmuka pengguna.
Semua data dan respons fitur disimulasikan melalui data lokal. Ruang lingkup MVP
terintegrasi pada tahap berikutnya mencakup backend Express.js, Supabase,
recommendation engine, OpenAI API, dan integrasi antarkomponen.

Fitur berikut tidak termasuk dalam ruang lingkup awal:

- Diagnosis medis.
- Chatbot atau konsultasi kesehatan.
- Machine learning.
- Pemindai barcode atau pengenalan makanan melalui kamera.
- Perencanaan belanja dan daftar belanja.
- Integrasi wearable device.
- Fitur sosial dan berbagi menu.

## 1.8 Referensi

- `plan.md`, dokumen perencanaan AI Food Recommendation System.
- `laporan/contoh-template-laporan.pdf`, template struktur laporan SKPL.
- Ionic Framework Documentation: <https://ionicframework.com/docs>
- Vue.js Documentation: <https://vuejs.org/guide/>
- IEEE Recommended Practice for Software Requirements Specifications.
- [Tambahkan buku, jurnal, atau referensi akademik yang digunakan dalam tugas
  akhir.]

---

# 2. Deskripsi Umum Perangkat Lunak

## 2.1 Pendahuluan

AI Food Recommendation System dikembangkan untuk membantu pengguna menentukan
pilihan menu harian dengan lebih mudah. Banyaknya pilihan makanan serta
perbedaan kebutuhan setiap pengguna dapat menyebabkan proses pemilihan makanan
menjadi kurang terarah. Sistem ini merangkum data profil pengguna dan
menyajikannya dalam bentuk rekomendasi menu yang mudah dipahami.

Pengembangan dilakukan dalam beberapa tahap:

1. **Tahap 1 — Demo UI:** pembuatan halaman, navigasi, state interaksi, dan data
   dummy untuk kebutuhan presentasi serta screenshot laporan.
2. **Tahap 2 — MVP Terintegrasi:** implementasi autentikasi, database, backend,
   recommendation engine, penjelasan OpenAI, dan integrasi UI dengan backend.
3. **Tahap 3 — Pengembangan Lanjutan:** penambahan fitur di luar MVP sesuai
   kebutuhan dan hasil evaluasi.

## 2.2 Perspektif Produk

AI Food Recommendation System merupakan aplikasi mobile lintas platform yang
dibangun menggunakan Ionic Vue.js. Pada versi demo, aplikasi berdiri sendiri
dan memperoleh data dari fixture atau mock service lokal.

Arsitektur versi demo:

```text
Ionic Vue App
        |
        +-- Data dummy/fixture lokal
        +-- Pinia atau component state
        +-- Simulasi interaksi pengguna
```

Arsitektur target MVP terintegrasi:

```text
Ionic Vue App
        |
        v
Express REST API
        |
        +--------------------> OpenAI API
        |
        v
Supabase Cloud
(Authentication dan PostgreSQL)
```

Recommendation engine pada MVP target menggunakan pendekatan hybrid sederhana,
yaitu rule-based filtering, content-based scoring, dan penyesuaian berdasarkan
feedback. OpenAI hanya digunakan untuk menyusun penjelasan rekomendasi dan tidak
digunakan untuk menentukan menu atau menghitung kebutuhan kalori.

## 2.3 Fungsi Produk

Perangkat lunak memiliki fungsi utama sebagai berikut.

### A. Fitur Login dan Registrasi

Fitur ini menyediakan formulir login untuk pengguna terdaftar dan formulir
registrasi untuk pengguna baru. Pada versi demo, autentikasi disimulasikan
dengan data lokal dan tombol login mengarahkan pengguna ke halaman utama.

> **Placeholder Gambar 2.1:** Screenshot halaman Login.  
> **Placeholder Gambar 2.2:** Screenshot halaman Registrasi.

### B. Fitur Pengaturan Profil

Fitur pengaturan profil digunakan untuk mengisi usia, jenis kelamin, tinggi,
berat, tingkat aktivitas, tujuan, kondisi kesehatan, alergi, dan preferensi
makanan. Informasi tersebut direncanakan menjadi input recommendation engine.

> **Placeholder Gambar 2.3:** Screenshot halaman Pengaturan Profil.

### C. Fitur Beranda

Halaman beranda menampilkan sapaan pengguna, ringkasan target kalori,
rekomendasi hari ini, dan akses cepat ke detail rekomendasi. Pada versi demo,
seluruh ringkasan berasal dari data dummy yang konsisten.

> **Placeholder Gambar 2.4:** Screenshot halaman Beranda.

### D. Fitur Rekomendasi Makanan Harian

Fitur rekomendasi menampilkan menu sarapan, makan siang, dan makan malam.
Pengguna dapat memilih salah satu menu untuk melihat informasi yang lebih rinci.

> **Placeholder Gambar 2.5:** Screenshot halaman Rekomendasi Harian.

### E. Fitur Detail Menu

Fitur detail menu menampilkan gambar, deskripsi, jumlah kalori, informasi gizi,
bahan, langkah persiapan, serta alasan menu direkomendasikan.

> **Placeholder Gambar 2.6:** Screenshot halaman Detail Menu.

### F. Fitur Penggantian Rekomendasi

Fitur ini memungkinkan pengguna melihat alternatif dan mengganti menu yang
kurang sesuai. Pada versi demo, pergantian menu hanya mengubah state dan data
lokal pada antarmuka.

> **Placeholder Gambar 2.7:** Screenshot pilihan Alternatif Menu.  
> **Placeholder Gambar 2.8:** Screenshot kondisi setelah menu diganti.

### G. Fitur Feedback

Pengguna dapat memberi respons suka, tidak suka, atau telah dikonsumsi terhadap
menu. Pada MVP terintegrasi, feedback akan disimpan dan digunakan sebagai
penyesuaian kecil terhadap skor rekomendasi berikutnya.

> **Placeholder Gambar 2.9:** Screenshot status feedback pada Detail Menu.

### H. Fitur Profil

Halaman profil menampilkan ringkasan data pengguna dan menyediakan akses untuk
memperbarui informasi. Pada versi demo, perubahan disimpan selama sesi lokal.

> **Placeholder Gambar 2.10:** Screenshot halaman Profil.  
> **Placeholder Gambar 2.11:** Screenshot halaman Edit Profil.

## 2.4 Karakteristik Pengguna

### A. Pengguna Aplikasi

Karakteristik pengguna utama:

- Menggunakan smartphone untuk menjalankan aplikasi.
- Memiliki pengetahuan dasar dalam mengoperasikan aplikasi mobile.
- Ingin melihat rekomendasi menu makanan harian.
- Bersedia melengkapi data profil dan preferensi makanan.
- Memahami bahwa rekomendasi bukan diagnosis atau resep medis.

Hak akses pengguna:

- Melakukan registrasi dan login.
- Melengkapi serta mengubah profil.
- Melihat rekomendasi makanan harian.
- Melihat detail dan alternatif menu.
- Memberikan feedback terhadap menu.

### B. Pengembang atau Administrator Teknis

Karakteristik pengembang:

- Memahami Ionic, Vue.js, TypeScript, dan REST API.
- Memelihara data menu, aturan rekomendasi, dan integrasi sistem.
- Memiliki akses teknis sesuai kebutuhan pengembangan.

Dashboard administrator tidak termasuk dalam ruang lingkup MVP awal.

## 2.5 Operating Environment

Lingkungan operasi yang direncanakan:

- Smartphone Android atau iOS yang mendukung aplikasi berbasis Capacitor.
- Browser modern untuk menjalankan dan menguji versi web.
- Sistem operasi pengembangan Linux, Windows, atau macOS.
- Node.js dan package manager yang sesuai dengan proyek.
- Koneksi internet pada MVP terintegrasi untuk mengakses backend, Supabase, dan
  layanan OpenAI.

Versi demo UI dapat dijalankan secara lokal tanpa koneksi ke backend. Koneksi
internet mungkin tetap diperlukan jika gambar demo menggunakan sumber eksternal.
Untuk kestabilan screenshot, aset lokal lebih disarankan.

## 2.6 Design dan Implementasi

Rancangan dan implementasi frontend menggunakan:

- Ionic Framework sebagai komponen UI mobile.
- Vue 3 sebagai framework antarmuka.
- TypeScript sebagai bahasa pemrograman.
- Vue Router sebagai pengelola navigasi.
- Pinia atau component state sebagai pengelola state demo.
- Data fixture TypeScript/JSON atau mock service sebagai sumber data demo.
- Capacitor sebagai sarana membangun aplikasi lintas platform.

Rancangan tahap MVP terintegrasi menggunakan:

- Express.js dan Node.js sebagai backend REST API.
- Supabase Auth untuk autentikasi.
- PostgreSQL pada Supabase untuk penyimpanan data.
- Recommendation engine berbasis aturan dan pemberian skor.
- OpenAI API untuk mengubah alasan terstruktur menjadi penjelasan bahasa alami.

Antarmuka dibuat dengan pendekatan sederhana, bersih, minimal, berbasis kartu,
dan meminimalkan langkah interaksi pada halaman utama.

## 2.7 Dokumentasi User

Dokumentasi pengguna yang direncanakan mencakup:

- Petunjuk registrasi dan login.
- Petunjuk pengisian profil.
- Petunjuk melihat rekomendasi dan detail menu.
- Petunjuk mengganti menu.
- Petunjuk memberikan feedback.
- Penjelasan bahwa aplikasi tidak memberikan diagnosis medis.

Untuk versi demo, dokumentasi dapat ditempatkan pada laporan, presentasi, atau
halaman bantuan sederhana di dalam aplikasi apabila dibutuhkan.

## 2.8 Asumsi dan Ketergantungan

Asumsi pengembangan sistem:

- Pengguna memiliki smartphone atau browser yang kompatibel.
- Pengguna memahami cara dasar mengoperasikan aplikasi mobile.
- Pengguna mengisi data profil dengan benar.
- Data menu yang digunakan memiliki informasi gizi yang memadai.
- Rekomendasi digunakan sebagai informasi umum dan bukan pengganti tenaga medis.

Ketergantungan versi demo:

- Ionic Vue dan dependency frontend dapat dijalankan pada lingkungan lokal.
- Data dummy dan aset gambar tersedia secara lokal.
- State demo dapat dikembalikan ke kondisi awal untuk pengambilan screenshot.

Ketergantungan MVP terintegrasi:

- Koneksi internet tersedia.
- Supabase Cloud dan OpenAI API dapat diakses.
- Environment variable dikonfigurasi dengan benar pada backend.
- Backend Express.js dan database berjalan dengan baik.

---

# 3. Kebutuhan Antarmuka Eksternal

## 3.1 Antarmuka Pengguna

Antarmuka pengguna menggunakan Graphical User Interface berbasis mobile.
Komponen utama yang diperlukan meliputi:

- Form input untuk login, registrasi, dan profil.
- Card untuk ringkasan kalori dan menu rekomendasi.
- Tab atau navigasi bawah untuk berpindah halaman utama.
- Tombol aksi untuk mengganti, menyukai, tidak menyukai, dan menandai menu telah
  dikonsumsi.
- Modal, toast, alert, badge, atau komponen status untuk memberikan feedback
  visual.
- Loading, empty, success, dan error state apabila diperlukan.

Prinsip antarmuka:

- Konsisten dalam warna, tipografi, ikon, jarak, dan komponen.
- Mudah dibaca pada ukuran layar smartphone.
- Mengutamakan informasi utama dan tindakan yang sering digunakan.
- Menghindari animasi berlebihan.
- Tidak menampilkan klaim medis.
- Tidak memiliki teks placeholder yang belum selesai pada screenshot final.

Daftar antarmuka yang perlu didokumentasikan:

| Kode | Halaman/State | Status Demo | Bukti Screenshot |
|---|---|---|---|
| UI-01 | Login | [Belum/Selesai] | [Masukkan Gambar] |
| UI-02 | Registrasi | [Belum/Selesai] | [Masukkan Gambar] |
| UI-03 | Pengaturan profil | [Belum/Selesai] | [Masukkan Gambar] |
| UI-04 | Beranda | [Belum/Selesai] | [Masukkan Gambar] |
| UI-05 | Rekomendasi harian | [Belum/Selesai] | [Masukkan Gambar] |
| UI-06 | Detail menu | [Belum/Selesai] | [Masukkan Gambar] |
| UI-07 | Alternatif/penggantian menu | [Belum/Selesai] | [Masukkan Gambar] |
| UI-08 | Feedback menu | [Belum/Selesai] | [Masukkan Gambar] |
| UI-09 | Profil | [Belum/Selesai] | [Masukkan Gambar] |
| UI-10 | Edit profil | [Belum/Selesai] | [Masukkan Gambar] |

## 3.2 Antarmuka Perangkat Keras

Perangkat keras untuk menjalankan aplikasi:

- Smartphone Android atau iOS.
- Layar sentuh sebagai perangkat input utama.
- Laptop atau komputer untuk menjalankan versi web dan proses pengembangan.

Spesifikasi minimum untuk pengembangan masih perlu diuji dan ditetapkan:

- Prosesor: [Isi spesifikasi minimum].
- RAM: [Isi spesifikasi minimum].
- Ruang penyimpanan: [Isi spesifikasi minimum].
- Resolusi layar target: [Isi resolusi/perangkat pengujian].

Aplikasi tidak memerlukan akses khusus ke kamera, mikrofon, GPS, sensor, atau
perangkat keras eksternal pada ruang lingkup awal.

## 3.3 Antarmuka Perangkat Lunak

Antarmuka perangkat lunak versi demo meliputi:

- Ionic Framework.
- Vue 3.
- Vue Router.
- Pinia.
- TypeScript.
- Capacitor.
- Browser atau emulator perangkat mobile.
- Data lokal berformat TypeScript atau JSON.

Antarmuka perangkat lunak pada MVP terintegrasi meliputi:

- Express REST API.
- Supabase Authentication.
- PostgreSQL pada Supabase.
- Supabase Storage apabila penyimpanan aset diperlukan.
- OpenAI API untuk penjelasan rekomendasi.
- Format pertukaran data JSON melalui HTTPS.

## 3.4 Antarmuka Komunikasi

Pada versi demo, komunikasi jaringan dengan backend tidak diwajibkan. Halaman
mengakses data melalui mock service atau fixture lokal.

Pada MVP terintegrasi:

- Frontend berkomunikasi dengan Express REST API melalui HTTPS.
- Data permintaan dan respons menggunakan JSON.
- Autentikasi menggunakan access token dari Supabase.
- Express API memvalidasi token sebelum memproses permintaan terproteksi.
- Backend berkomunikasi dengan Supabase dan OpenAI API melalui koneksi aman.
- Kunci layanan dan OpenAI API key tidak boleh dikirimkan ke frontend.

---

# 4. Kebutuhan Fungsional

Kebutuhan fungsional menjelaskan fungsi yang harus disediakan oleh sistem
target. Pada versi demo, proses yang memerlukan backend disimulasikan melalui
data dan state lokal.

## 4.1 Fungsi Registrasi dan Login

**Kode:** FR-01  
**Deskripsi:** Fitur untuk mendaftarkan pengguna baru dan masuk ke aplikasi.  
**Aktor:** Pengguna.  
**Prakondisi:** Aplikasi telah dibuka pada perangkat atau browser.  
**Pemicu:** Pengguna memilih menu registrasi atau login.

**Skenario utama registrasi:**

1. Pengguna membuka halaman registrasi.
2. Pengguna mengisi nama, email, kata sandi, dan konfirmasi kata sandi.
3. Pengguna menekan tombol **Daftar**.
4. Sistem memvalidasi kelengkapan dan format input.
5. Sistem membuat akun pengguna.
6. Sistem mengarahkan pengguna ke halaman pengaturan profil.

**Skenario utama login:**

1. Pengguna membuka halaman login.
2. Pengguna mengisi email dan kata sandi.
3. Pengguna menekan tombol **Masuk**.
4. Sistem memvalidasi kredensial.
5. Sistem membuat sesi pengguna.
6. Sistem mengarahkan pengguna ke halaman beranda.

**Pengecualian:**

- Input wajib belum diisi.
- Format email tidak valid.
- Kata sandi dan konfirmasi kata sandi tidak sama.
- Kredensial login salah.
- Layanan autentikasi tidak tersedia.

**Implementasi tahap demo:**

- Form, validasi visual, dan navigasi dibuat pada UI.
- Akun dan sesi pengguna disimulasikan menggunakan data lokal.
- Supabase Auth belum diwajibkan.

**Hasil akhir:** Pengguna masuk ke alur aplikasi atau menerima pesan kesalahan
yang sesuai.

## 4.2 Fungsi Profil Pengguna

**Kode:** FR-02  
**Deskripsi:** Fitur untuk mengisi, melihat, dan memperbarui profil pengguna.  
**Aktor:** Pengguna.  
**Prakondisi:** Pengguna telah masuk ke aplikasi.  
**Pemicu:** Pengguna membuka pengaturan profil atau memilih edit profil.

**Data profil:**

- Nama.
- Usia.
- Jenis kelamin.
- Tinggi badan.
- Berat badan.
- Tingkat aktivitas.
- Tujuan pengguna.
- Kondisi kesehatan.
- Alergi.
- Makanan yang tidak disukai.
- Preferensi makanan.

**Skenario utama:**

1. Pengguna membuka halaman profil.
2. Sistem menampilkan data profil yang tersedia.
3. Pengguna memilih **Edit Profil**.
4. Pengguna mengubah satu atau beberapa field.
5. Pengguna menekan tombol **Simpan**.
6. Sistem memvalidasi input.
7. Sistem menyimpan dan menampilkan data terbaru.

**Pengecualian:**

- Field wajib kosong.
- Nilai usia, tinggi, atau berat berada di luar format yang diperbolehkan.
- Penyimpanan data gagal.

**Implementasi tahap demo:**

- Data profil berasal dari fixture pengguna.
- Perubahan hanya diterapkan pada state lokal.
- Database belum diwajibkan.

**Hasil akhir:** Profil pengguna ditampilkan dengan data terbaru atau sistem
menampilkan pesan validasi.

## 4.3 Fungsi Rekomendasi Makanan Harian

**Kode:** FR-03  
**Deskripsi:** Fitur untuk menampilkan rekomendasi sarapan, makan siang, dan
makan malam.  
**Aktor:** Pengguna.  
**Prakondisi:** Pengguna telah masuk dan memiliki data profil.  
**Pemicu:** Pengguna membuka halaman beranda atau rekomendasi.

**Skenario utama:**

1. Sistem membaca profil dan target pengguna.
2. Sistem menentukan target kalori harian.
3. Sistem memuat kandidat menu.
4. Sistem menghapus menu yang melanggar aturan keras, seperti alergi.
5. Sistem memberikan skor kecocokan pada menu.
6. Sistem menyesuaikan skor menggunakan riwayat feedback.
7. Sistem memilih rekomendasi sarapan, makan siang, dan makan malam.
8. Sistem menampilkan hasil rekomendasi dan ringkasan kalori.

**Pengecualian:**

- Profil pengguna belum lengkap.
- Tidak ada kandidat menu yang memenuhi aturan.
- Proses menghasilkan rekomendasi gagal.

**Implementasi tahap demo:**

- Langkah perhitungan belum dijalankan.
- Tiga menu utama dan ringkasan kalori berasal dari data dummy.
- Loading, empty, atau error state dapat disediakan untuk screenshot.

**Hasil akhir:** Pengguna melihat tiga rekomendasi makanan harian atau informasi
mengapa rekomendasi belum tersedia.

## 4.4 Fungsi Detail dan Penggantian Menu

**Kode:** FR-04  
**Deskripsi:** Fitur untuk melihat informasi lengkap dan mengganti menu
rekomendasi.  
**Aktor:** Pengguna.  
**Prakondisi:** Rekomendasi makanan telah tersedia.  
**Pemicu:** Pengguna memilih menu atau menekan tombol **Ganti**.

**Skenario utama detail menu:**

1. Pengguna memilih salah satu rekomendasi.
2. Sistem menampilkan gambar dan nama menu.
3. Sistem menampilkan kalori dan informasi gizi.
4. Sistem menampilkan bahan dan langkah persiapan.
5. Sistem menampilkan penjelasan rekomendasi.

**Skenario utama penggantian menu:**

1. Pengguna menekan tombol **Ganti**.
2. Sistem memuat menu alternatif yang masih memenuhi aturan pengguna.
3. Sistem menampilkan alternatif menu.
4. Pengguna memilih salah satu alternatif.
5. Sistem mengganti menu pada rekomendasi harian.
6. Sistem menampilkan konfirmasi keberhasilan.

**Pengecualian:**

- Detail menu tidak ditemukan.
- Tidak ada alternatif menu yang memenuhi ketentuan.
- Penggantian menu gagal disimpan.

**Implementasi tahap demo:**

- Detail menu berasal dari fixture lokal.
- Minimal dua alternatif menu disediakan.
- Pemilihan alternatif hanya memperbarui state lokal.

**Hasil akhir:** Pengguna melihat informasi lengkap atau rekomendasi yang telah
diperbarui.

## 4.5 Fungsi Feedback dan Penjelasan AI

**Kode:** FR-05  
**Deskripsi:** Fitur untuk memberikan respons terhadap menu dan melihat alasan
rekomendasi.  
**Aktor:** Pengguna.  
**Prakondisi:** Detail menu telah ditampilkan.  
**Pemicu:** Pengguna menekan tombol suka, tidak suka, atau telah dikonsumsi.

**Skenario utama feedback:**

1. Pengguna membuka detail menu.
2. Pengguna memilih salah satu aksi: **Suka**, **Tidak Suka**, atau
   **Dikonsumsi**.
3. Sistem mencatat feedback pengguna.
4. Sistem memperbarui status tombol atau indikator pada antarmuka.
5. Sistem menampilkan konfirmasi.

**Skenario utama penjelasan rekomendasi:**

1. Recommendation engine menghasilkan menu dan alasan terstruktur.
2. Backend mengirimkan alasan terstruktur ke layanan OpenAI.
3. OpenAI mengubah alasan tersebut menjadi penjelasan singkat dalam bahasa
   Indonesia.
4. Sistem menampilkan penjelasan tanpa klaim diagnosis atau penyembuhan.
5. Jika OpenAI gagal, sistem menampilkan penjelasan dari template lokal.

**Pengecualian:**

- Penyimpanan feedback gagal.
- OpenAI API tidak tersedia.
- Penjelasan tidak dapat dimuat.

**Implementasi tahap demo:**

- Status feedback diperbarui pada state lokal.
- Penjelasan rekomendasi menggunakan teks dummy yang telah ditentukan.
- OpenAI API belum dipanggil.

**Hasil akhir:** Antarmuka menampilkan status feedback dan penjelasan
rekomendasi yang sesuai.

---

# 5. Kebutuhan Nonfungsional Lain

## 5.1 Kebutuhan Performansi

Kebutuhan performansi yang direncanakan:

- Halaman demo dapat dibuka tanpa menunggu backend.
- Perpindahan antarlayar terasa responsif pada perangkat pengujian.
- Interaksi lokal seperti suka, tidak suka, dikonsumsi, dan ganti menu segera
  memberikan feedback visual.
- Gambar dioptimalkan agar tidak menyebabkan layout lambat atau bergeser.
- Pada MVP terintegrasi, indikator loading ditampilkan selama permintaan API.
- Target waktu respons API dan batas ukuran aplikasi akan ditentukan setelah
  pengujian implementasi.

Kriteria pengujian performansi kuantitatif:

- Waktu tampil awal versi demo: [Isi setelah pengujian].
- Waktu perpindahan halaman: [Isi setelah pengujian].
- Waktu respons API MVP: [Isi setelah backend tersedia].
- Ukuran build aplikasi: [Isi setelah build dilakukan].

## 5.2 Kebutuhan Keamanan Data

Sistem mengelola data profil yang dapat berkaitan dengan kondisi tubuh,
preferensi, alergi, dan kondisi kesehatan pengguna. Oleh karena itu:

- Sistem hanya mengumpulkan data yang diperlukan.
- Data sensitif tidak ditulis pada log tanpa kebutuhan.
- API key dan service role key tidak disimpan di frontend.
- Data dummy tidak boleh menggunakan data pribadi nyata tanpa izin.
- Komunikasi MVP terintegrasi menggunakan HTTPS.
- Akses terhadap data pengguna harus mengikuti identitas pada token yang telah
  diverifikasi.
- Kebijakan privasi dan retensi data perlu disusun sebelum penggunaan produksi.

## 5.3 Keamanan Sistem

Kebutuhan keamanan MVP terintegrasi:

- Autentikasi pengguna menggunakan Supabase Auth.
- Express API memverifikasi Supabase JWT.
- Backend tidak mempercayai `user_id` yang dikirim langsung oleh frontend.
- Setiap input API divalidasi dan disanitasi.
- `SUPABASE_SERVICE_ROLE_KEY` dan `OPENAI_API_KEY` hanya tersedia di backend.
- Kesalahan sistem tidak menampilkan credential atau detail internal.
- Hak akses diterapkan agar pengguna hanya dapat mengelola datanya sendiri.

Pada versi demo, autentikasi dan penyimpanan data masih berupa simulasi.
Walaupun demikian, credential produksi tidak boleh dimasukkan ke kode frontend
atau data dummy.

## 5.4 Atribut Kualitas Antarmuka

Antarmuka aplikasi harus memenuhi atribut berikut:

- **Usability:** alur utama dapat dipahami tanpa penjelasan panjang.
- **Consistency:** warna, tipografi, ikon, komponen, dan pola navigasi konsisten.
- **Readability:** ukuran teks dan kontras warna mendukung keterbacaan.
- **Responsiveness:** konten menyesuaikan ukuran layar mobile target.
- **Feedback:** setiap tindakan utama memberikan respons visual.
- **Error prevention:** input memiliki label, batasan, dan pesan validasi yang
  jelas.
- **Accessibility:** tombol memiliki area sentuh yang memadai dan informasi
  tidak hanya dibedakan berdasarkan warna.
- **Maintainability:** data dummy dipisahkan dari komponen agar dapat diganti
  dengan layanan API pada tahap berikutnya.

Kriteria kelulusan UI demo:

- Tidak ada konten yang terpotong, bertumpuk, atau keluar layar.
- Tidak ada teks placeholder yang tidak disengaja pada screenshot final.
- Data pengguna dan menu konsisten di seluruh halaman.
- Navigasi halaman utama dapat dijalankan.
- Interaksi ganti menu dan feedback menunjukkan perubahan state.
- Halaman penting telah didokumentasikan melalui screenshot.

## 5.5 Tujuan Bisnis

Tujuan pengembangan AI Food Recommendation System adalah:

- Membantu pengguna memperoleh pilihan makanan harian yang lebih terarah.
- Menyajikan informasi makanan dalam bentuk yang sederhana dan mudah dipahami.
- Menjadi media penerapan konsep hybrid recommendation pada tugas akhir.
- Menghasilkan prototype visual yang dapat divalidasi sebelum investasi
  pengembangan backend penuh.
- Menjadi dasar pengembangan MVP yang dapat diuji menggunakan pengguna dan data
  yang lebih representatif.

Indikator keberhasilan tahap demo:

- Seluruh halaman utama selesai dibuat.
- Data dummy tampil konsisten dan realistis.
- Alur demo dapat digunakan untuk presentasi.
- Screenshot yang diperlukan dalam laporan telah tersedia.
- Dosen pembimbing dapat memahami fungsi dan alur aplikasi dari prototype.

Indikator keberhasilan MVP terintegrasi akan ditentukan lebih lanjut, misalnya
keberhasilan autentikasi, ketepatan penerapan aturan rekomendasi, waktu respons,
dan hasil pengujian pengguna.

---

# Lampiran A — Daftar Screenshot yang Perlu Disiapkan

Bagian ini merupakan tambahan untuk membantu proses penyelesaian laporan dan
dapat dihapus atau dipindahkan ketika format akhir sudah disusun.

| No. | Screenshot | Halaman Laporan | Status | Nama File |
|---:|---|---|---|---|
| 1 | Login | Bagian 2.3/3.1 | [ ] | [Isi] |
| 2 | Registrasi | Bagian 2.3/3.1 | [ ] | [Isi] |
| 3 | Pengaturan profil | Bagian 2.3/3.1 | [ ] | [Isi] |
| 4 | Beranda | Bagian 2.3/3.1 | [ ] | [Isi] |
| 5 | Rekomendasi harian | Bagian 2.3/3.1 | [ ] | [Isi] |
| 6 | Detail menu | Bagian 2.3/3.1 | [ ] | [Isi] |
| 7 | Pilihan alternatif menu | Bagian 2.3/3.1 | [ ] | [Isi] |
| 8 | Kondisi setelah menu diganti | Bagian 2.3/3.1 | [ ] | [Isi] |
| 9 | Status suka/tidak suka/dikonsumsi | Bagian 2.3/3.1 | [ ] | [Isi] |
| 10 | Profil | Bagian 2.3/3.1 | [ ] | [Isi] |
| 11 | Edit profil | Bagian 2.3/3.1 | [ ] | [Isi] |
| 12 | Loading/empty/error state | Bagian 3.1/5.4 | [ ] | [Isi] |

---

# Lampiran B — Catatan Penyelesaian Draft

Sebelum dokumen dijadikan laporan final:

- Isi identitas mahasiswa, institusi, dosen pembimbing, dan tanggal.
- Konfirmasi nama resmi aplikasi yang digunakan pada tugas akhir.
- Tambahkan latar belakang berbasis sumber akademik apabila diminta.
- Lengkapi referensi menggunakan format sitasi yang ditetapkan kampus.
- Ganti seluruh placeholder gambar dengan screenshot aplikasi.
- Tambahkan nomor dan keterangan pada setiap gambar.
- Isi hasil pengujian performansi menggunakan hasil pengukuran nyata.
- Sesuaikan kebutuhan perangkat keras dengan perangkat pengembangan dan
  perangkat pengujian yang benar-benar digunakan.
- Perbarui status implementasi setelah backend dan integrasi mulai dikerjakan.
- Buat daftar isi dan nomor halaman otomatis setelah dokumen dikonversi ke
  format DOCX atau PDF.
