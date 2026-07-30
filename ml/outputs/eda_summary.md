# Ringkasan Exploratory Data Analysis

EDA fitur dilakukan pada 491 baris data latih. Data uji tidak digunakan untuk
membuat histogram, correlation matrix, boxplot, atau statistik deskriptif.
Distribusi kelas dataset lengkap ditampilkan karena target tersebut sudah
digunakan untuk stratified split.

## Statistik Deskriptif Data Latih

| Fitur | Terisi | Kosong | Rata-rata | Median | Minimum | Maksimum | Skewness |
|---|---|---|---|---|---|---|---|
| serving_size_g | 491 | 0 | 418.218 | 495.000 | 150.000 | 525.000 | -0.843 |
| energy_kcal | 491 | 0 | 407.815 | 434.600 | 104.400 | 637.250 | -0.690 |
| protein_g | 491 | 0 | 19.185 | 19.530 | 1.200 | 48.410 | 0.380 |
| fat_g | 491 | 0 | 6.814 | 5.600 | 0.280 | 34.060 | 1.154 |
| carbohydrate_g | 491 | 0 | 69.567 | 70.360 | 13.020 | 121.200 | -0.595 |
| fiber_g | 392 | 99 | 7.139 | 6.030 | 0.600 | 27.070 | 1.547 |
| sodium_mg | 491 | 0 | 113.990 | 68.200 | 2.000 | 678.450 | 1.531 |

## Sepuluh Korelasi Absolut Terbesar

| Fitur 1 | Fitur 2 | Korelasi Pearson |
|---|---|---|
| serving_size_g | energy_kcal | 0.866 |
| energy_kcal | protein_g | 0.822 |
| energy_kcal | carbohydrate_g | 0.790 |
| serving_size_g | protein_g | 0.784 |
| serving_size_g | carbohydrate_g | 0.671 |
| energy_kcal | fat_g | 0.635 |
| protein_g | fat_g | 0.583 |
| serving_size_g | fat_g | 0.517 |
| serving_size_g | sodium_mg | 0.477 |
| carbohydrate_g | fiber_g | 0.456 |

## Median Fitur per Kelas pada Data Latih

| Kelas | Porsi | Energi | Protein | Lemak | Karbohidrat | Serat | Natrium |
|---|---|---|---|---|---|---|---|
| breakfast | 330.000 | 344.000 | 11.085 | 1.660 | 69.255 | 5.750 | 29.250 |
| dinner | 515.000 | 485.200 | 24.730 | 8.355 | 76.120 | 7.650 | 125.400 |
| lunch | 510.000 | 496.500 | 24.210 | 9.130 | 75.010 | 6.940 | 136.200 |
| snack | 200.000 | 149.450 | 5.370 | 1.000 | 31.070 | 3.500 | 17.350 |

## Distribusi Kelas Dataset Lengkap

| Kelas | Jumlah | Persentase |
|---|---|---|
| breakfast | 153 | 24.9186% |
| dinner | 184 | 29.9674% |
| lunch | 185 | 30.1303% |
| snack | 92 | 14.9837% |

## Gambar

- histogram: `ml/outputs/eda/histogram_fitur.png`
- correlation_matrix: `ml/outputs/eda/correlation_matrix.png`
- boxplot: `ml/outputs/eda/boxplot_per_kelas.png`
- class_distribution: `ml/outputs/eda/class_distribution.png`

## Catatan Metodologis

- Histogram dan boxplot menggunakan nilai yang tersedia tanpa imputasi.
- Korelasi Pearson dihitung secara pairwise pada data latih.
- Korelasi tidak menyatakan hubungan sebab-akibat.
- Perbedaan distribusi antarkelas dapat mencerminkan proses kurasi dan
  pembentukan menu, sehingga harus dibahas sebagai keterbatasan generalisasi.
