# AI Food Recommendation Backend

Fondasi REST API untuk AI Food Recommendation System menggunakan Express,
TypeScript, dan SQLite. Backend saat ini juga menyediakan autentikasi email dan
kata sandi.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Server menggunakan port `3000` secara default. Pemeriksaan kesiapan API dan
database tersedia pada:

```text
GET http://localhost:3000/api/v1/health
```

## Perintah

```bash
npm run dev
npm run build
npm run start
npm run db:migrate
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
npm run typecheck
npm run lint
npm test
```

Saat server dimulai, migrasi yang belum diterapkan juga dijalankan secara
otomatis. Database lokal disimpan pada `storage/app.db` dan tidak dilacak oleh
Git.

Origin frontend yang diperbolehkan dikonfigurasi melalui `CORS_ORIGINS` sebagai
daftar yang dipisahkan koma. Nilai default mencakup Vite dan origin lokal
Capacitor.

Penjelasan AI bersifat opsional dan menggunakan OpenRouter. Simpan API key
hanya pada `backend/.env`:

```dotenv
OPENROUTER_API_KEY=isi-api-key-anda
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=NutriChoice
OPENROUTER_TIMEOUT_MS=20000
```

Tanpa `OPENROUTER_API_KEY`, fitur lain tetap berjalan dan endpoint penjelasan
akan mengembalikan `AI_EXPLANATION_NOT_CONFIGURED`. Jangan menaruh API key pada
environment frontend yang diawali `VITE_`.

`AUTH_TOKEN_SECRET` pada `.env.example` hanya untuk development. Gunakan secret
acak minimal 32 karakter pada deployment. Backend akan menolak nilai development
tersebut ketika `NODE_ENV=production`.

## Autentikasi

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Contoh registrasi:

```json
{
  "email": "pengguna@example.com",
  "password": "password-aman"
}
```

Register dan login mengembalikan `accessToken` bertipe Bearer. Gunakan token
tersebut untuk endpoint terproteksi:

```http
Authorization: Bearer <accessToken>
```

Email disimpan dalam bentuk huruf kecil. Kata sandi tidak pernah disimpan secara
langsung; backend menggunakan Argon2id. Password harus berisi 8–128 karakter.
Access token memiliki issuer, audience, dan masa berlaku yang dikonfigurasi
melalui environment variable.

## Profil pengguna

Semua endpoint profil memerlukan Bearer access token:

```text
POST /api/v1/profile  # Membuat profil
GET  /api/v1/profile  # Membaca profil pengguna aktif
PUT  /api/v1/profile  # Mengganti profil yang sudah ada
```

Contoh data profil:

```json
{
  "name": "Alya Putri",
  "age": 22,
  "gender": "female",
  "heightCm": 160,
  "weightKg": 56,
  "activityLevel": "moderate",
  "goal": "maintain",
  "healthConditions": [],
  "allergies": ["Kacang tanah"],
  "dislikedFoods": ["Jeroan"],
  "foodPreferences": ["Makanan rumahan"]
}
```

`POST` hanya dapat dipanggil sekali untuk setiap pengguna. Gunakan `PUT` untuk
memperbarui profil. Daftar kondisi kesehatan, alergi, makanan yang tidak
disukai, dan preferensi makanan dinormalisasi serta disimpan sebagai JSON
tervalidasi di SQLite.

## Perhitungan kebutuhan kalori

Endpoint berikut memerlukan Bearer access token dan profil pengguna yang sudah
dibuat:

```text
GET /api/v1/calorie-needs
```

Hasil dihitung ulang dari profil terbaru pada setiap permintaan dan tidak
disimpan sebagai salinan di database. Dengan demikian, perubahan usia, berat,
tinggi, aktivitas, atau tujuan langsung tercermin dan tidak menghasilkan data
turunan yang kedaluwarsa.

Perhitungan versi 1 menggunakan:

- Estimasi BMR/REE Mifflin–St Jeor:
  - Laki-laki: `10 × berat kg + 6,25 × tinggi cm - 5 × usia + 5`.
  - Perempuan: `10 × berat kg + 6,25 × tinggi cm - 5 × usia - 161`.
