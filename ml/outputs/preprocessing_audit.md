# Audit Data Preprocessing

Dokumen ini dihasilkan otomatis oleh `ml/preprocessing.py`.

## Konfigurasi

- Dataset: `ml/data/menu_ml.csv`
- SHA-256 dataset: `af47859002d6c0bf282c88762d852076113cb729d6621bdd9ec2c50ddf8fbfa6`
- Pembagian data: 80% latih dan 20% uji
- Stratifikasi: `meal_type`
- Random state: `42`
- Imputasi: median yang dipelajari dari data latih
- Outlier: dipertahankan setelah validasi; dampaknya dikurangi dengan
  `RobustScaler`
- Scaling: `RobustScaler with quantile_range=(25, 75)`
- Encoding target: `LabelEncoder`

## Data Cleaning

| Pemeriksaan | Hasil |
|---|---:|
| Baris sebelum cleaning | 614 |
| Baris setelah cleaning | 614 |
| Baris dihapus | 0 |
| Duplikasi ID | 0 |
| Duplikasi nama | 0 |
| Duplikasi fitur dan target | 0 |
| Nilai nonfinite | 0 |
| Nilai negatif | 0 |

## Stratified Train-Test Split

- Data latih: 491 baris (79.9674%)
- Data uji: 123 baris (20.0326%)
- ID yang muncul pada kedua subset: 0

| Kelas | Latih | Uji | Total |
|---|---|---|---|
| breakfast | 122 | 31 | 153 |
| dinner | 147 | 37 | 184 |
| lunch | 148 | 37 | 185 |
| snack | 74 | 18 | 92 |

## Imputasi dan Scaling

Parameter pada tabel berikut dipelajari hanya dari data latih. Transformasi ini
merupakan validasi awal; pelatihan model harus membuat pipeline baru di dalam
cross-validation.

| Fitur | Kosong total | Kosong latih | Kosong uji | Median imputasi | Pusat scaler | Skala IQR |
|---|---|---|---|---|---|---|
| serving_size_g | 0 | 0 | 0 | 495.0 | 495.0 | 180.0 |
| energy_kcal | 0 | 0 | 0 | 434.6 | 434.6 | 173.775 |
| protein_g | 0 | 0 | 0 | 19.53 | 19.53 | 14.965 |
| fat_g | 0 | 0 | 0 | 5.6 | 5.6 | 8.04 |
| carbohydrate_g | 0 | 0 | 0 | 70.36 | 70.36 | 20.725 |
| fiber_g | 122 | 99 | 23 | 6.03 | 6.03 | 3.375 |
| sodium_mg | 0 | 0 | 0 | 68.2 | 68.2 | 132.925 |

Setelah preview transform, jumlah nilai kosong pada data latih adalah
0 dan pada data uji adalah
0.

## Pemeriksaan Outlier

| Fitur | Batas bawah | Batas atas | Jumlah | Persentase |
|---|---|---|---|---|
| serving_size_g | 60.0 | 780.0 | 0 | 0.0000% |
| energy_kcal | 67.1625 | 766.4625 | 0 | 0.0000% |
| protein_g | -11.11125 | 47.35875 | 3 | 0.4886% |
| fat_g | -9.81375 | 21.59625 | 10 | 1.6287% |
| carbohydrate_g | 31.875 | 113.195 | 53 | 8.6319% |
| fiber_g | -3.41375 | 16.37625 | 21 | 4.2683% |
| sodium_mg | -168.2 | 363.4 | 40 | 6.5147% |

Kandidat outlier tidak dihapus karena audit tidak menemukan nilai negatif,
nonfinite, atau pelanggaran ukuran porsi. Nilai tersebut tetap harus dibahas
sebagai variasi data terkurasi, bukan langsung dianggap kesalahan.

## Encoding Target

| Kelas | Kode |
|---|---|
| breakfast | 0 |
| dinner | 1 |
| lunch | 2 |
| snack | 3 |

## Pencegahan Data Leakage

- Pembagian data dilakukan sebelum imputer atau scaler di-fit.
- menu_id dan menu_name dikeluarkan dari transformer fitur.
- Statistik imputer dan scaler hanya dipelajari dari baris data latih.
- Berkas train dan test mentah diekspor; array hasil transformasi tidak digunakan ulang untuk cross-validation.
- Pipeline model harus memuat preprocessor baru agar setiap fold cross-validation mempelajari statistiknya sendiri.

## Lingkungan

- Python: `3.12.3`
- NumPy: `2.5.1`
- pandas: `3.0.5`
- scikit-learn: `1.9.0`
