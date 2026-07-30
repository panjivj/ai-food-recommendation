# Lampiran A — Daftar Artefak Eksperimen

Lampiran ini mencatat dataset, source code, hasil antara, model, metrik, dan
visualisasi yang digunakan dalam laporan. Seluruh path dinyatakan relatif
terhadap root repositori.

## A.1 Ringkasan Pipeline

| Tahap | Source code | Masukan utama | Keluaran utama |
|---|---|---|---|
| Diagram penelitian | [`ml/research_flow.py`](../ml/research_flow.py) | Urutan pipeline eksperimen aktual | `research_flow.png` |
| Ekspor dataset | [`ml/export_dataset.py`](../ml/export_dataset.py) | `backend/storage/app.db` | `menu_ml.csv` dan audit dataset |
| Preprocessing | [`ml/preprocessing.py`](../ml/preprocessing.py) | `menu_ml.csv` | `train.csv`, `test.csv`, dan audit preprocessing |
| EDA | [`ml/eda.py`](../ml/eda.py) | Data latih dan distribusi kelas | Statistik, tabel, dan empat jenis visualisasi |
| Baseline | [`ml/baseline.py`](../ml/baseline.py) | Data latih | Hasil cross-validation tiga model |
| Grid Search | [`ml/tuning.py`](../ml/tuning.py) | Data latih dan hasil baseline | Konfigurasi terbaik dan model final |
| Evaluasi final | [`ml/evaluation.py`](../ml/evaluation.py) | Model beku dan test set | Metrik final, prediksi, confusion matrix, dan ROC |
| Explainable AI | [`ml/explainability.py`](../ml/explainability.py) | Model beku | Ranking dan grafik feature importance |

Kolom `menu_id` dan `menu_name` hanya dipertahankan untuk keterlacakan. Keduanya
tidak menjadi fitur model.

## A.2 Dataset dan Split

| Artefak | Isi | Jumlah baris | SHA-256 |
|---|---|---:|---|
| [`ml/data/menu_ml.csv`](../ml/data/menu_ml.csv) | Dataset hasil ekspor dan cleaning | 614 | `af47859002d6c0bf282c88762d852076113cb729d6621bdd9ec2c50ddf8fbfa6` |
| [`ml/data/train.csv`](../ml/data/train.csv) | Data latih mentah hasil stratified split | 491 | `a6c47cd8ac7dcf7c5c1f83bab802db654a3675a88129f35c1a3ecda61a64ac5d` |
| [`ml/data/test.csv`](../ml/data/test.csv) | Held-out test set mentah | 123 | `7de5d1684d5978e8117ab41cd07de43c09315ac472783b08ddc9e996c5f7b129` |

Skema dataset dan penjelasan setiap kolom tersedia pada
[`ml/DATASET.md`](../ml/DATASET.md). Dependency Python yang dikunci tersedia
pada [`ml/requirements.txt`](../ml/requirements.txt).

## A.3 Audit Dataset dan Preprocessing

| Artefak | Fungsi |
|---|---|
| [`ml/outputs/dataset_audit.json`](../ml/outputs/dataset_audit.json) | Audit terstruktur terhadap sumber, skema, missing value, duplikasi, dan distribusi kelas |
| [`ml/outputs/dataset_audit.md`](../ml/outputs/dataset_audit.md) | Ringkasan audit dataset yang dapat dibaca |
| [`ml/outputs/preprocessing_audit.json`](../ml/outputs/preprocessing_audit.json) | Konfigurasi split, hash data, distribusi kelas, imputasi, scaling, dan outlier |
| [`ml/outputs/preprocessing_audit.md`](../ml/outputs/preprocessing_audit.md) | Ringkasan preprocessing yang dapat dibaca |

Audit preprocessing mencatat bahwa pembagian data menggunakan stratifikasi,
rasio sekitar 80:20, dan `random_state=42`. Statistik imputasi dan scaling
dipelajari dari data latih.

