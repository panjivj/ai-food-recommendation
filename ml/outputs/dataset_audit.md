# Audit Dataset Klasifikasi Menu

Dokumen ini dihasilkan otomatis oleh `ml/export_dataset.py`. Angka pada dokumen
ini berasal dari sumber SQLite yang dicatat pada bagian keterlacakan.

## Keterlacakan

- Waktu audit (UTC): `2026-07-29T15:16:35.950799+00:00`
- Database sumber: `backend/storage/app.db`
- SHA-256 database: `2d4780c177e3645131c988e884a99105e48471794f0ccd69900ac6a2b4f84747`
- Dataset hasil ekspor: `ml/data/menu_ml.csv`
- SHA-256 dataset: `af47859002d6c0bf282c88762d852076113cb729d6621bdd9ec2c50ddf8fbfa6`
- Seleksi baris: `menus with curation_status = approved`
- Sumber nutrisi: `Tabel Komposisi Pangan Indonesia 2017`
- Versi kalkulasi: `tkpi-weighted-v1`

## Peran Kolom

Metadata yang tidak boleh digunakan sebagai fitur model:

- `menu_id`
- `menu_name`

Fitur kandidat:

- `serving_size_g`
- `energy_kcal`
- `protein_g`
- `fat_g`
- `carbohydrate_g`
- `fiber_g`
- `sodium_mg`

Target: `meal_type`

## Ringkasan Integritas

| Pemeriksaan | Hasil |
|---|---|
| Baris data | 614 |
| Kolom | 10 |
| ID menu unik | 614 |
| Nama menu unik | 614 |
| Duplikasi ID menu | 0 |
| Duplikasi nama ternormalisasi | 0 |
| Duplikasi fitur dan target | 0 |
| Duplikasi fitur tanpa melihat target | 0 |
| Kelas tidak terduga | [] |
| Kelas wajib yang tidak tersedia | [] |
| Ukuran porsi tidak valid | 0 |
| Jumlah nilai nonfinite | 0 |
| Jumlah nilai negatif | 0 |

## Distribusi Kelas

| Kelas | Jumlah | Persentase |
|---|---|---|
| breakfast | 153 | 24.9186% |
| lunch | 185 | 30.1303% |
| dinner | 184 | 29.9674% |
| snack | 92 | 14.9837% |

## Ringkasan Fitur Numerik

| Fitur | Terisi | Kosong | Kosong (%) | Minimum | Median | Maksimum | Kandidat outlier IQR |
|---|---|---|---|---|---|---|---|
| serving_size_g | 614 | 0 | 0.0000% | 130 | 497.5 | 525 | 0 |
| energy_kcal | 614 | 0 | 0.0000% | 104.4 | 432.65 | 637.25 | 0 |
| protein_g | 614 | 0 | 0.0000% | 1.2 | 19.5175 | 48.74 | 3 |
| fat_g | 614 | 0 | 0.0000% | 0.28 | 5.5 | 34.06 | 10 |
| carbohydrate_g | 614 | 0 | 0.0000% | 13.02 | 70.925 | 121.2 | 53 |
| fiber_g | 492 | 122 | 19.8697% | 0.6 | 6.03 | 27.07 | 21 |
| sodium_mg | 614 | 0 | 0.0000% | 2 | 69 | 678.45 | 40 |

Kandidat outlier dihitung menggunakan batas 1,5 × IQR. Angka ini merupakan
indikator untuk pemeriksaan domain dan bukan instruksi penghapusan otomatis.

## Peringatan Metodologis

- menu_id dan menu_name merupakan metadata keterlacakan dan tidak boleh digunakan sebagai fitur model.
- Outlier IQR merupakan kandidat pemeriksaan domain, bukan instruksi penghapusan otomatis; variasi gizi yang valid dapat memiliki nilai ekstrem.
- Label meal_type berasal dari kurasi menu, bukan perilaku pengguna yang diamati, sehingga klaim personalisasi harus dibatasi.
- Distribusi fitur dapat mencerminkan aturan pembentukan menu terkurasi; risiko leakage dan keterbatasan generalisasi harus dibahas.
