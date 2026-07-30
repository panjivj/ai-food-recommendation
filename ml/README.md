# Eksperimen Machine Learning

Folder ini berisi artefak untuk eksperimen klasifikasi waktu makan menu.

## Ekspor dan audit dataset

Jalankan dari root repositori:

```bash
python3 ml/export_dataset.py
```

Perintah tersebut membaca menu berstatus `approved` dari
`backend/storage/app.db`, kemudian menghasilkan:

- `ml/data/menu_ml.csv`: dataset eksperimen;
- `ml/outputs/dataset_audit.json`: hasil audit terstruktur;
- `ml/outputs/dataset_audit.md`: hasil audit yang dapat dibaca.

Dataset menyimpan `menu_id` dan `menu_name` hanya untuk keterlacakan. Kedua
kolom tersebut tidak boleh digunakan sebagai fitur model.

Fitur kandidat awal:

- `serving_size_g`;
- `energy_kcal`;
- `protein_g`;
- `fat_g`;
- `carbohydrate_g`;
- `fiber_g`;
- `sodium_mg`.

Target klasifikasi adalah `meal_type`.

Nilai kosong dipertahankan pada hasil ekspor. Imputasi dan transformasi lain
harus dilakukan melalui pipeline yang hanya di-fit pada data pelatihan untuk
mencegah data leakage.

## Data preprocessing

Siapkan lingkungan Python terisolasi dan pasang dependency:

```bash
python3 -m venv .tmp/ml-venv
.tmp/ml-venv/bin/python -m pip install -r ml/requirements.txt
```

Jalankan preprocessing:

```bash
.tmp/ml-venv/bin/python ml/preprocessing.py
```

Proses tersebut menghasilkan:

- `ml/data/train.csv`: data latih mentah hasil stratified split;
- `ml/data/test.csv`: data uji mentah hasil stratified split;
- `ml/outputs/preprocessing_audit.json`: audit terstruktur;
- `ml/outputs/preprocessing_audit.md`: ringkasan audit.

Kebijakan preprocessing:

- validasi skema, tipe, kelas, duplikasi, dan rentang nilai;
- imputasi median untuk missing value yang dipelajari dari data latih;
- kandidat outlier yang valid dipertahankan;
- `RobustScaler` digunakan untuk mengurangi sensitivitas terhadap outlier;
- target dienkode dengan `LabelEncoder`;
- pembagian 80:20 menggunakan stratifikasi dan `random_state=42`.

CSV hasil split sengaja belum diimputasi atau di-scaling. Model harus membuat
pipeline preprocessing baru di dalam proses cross-validation agar statistik
setiap fold hanya dipelajari dari bagian latih fold tersebut.

Jalankan pengujian:

```bash
.tmp/ml-venv/bin/python -m unittest discover -s ml/tests -v
```

## Exploratory Data Analysis

Jalankan EDA setelah preprocessing:

```bash
.tmp/ml-venv/bin/python ml/eda.py
```

EDA fitur menggunakan data latih saja agar data uji tetap terisolasi. Proses
tersebut menghasilkan:

- histogram tujuh fitur numerik;
- correlation matrix Pearson;
- boxplot setiap fitur menurut kelas;
- class distribution dataset lengkap;
- tabel statistik deskriptif, korelasi, dan median per kelas;
- ringkasan terstruktur pada `ml/outputs/eda_summary.json`;
- ringkasan yang dapat dibaca pada `ml/outputs/eda_summary.md`.

Missing value tidak diimputasi untuk visualisasi EDA. Histogram dan boxplot
menggunakan nilai yang tersedia, sedangkan korelasi dihitung secara pairwise.

## Pemodelan baseline

Bandingkan Decision Tree, Random Forest, dan Support Vector Machine:

```bash
.tmp/ml-venv/bin/python ml/baseline.py
```

Perbandingan menggunakan 5-fold stratified cross-validation pada data latih
saja. Model baseline terbaik dipilih berdasarkan rata-rata F1-macro. Data uji
tidak digunakan sebelum hyperparameter tuning selesai.

Artefak yang dihasilkan:

- `ml/outputs/baseline_results.md`;
- `ml/outputs/baseline_results.json`;
- `ml/outputs/baseline_metrics.csv`;
- `ml/outputs/baseline_fold_metrics.csv`;
- `ml/outputs/baseline_f1_cv.png`.

## Hyperparameter tuning

Jalankan Grid Search pada Decision Tree yang terpilih:

```bash
.tmp/ml-venv/bin/python ml/tuning.py
```

Grid Search menggunakan 216 kombinasi parameter dan 5-fold stratified
cross-validation dengan F1-macro sebagai scoring. Data uji tetap tidak
digunakan.

Artefak yang dihasilkan:

- `ml/outputs/tuning_results.md`;
- `ml/outputs/tuning_results.json`;
- `ml/outputs/grid_search_results.csv`;
- `ml/outputs/tuning_comparison.csv`;
- `ml/outputs/grid_search_top_f1.png`;
- `ml/artifacts/tuned_decision_tree.joblib`.

## Evaluasi final

Evaluasi model beku satu kali pada held-out test set:

```bash
.tmp/ml-venv/bin/python ml/evaluation.py
```

Skrip memanggil `predict_proba` satu kali, memperoleh prediksi kelas dari
probabilitas tertinggi, dan tidak melakukan `fit` ulang. Guard akan menolak
eksekusi apabila artefak evaluasi final sudah ada. Opsi `--overwrite` tersedia
hanya untuk penggantian hasil yang benar-benar disengaja, bukan untuk
mengulang eksperimen berdasarkan performa test set.

Artefak yang dihasilkan:

- `ml/outputs/final_evaluation.md` dan `.json`;
- `ml/outputs/final_metrics.csv`;
- `ml/outputs/classification_report.csv`;
- `ml/outputs/confusion_matrix.csv` dan versi ternormalisasi;
- `ml/outputs/test_predictions.csv`;
- `ml/outputs/confusion_matrix.png`;
- `ml/outputs/roc_multiclass.png`.

## Explainable AI

Ekstrak feature importance dari Decision Tree final:

```bash
.tmp/ml-venv/bin/python ml/explainability.py
```

Proses menggunakan atribut `feature_importances_` pada model beku dan tidak
memuat held-out test set. Nilainya merepresentasikan kontribusi relatif setiap
fitur terhadap total penurunan impurity, bukan hubungan sebab-akibat.

Artefak yang dihasilkan:

- `ml/outputs/feature_importance.md` dan `.json`;
- `ml/outputs/feature_importance.csv`;
- `ml/outputs/feature_importance.png`.