## A.4 Exploratory Data Analysis

| Artefak | Fungsi |
|---|---|
| [`ml/outputs/eda_summary.json`](../ml/outputs/eda_summary.json) | Ringkasan EDA terstruktur |
| [`ml/outputs/eda_summary.md`](../ml/outputs/eda_summary.md) | Ringkasan EDA yang dapat dibaca |
| [`ml/outputs/eda/descriptive_statistics.csv`](../ml/outputs/eda/descriptive_statistics.csv) | Statistik deskriptif fitur numerik |
| [`ml/outputs/eda/correlation_matrix.csv`](../ml/outputs/eda/correlation_matrix.csv) | Matriks korelasi Pearson |
| [`ml/outputs/eda/per_class_medians.csv`](../ml/outputs/eda/per_class_medians.csv) | Median fitur menurut kelas |
| [`ml/outputs/eda/histogram_fitur.png`](../ml/outputs/eda/histogram_fitur.png) | Histogram tujuh fitur numerik |
| [`ml/outputs/eda/correlation_matrix.png`](../ml/outputs/eda/correlation_matrix.png) | Visualisasi correlation matrix |
| [`ml/outputs/eda/boxplot_per_kelas.png`](../ml/outputs/eda/boxplot_per_kelas.png) | Boxplot fitur menurut kelas |
| [`ml/outputs/eda/class_distribution.png`](../ml/outputs/eda/class_distribution.png) | Distribusi empat kelas target |

EDA fitur menggunakan data latih. Dataset lengkap hanya digunakan untuk
menampilkan distribusi kelas yang telah diketahui setelah stratified split.

## A.5 Pemodelan Baseline

| Artefak | Fungsi |
|---|---|
| [`ml/outputs/baseline_results.json`](../ml/outputs/baseline_results.json) | Konfigurasi, hasil per fold, ringkasan metrik, dan model terpilih |
| [`ml/outputs/baseline_results.md`](../ml/outputs/baseline_results.md) | Ringkasan hasil baseline |
| [`ml/outputs/baseline_metrics.csv`](../ml/outputs/baseline_metrics.csv) | Rata-rata dan simpangan baku metrik tiga model |
| [`ml/outputs/baseline_fold_metrics.csv`](../ml/outputs/baseline_fold_metrics.csv) | Metrik setiap fold cross-validation |
| [`ml/outputs/baseline_f1_cv.png`](../ml/outputs/baseline_f1_cv.png) | Perbandingan F1-macro baseline |

Tiga model yang dibandingkan adalah Decision Tree, Random Forest, dan Support
Vector Machine. Data uji tidak digunakan pada tahap ini.

## A.6 Hyperparameter Tuning dan Model Final

| Artefak | Fungsi |
|---|---|
| [`ml/outputs/tuning_results.json`](../ml/outputs/tuning_results.json) | Ruang pencarian, parameter terbaik, dan hasil cross-validation |
| [`ml/outputs/tuning_results.md`](../ml/outputs/tuning_results.md) | Ringkasan Grid Search |
| [`ml/outputs/grid_search_results.csv`](../ml/outputs/grid_search_results.csv) | Hasil lengkap 216 kombinasi parameter |
| [`ml/outputs/tuning_comparison.csv`](../ml/outputs/tuning_comparison.csv) | Perbandingan Decision Tree sebelum dan sesudah tuning |
| [`ml/outputs/grid_search_top_f1.png`](../ml/outputs/grid_search_top_f1.png) | Sepuluh konfigurasi dengan F1-macro tertinggi |
| [`ml/artifacts/tuned_decision_tree.joblib`](../ml/artifacts/tuned_decision_tree.joblib) | Pipeline preprocessing, Decision Tree final, encoder target, dan metadata model |

SHA-256 model final:
`6cb0c572d29d43ac5ee5702efa444a928409dc1fedbfc1942102403de0d9b474`.

