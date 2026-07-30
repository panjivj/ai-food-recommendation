# Evaluasi Final pada Held-out Test Set

Model Decision Tree hasil Grid Search dimuat dari artefak beku dan dievaluasi
satu kali pada 123 baris held-out test set.
Pipeline tidak di-fit ulang dan data uji tidak digunakan untuk mengubah model.

## Metrik Agregat

| Metrik | Nilai |
|---|---|
| accuracy | 0.9268 |
| precision_macro | 0.9427 |
| recall_macro | 0.9392 |
| f1_macro | 0.9389 |
| roc_auc_ovr_macro | 0.9714 |

## Classification Report dan ROC-AUC per Kelas

| Kelas | Precision | Recall | F1-score | Support | ROC-AUC OVR |
|---|---|---|---|---|---|
| breakfast | 1.0000 | 1.0000 | 1.0000 | 31 | 1.0000 |
| dinner | 0.9375 | 0.8108 | 0.8696 | 37 | 0.9312 |
| lunch | 0.8333 | 0.9459 | 0.8861 | 37 | 0.9543 |
| snack | 1.0000 | 1.0000 | 1.0000 | 18 | 1.0000 |

## Visualisasi

![Confusion matrix](confusion_matrix.png)

![Kurva ROC multiclass](roc_multiclass.png)

## Protokol

- Prediksi probabilitas dilakukan satu kali dari pipeline model yang telah
  di-fit pada data latih.
- Prediksi kelas diperoleh dari probabilitas tertinggi; tidak ada proses
  pelatihan, tuning, atau pemilihan threshold pada test set.
- Precision, recall, dan F1 agregat menggunakan macro average.
- ROC-AUC multiclass menggunakan skema one-vs-rest dengan macro average.
- Baris confusion matrix adalah kelas aktual dan kolomnya kelas prediksi.
