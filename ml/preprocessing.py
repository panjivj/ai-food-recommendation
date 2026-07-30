#!/usr/bin/env python3
"""Validate, split, and audit preprocessing for the menu ML dataset.

The exported train and test CSV files remain untransformed. Imputation and
scaling are represented as a scikit-learn pipeline so they can later be fitted
inside each cross-validation fold and avoid data leakage.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, RobustScaler


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = REPOSITORY_ROOT / "ml" / "data" / "menu_ml.csv"
DEFAULT_TRAIN = REPOSITORY_ROOT / "ml" / "data" / "train.csv"
DEFAULT_TEST = REPOSITORY_ROOT / "ml" / "data" / "test.csv"
DEFAULT_AUDIT_JSON = (
    REPOSITORY_ROOT / "ml" / "outputs" / "preprocessing_audit.json"
)
DEFAULT_AUDIT_MARKDOWN = (
    REPOSITORY_ROOT / "ml" / "outputs" / "preprocessing_audit.md"
)

METADATA_COLUMNS = ("menu_id", "menu_name")
FEATURE_COLUMNS = (
    "serving_size_g",
    "energy_kcal",
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "fiber_g",
    "sodium_mg",
)
TARGET_COLUMN = "meal_type"
EXPECTED_CLASSES = ("breakfast", "dinner", "lunch", "snack")
REQUIRED_COLUMNS = (*METADATA_COLUMNS, *FEATURE_COLUMNS, TARGET_COLUMN)
ALLOWED_MISSING_FEATURES = ("fiber_g",)
TEST_SIZE = 0.20
RANDOM_STATE = 42


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate and split the menu classification dataset.",
    )
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--train-output", type=Path, default=DEFAULT_TRAIN)
    parser.add_argument("--test-output", type=Path, default=DEFAULT_TEST)
    parser.add_argument(
        "--audit-json",
        type=Path,
        default=DEFAULT_AUDIT_JSON,
    )
    parser.add_argument(
        "--audit-markdown",
        type=Path,
        default=DEFAULT_AUDIT_MARKDOWN,
    )
    return parser.parse_args()


def display_path(path: Path) -> str:
    resolved = path.resolve()
    try:
        return str(resolved.relative_to(REPOSITORY_ROOT))
    except ValueError:
        return str(resolved)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_and_clean_dataset(dataset_path: Path) -> tuple[pd.DataFrame, dict[str, Any]]:
    if not dataset_path.is_file():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    dataframe = pd.read_csv(dataset_path)
    original_rows = len(dataframe)
    original_columns = list(dataframe.columns)

    missing_columns = sorted(set(REQUIRED_COLUMNS) - set(dataframe.columns))
    extra_columns = sorted(set(dataframe.columns) - set(REQUIRED_COLUMNS))
    if missing_columns:
        raise ValueError(f"Required columns are missing: {missing_columns}")
    if extra_columns:
        raise ValueError(f"Unexpected columns are present: {extra_columns}")

    dataframe = dataframe.loc[:, REQUIRED_COLUMNS].copy()

    for column in METADATA_COLUMNS:
        dataframe[column] = dataframe[column].astype("string").str.strip()
    dataframe[TARGET_COLUMN] = (
        dataframe[TARGET_COLUMN].astype("string").str.strip().str.lower()
    )

    blank_metadata = {
        column: int(dataframe[column].isna().sum() + dataframe[column].eq("").sum())
        for column in METADATA_COLUMNS
    }
    if any(blank_metadata.values()):
        raise ValueError(f"Blank metadata values found: {blank_metadata}")

    for column in FEATURE_COLUMNS:
        dataframe[column] = pd.to_numeric(dataframe[column], errors="raise")

    unexpected_classes = sorted(
        set(dataframe[TARGET_COLUMN].dropna()) - set(EXPECTED_CLASSES)
    )
    missing_classes = sorted(
        set(EXPECTED_CLASSES) - set(dataframe[TARGET_COLUMN].dropna())
    )
    if dataframe[TARGET_COLUMN].isna().any():
        raise ValueError("The target contains missing values")
    if unexpected_classes or missing_classes:
        raise ValueError(
            "Target class mismatch: "
            f"unexpected={unexpected_classes}, missing={missing_classes}"
        )

    nonfinite_counts = {
        column: int(
            (~np.isfinite(dataframe[column].dropna().to_numpy(dtype=float))).sum()
        )
        for column in FEATURE_COLUMNS
    }
    if any(nonfinite_counts.values()):
        raise ValueError(f"Nonfinite feature values found: {nonfinite_counts}")

    negative_counts = {
        column: int(dataframe[column].lt(0).sum())
        for column in FEATURE_COLUMNS
    }
    if any(negative_counts.values()):
        raise ValueError(f"Negative feature values found: {negative_counts}")
    if dataframe["serving_size_g"].le(0).any():
        raise ValueError("serving_size_g must be greater than zero")

    missing_counts = {
        column: int(dataframe[column].isna().sum())
        for column in FEATURE_COLUMNS
    }
    forbidden_missing = {
        column: count
        for column, count in missing_counts.items()
        if count > 0 and column not in ALLOWED_MISSING_FEATURES
    }
    if forbidden_missing:
        raise ValueError(
            f"Unexpected missing feature values found: {forbidden_missing}"
        )

    duplicate_id_count = int(dataframe.duplicated(["menu_id"]).sum())
    normalized_names = dataframe["menu_name"].str.casefold()
    duplicate_name_count = int(normalized_names.duplicated().sum())
    duplicate_row_count = int(
        dataframe.duplicated([*FEATURE_COLUMNS, TARGET_COLUMN]).sum()
    )
    if duplicate_id_count or duplicate_name_count or duplicate_row_count:
        raise ValueError(
            "Duplicate data found: "
            f"ids={duplicate_id_count}, names={duplicate_name_count}, "
            f"feature_target_rows={duplicate_row_count}"
        )

    dataframe = dataframe.sort_values("menu_id").reset_index(drop=True)
    cleaning = {
        "original_rows": original_rows,
        "final_rows": len(dataframe),
        "removed_rows": original_rows - len(dataframe),
        "original_columns": original_columns,
        "final_columns": list(dataframe.columns),
        "duplicate_menu_ids": duplicate_id_count,
        "duplicate_normalized_names": duplicate_name_count,
        "duplicate_feature_and_target_rows": duplicate_row_count,
        "nonfinite_values": nonfinite_counts,
        "negative_values": negative_counts,
        "missing_values": missing_counts,
        "normalization": [
            "Whitespace at the edges of menu_id and menu_name was removed.",
            "meal_type was stripped and normalized to lowercase.",
            "Feature columns were validated as numeric.",
        ],
    }
    return dataframe, cleaning


def stratified_split(
    dataframe: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    train_data, test_data = train_test_split(
        dataframe,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=dataframe[TARGET_COLUMN],
    )
    return (
        train_data.sort_values("menu_id").reset_index(drop=True),
        test_data.sort_values("menu_id").reset_index(drop=True),
    )


def build_numeric_preprocessor() -> ColumnTransformer:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            (
                "scaler",
                RobustScaler(
                    quantile_range=(25.0, 75.0),
                    with_centering=True,
                    with_scaling=True,
                ),
            ),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, list(FEATURE_COLUMNS)),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def encode_targets(
    train_target: pd.Series,
    test_target: pd.Series,
) -> tuple[LabelEncoder, np.ndarray, np.ndarray]:
    encoder = LabelEncoder()
    encoded_train = encoder.fit_transform(train_target)
    encoded_test = encoder.transform(test_target)
    if tuple(encoder.classes_) != EXPECTED_CLASSES:
        raise ValueError(
            f"Unexpected label mapping: {tuple(encoder.classes_)}"
        )
    return encoder, encoded_train, encoded_test


def iqr_outlier_summary(dataframe: pd.DataFrame) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for column in FEATURE_COLUMNS:
        values = dataframe[column].dropna()
        q1 = float(values.quantile(0.25))
        q3 = float(values.quantile(0.75))
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        mask = values.lt(lower_bound) | values.gt(upper_bound)
        result[column] = {
            "q1": round(q1, 6),
            "q3": round(q3, 6),
            "iqr": round(iqr, 6),
            "lower_bound": round(lower_bound, 6),
            "upper_bound": round(upper_bound, 6),
            "outlier_count": int(mask.sum()),
            "outlier_percent": round(float(mask.mean() * 100), 4),
        }
    return result


def class_distribution(dataframe: pd.DataFrame) -> dict[str, dict[str, Any]]:
    counts = Counter(dataframe[TARGET_COLUMN].tolist())
    total = len(dataframe)
    return {
        class_name: {
            "count": counts.get(class_name, 0),
            "percent": round(counts.get(class_name, 0) / total * 100, 4),
        }
        for class_name in EXPECTED_CLASSES
    }


def missing_distribution(dataframe: pd.DataFrame) -> dict[str, dict[str, Any]]:
    return {
        column: {
            "count": int(dataframe[column].isna().sum()),
            "percent": round(float(dataframe[column].isna().mean() * 100), 4),
        }
        for column in FEATURE_COLUMNS
    }


def write_dataframe(dataframe: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_csv(path, index=False, lineterminator="\n")


def fitted_preprocessor_details(
    preprocessor: ColumnTransformer,
) -> dict[str, dict[str, float]]:
    pipeline = preprocessor.named_transformers_["numeric"]
    imputer = pipeline.named_steps["imputer"]
    scaler = pipeline.named_steps["scaler"]
    return {
        column: {
            "imputation_median": round(float(imputer.statistics_[index]), 6),
            "robust_scaler_center": round(float(scaler.center_[index]), 6),
            "robust_scaler_scale": round(float(scaler.scale_[index]), 6),
        }
        for index, column in enumerate(FEATURE_COLUMNS)
    }


def build_audit(
    dataset_path: Path,
    train_path: Path,
    test_path: Path,
    dataframe: pd.DataFrame,
    train_data: pd.DataFrame,
    test_data: pd.DataFrame,
    cleaning: dict[str, Any],
    encoder: LabelEncoder,
    encoded_train: np.ndarray,
    encoded_test: np.ndarray,
    preprocessor: ColumnTransformer,
    transformed_train: np.ndarray,
    transformed_test: np.ndarray,
) -> dict[str, Any]:
    train_ids = set(train_data["menu_id"])
    test_ids = set(test_data["menu_id"])
    overlap = sorted(train_ids & test_ids)

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "environment": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "scikit_learn": sklearn.__version__,
        },
        "source": {
            "dataset": display_path(dataset_path),
            "dataset_sha256": sha256_file(dataset_path),
        },
        "outputs": {
            "train": display_path(train_path),
            "train_sha256": sha256_file(train_path),
            "test": display_path(test_path),
            "test_sha256": sha256_file(test_path),
        },
        "configuration": {
            "feature_columns": list(FEATURE_COLUMNS),
            "metadata_columns_not_for_model": list(METADATA_COLUMNS),
            "target_column": TARGET_COLUMN,
            "test_size": TEST_SIZE,
            "random_state": RANDOM_STATE,
            "stratified_by": TARGET_COLUMN,
            "missing_value_strategy": "median fitted on training data",
            "outlier_strategy": (
                "retain values that pass validity checks; use RobustScaler "
                "to reduce sensitivity"
            ),
            "scaling": "RobustScaler with quantile_range=(25, 75)",
            "target_encoding": "LabelEncoder fitted on training target",
        },
        "cleaning": cleaning,
        "split": {
            "total_rows": len(dataframe),
            "train_rows": len(train_data),
            "test_rows": len(test_data),
            "train_percent": round(len(train_data) / len(dataframe) * 100, 4),
            "test_percent": round(len(test_data) / len(dataframe) * 100, 4),
            "menu_id_overlap_count": len(overlap),
            "train_class_distribution": class_distribution(train_data),
            "test_class_distribution": class_distribution(test_data),
        },
        "missing_values": {
            "full": missing_distribution(dataframe),
            "train_before_imputation": missing_distribution(train_data),
            "test_before_imputation": missing_distribution(test_data),
            "train_after_preview_transform": int(
                np.isnan(transformed_train).sum()
            ),
            "test_after_preview_transform": int(
                np.isnan(transformed_test).sum()
            ),
        },
        "outliers": {
            "method": "1.5 x IQR, calculated before imputation and scaling",
            "decision": (
                "Retained because no domain-invalid or negative values were "
                "found; candidates are reported for transparency."
            ),
            "full": iqr_outlier_summary(dataframe),
            "train": iqr_outlier_summary(train_data),
            "test": iqr_outlier_summary(test_data),
        },
        "target_encoding": {
            "mapping": {
                class_name: int(encoder.transform([class_name])[0])
                for class_name in encoder.classes_
            },
            "encoded_train_min": int(encoded_train.min()),
            "encoded_train_max": int(encoded_train.max()),
            "encoded_test_min": int(encoded_test.min()),
            "encoded_test_max": int(encoded_test.max()),
        },
        "preview_transform": {
            "purpose": (
                "Validation only. Model selection must create a fresh "
                "preprocessor inside each estimator pipeline."
            ),
            "train_shape": list(transformed_train.shape),
            "test_shape": list(transformed_test.shape),
            "train_nonfinite_count": int(
                (~np.isfinite(transformed_train)).sum()
            ),
            "test_nonfinite_count": int(
                (~np.isfinite(transformed_test)).sum()
            ),
            "training_fitted_parameters": fitted_preprocessor_details(
                preprocessor
            ),
        },
        "leakage_controls": [
            "Pembagian data dilakukan sebelum imputer atau scaler di-fit.",
            (
                "menu_id dan menu_name dikeluarkan dari transformer fitur."
            ),
            (
                "Statistik imputer dan scaler hanya dipelajari dari baris "
                "data latih."
            ),
            (
                "Berkas train dan test mentah diekspor; array hasil "
                "transformasi tidak digunakan ulang untuk cross-validation."
            ),
            (
                "Pipeline model harus memuat preprocessor baru agar setiap "
                "fold cross-validation mempelajari statistiknya sendiri."
            ),
        ],
    }


def markdown_table(
    headers: Sequence[str],
    rows: Sequence[Sequence[Any]],
) -> str:
    header = "| " + " | ".join(headers) + " |"
    divider = "|" + "|".join("---" for _ in headers) + "|"
    body = [
        "| " + " | ".join(str(value) for value in row) + " |"
        for row in rows
    ]
    return "\n".join([header, divider, *body])


def render_audit_markdown(audit: dict[str, Any]) -> str:
    split = audit["split"]
    missing = audit["missing_values"]
    target_mapping = audit["target_encoding"]["mapping"]
    fitted = audit["preview_transform"]["training_fitted_parameters"]

    split_rows = []
    for class_name in EXPECTED_CLASSES:
        split_rows.append(
            (
                class_name,
                split["train_class_distribution"][class_name]["count"],
                split["test_class_distribution"][class_name]["count"],
                (
                    split["train_class_distribution"][class_name]["count"]
                    + split["test_class_distribution"][class_name]["count"]
                ),
            )
        )

    preprocessing_rows = [
        (
            column,
            missing["full"][column]["count"],
            missing["train_before_imputation"][column]["count"],
            missing["test_before_imputation"][column]["count"],
            fitted[column]["imputation_median"],
            fitted[column]["robust_scaler_center"],
            fitted[column]["robust_scaler_scale"],
        )
        for column in FEATURE_COLUMNS
    ]

    outlier_rows = [
        (
            column,
            details["lower_bound"],
            details["upper_bound"],
            details["outlier_count"],
            f'{details["outlier_percent"]:.4f}%',
        )
        for column, details in audit["outliers"]["full"].items()
    ]

    mapping_rows = [
        (class_name, encoded)
        for class_name, encoded in target_mapping.items()
    ]
    leakage_lines = "\n".join(
        f"- {control}" for control in audit["leakage_controls"]
    )

    return f"""# Audit Data Preprocessing

