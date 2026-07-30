# Lampiran B — Petunjuk Reproduksi Eksperimen

Petunjuk ini digunakan untuk memverifikasi artefak yang telah tersedia atau
mereproduksi pipeline eksperimen dalam lingkungan terisolasi. Seluruh perintah
dijalankan dari root repositori:

```text
ai-food-recommendation/
```

## B.1 Prasyarat

Prasyarat minimum:

1. Python 3.12.
2. `venv` dan `pip`.
3. Database SQLite sumber pada `backend/storage/app.db`.
4. Ruang penyimpanan untuk dataset, model, tabel, dan gambar hasil eksperimen.

Versi dependency Python dikunci dalam `ml/requirements.txt`:

| Dependency | Versi |
|---|---:|
| joblib | 1.5.3 |
| matplotlib | 3.11.1 |
| NumPy | 2.5.1 |
| pandas | 3.0.5 |
| scikit-learn | 1.9.0 |
| seaborn | 0.13.2 |

Perbedaan versi Python atau dependency dapat menghasilkan perbedaan kecil pada
angka floating-point, serialisasi model, atau gambar.

## B.2 Menyiapkan Lingkungan

Buat virtual environment dan pasang dependency:

```bash
python3 -m venv .tmp/ml-venv
.tmp/ml-venv/bin/python -m pip install -r ml/requirements.txt
```

Periksa versi yang aktif:

```bash
.tmp/ml-venv/bin/python --version
.tmp/ml-venv/bin/python -m pip freeze
```

## B.3 Verifikasi Artefak yang Sudah Ada

Jalur ini disarankan untuk workspace utama karena tidak melatih model atau
menggunakan held-out test set kembali.

Jalankan seluruh unit test:

```bash
.tmp/ml-venv/bin/python -m unittest discover -s ml/tests -v
```

Hasil acuan saat lampiran dibuat adalah 25 test berstatus lulus.

Regenerasi diagram pipeline aktual:

```bash
.tmp/ml-venv/bin/python ml/research_flow.py
```

Keluaran diagram harus tersedia pada `ml/outputs/research_flow.png`.

Periksa hash artefak kritis:

```bash
sha256sum \
  ml/data/menu_ml.csv \
  ml/data/train.csv \
  ml/data/test.csv \
  ml/artifacts/tuned_decision_tree.joblib
```

Hash yang diharapkan:

```text
af47859002d6c0bf282c88762d852076113cb729d6621bdd9ec2c50ddf8fbfa6  ml/data/menu_ml.csv
a6c47cd8ac7dcf7c5c1f83bab802db654a3675a88129f35c1a3ecda61a64ac5d  ml/data/train.csv
7de5d1684d5978e8117ab41cd07de43c09315ac472783b08ddc9e996c5f7b129  ml/data/test.csv
6cb0c572d29d43ac5ee5702efa444a928409dc1fedbfc1942102403de0d9b474  ml/artifacts/tuned_decision_tree.joblib
```

Hasil terstruktur dapat diperiksa tanpa menjalankan ulang model:

```bash
.tmp/ml-venv/bin/python -m json.tool ml/outputs/baseline_results.json
.tmp/ml-venv/bin/python -m json.tool ml/outputs/tuning_results.json
.tmp/ml-venv/bin/python -m json.tool ml/outputs/final_evaluation.json
.tmp/ml-venv/bin/python -m json.tool ml/outputs/feature_importance.json
```

Jangan menjalankan `ml/evaluation.py` kembali di workspace utama. Skrip
memiliki guard yang akan menolak eksekusi ketika artefak evaluasi final sudah
tersedia.

## B.4 Reproduksi Pipeline dari Awal

Rerun penuh hanya dilakukan pada clone atau salinan workspace yang terpisah.
Tujuannya agar artefak laporan yang telah diverifikasi tidak tertimpa.

### B.4.1 Ekspor Dataset

```bash
.tmp/ml-venv/bin/python ml/export_dataset.py
```

Checkpoint:

- sumber: `backend/storage/app.db`;
- hanya menu berstatus `approved`;
- keluaran: 614 baris pada `ml/data/menu_ml.csv`;
- target: `meal_type`;
- fitur model: tujuh fitur numerik;
- `menu_id` dan `menu_name` hanya metadata.

### B.4.2 Preprocessing dan Split

```bash
.tmp/ml-venv/bin/python ml/preprocessing.py
```

Checkpoint:

- 491 data latih dan 123 data uji;
- tidak ada irisan `menu_id`;
- pembagian stratified dengan `random_state=42`;
- imputasi median dan `RobustScaler` dipelajari dari data latih;
- CSV hasil split tetap mentah agar transformasi terjadi di dalam pipeline.

### B.4.3 Exploratory Data Analysis

```bash
.tmp/ml-venv/bin/python ml/eda.py
```

Periksa keluaran pada `ml/outputs/eda/` dan ringkasan
`ml/outputs/eda_summary.json`. EDA fitur harus menggunakan data latih; test set
tidak digunakan untuk memilih fitur atau model.

### B.4.4 Pemodelan Baseline

```bash
.tmp/ml-venv/bin/python ml/baseline.py
```

Proses membandingkan Decision Tree, Random Forest, dan SVM dengan 5-fold
stratified cross-validation pada 491 data latih.

Hasil acuan:

