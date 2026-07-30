#!/usr/bin/env python3
"""Tune the selected Decision Tree baseline using GridSearchCV."""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

import joblib
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import sklearn
from sklearn.model_selection import GridSearchCV, cross_validate

from baseline import (
    METRIC_NAMES,
    baseline_estimators,
    build_baseline_pipeline,
    cross_validation,
    scoring,
)
from preprocessing import (
    DEFAULT_TRAIN,
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    RANDOM_STATE,
    TARGET_COLUMN,
    display_path,
    encode_targets,
    load_and_clean_dataset,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASELINE_RESULTS = (
    REPOSITORY_ROOT / "ml" / "outputs" / "baseline_results.json"
)
DEFAULT_RESULTS_JSON = (
    REPOSITORY_ROOT / "ml" / "outputs" / "tuning_results.json"
)
DEFAULT_RESULTS_MARKDOWN = (
    REPOSITORY_ROOT / "ml" / "outputs" / "tuning_results.md"
)
DEFAULT_GRID_CSV = (
    REPOSITORY_ROOT / "ml" / "outputs" / "grid_search_results.csv"
)
DEFAULT_COMPARISON_CSV = (
    REPOSITORY_ROOT / "ml" / "outputs" / "tuning_comparison.csv"
)
DEFAULT_FIGURE = (
    REPOSITORY_ROOT / "ml" / "outputs" / "grid_search_top_f1.png"
)
DEFAULT_MODEL_ARTIFACT = (
    REPOSITORY_ROOT / "ml" / "artifacts" / "tuned_decision_tree.joblib"
)

SEARCH_SCORING = "f1_macro"
TOP_CONFIGURATIONS_TO_PLOT = 10


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tune the selected Decision Tree using GridSearchCV.",
    )
    parser.add_argument("--train", type=Path, default=DEFAULT_TRAIN)
    parser.add_argument(
        "--baseline-results",
        type=Path,
        default=DEFAULT_BASELINE_RESULTS,
    )
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
    parser.add_argument("--grid-csv", type=Path, default=DEFAULT_GRID_CSV)
    parser.add_argument(
        "--comparison-csv",
        type=Path,
        default=DEFAULT_COMPARISON_CSV,
    )
    parser.add_argument("--figure", type=Path, default=DEFAULT_FIGURE)
    parser.add_argument(
        "--model-artifact",
        type=Path,
        default=DEFAULT_MODEL_ARTIFACT,
    )
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def parameter_grid() -> dict[str, list[Any]]:
    return {
        "classifier__criterion": ["gini", "entropy"],
        "classifier__max_depth": [None, 3, 5, 7, 10, 15],
        "classifier__min_samples_split": [2, 5, 10],
        "classifier__min_samples_leaf": [1, 2, 4],
        "classifier__class_weight": [None, "balanced"],
    }


def grid_combination_count(grid: Mapping[str, Sequence[Any]]) -> int:
    lengths = [len(values) for values in grid.values()]
    count = 1
    for length in lengths:
        count *= length
    return count


