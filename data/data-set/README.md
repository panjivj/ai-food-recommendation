# Paket Dataset Penelitian dan Aplikasi

Folder ini mengumpulkan salinan dataset yang digunakan dalam penelitian
klasifikasi waktu makan dan pengembangan aplikasi rekomendasi makanan. Seluruh
path di bawah dinyatakan relatif terhadap folder `data/data-set/`.

## Struktur

```text
data-set/
├── README.md
├── SHA256SUMS.txt
├── penelitian/
│   ├── menu_ml.csv
│   ├── train.csv
│   └── test.csv
├── aplikasi/
│   ├── food_categories.csv
│   ├── food_ingredients.csv
│   ├── menus.csv
│   ├── menu_ingredients.csv
│   ├── menu_nutrition.csv
│   ├── menu_allergens.csv
│   └── menu_tags.csv
└── sumber-tkpi/
    ├── Tabel Komposisi Pangan Indonesia 2017.pdf
    └── tkpi-json/
        └── 12 berkas JSON kategori pangan
```

## 1. Dataset Penelitian

`penelitian/menu_ml.csv` adalah dataset utama eksperimen machine learning.
Dataset memuat 614 menu, tujuh fitur numerik, dua kolom metadata untuk
keterlacakan, dan target `meal_type`.

| Berkas | Baris data | Keterangan |
|---|---:|---|
| `menu_ml.csv` | 614 | Dataset lengkap hasil ekspor menu berstatus `approved` |
| `train.csv` | 491 | Data latih mentah hasil stratified split |
| `test.csv` | 123 | Held-out test set mentah |

Kolom dataset penelitian:

- `menu_id` dan `menu_name`: metadata, tidak digunakan sebagai fitur model;
- `serving_size_g`;
- `energy_kcal`;
- `protein_g`;
- `fat_g`;
- `carbohydrate_g`;
- `fiber_g`;
- `sodium_mg`;
- `meal_type`: target dengan kelas `breakfast`, `dinner`, `lunch`, dan
  `snack`.

Split menggunakan proporsi 80:20, stratifikasi kelas, dan `random_state=42`.
CSV split masih berupa data mentah. Imputasi median dan `RobustScaler`
dijalankan di dalam pipeline model agar tidak terjadi data leakage.

## 2. Dataset Katalog Aplikasi

Folder `aplikasi/` merupakan ekspor CSV dari tabel katalog nonpengguna pada
`backend/storage/app.db`. Hanya 614 menu berstatus `approved` yang diekspor.

| Berkas | Baris data | Isi |
|---|---:|---|
| `food_categories.csv` | 12 | Kelompok pangan TKPI |
| `food_ingredients.csv` | 1.145 | Referensi bahan pangan dan komposisi per 100 gram |
| `menus.csv` | 614 | Metadata menu yang telah disetujui |
| `menu_ingredients.csv` | 2.120 | Relasi menu–bahan, berat, dan peran komponen |
| `menu_nutrition.csv` | 614 | Hasil kalkulasi kandungan gizi setiap menu |
| `menu_allergens.csv` | 345 | Penanda alergen menu |
| `menu_tags.csv` | 1.853 | Tag menu untuk filtering rekomendasi |

Relasi utamanya adalah:

- `food_ingredients.category_id` → `food_categories.id`;
- `menu_ingredients.menu_id` → `menus.id`;
- `menu_ingredients.food_ingredient_id` → `food_ingredients.id`;
- `menu_nutrition.menu_id`, `menu_allergens.menu_id`, dan
  `menu_tags.menu_id` → `menus.id`.

Tabel `users`, `user_profiles`, `recommendations`, `recommendation_items`, dan
`user_menu_feedback` sengaja tidak disertakan. Paket dataset ini tidak memuat
alamat surel pengguna, password hash, profil kesehatan pengguna, token, atau
riwayat rekomendasi personal.

## 3. Sumber TKPI

Nilai gizi bersumber dari *Tabel Komposisi Pangan Indonesia 2017*, Kementerian
Kesehatan Republik Indonesia, ISBN 978-602-416-407-2. Salinan dokumen sumber
tersedia pada `sumber-tkpi/Tabel Komposisi Pangan Indonesia 2017.pdf`.

Folder `sumber-tkpi/tkpi-json/` berisi hasil normalisasi 12 tabel kategori dari
dokumen TKPI yang digunakan oleh importer aplikasi. Nilai kosong dari sumber
dipertahankan sebagai `null`; nilai tersebut tidak boleh dianggap sama dengan
nol.

Sumber resmi TKPI:

https://repository.kemkes.go.id/book/777

## Integritas Berkas

Hash SHA-256 seluruh berkas paket tersedia dalam `SHA256SUMS.txt`. Untuk
memeriksa integritas setelah folder disalin, jalankan dari dalam folder
`data-set`:

```bash
sha256sum --check SHA256SUMS.txt
```

## Batas Penggunaan

Dataset disiapkan untuk kebutuhan akademik dan reproduksi proyek. Label waktu
makan berasal dari proses kurasi menu, bukan observasi perilaku makan pengguna.
Dataset dan aplikasi tidak ditujukan untuk diagnosis atau pengganti konsultasi
dengan tenaga kesehatan.