Dokumen ini dihasilkan otomatis oleh `ml/preprocessing.py`.

## Konfigurasi

- Dataset: `{audit["source"]["dataset"]}`
- SHA-256 dataset: `{audit["source"]["dataset_sha256"]}`
- Pembagian data: 80% latih dan 20% uji
- Stratifikasi: `{audit["configuration"]["stratified_by"]}`
- Random state: `{audit["configuration"]["random_state"]}`
- Imputasi: median yang dipelajari dari data latih
- Outlier: dipertahankan setelah validasi; dampaknya dikurangi dengan
  `RobustScaler`
- Scaling: `{audit["configuration"]["scaling"]}`
- Encoding target: `LabelEncoder`

## Data Cleaning

| Pemeriksaan | Hasil |
|---|---:|
| Baris sebelum cleaning | {audit["cleaning"]["original_rows"]} |
| Baris setelah cleaning | {audit["cleaning"]["final_rows"]} |
| Baris dihapus | {audit["cleaning"]["removed_rows"]} |
| Duplikasi ID | {audit["cleaning"]["duplicate_menu_ids"]} |
| Duplikasi nama | {audit["cleaning"]["duplicate_normalized_names"]} |
| Duplikasi fitur dan target | {audit["cleaning"]["duplicate_feature_and_target_rows"]} |
| Nilai nonfinite | {sum(audit["cleaning"]["nonfinite_values"].values())} |
| Nilai negatif | {sum(audit["cleaning"]["negative_values"].values())} |