- Faktor aktivitas internal: `low = 1,4`, `moderate = 1,6`, dan `high = 1,8`.
- TDEE: `BMR × faktor aktivitas`.
- Tujuan `maintain`: tanpa penyesuaian.
- Tujuan `weight_loss`: meminta defisit 500 kkal/hari, tetapi tidak memaksakan
  target di bawah 1.200 kkal/hari atau defisit yang tidak memungkinkan.
- Tujuan `weight_gain`: surplus 300 kkal/hari.
- Pembagian internal aplikasi: sarapan 25%, makan siang 35%, makan malam 30%,
  dan camilan 10%. Koreksi pembulatan ditempatkan pada camilan agar jumlahnya
  selalu tepat sama dengan target harian.

Respons mengembalikan snapshot input, BMI, BMR, TDEE, target harian,
penyesuaian yang diminta dan benar-benar diterapkan, target setiap waktu makan,
rumus, faktor aktivitas, kebijakan, peringatan, sumber referensi, serta waktu
kalkulasi. Mifflin–St Jeor hanya dijalankan untuk usia 19–78 tahun sesuai
rentang sampel publikasi asal; usia di luar rentang tersebut menerima
`CALORIE_CALCULATION_UNSUPPORTED`.

Kalkulasi ini adalah estimasi edukatif, bukan diagnosis atau resep gizi klinis.
Kondisi kesehatan, kehamilan, menyusui, obat, penyakit, dan komposisi tubuh
terukur tidak dimasukkan otomatis.

Dasar implementasi:

