#!/usr/bin/env python3
"""Compare three baseline classifiers using stratified cross-validation."""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
from collections import Counter, OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    make_scorer,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from preprocessing import (
    DEFAULT_TRAIN,
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    RANDOM_STATE,
    TARGET_COLUMN,
    build_numeric_preprocessor,
    display_path,
    encode_targets,
    load_and_clean_dataset,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RESULTS_JSON = (
    REPOSITORY_ROOT / "ml" / "outputs" / "baseline_results.json"
)
DEFAULT_RESULTS_MARKDOWN = (
    REPOSITORY_ROOT / "ml" / "outputs" / "baseline_results.md"
)
DEFAULT_SUMMARY_CSV = (
    REPOSITORY_ROOT / "ml" / "outputs" / "baseline_metrics.csv"
)
DEFAULT_FOLD_CSV = (
    REPOSITORY_ROOT / "ml" / "outputs" / "baseline_fold_metrics.csv"
)
DEFAULT_FIGURE = (
    REPOSITORY_ROOT / "ml" / "outputs" / "baseline_f1_cv.png"
)

CV_FOLDS = 5
PRIMARY_METRIC = "f1_macro"
MODEL_DISPLAY_NAMES = {
    "decision_tree": "Decision Tree",
    "random_forest": "Random Forest",
    "svm_rbf": "Support Vector Machine",
}
METRIC_NAMES = (
    "accuracy",
    "precision_macro",
    "recall_macro",
    "f1_macro",
    "roc_auc_ovr_macro",
)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run baseline model comparison on training data only.",
    )
    parser.add_argument("--train", type=Path, default=DEFAULT_TRAIN)
    parser.add_argument(
        "--results-json",
        type=Path,
        default=DEFAULT_RESULTS_JSON,
    )
    parser.add_argument(
        "--results-markdown",
        type=Path,
        default=DEFAULT_RESULTS_MARKDOWN,
    )
    parser.add_argument(
        "--summary-csv",
        type=Path,
        default=DEFAULT_SUMMARY_CSV,
    )
    parser.add_argument("--fold-csv", type=Path, default=DEFAULT_FOLD_CSV)
    parser.add_argument("--figure", type=Path, default=DEFAULT_FIGURE)
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def baseline_estimators() -> OrderedDict[str, Any]:
    return OrderedDict(
        [
            (
                "decision_tree",
                DecisionTreeClassifier(
                    criterion="gini",
                    splitter="best",
                    max_depth=None,
                    min_samples_split=2,
                    min_samples_leaf=1,
                    class_weight=None,
                    random_state=RANDOM_STATE,
                ),
            ),
            (
                "random_forest",
                RandomForestClassifier(
                    n_estimators=100,
                    criterion="gini",
                    max_depth=None,
                    min_samples_split=2,
                    min_samples_leaf=1,
                    max_features="sqrt",
                    bootstrap=True,
                    class_weight=None,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
            (
                "svm_rbf",
                SVC(
                    C=1.0,
                    kernel="rbf",
                    degree=3,
                    gamma="scale",
                    class_weight=None,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )


def build_baseline_pipeline(estimator: Any) -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocessor", build_numeric_preprocessor()),
            ("classifier", estimator),
        ]
    )


def cross_validation() -> StratifiedKFold:
    return StratifiedKFold(
        n_splits=CV_FOLDS,
        shuffle=True,
        random_state=RANDOM_STATE,
    )


def scoring() -> dict[str, Any]:
    return {
        "accuracy": make_scorer(accuracy_score),
        "precision_macro": make_scorer(
            precision_score,
            average="macro",
            zero_division=0,
        ),
        "recall_macro": make_scorer(
            recall_score,
            average="macro",
            zero_division=0,
        ),
        "f1_macro": make_scorer(
            f1_score,
            average="macro",
            zero_division=0,
        ),
        "roc_auc_ovr_macro": roc_auc_ovr_macro_scorer,
    }


def roc_auc_ovr_macro_scorer(
    estimator: Pipeline,
    features: pd.DataFrame,
    target: np.ndarray,
) -> float:
    classifier = estimator.named_steps["classifier"]
    classes = np.asarray(classifier.classes_)
    if hasattr(estimator, "predict_proba"):
        score_matrix = estimator.predict_proba(features)
    elif hasattr(estimator, "decision_function"):
        score_matrix = estimator.decision_function(features)
    else:
        raise TypeError(
            f"{type(classifier).__name__} has no probability or decision score"
        )

    if score_matrix.ndim != 2 or score_matrix.shape[1] != len(classes):
        raise ValueError(
            "Multiclass ROC-AUC requires one score column for every class"
        )

    auc_values = [
        roc_auc_score(
            (target == class_label).astype(int),
            score_matrix[:, class_index],
        )
        for class_index, class_label in enumerate(classes)
    ]
    return float(np.mean(auc_values))


def estimator_configuration(estimator: Any) -> dict[str, Any]:
    if isinstance(estimator, DecisionTreeClassifier):
        keys = (
            "criterion",
            "splitter",
            "max_depth",
            "min_samples_split",
            "min_samples_leaf",
            "class_weight",
            "random_state",
        )
    elif isinstance(estimator, RandomForestClassifier):
        keys = (
            "n_estimators",
            "criterion",
            "max_depth",
            "min_samples_split",
            "min_samples_leaf",
            "max_features",
            "bootstrap",
            "class_weight",
            "random_state",
        )
    elif isinstance(estimator, SVC):
        keys = (
            "C",
            "kernel",
            "degree",
            "gamma",
            "class_weight",
            "random_state",
        )
    else:
        raise TypeError(f"Unsupported estimator type: {type(estimator)}")

    parameters = estimator.get_params()
    return {key: parameters[key] for key in keys}


def run_cross_validation(
    features: pd.DataFrame,
    encoded_target: np.ndarray,
    estimators: Mapping[str, Any],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    fold_rows: list[dict[str, Any]] = []
    summary_rows: list[dict[str, Any]] = []

    for model_name, estimator in estimators.items():
        pipeline = build_baseline_pipeline(estimator)
        scores = cross_validate(
            pipeline,
            features,
            encoded_target,
            cv=cross_validation(),
            scoring=scoring(),
            return_train_score=False,
            error_score="raise",
            n_jobs=1,
        )

        for fold_index in range(CV_FOLDS):
            row: dict[str, Any] = {
                "model": model_name,
                "model_display": MODEL_DISPLAY_NAMES[model_name],
                "fold": fold_index + 1,
                "fit_time_seconds": float(scores["fit_time"][fold_index]),
                "score_time_seconds": float(scores["score_time"][fold_index]),
            }
            for metric in METRIC_NAMES:
                row[metric] = float(scores[f"test_{metric}"][fold_index])
            fold_rows.append(row)

        summary: dict[str, Any] = {
            "model": model_name,
            "model_display": MODEL_DISPLAY_NAMES[model_name],
        }
        for metric in METRIC_NAMES:
            values = scores[f"test_{metric}"]
            summary[f"{metric}_mean"] = float(np.mean(values))
            summary[f"{metric}_std"] = float(np.std(values, ddof=1))
        summary["fit_time_seconds_mean"] = float(np.mean(scores["fit_time"]))
        summary["score_time_seconds_mean"] = float(
            np.mean(scores["score_time"])
        )
        summary_rows.append(summary)

    return pd.DataFrame(fold_rows), pd.DataFrame(summary_rows)


def select_best_baseline(summary: pd.DataFrame) -> str:
    ranked = summary.sort_values(
        by=[
            f"{PRIMARY_METRIC}_mean",
            f"{PRIMARY_METRIC}_std",
            "accuracy_mean",
            "model",
        ],
        ascending=[False, True, False, True],
        kind="stable",
    )
    return str(ranked.iloc[0]["model"])


def plot_f1_cross_validation(
    fold_results: pd.DataFrame,
    figure_path: Path,
) -> None:
    sns.set_theme(
        context="notebook",
        style="whitegrid",
        palette="colorblind",
        font_scale=1.0,
    )
    order = list(MODEL_DISPLAY_NAMES.values())
    figure, axis = plt.subplots(figsize=(9, 6))
    sns.boxplot(
        data=fold_results,
        x="model_display",
        y="f1_macro",
        order=order,
        color="#78B7C5",
        width=0.55,
        fliersize=0,
        ax=axis,
    )
    sns.stripplot(
        data=fold_results,
        x="model_display",
        y="f1_macro",
        order=order,
        color="#1F3B4D",
        jitter=0.08,
        size=6,
        ax=axis,
    )
    axis.set_title(
        "F1-Macro Baseline pada 5-Fold Cross-Validation",
        fontsize=15,
        fontweight="bold",
        pad=12,
    )
    axis.set_xlabel("")
    axis.set_ylabel("F1-macro")
    axis.set_ylim(
        max(0.0, float(fold_results["f1_macro"].min()) - 0.08),
        min(1.0, float(fold_results["f1_macro"].max()) + 0.08),
    )
    sns.despine(ax=axis, top=True, right=True)
    figure.tight_layout()
    figure_path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(
        figure_path,
        dpi=300,
        bbox_inches="tight",
        pad_inches=0.15,
        facecolor="white",
    )
    plt.close(figure)


def dataframe_records(dataframe: pd.DataFrame) -> list[dict[str, Any]]:
    return json.loads(dataframe.round(8).to_json(orient="records"))


def build_results(
    train_path: Path,
    figure_path: Path,
    train_data: pd.DataFrame,
    encoded_target: np.ndarray,
    estimators: Mapping[str, Any],
    fold_results: pd.DataFrame,
    summary: pd.DataFrame,
    best_model: str,
) -> dict[str, Any]:
    class_counts = Counter(train_data[TARGET_COLUMN].tolist())
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "scope": {
            "data": "training data only",
            "held_out_test_used": False,
            "selection_metric": PRIMARY_METRIC,
            "selection_rule": (
                "Highest mean F1-macro; ties use lower F1-macro standard "
                "deviation, then higher mean accuracy."
            ),
        },
        "environment": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "scikit_learn": sklearn.__version__,
            "matplotlib": matplotlib.__version__,
            "seaborn": sns.__version__,
        },
        "input": {
            "train": display_path(train_path),
            "train_sha256": sha256_file(train_path),
            "rows": len(train_data),
            "features": list(FEATURE_COLUMNS),
            "encoded_target_min": int(encoded_target.min()),
            "encoded_target_max": int(encoded_target.max()),
            "class_distribution": {
                class_name: class_counts.get(class_name, 0)
                for class_name in EXPECTED_CLASSES
            },
        },
        "protocol": {
            "cross_validation": "StratifiedKFold",
            "folds": CV_FOLDS,
            "shuffle": True,
            "random_state": RANDOM_STATE,
            "preprocessing_per_fold": [
                "SimpleImputer(strategy='median')",
                "RobustScaler(quantile_range=(25, 75))",
            ],
            "sampling_or_class_weight": "none",
            "metrics": list(METRIC_NAMES),
        },
        "model_configurations": {
            model_name: estimator_configuration(estimator)
            for model_name, estimator in estimators.items()
        },
        "fold_results": dataframe_records(fold_results),
        "summary": dataframe_records(summary),
        "selected_baseline": {
            "model": best_model,
            "model_display": MODEL_DISPLAY_NAMES[best_model],
            "criterion": PRIMARY_METRIC,
        },
        "figure": {
            "path": display_path(figure_path),
            "sha256": sha256_file(figure_path),
        },
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


def mean_std(row: Mapping[str, Any], metric: str) -> str:
    return (
        f'{float(row[f"{metric}_mean"]):.4f} ± '
        f'{float(row[f"{metric}_std"]):.4f}'
    )


def render_results_markdown(results: dict[str, Any]) -> str:
    summary_rows = [
        (
            item["model_display"],
            mean_std(item, "accuracy"),
            mean_std(item, "precision_macro"),
            mean_std(item, "recall_macro"),
            mean_std(item, "f1_macro"),
            mean_std(item, "roc_auc_ovr_macro"),
        )
        for item in results["summary"]
    ]
    config_rows = [
        (
            MODEL_DISPLAY_NAMES[model_name],
            json.dumps(configuration, ensure_ascii=False, sort_keys=True),
        )
        for model_name, configuration in results[
            "model_configurations"
        ].items()
    ]
    selected = results["selected_baseline"]

    return f"""# Hasil Pemodelan Baseline

Eksperimen menggunakan 491 data latih dan tidak mengakses data uji. Setiap
model dievaluasi menggunakan 5-fold `StratifiedKFold` dengan shuffle dan
`random_state=42`. Imputer median dan `RobustScaler` di-fit ulang di dalam
setiap fold.

## Konfigurasi Model

{markdown_table(("Model", "Konfigurasi"), config_rows)}

Tidak digunakan oversampling, undersampling, atau `class_weight`. ROC-AUC
multiclass dihitung dengan pendekatan one-vs-rest dari probabilitas kelas untuk
model pohon dan decision score untuk SVM.

## Hasil Cross-Validation

Nilai ditampilkan sebagai rata-rata ± simpangan baku sampel dari lima fold.

{markdown_table(
    (
        "Model",
        "Accuracy",
        "Precision Macro",
        "Recall Macro",
        "F1 Macro",
        "ROC-AUC OVR Macro",
    ),
    summary_rows,
)}

## Baseline Terpilih

Model baseline terpilih adalah **{selected["model_display"]}** berdasarkan
rata-rata `{selected["criterion"]}` tertinggi. Pemilihan ini hanya digunakan
untuk menentukan model yang akan menjalani Grid Search. Data uji tetap belum
digunakan.

## Visualisasi

![Distribusi F1-macro per fold](baseline_f1_cv.png)

## Catatan

- Hasil baseline merupakan cross-validation pada data latih, bukan hasil akhir
  pada held-out test set.
- Nilai performa dapat dipengaruhi pola pembentukan dan kurasi menu.
- Model final baru dievaluasi satu kali pada data uji setelah hyperparameter
  tuning selesai.
"""


def write_json(data: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as destination:
        json.dump(data, destination, ensure_ascii=False, indent=2)
        destination.write("\n")


def main() -> None:
    arguments = parse_arguments()
    train_path = arguments.train.resolve()
    results_json_path = arguments.results_json.resolve()
    results_markdown_path = arguments.results_markdown.resolve()
    summary_csv_path = arguments.summary_csv.resolve()
    fold_csv_path = arguments.fold_csv.resolve()
    figure_path = arguments.figure.resolve()

    train_data, _ = load_and_clean_dataset(train_path)
    if len(train_data) != 491:
        raise ValueError(f"Expected 491 training rows, found {len(train_data)}")

    encoder, encoded_target, _ = encode_targets(
        train_data[TARGET_COLUMN],
        train_data[TARGET_COLUMN],
    )
    if tuple(encoder.classes_) != EXPECTED_CLASSES:
        raise ValueError("Target encoding does not match the expected classes")

    estimators = baseline_estimators()
    features = train_data.loc[:, FEATURE_COLUMNS]
    fold_results, summary = run_cross_validation(
        features,
        encoded_target,
        estimators,
    )
    best_model = select_best_baseline(summary)

    summary_csv_path.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(summary_csv_path, index=False, lineterminator="\n")
    fold_csv_path.parent.mkdir(parents=True, exist_ok=True)
    fold_results.to_csv(fold_csv_path, index=False, lineterminator="\n")
    plot_f1_cross_validation(fold_results, figure_path)

    results = build_results(
        train_path=train_path,
        figure_path=figure_path,
        train_data=train_data,
        encoded_target=encoded_target,
        estimators=estimators,
        fold_results=fold_results,
        summary=summary,
        best_model=best_model,
    )
    write_json(results, results_json_path)
    results_markdown_path.parent.mkdir(parents=True, exist_ok=True)
    results_markdown_path.write_text(
        render_results_markdown(results),
        encoding="utf-8",
    )

    print("Baseline comparison completed without using held-out test data")
    for item in results["summary"]:
        print(
            f'{item["model_display"]}: '
            f'F1-macro={item["f1_macro_mean"]:.4f} '
            f'± {item["f1_macro_std"]:.4f}'
        )
    print(f'Selected baseline: {results["selected_baseline"]["model_display"]}')
    print(f"Results: {results_markdown_path}")


if __name__ == "__main__":
    main()