Konfigurasi model final adalah `criterion=entropy`, `max_depth=10`,
`min_samples_split=10`, `min_samples_leaf=4`, dan
`class_weight=balanced`.

## A.7 Evaluasi Final

| Artefak | Fungsi |
|---|---|
| [`ml/outputs/final_evaluation.json`](../ml/outputs/final_evaluation.json) | Protokol, versi lingkungan, hash masukan, seluruh metrik, dan confusion matrix |
| [`ml/outputs/final_evaluation.md`](../ml/outputs/final_evaluation.md) | Ringkasan evaluasi final |
| [`ml/outputs/final_metrics.csv`](../ml/outputs/final_metrics.csv) | Accuracy, precision-macro, recall-macro, F1-macro, dan ROC-AUC |
| [`ml/outputs/classification_report.csv`](../ml/outputs/classification_report.csv) | Precision, recall, F1-score, support, dan ROC-AUC setiap kelas |
| [`ml/outputs/confusion_matrix.csv`](../ml/outputs/confusion_matrix.csv) | Confusion matrix dalam jumlah data |
| [`ml/outputs/confusion_matrix_normalized.csv`](../ml/outputs/confusion_matrix_normalized.csv) | Confusion matrix yang dinormalisasi per kelas aktual |
| [`ml/outputs/test_predictions.csv`](../ml/outputs/test_predictions.csv) | Kelas aktual, kelas prediksi, status benar, dan probabilitas per baris |
| [`ml/outputs/confusion_matrix.png`](../ml/outputs/confusion_matrix.png) | Visualisasi confusion matrix |
| [`ml/outputs/roc_multiclass.png`](../ml/outputs/roc_multiclass.png) | Kurva ROC one-vs-rest untuk empat kelas |

Evaluasi final dilakukan satu kali pada 123 data uji tanpa `fit` ulang. Artefak
JSON mencatat `model_refit=false` dan `inference_calls=1`.

## A.8 Explainable AI

| Artefak | Fungsi |
|---|---|
| [`ml/outputs/feature_importance.json`](../ml/outputs/feature_importance.json) | Metode, keterbatasan, hash model, dan ranking importance |
| [`ml/outputs/feature_importance.md`](../ml/outputs/feature_importance.md) | Ringkasan feature importance |
| [`ml/outputs/feature_importance.csv`](../ml/outputs/feature_importance.csv) | Ranking tujuh fitur |
| [`ml/outputs/feature_importance.png`](../ml/outputs/feature_importance.png) | Grafik impurity-based feature importance |

Feature importance diekstrak dari model beku tanpa memuat test set. Nilainya
menjelaskan perilaku Decision Tree dan tidak menyatakan hubungan sebab-akibat.

## A.9 Pengujian dan Dokumentasi

| Artefak | Fungsi |
|---|---|
| [`ml/tests/test_preprocessing.py`](../ml/tests/test_preprocessing.py) | Pengujian cleaning, split, encoding, dan pipeline |
| [`ml/tests/test_eda.py`](../ml/tests/test_eda.py) | Pengujian tabel dan cakupan EDA |
| [`ml/tests/test_baseline.py`](../ml/tests/test_baseline.py) | Pengujian model, scoring, pipeline, dan stratifikasi |
| [`ml/tests/test_tuning.py`](../ml/tests/test_tuning.py) | Pengujian ruang Grid Search |
| [`ml/tests/test_evaluation.py`](../ml/tests/test_evaluation.py) | Pengujian metrik, guard evaluasi, dan visual |
| [`ml/tests/test_explainability.py`](../ml/tests/test_explainability.py) | Pengujian feature importance dan integritas model |
| [`ml/README.md`](../ml/README.md) | Ringkasan alur eksperimen |
| [`laporan/draft-laporan.md`](draft-laporan.md) | Draft laporan utama |

Pada verifikasi terakhir, seluruh 25 unit test lulus.