## Stratified Train-Test Split

- Data latih: {split["train_rows"]} baris ({split["train_percent"]:.4f}%)
- Data uji: {split["test_rows"]} baris ({split["test_percent"]:.4f}%)
- ID yang muncul pada kedua subset: {split["menu_id_overlap_count"]}

{markdown_table(("Kelas", "Latih", "Uji", "Total"), split_rows)}

## Imputasi dan Scaling

Parameter pada tabel berikut dipelajari hanya dari data latih. Transformasi ini
merupakan validasi awal; pelatihan model harus membuat pipeline baru di dalam
cross-validation.

{markdown_table(
    (
        "Fitur",
        "Kosong total",
        "Kosong latih",
        "Kosong uji",
        "Median imputasi",
        "Pusat scaler",
        "Skala IQR",
    ),
    preprocessing_rows,
)}

Setelah preview transform, jumlah nilai kosong pada data latih adalah
{missing["train_after_preview_transform"]} dan pada data uji adalah
{missing["test_after_preview_transform"]}.

## Pemeriksaan Outlier

{markdown_table(
    ("Fitur", "Batas bawah", "Batas atas", "Jumlah", "Persentase"),
    outlier_rows,
)}

Kandidat outlier tidak dihapus karena audit tidak menemukan nilai negatif,
nonfinite, atau pelanggaran ukuran porsi. Nilai tersebut tetap harus dibahas
sebagai variasi data terkurasi, bukan langsung dianggap kesalahan.