def load_baseline_results(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(f"Baseline results not found: {path}")
    results = json.loads(path.read_text(encoding="utf-8"))
    if results["selected_baseline"]["model"] != "decision_tree":
        raise ValueError("Grid Search target must match selected Decision Tree")
    if results["scope"]["held_out_test_used"]:
        raise ValueError("Baseline results unexpectedly used held-out test data")
    return results


def run_grid_search(
    features: pd.DataFrame,
    encoded_target: np.ndarray,
) -> tuple[GridSearchCV, float]:
    pipeline = build_baseline_pipeline(
        baseline_estimators()["decision_tree"]
    )
    search = GridSearchCV(
        estimator=pipeline,
        param_grid=parameter_grid(),
        scoring=scoring()[SEARCH_SCORING],
        n_jobs=-1,
        refit=True,
        cv=cross_validation(),
        verbose=0,
        pre_dispatch="2*n_jobs",
        error_score="raise",
        return_train_score=True,
    )
    started = time.perf_counter()
    search.fit(features, encoded_target)
    elapsed = time.perf_counter() - started
    return search, elapsed


def evaluate_tuned_configuration(
    best_estimator: Any,
    features: pd.DataFrame,
    encoded_target: np.ndarray,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    scores = cross_validate(
        best_estimator,
        features,
        encoded_target,
        cv=cross_validation(),
        scoring=scoring(),
        return_train_score=False,
        error_score="raise",
        n_jobs=1,
    )
    fold_rows: list[dict[str, Any]] = []
    for fold_index in range(cross_validation().n_splits):
        row: dict[str, Any] = {"fold": fold_index + 1}
        for metric in METRIC_NAMES:
            row[metric] = float(scores[f"test_{metric}"][fold_index])
        fold_rows.append(row)

    summary: dict[str, Any] = {}
    for metric in METRIC_NAMES:
        values = scores[f"test_{metric}"]
        summary[f"{metric}_mean"] = float(np.mean(values))
        summary[f"{metric}_std"] = float(np.std(values, ddof=1))
    return pd.DataFrame(fold_rows), pd.DataFrame([summary])


def baseline_decision_tree_summary(
    baseline_results: dict[str, Any],
) -> dict[str, Any]:
    for item in baseline_results["summary"]:
        if item["model"] == "decision_tree":
            return item
    raise ValueError("Decision Tree baseline summary is missing")


def comparison_dataframe(
    baseline_summary: Mapping[str, Any],
    tuned_summary: Mapping[str, Any],
) -> pd.DataFrame:
    rows = []
    for condition, source in (
        ("baseline", baseline_summary),
        ("tuned", tuned_summary),
    ):
        row: dict[str, Any] = {"condition": condition}
        for metric in METRIC_NAMES:
            row[f"{metric}_mean"] = float(source[f"{metric}_mean"])
            row[f"{metric}_std"] = float(source[f"{metric}_std"])
        rows.append(row)
    return pd.DataFrame(rows)


def clean_grid_results(search: GridSearchCV) -> pd.DataFrame:
    results = pd.DataFrame(search.cv_results_)
    columns = [
        "rank_test_score",
        "mean_test_score",
        "std_test_score",
        "mean_train_score",
        "std_train_score",
        "mean_fit_time",
        "std_fit_time",
        "mean_score_time",
        "std_score_time",
        *[
            column
            for column in results.columns
            if column.startswith("param_")
        ],
        *[
            f"split{fold}_test_score"
            for fold in range(cross_validation().n_splits)
        ],
        "params",
    ]
    cleaned = results.loc[:, columns].copy()
    return cleaned.sort_values(
        ["rank_test_score", "mean_test_score"],
        ascending=[True, False],
        kind="stable",
    ).reset_index(drop=True)


def configuration_label(row: pd.Series) -> str:
    params = row["params"]
    depth = params["classifier__max_depth"]
    class_weight = params["classifier__class_weight"]
    return (
        f'criterion={params["classifier__criterion"]}; '
        f"depth={depth}; "
        f'split={params["classifier__min_samples_split"]}; '
        f'leaf={params["classifier__min_samples_leaf"]}; '
        f"weight={class_weight}"
    )


def plot_top_configurations(
    grid_results: pd.DataFrame,
    figure_path: Path,
) -> None:
    top = grid_results.head(TOP_CONFIGURATIONS_TO_PLOT).copy()
    top["label"] = top.apply(configuration_label, axis=1)
    top = top.iloc[::-1]

    sns.set_theme(
        context="notebook",
        style="whitegrid",
        palette="colorblind",
        font_scale=0.9,
    )
    figure, axis = plt.subplots(figsize=(12, 8))
    positions = np.arange(len(top))
    axis.barh(
        positions,
        top["mean_test_score"],
        xerr=top["std_test_score"],
        color="#4C78A8",
        alpha=0.9,
        capsize=4,
    )
    axis.set_yticks(positions, top["label"])
    axis.set_xlabel("F1-macro cross-validation")
    axis.set_ylabel("")
    axis.set_title(
        "Sepuluh Konfigurasi Decision Tree Terbaik",
        fontsize=15,
        fontweight="bold",
        pad=12,
    )
    lower = max(0.0, float(top["mean_test_score"].min()) - 0.04)
    upper = min(1.0, float(top["mean_test_score"].max()) + 0.04)
    axis.set_xlim(lower, upper)
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


def save_model_artifact(
    best_estimator: Any,
    encoder: Any,
    best_params: Mapping[str, Any],
    best_score: float,
    train_path: Path,
    artifact_path: Path,
) -> None:
    bundle = {
        "pipeline": best_estimator,
        "label_encoder": encoder,
        "feature_columns": list(FEATURE_COLUMNS),
        "target_column": TARGET_COLUMN,
        "classes": list(EXPECTED_CLASSES),
        "best_params": dict(best_params),
        "best_cv_f1_macro": float(best_score),
        "random_state": RANDOM_STATE,
        "train_sha256": sha256_file(train_path),
        "scikit_learn_version": sklearn.__version__,
    }
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, artifact_path, compress=3)


def dataframe_records(dataframe: pd.DataFrame) -> list[dict[str, Any]]:
    return json.loads(dataframe.round(8).to_json(orient="records"))


def build_results(
    train_path: Path,
    baseline_path: Path,
    grid_csv_path: Path,
    comparison_csv_path: Path,
    figure_path: Path,
    artifact_path: Path,
    search: GridSearchCV,
    elapsed_seconds: float,
    fold_results: pd.DataFrame,
    comparison: pd.DataFrame,
) -> dict[str, Any]:
    grid = parameter_grid()
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "scope": {
            "data": "training data only",
            "held_out_test_used": False,
            "search_scoring": SEARCH_SCORING,
            "comparison_caveat": (
                "The tuned cross-validation score is search-optimized on the "
                "same folds; held-out test evaluation remains required."
            ),
        },
        "environment": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "scikit_learn": sklearn.__version__,
            "joblib": joblib.__version__,
            "matplotlib": matplotlib.__version__,
            "seaborn": sns.__version__,
        },
        "inputs": {
            "train": display_path(train_path),
            "train_sha256": sha256_file(train_path),
            "baseline_results": display_path(baseline_path),
            "baseline_results_sha256": sha256_file(baseline_path),
        },
        "search": {
            "method": "GridSearchCV",
            "parameter_grid": grid,
            "combinations": grid_combination_count(grid),
            "folds": cross_validation().n_splits,
            "total_fits": grid_combination_count(grid)
            * cross_validation().n_splits,
            "scoring": SEARCH_SCORING,
            "random_state": RANDOM_STATE,
            "elapsed_seconds": round(elapsed_seconds, 6),
            "best_params": search.best_params_,
            "best_index": int(search.best_index_),
            "best_cv_f1_macro": float(search.best_score_),
        },
        "tuned_cross_validation_folds": dataframe_records(fold_results),
        "comparison": dataframe_records(comparison),
        "outputs": {
            "grid_results": display_path(grid_csv_path),
            "grid_results_sha256": sha256_file(grid_csv_path),
            "comparison": display_path(comparison_csv_path),
            "comparison_sha256": sha256_file(comparison_csv_path),
            "figure": display_path(figure_path),
            "figure_sha256": sha256_file(figure_path),
            "model_artifact": display_path(artifact_path),
            "model_artifact_sha256": sha256_file(artifact_path),
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
    search = results["search"]
    grid_rows = [
        (
            parameter.replace("classifier__", ""),
            values,
        )
        for parameter, values in search["parameter_grid"].items()
    ]
    comparison_rows = [
        (
            item["condition"],
            mean_std(item, "accuracy"),
            mean_std(item, "precision_macro"),
            mean_std(item, "recall_macro"),
            mean_std(item, "f1_macro"),
            mean_std(item, "roc_auc_ovr_macro"),
        )
        for item in results["comparison"]
    ]

    return f"""# Hasil Hyperparameter Tuning Decision Tree

Grid Search dilakukan hanya pada 491 data latih. Held-out test set tidak
digunakan.

## Ruang Pencarian

{markdown_table(("Hyperparameter", "Nilai"), grid_rows)}

Jumlah kombinasi adalah {search["combinations"]}, dievaluasi dengan
{search["folds"]}-fold stratified cross-validation sehingga terdapat
{search["total_fits"]} proses fit. Scoring utama adalah F1-macro.

## Hasil Terbaik

- Parameter terbaik: `{json.dumps(search["best_params"], ensure_ascii=False)}`
- F1-macro cross-validation terbaik: {search["best_cv_f1_macro"]:.4f}
- Waktu Grid Search: {search["elapsed_seconds"]:.3f} detik

## Perbandingan

{markdown_table(
    (
        "Kondisi",
        "Accuracy",
        "Precision Macro",
        "Recall Macro",
        "F1 Macro",
        "ROC-AUC OVR Macro",
    ),
    comparison_rows,
)}

## Visualisasi

![Sepuluh konfigurasi terbaik](grid_search_top_f1.png)

## Catatan

- Skor konfigurasi tuned telah dioptimalkan pada fold Grid Search yang sama,
  sehingga bukan estimasi final yang independen.
- Model final harus dievaluasi satu kali pada held-out test set.
- Artefak model menyimpan pipeline preprocessing, Decision Tree, encoder
  target, daftar fitur, dan metadata versi.
"""


def write_json(data: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as destination:
        json.dump(data, destination, ensure_ascii=False, indent=2)
        destination.write("\n")


def main() -> None:
    arguments = parse_arguments()
    train_path = arguments.train.resolve()
    baseline_path = arguments.baseline_results.resolve()
    results_json_path = arguments.results_json.resolve()
    results_markdown_path = arguments.results_markdown.resolve()
    grid_csv_path = arguments.grid_csv.resolve()
    comparison_csv_path = arguments.comparison_csv.resolve()
    figure_path = arguments.figure.resolve()
    artifact_path = arguments.model_artifact.resolve()

    train_data, _ = load_and_clean_dataset(train_path)
    if len(train_data) != 491:
        raise ValueError(f"Expected 491 training rows, found {len(train_data)}")
    baseline_results = load_baseline_results(baseline_path)
    baseline_summary = baseline_decision_tree_summary(baseline_results)

    encoder, encoded_target, _ = encode_targets(
        train_data[TARGET_COLUMN],
        train_data[TARGET_COLUMN],
    )
    features = train_data.loc[:, FEATURE_COLUMNS]
    search, elapsed_seconds = run_grid_search(features, encoded_target)
    fold_results, tuned_summary_frame = evaluate_tuned_configuration(
        search.best_estimator_,
        features,
        encoded_target,
    )
    tuned_summary = tuned_summary_frame.iloc[0].to_dict()
    comparison = comparison_dataframe(baseline_summary, tuned_summary)

    grid_results = clean_grid_results(search)
    grid_csv_path.parent.mkdir(parents=True, exist_ok=True)
    grid_results.to_csv(grid_csv_path, index=False, lineterminator="\n")
    comparison_csv_path.parent.mkdir(parents=True, exist_ok=True)
    comparison.to_csv(
        comparison_csv_path,
        index=False,
        lineterminator="\n",
    )
    plot_top_configurations(grid_results, figure_path)
    save_model_artifact(
        best_estimator=search.best_estimator_,
        encoder=encoder,
        best_params=search.best_params_,
        best_score=search.best_score_,
        train_path=train_path,
        artifact_path=artifact_path,
    )

    results = build_results(
        train_path=train_path,
        baseline_path=baseline_path,
        grid_csv_path=grid_csv_path,
        comparison_csv_path=comparison_csv_path,
        figure_path=figure_path,
        artifact_path=artifact_path,
        search=search,
        elapsed_seconds=elapsed_seconds,
        fold_results=fold_results,
        comparison=comparison,
    )
    write_json(results, results_json_path)
    results_markdown_path.parent.mkdir(parents=True, exist_ok=True)
    results_markdown_path.write_text(
        render_results_markdown(results),
        encoding="utf-8",
    )

    print(
        f"Grid Search completed: {results['search']['combinations']} "
        f"combinations, {results['search']['total_fits']} fits"
    )
    print(f"Best parameters: {results['search']['best_params']}")
    print(
        "Best cross-validation F1-macro: "
        f"{results['search']['best_cv_f1_macro']:.4f}"
    )
    print("Held-out test data used: no")
    print(f"Model artifact: {artifact_path}")
    print(f"Results: {results_markdown_path}")


if __name__ == "__main__":
    main()