- [Mifflin et al. — persamaan estimasi energi istirahat](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- [NIDDK — rentang Physical Activity Level](https://www.niddk.nih.gov/bwp)
- [CDC — penurunan berat badan bertahap](https://www.cdc.gov/healthy-weight-growth/losing-weight/)
- [NHLBI — dasar defisit energi untuk penurunan berat](https://www.nhlbi.nih.gov/files/docs/guidelines/ob_gdlns.pdf)
- [NIDDK — pengaman minimum 1.200 kkal](https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-type-2-diabetes/game-plan)
- [NHS — penambahan kalori untuk kenaikan berat bertahap](https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/)

## Recommendation engine versi 1

Endpoint rekomendasi memerlukan Bearer access token dan profil pengguna:

```text
GET /api/v1/recommendations/daily
GET /api/v1/recommendations/daily?date=2026-07-28
GET /api/v1/recommendations/weekly?start_date=2026-07-28
GET /api/v1/recommendations/daily/alternatives?date=2026-07-28&meal_type=breakfast&current_menu_id=pilot-004&limit=3
POST /api/v1/recommendations/daily/alternatives/conversation
POST /api/v1/recommendations/daily/2026-07-28/items/breakfast/explanation
PUT /api/v1/recommendations/daily/2026-07-28/items/breakfast
GET /api/v1/recommendations/history?page=1&limit=20
```

Parameter `date` harus menggunakan format kalender `YYYY-MM-DD`. Jika tidak
dikirim, backend menggunakan tanggal UTC saat permintaan diterima. Aplikasi
mobile sebaiknya mengirim tanggal lokal pengguna secara eksplisit.

Engine memilih satu menu `approved` untuk sarapan, makan siang, makan malam, dan
camilan. Target setiap slot berasal dari endpoint perhitungan kebutuhan kalori.
Satu ID menu tidak dapat dipilih dua kali dalam paket harian yang sama.

Filter keras diterapkan sebelum pemberian skor:

- Alergen terkurasi pada menu dibandingkan dengan alias Indonesia dan Inggris,
  misalnya `susu → milk`, `ikan → fish`, `kacang tanah → peanut`,
  `udang/kerang/cumi → shellfish`, `tahu/tempe/kedelai → soy`, dan
  `gandum/terigu → wheat`.
- Istilah alergi juga dicocokkan sebagai frasa terhadap nama menu, tag, dan
  nama bahan.
- Makanan yang tidak disukai dicocokkan sebagai frasa terhadap nama menu, tag,
  dan nama bahan.
- Kandidat yang sudah dipakai pada slot sebelumnya dikeluarkan.

Istilah alergi yang belum mempunyai pemetaan kanonis tetap digunakan sebagai
filter teks dan dilaporkan melalui `unresolvedAllergies` serta `warnings`.
Pencocokan ini bersifat konservatif tetapi bukan jaminan klinis; label alergen
menu masih harus terus dikurasi.

Skor maksimal adalah 100 dan seluruh komponennya dikembalikan pada respons:

| Komponen | Bobot | Perhitungan |
| --- | ---: | --- |
| Kedekatan kalori | 75 | Menurun secara linear dari 75 berdasarkan persentase selisih terhadap target |
| Preferensi | 20 | Proporsi preferensi yang cocok dengan nama, tag, atau bahan |
| Rotasi harian | 5 | Hash deterministik pengguna, tanggal, slot, dan ID menu |

Setiap pilihan mengembalikan `score.breakdown`, selisih kalori, preferensi yang
cocok, serta alasan berkode `CALORIE_FIT`, `PREFERENCE_MATCH` atau
`NO_PREFERENCE_MATCH`, `DAILY_ROTATION`, dan `SAFETY_FILTERS`. Respons juga
menyertakan jumlah kandidat yang tersaring oleh setiap aturan.

Request pertama untuk pasangan pengguna dan tanggal dihitung lalu disimpan
sebagai snapshot SQLite. Request berikutnya membaca snapshot tersebut, sehingga
target, menu, nilai gizi ringkas, skor, alasan, statistik filter, aturan profil,
dan strategi tetap sama walaupun profil atau katalog kemudian berubah. Jika
filter menghapus seluruh kandidat salah satu waktu makan sebelum snapshot
terbentuk, API mengembalikan `NO_SAFE_RECOMMENDATION` dan tidak memberikan paket
parsial.

### Rencana menu tujuh hari

Endpoint `/recommendations/weekly` menerima `start_date` dalam format
`YYYY-MM-DD`, lalu mengembalikan tujuh snapshot berturut-turut mulai dari
tanggal tersebut. Tanggal yang belum memiliki snapshot dibuat otomatis dengan
mengecualikan seluruh menu yang sudah digunakan dalam paket, sehingga paket
baru berisi 28 menu unik.

Snapshot lama tidak ditimpa. Jika beberapa tanggal sudah tersimpan dan
memiliki menu yang sama, respons menandai `isFullyUnique: false` serta
memberikan peringatan. Menu yang dipilih melalui fitur penggantian dari halaman
mingguan juga mengecualikan seluruh menu lain dalam paket.

### Alternatif pengganti menu

Endpoint `/recommendations/daily/alternatives` menggunakan filter dan bobot
skor yang sama dengan rekomendasi harian. Endpoint menerima query berikut:

| Parameter | Wajib | Keterangan |
| --- | --- | --- |
| `date` | Tidak | Tanggal kalender `YYYY-MM-DD`; aplikasi mobile mengirim tanggal lokal |
| `meal_type` | Ya | `breakfast`, `lunch`, `dinner`, atau `snack` |
| `current_menu_id` | Ya | ID menu yang sedang digunakan pada slot tersebut |
| `excluded_menu_ids` | Tidak | Maksimal 600 ID dipisahkan koma, termasuk alternatif yang sudah ditampilkan |
| `excluded_ingredients` | Tidak | Maksimal 8 filter bahan sementara dari interpretasi percakapan |
| `preferred_ingredients` | Tidak | Maksimal 8 preferensi bahan sementara dari interpretasi percakapan |
| `limit` | Tidak | Jumlah hasil 1–10, default 3 |

Backend selalu menggabungkan pengecualian client dengan menu aktif dan seluruh
menu rekomendasi deterministik pada tanggal tersebut. Karena itu alternatif
tidak mengembalikan menu aktif atau menu lain yang sudah dipakai pada hari yang
sama. Setiap hasil membawa target slot, menu, breakdown skor, selisih kalori,
preferensi yang cocok, alasan terstruktur, dan penanda `hasMore`. Dalam setiap
batch, backend memprioritaskan pasangan bahan utama yang berbeda sebelum
mengisi hasil dengan komposisi serupa. Aplikasi menambahkan alternatif dari
batch sebelumnya ke `excluded_menu_ids` saat pengguna memilih **Tampilkan
pilihan lain**. Jika tidak tersisa kandidat aman, API mengembalikan
`NO_SAFE_ALTERNATIVE`.

### Asisten penggantian berbasis percakapan

Endpoint percakapan menerima permintaan bahasa alami bersama konteks slot:

```json
{
  "date": "2026-07-28",
  "meal_type": "breakfast",
  "current_menu_id": "pilot-004",
  "excluded_menu_ids": [],
  "limit": 3,
  "message": "Saya ingin tanpa talas dan lebih banyak buah."
}
```

OpenRouter hanya mengubah `message` menjadi `excludedIngredients`,
`preferredIngredients`, dan `mealType`. Backend memvalidasi JSON Schema,
memastikan slot tidak berubah, lalu menerapkan hasilnya sebagai filter
sementara. Alergi, dislike, feedback, target kalori, status menu approved,
duplikasi harian/mingguan, scoring, dan pemilihan akhir tetap ditangani
recommendation engine deterministik.

Filter terstruktur dikirim kembali pada batch **Tampilkan pilihan lain** dan
saat menyimpan penggantian agar kandidat, skor, serta alasan tetap konsisten.
Permintaan percakapan tidak mengubah `user_profiles`.

Pemilihan alternatif disimpan secara transaksional melalui endpoint `PUT`
dengan body berikut:

```json
{
  "current_menu_id": "pilot-004",
  "replacement_menu_id": "pilot-005"
}
```

`current_menu_id` berfungsi sebagai kontrol konflik. Jika item sudah diganti
oleh request lain, backend mengembalikan `RECOMMENDATION_ITEM_CHANGED`.
Snapshot item menyimpan menu, skor, dan alasan pengganti serta memperbarui total
kalori paket harian.

### Penjelasan AI

Endpoint penjelasan memerlukan Bearer token dan body menu yang sedang aktif:

```json
{
  "menu_id": "pilot-004"
}
```

Backend mengambil snapshot rekomendasi milik pengguna, memastikan menu masih
cocok dengan tanggal dan slot, lalu hanya mengirim sinyal profil minimum,
target, data gizi terkurasi, skor, dan alasan terverifikasi ke OpenRouter.
Nama pengguna, email, ukuran tubuh, serta nama alergi dan dislike tidak ikut
dikirim.

Output model wajib mengikuti JSON Schema dan kembali divalidasi oleh backend.
Teks yang menghasilkan angka baru, klaim medis, atau jaminan keamanan ditolak.
Disclaimer ditetapkan backend, bukan oleh model. AI hanya menerangkan pilihan;
AI tidak dapat mengubah nilai gizi, mengganti menu, atau melewati filter
alergi/dislike. Karena `openrouter/free` dapat memilih model yang berbeda,
backend membatasi reasoning, menyediakan anggaran output yang cukup, dan
mencoba satu kali lagi jika penyedia mengembalikan respons sementara yang
kosong atau tidak lengkap.

### Riwayat rekomendasi

`GET /recommendations/history` mengembalikan snapshot milik pengguna dalam
urutan tanggal terbaru. Query `page` dimulai dari 1 dan `limit` dibatasi 1–50.
Setiap entri berisi empat item snapshot lengkap, sehingga riwayat tidak
bergantung pada kondisi katalog saat dibaca.

## Feedback pengguna

Endpoint feedback memerlukan Bearer access token:

```text
GET /api/v1/feedback/:menuId
PUT /api/v1/feedback/:menuId
```

Body `PUT` dapat mengirim satu atau beberapa status:

```json
{
  "liked": true,
  "disliked": false,
  "consumed": true
}
```

`liked` dan `disliked` saling eksklusif. Mengaktifkan salah satunya otomatis
menonaktifkan yang lain, sedangkan `consumed` berdiri sendiri. Mengirim `false`
akan membatalkan status terkait.

Menu dengan status `disliked` dikeluarkan sebagai filter keras ketika snapshot
rekomendasi untuk tanggal baru dibentuk. Snapshot tanggal yang sudah ada tidak
diubah. Status `liked` dan `consumed` disimpan serta dicatat pada
`appliedFeedbackRules` sebagai sinyal untuk versi scoring berikutnya, tetapi
belum menambah bobot skor `rule-based-v1`.

## API katalog menu

API katalog bersifat read-only dan hanya mengembalikan menu dengan status
`approved`. Endpoint ini tidak memerlukan Bearer token karena tidak mengakses
data personal pengguna.

```text
GET /api/v1/menus
GET /api/v1/menus/:identifier
```

`:identifier` dapat berupa ID atau slug menu. Endpoint daftar menerima parameter
query berikut:

| Parameter | Keterangan |
| --- | --- |
| `page` | Halaman, default `1` |
| `limit` | Jumlah menu per halaman, default `20`, maksimum `100` |
| `search` | Pencarian sebagian nama menu, maksimum 100 karakter |
| `meal_type` | `breakfast`, `lunch`, `dinner`, `snack`, atau `all_day` |
| `min_calories` | Batas minimum energi per porsi |
| `max_calories` | Batas maksimum energi per porsi |

Contoh:

```text
GET /api/v1/menus?page=1&limit=20&meal_type=breakfast
GET /api/v1/menus?search=ubi&min_calories=250&max_calories=400
GET /api/v1/menus/pilot-003
GET /api/v1/menus/ubi-kuning-yoghurt-dan-apel
```

Respons daftar berisi ringkasan menu, makronutrien utama, tag, alergen, serta
metadata pagination. Respons detail juga memuat seluruh nilai gizi TKPI, bahan
dan beratnya, peran komponen, kategori pangan, bukti alergen, sumber nilai gizi,
serta versi kalkulasi. Filter dapat digabungkan dan hasil selalu diurutkan
berdasarkan nama lalu ID agar pagination stabil.

## Katalog pangan TKPI dan menu pilot

Migrasi versi 5 menyediakan tabel:

- `food_categories` dan `food_ingredients` untuk referensi komposisi pangan.
- `menus` dan `menu_ingredients` untuk porsi serta komponen menu.
- `menu_nutrition` untuk hasil perhitungan gizi per porsi.
- `menu_tags`, `menu_allergens`, dan `menu_reviews` untuk kebutuhan kurasi.
- `menu_component_signatures` untuk menolak nama, komposisi berbobot, dan
  kelompok bahan yang duplikat.

Importer membaca semua berkas JSON pada `data/tkpi-json`, memvalidasi struktur,
dan melakukan upsert berdasarkan kode TKPI. Nilai `null` dipertahankan sebagai
data tidak tersedia dan tidak dikonversi menjadi nol.

Jalankan impor referensi saja:

```bash
npm run db:import-tkpi
```

Impor referensi sekaligus membuat ulang dan menyetujui 14 menu pilot:

```bash
npm run db:seed-pilot
npm run db:validate-foods
```

Perintah seed bersifat idempoten, langsung menjalankan kurasi, dan tidak
menimpa menu yang sudah berstatus `approved`. Nilai gizi menu menggunakan rumus
bobot komponen:

```text
nilai komponen = berat gram / 100 × nilai TKPI per 100 gram
```

Validasi otomatis memeriksa jumlah sumber, relasi komponen, ukuran porsi,
kelengkapan makronutrien, dan konsistensi hasil kalkulasi. Review terstruktur
versi 1 meloloskan 14 menu. Sebanyak 11 kandidat pilot yang tidak lolos telah
dihapus dari katalog aktif. Status `approved` merupakan gerbang kurasi dataset
edukatif, bukan sertifikasi klinis. Lembar pemeriksaan tersedia di
[`data/menu-pilot-review.md`](../data/menu-pilot-review.md).

Batch 2 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-02
npm run db:review-batch-02
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dan seluruhnya lolos kurasi. Database
memastikan nama ter-normalisasi, komposisi kode TKPI beserta berat, dan kelompok
bahan tidak dapat diduplikasi. Daftar lengkap tersedia di
[`data/menu-batch-02-review.md`](../data/menu-batch-02-review.md).

Batch 3 menggunakan alur yang sama:

```bash
npm run db:seed-batch-03
npm run db:review-batch-03
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik lainnya dan seluruhnya lolos kurasi. Setelah
Batch 3, katalog memiliki 134 menu dan seluruhnya berstatus `approved`. Daftar
lengkap dan rentang gizinya tersedia di
[`data/menu-batch-03-review.md`](../data/menu-batch-03-review.md).

Batch 4 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-04
npm run db:review-batch-04
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dan seluruhnya lolos kurasi. Setelah Batch 4,
katalog memiliki 194 menu dan seluruhnya berstatus `approved`. Daftar lengkap
dan rentang gizinya tersedia di
[`data/menu-batch-04-review.md`](../data/menu-batch-04-review.md).

Batch 5 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-05
npm run db:review-batch-05
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dengan perluasan pilihan buah dan sayuran.
Seluruhnya lolos kurasi. Setelah Batch 5, katalog memiliki 254 menu dan
seluruhnya berstatus `approved`. Daftar lengkap dan rentang gizinya tersedia di
[`data/menu-batch-05-review.md`](../data/menu-batch-05-review.md).

Batch 6 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-06
npm run db:review-batch-06
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dengan perluasan buah dan sayur olahan
daerah dari TKPI. Seluruhnya lolos kurasi. Setelah Batch 6, katalog memiliki
314 menu dan seluruhnya berstatus `approved`. Daftar lengkap dan rentang
gizinya tersedia di
[`data/menu-batch-06-review.md`](../data/menu-batch-06-review.md).

Batch 7 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-07
npm run db:review-batch-07
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dengan tambahan buah serta sayuran segar
TKPI. Seluruhnya lolos kurasi. Setelah Batch 7, katalog memiliki 374 menu dan
seluruhnya berstatus `approved`. Daftar lengkap dan rentang gizinya tersedia di
[`data/menu-batch-07-review.md`](../data/menu-batch-07-review.md).

Batch 8 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-08
npm run db:review-batch-08
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dengan tambahan buah serta sayuran segar
TKPI. Seluruhnya lolos kurasi. Setelah Batch 8, katalog memiliki 434 menu dan
seluruhnya berstatus `approved`. Daftar lengkap dan rentang gizinya tersedia di
[`data/menu-batch-08-review.md`](../data/menu-batch-08-review.md).

Batch 9 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-09
npm run db:review-batch-09
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dengan tambahan varietas mangga lokal dan
daun sayuran TKPI. Seluruhnya lolos kurasi. Setelah Batch 9, katalog memiliki
494 menu dan seluruhnya berstatus `approved`. Daftar lengkap dan rentang gizinya
tersedia di
[`data/menu-batch-09-review.md`](../data/menu-batch-09-review.md).

Batch 10 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-10
npm run db:review-batch-10
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dan seluruhnya lolos kurasi. Setelah Batch
10, katalog memiliki 554 menu dan seluruhnya berstatus `approved`. Daftar
lengkap dan rentang gizi Batch 10 tersedia di
[`data/menu-batch-10-review.md`](../data/menu-batch-10-review.md).

Batch 11 dapat dibuat dan diperiksa dengan:

```bash
npm run db:seed-batch-11
npm run db:review-batch-11
npm run db:validate-foods
```

Batch ini menambahkan 60 menu unik dan seluruhnya lolos kurasi. Setelah Batch
11, katalog memiliki 614 menu dan seluruhnya berstatus `approved`. Target
minimum 600 approved telah dilampaui sebanyak 14 menu. Daftar lengkap dan
rentang gizinya tersedia di
[`data/menu-batch-11-review.md`](../data/menu-batch-11-review.md).

## Struktur awal

```text
src/
├── config/       # Environment dan logger
├── database/     # Koneksi SQLite dan migrasi
├── domain/       # Tipe dan kontrak domain
├── errors/       # Jenis error aplikasi
├── middleware/   # HTTP middleware
├── repositories/ # Akses data SQLite
├── routes/       # Definisi route
├── services/     # Aturan bisnis, password, dan token
├── types/        # Type augmentation
├── app.ts        # Konfigurasi Express
└── server.ts     # Lifecycle server
```