## Encoding Target

{markdown_table(("Kelas", "Kode"), mapping_rows)}

## Pencegahan Data Leakage

{leakage_lines}

## Lingkungan

- Python: `{audit["environment"]["python"]}`
- NumPy: `{audit["environment"]["numpy"]}`
- pandas: `{audit["environment"]["pandas"]}`
- scikit-learn: `{audit["environment"]["scikit_learn"]}`
"""


def write_json(data: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as destination:
        json.dump(data, destination, ensure_ascii=False, indent=2)
        destination.write("\n")


def write_text(content: str, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> None:
    arguments = parse_arguments()
    dataset_path = arguments.dataset.resolve()
    train_path = arguments.train_output.resolve()
    test_path = arguments.test_output.resolve()
    audit_json_path = arguments.audit_json.resolve()
    audit_markdown_path = arguments.audit_markdown.resolve()

    dataframe, cleaning = load_and_clean_dataset(dataset_path)
    train_data, test_data = stratified_split(dataframe)
    encoder, encoded_train, encoded_test = encode_targets(
        train_data[TARGET_COLUMN],
        test_data[TARGET_COLUMN],
    )

    preprocessor = build_numeric_preprocessor()
    transformed_train = preprocessor.fit_transform(train_data)
    transformed_test = preprocessor.transform(test_data)

    if not np.isfinite(transformed_train).all():
        raise RuntimeError("The transformed training data contains nonfinite values")
    if not np.isfinite(transformed_test).all():
        raise RuntimeError("The transformed test data contains nonfinite values")

    write_dataframe(train_data, train_path)
    write_dataframe(test_data, test_path)
    audit = build_audit(
        dataset_path=dataset_path,
        train_path=train_path,
        test_path=test_path,
        dataframe=dataframe,
        train_data=train_data,
        test_data=test_data,
        cleaning=cleaning,
        encoder=encoder,
        encoded_train=encoded_train,
        encoded_test=encoded_test,
        preprocessor=preprocessor,
        transformed_train=transformed_train,
        transformed_test=transformed_test,
    )
    write_json(audit, audit_json_path)
    write_text(render_audit_markdown(audit), audit_markdown_path)

    print(
        f"Prepared {len(train_data)} training rows and "
        f"{len(test_data)} test rows"
    )
    print(f"Training data: {train_path}")
    print(f"Test data: {test_path}")
    print(f"Audit JSON: {audit_json_path}")
    print(f"Audit Markdown: {audit_markdown_path}")


if __name__ == "__main__":
    main()