| Model | Accuracy | F1-macro | ROC-AUC OVR macro |
|---|---:|---:|---:|
| Decision Tree | 0,9186 | 0,9311 | 0,9507 |
| Random Forest | 0,9165 | 0,9292 | 0,9803 |
| SVM | 0,7128 | 0,7451 | 0,9006 |

Decision Tree harus terpilih berdasarkan rata-rata F1-macro.

### B.4.5 Hyperparameter Tuning

```bash
.tmp/ml-venv/bin/python ml/tuning.py
```

Grid Search menjalankan 216 kombinasi dengan 5-fold cross-validation atau
1.080 proses fit. Parameter acuan:

```text
classifier__class_weight=balanced
classifier__criterion=entropy
classifier__max_depth=10
classifier__min_samples_leaf=4
classifier__min_samples_split=10
```

F1-macro cross-validation terbaik yang diharapkan adalah sekitar 0,9447.
Waktu eksekusi tidak digunakan sebagai syarat kesamaan karena bergantung pada
perangkat.

### B.4.6 Evaluasi Final

Evaluasi test set hanya dijalankan setelah seluruh pemilihan model dan tuning
selesai. Dalam workspace reproduksi, gunakan direktori keluaran baru dan
jangan gunakan `--overwrite`:

```bash
.tmp/ml-venv/bin/python ml/evaluation.py \
  --output-directory ml/reproduction/final
```

Skrip memuat model beku, memanggil `predict_proba` satu kali, dan tidak
melakukan `fit` ulang. Hasil acuan:

| Metrik | Nilai |
|---|---:|
| Accuracy | 0,9268 |
| Precision macro | 0,9427 |
| Recall macro | 0,9392 |
| F1-macro | 0,9389 |
| ROC-AUC OVR macro | 0,9714 |

Confusion matrix acuan, dengan baris sebagai kelas aktual dan kolom sebagai
kelas prediksi:

| Aktual \ Prediksi | `breakfast` | `dinner` | `lunch` | `snack` |
|---|---:|---:|---:|---:|
| `breakfast` | 31 | 0 | 0 | 0 |
| `dinner` | 0 | 30 | 7 | 0 |
| `lunch` | 0 | 2 | 35 | 0 |
| `snack` | 0 | 0 | 0 | 18 |

Opsi `--resume-from-predictions` hanya digunakan untuk memulihkan pembuatan
laporan atau gambar setelah kegagalan pascainferensi dan ketika cache prediksi
sudah tersedia. Opsi tersebut bukan cara untuk melakukan evaluasi baru.

### B.4.7 Explainable AI

Gunakan model hasil tuning dan direktori terpisah:

```bash
.tmp/ml-venv/bin/python ml/explainability.py \
  --output-directory ml/reproduction/xai
```

Checkpoint:

- total importance sama dengan 1;
- `serving_size_g` berada pada peringkat pertama;
- importance `serving_size_g` sekitar 0,9401;
- held-out test set tidak dimuat.

### B.4.8 Pengujian Akhir

```bash
.tmp/ml-venv/bin/python -m unittest discover -s ml/tests -v
```

Periksa bahwa tidak ada test yang gagal dan artefak model tetap dapat dimuat.

## B.5 Urutan Eksekusi

Urutan berikut tidak boleh ditukar:

```text
Database
  → ekspor dan audit dataset
  → preprocessing dan stratified split
  → EDA data latih
  → perbandingan baseline
  → Grid Search data latih
  → simpan model final
  → evaluasi held-out test set satu kali
  → feature importance dari model beku
```

Test set tidak digunakan untuk EDA fitur, pemilihan algoritma, Grid Search,
atau perubahan model.

## B.6 Kriteria Reproduksi

Reproduksi dianggap berhasil apabila:

1. Dataset, split, dan model dapat dibuat tanpa error.
2. Jumlah baris, kelas, fitur, dan parameter terbaik sesuai checkpoint.
3. Metrik yang dibulatkan empat desimal sesuai hasil acuan.
4. Confusion matrix sesuai hasil acuan.
5. Ranking feature importance memiliki urutan yang sama.
6. Seluruh unit test lulus.

Timestamp, waktu training, waktu Grid Search, metadata sistem, dan hash berkas
JSON atau gambar dapat berbeda. Perbedaan tersebut tidak dianggap kegagalan
selama data inti, konfigurasi, metrik, dan hasil prediksi tetap sesuai.

## B.7 Pemecahan Masalah

| Masalah | Pemeriksaan |
|---|---|
| Database tidak ditemukan | Pastikan `backend/storage/app.db` tersedia dan perintah dijalankan dari root repositori |
| Import package gagal | Pastikan interpreter yang digunakan adalah `.tmp/ml-venv/bin/python` dan instalasi requirements selesai |
| Hash data berbeda | Periksa apakah database sumber, cleaning, versi pandas, atau urutan ekspor berubah |
| Evaluasi final ditolak | Artefak final sudah ada; audit hasil yang ada atau gunakan workspace reproduksi terpisah |
| Metrik berbeda | Periksa hash train/test, versi scikit-learn, parameter, `random_state`, dan urutan kelas |
| Gambar berbeda tetapi angka sama | Periksa versi Matplotlib/seaborn; variasi rendering tidak selalu mengubah hasil numerik |
