# Dataset Klasifikasi Waktu Makan

## Tujuan

Dataset ini disiapkan untuk membandingkan model klasifikasi waktu makan menu.
Target `meal_type` memiliki empat kelas: `breakfast`, `lunch`, `dinner`, dan
`snack`.

## Sumber dan pembentukan

Dataset diekspor dari `backend/storage/app.db` menggunakan
`ml/export_dataset.py`. Hanya menu dengan `curation_status = approved` yang
dipilih. Nilai gizi menu pada database menggunakan sumber **Tabel Komposisi
Pangan Indonesia 2017** dan versi kalkulasi `tkpi-weighted-v1`.

Satu baris mewakili satu menu terkurasi. Dataset hasil ekspor memiliki 614 baris
dan 10 kolom. Seluruh 614 menu memiliki data nutrisi dan komponen pangan; menu
tersebut menggunakan 169 bahan pangan referensi yang berbeda.

## Peran kolom

| Kolom | Peran | Tipe | Keterangan |
|---|---|---|---|
| `menu_id` | Metadata | Teks | Identitas unik untuk keterlacakan; bukan fitur model |
| `menu_name` | Metadata | Teks | Nama menu untuk keterlacakan; bukan fitur model |
| `serving_size_g` | Fitur | Numerik | Berat porsi menu dalam gram |
| `energy_kcal` | Fitur | Numerik | Energi per porsi dalam kilokalori |
| `protein_g` | Fitur | Numerik | Protein per porsi dalam gram |
| `fat_g` | Fitur | Numerik | Lemak per porsi dalam gram |
| `carbohydrate_g` | Fitur | Numerik | Karbohidrat per porsi dalam gram |
| `fiber_g` | Fitur | Numerik | Serat per porsi dalam gram |
| `sodium_mg` | Fitur | Numerik | Natrium per porsi dalam miligram |
| `meal_type` | Target | Kategorikal | Kelas waktu makan hasil kurasi |

## Distribusi kelas

| Kelas | Jumlah | Persentase |
|---|---:|---:|
| `breakfast` | 153 | 24,9186% |
| `lunch` | 185 | 30,1303% |
| `dinner` | 184 | 29,9674% |
| `snack` | 92 | 14,9837% |
| **Total** | **614** | **100,0000%** |

## Temuan audit awal

- Seluruh ID dan nama menu unik.
- Tidak ada duplikasi berdasarkan gabungan tujuh fitur kandidat dan target.
- Tidak ada nilai negatif atau nonfinite pada fitur kandidat.
- Tidak ada ukuran porsi yang kosong atau tidak positif.
- Hanya `fiber_g` yang memiliki missing value, yaitu 122 baris atau 19,8697%.
- Pemeriksaan 1,5 × IQR menemukan kandidat outlier pada protein, lemak,
  karbohidrat, serat, dan natrium. Kandidat tersebut belum dihapus karena nilai
  gizi ekstrem dapat tetap valid.

Rincian angka, hash sumber, dan hash hasil ekspor tersedia pada
`ml/outputs/dataset_audit.md` dan `ml/outputs/dataset_audit.json`.

## Batasan

- Label waktu makan ditetapkan ketika menu dikurasi, bukan diperoleh dari
  perilaku makan pengguna.
- Fitur dan distribusi kelas dapat mencerminkan aturan yang digunakan ketika
  menu dibentuk.
- Hasil klasifikasi tidak boleh diklaim sebagai rekomendasi personal atau
  keputusan medis.
- `menu_id` dan `menu_name` harus dikeluarkan dari matriks fitur untuk mencegah
  model menghafal identitas menu.
