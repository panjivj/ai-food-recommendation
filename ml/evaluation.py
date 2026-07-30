#!/usr/bin/env python3
"""Evaluate the frozen tuned model once on the held-out test set."""

from __future__ import annotations

import argparse
import json
import platform
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
from sklearn.metrics import (
    accuracy_score,
    auc,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.preprocessing import label_binarize

from preprocessing import (
    DEFAULT_TEST,
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    METADATA_COLUMNS,
    TARGET_COLUMN,
    display_path,
    load_and_clean_dataset,
    sha256_file,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = (
    REPOSITORY_ROOT / "ml" / "artifacts" / "tuned_decision_tree.joblib"
)
DEFAULT_OUTPUT_DIRECTORY = REPOSITORY_ROOT / "ml" / "outputs"
EXPECTED_TEST_ROWS = 123


def output_paths(output_directory: Path) -> dict[str, Path]:
    return {
        "results_json": output_directory / "final_evaluation.json",
        "results_markdown": output_directory / "final_evaluation.md",
        "metrics_csv": output_directory / "final_metrics.csv",
        "classification_report_csv": (
            output_directory / "classification_report.csv"
        ),
        "confusion_matrix_csv": output_directory / "confusion_matrix.csv",
        "confusion_matrix_normalized_csv": (
            output_directory / "confusion_matrix_normalized.csv"
        ),
        "predictions_csv": output_directory / "test_predictions.csv",
        "confusion_matrix_figure": (
            output_directory / "confusion_matrix.png"
        ),
        "roc_figure": output_directory / "roc_multiclass.png",
    }


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Evaluate the frozen tuned model once on held-out test data."
        ),
    )
    parser.add_argument("--test", type=Path, default=DEFAULT_TEST)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument(
        "--output-directory",
        type=Path,
        default=DEFAULT_OUTPUT_DIRECTORY,
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help=(
            "Explicitly replace an existing final evaluation. Do not use this "
            "during the planned one-time held-out test evaluation."
        ),
    )
    parser.add_argument(
        "--resume-from-predictions",
        action="store_true",
        help=(
            "Resume report generation from a previously saved prediction "
            "cache without calling the model again."
        ),
    )
    return parser.parse_args()


def enforce_one_time_guard(
    paths: Mapping[str, Path],
    overwrite: bool,
) -> None:
    existing = [path for path in paths.values() if path.exists()]
    if existing and not overwrite:
        formatted = ", ".join(display_path(path) for path in existing)
        raise FileExistsError(
            "Final evaluation output already exists. Refusing to evaluate the "
            f"held-out test set again without --overwrite: {formatted}"
        )


def load_frozen_bundle(model_path: Path) -> dict[str, Any]:
    if not model_path.is_file():
        raise FileNotFoundError(f"Model artifact not found: {model_path}")
    bundle = joblib.load(model_path)
    required = {
        "pipeline",
        "label_encoder",
        "feature_columns",
        "target_column",
        "classes",
        "train_sha256",
    }
    missing = sorted(required - set(bundle))
    if missing:
        raise ValueError(f"Model artifact fields are missing: {missing}")
    if tuple(bundle["feature_columns"]) != FEATURE_COLUMNS:
        raise ValueError("Model artifact feature columns do not match")
    if bundle["target_column"] != TARGET_COLUMN:
        raise ValueError("Model artifact target column does not match")
    if tuple(bundle["classes"]) != EXPECTED_CLASSES:
        raise ValueError("Model artifact classes do not match")
    return bundle


def calculate_metrics(
    actual: np.ndarray,
    predicted: np.ndarray,
    probabilities: np.ndarray,
    class_names: Sequence[str],
) -> dict[str, Any]:
    labels = np.arange(len(class_names))
    report = classification_report(
        actual,
        predicted,
        labels=labels,
        target_names=list(class_names),
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(actual, predicted, labels=labels)
    matrix_normalized = confusion_matrix(
        actual,
        predicted,
        labels=labels,
        normalize="true",
    )
    overall = {
        "accuracy": float(accuracy_score(actual, predicted)),
        "precision_macro": float(
            precision_score(
                actual,
                predicted,
                labels=labels,
                average="macro",
                zero_division=0,
            )
        ),
        "recall_macro": float(
            recall_score(
                actual,
                predicted,
                labels=labels,
                average="macro",
                zero_division=0,
            )
        ),
        "f1_macro": float(
            f1_score(
                actual,
                predicted,
                labels=labels,
                average="macro",
                zero_division=0,
            )
        ),
        "roc_auc_ovr_macro": float(
            roc_auc_score(
                actual,
                probabilities,
                labels=labels,
                average="macro",
                multi_class="ovr",
            )
        ),
    }
    per_class = {
        class_name: {
            "precision": float(report[class_name]["precision"]),
            "recall": float(report[class_name]["recall"]),
            "f1_score": float(report[class_name]["f1-score"]),
            "support": int(report[class_name]["support"]),
            "roc_auc_ovr": float(
                roc_auc_score(
                    (actual == index).astype(int),
                    probabilities[:, index],
                )
            ),
        }
        for index, class_name in enumerate(class_names)
    }
    return {
        "overall": overall,
        "per_class": per_class,
        "confusion_matrix": matrix.tolist(),
        "confusion_matrix_normalized": matrix_normalized.tolist(),
    }


def metrics_dataframe(metrics: Mapping[str, Any]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {"metric": metric, "value": value}
            for metric, value in metrics["overall"].items()
        ]
    )


def report_dataframe(
    metrics: Mapping[str, Any],
    class_names: Sequence[str],
) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {"class": class_name, **metrics["per_class"][class_name]}
            for class_name in class_names
        ]
    )


def matrix_dataframe(
    values: Sequence[Sequence[float]],
    class_names: Sequence[str],
) -> pd.DataFrame:
    frame = pd.DataFrame(values, columns=class_names)
    frame.insert(0, "actual_class", class_names)
    return frame


def plot_confusion_matrix(
    matrix: np.ndarray,
    class_names: Sequence[str],
    figure_path: Path,
) -> None:
    sns.set_theme(
        context="notebook",
        style="white",
        palette="colorblind",
        font_scale=1.0,
    )
    figure, axis = plt.subplots(figsize=(8, 6.5))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="Blues",
        cbar=False,
        square=True,
        xticklabels=class_names,
        yticklabels=class_names,
        linewidths=0.5,
        ax=axis,
    )
    axis.set_xlabel("Kelas prediksi")
    axis.set_ylabel("Kelas aktual")
    axis.set_title(
        "Confusion Matrix Model Final",
        fontsize=15,
        fontweight="bold",
        pad=12,
    )
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


def plot_multiclass_roc(
    actual: np.ndarray,
    probabilities: np.ndarray,
    class_names: Sequence[str],
    figure_path: Path,
) -> dict[str, float]:
    labels = np.arange(len(class_names))
    binary_actual = label_binarize(actual, classes=labels)
    sns.set_theme(
        context="notebook",
        style="whitegrid",
        palette="colorblind",
        font_scale=1.0,
    )
    colors = sns.color_palette("colorblind", n_colors=len(class_names))
    figure, axis = plt.subplots(figsize=(8.5, 6.5))
    auc_values: dict[str, float] = {}
    for index, (class_name, color) in enumerate(zip(class_names, colors)):
        false_positive_rate, true_positive_rate, _ = roc_curve(
            binary_actual[:, index],
            probabilities[:, index],
        )
        class_auc = float(auc(false_positive_rate, true_positive_rate))
        auc_values[class_name] = class_auc
        axis.plot(
            false_positive_rate,
            true_positive_rate,
            color=color,
            linewidth=2,
            label=f"{class_name} (AUC = {class_auc:.3f})",
        )
    axis.plot(
        [0, 1],
        [0, 1],
        color="#777777",
        linestyle="--",
        linewidth=1.5,
        label="Acak (AUC = 0,500)",
    )
    axis.set(
        xlim=(0.0, 1.0),
        ylim=(0.0, 1.05),
        xlabel="False Positive Rate",
        ylabel="True Positive Rate",
    )
    axis.set_title(
        "Kurva ROC Multiclass One-vs-Rest",
        fontsize=15,
        fontweight="bold",
        pad=12,
    )
    axis.legend(loc="lower right", frameon=True)
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
    return auc_values


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


def render_results_markdown(results: Mapping[str, Any]) -> str:
    overall = results["metrics"]["overall"]
    per_class = results["metrics"]["per_class"]
    metric_rows = [
        (name, f"{value:.4f}") for name, value in overall.items()
    ]
    class_rows = [
        (
            class_name,
            f'{values["precision"]:.4f}',
            f'{values["recall"]:.4f}',
            f'{values["f1_score"]:.4f}',
            values["support"],
            f'{values["roc_auc_ovr"]:.4f}',
        )
        for class_name, values in per_class.items()
    ]
    return f"""# Evaluasi Final pada Held-out Test Set

Model Decision Tree hasil Grid Search dimuat dari artefak beku dan dievaluasi
satu kali pada {results["protocol"]["test_rows"]} baris held-out test set.
Pipeline tidak di-fit ulang dan data uji tidak digunakan untuk mengubah model.

## Metrik Agregat

{markdown_table(("Metrik", "Nilai"), metric_rows)}

## Classification Report dan ROC-AUC per Kelas

{markdown_table(
    ("Kelas", "Precision", "Recall", "F1-score", "Support", "ROC-AUC OVR"),
    class_rows,
)}

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
"""


def build_predictions(
    test_data: pd.DataFrame,
    actual: np.ndarray,
    predicted: np.ndarray,
    probabilities: np.ndarray,
    encoder: Any,
    class_names: Sequence[str],
) -> pd.DataFrame:
    predictions = test_data.loc[:, METADATA_COLUMNS].copy()
    predictions["actual_class"] = encoder.inverse_transform(actual)
    predictions["predicted_class"] = encoder.inverse_transform(predicted)
    predictions["correct"] = actual == predicted
    for index, class_name in enumerate(class_names):
        predictions[f"probability_{class_name}"] = probabilities[:, index]
    return predictions


def main() -> None:
    arguments = parse_arguments()
    test_path = arguments.test.resolve()
    model_path = arguments.model.resolve()
    paths = output_paths(arguments.output_directory.resolve())
    if arguments.resume_from_predictions:
        if not paths["predictions_csv"].is_file():
            raise FileNotFoundError(
                "Cannot resume because the prediction cache is missing: "
                f"{paths['predictions_csv']}"
            )
        if paths["results_json"].exists():
            raise FileExistsError(
                "Final evaluation is already complete; resume is not allowed"
            )
    else:
        enforce_one_time_guard(paths, arguments.overwrite)

    bundle = load_frozen_bundle(model_path)
    test_data, _ = load_and_clean_dataset(test_path)
    if len(test_data) != EXPECTED_TEST_ROWS:
        raise ValueError(
            f"Expected {EXPECTED_TEST_ROWS} test rows, found {len(test_data)}"
        )

    encoder = bundle["label_encoder"]
    class_names = tuple(bundle["classes"])
    classifier_classes = np.asarray(
        bundle["pipeline"].named_steps["classifier"].classes_
    )
    expected_encoded_classes = np.arange(len(class_names))
    if not np.array_equal(classifier_classes, expected_encoded_classes):
        raise ValueError("Classifier probability columns are out of order")

    if arguments.resume_from_predictions:
        predictions = pd.read_csv(paths["predictions_csv"])
        if predictions["menu_id"].astype(str).tolist() != (
            test_data["menu_id"].astype(str).tolist()
        ):
            raise ValueError("Prediction cache does not match the test rows")
        if predictions["actual_class"].tolist() != (
            test_data[TARGET_COLUMN].tolist()
        ):
            raise ValueError("Prediction cache actual classes do not match")
        actual = encoder.transform(predictions["actual_class"])
        predicted = encoder.transform(predictions["predicted_class"])
        probabilities = predictions[
            [f"probability_{name}" for name in class_names]
        ].to_numpy(dtype=float)
    else:
        actual = encoder.transform(test_data[TARGET_COLUMN])
        features = test_data.loc[:, bundle["feature_columns"]]

        # This is the only model-inference call in the final evaluation.
        probabilities = bundle["pipeline"].predict_proba(features)
        predicted = classifier_classes[np.argmax(probabilities, axis=1)]

    if probabilities.shape != (len(test_data), len(class_names)):
        raise ValueError(
            f"Unexpected probability shape: {probabilities.shape}"
        )

    metrics = calculate_metrics(
        actual,
        predicted,
        probabilities,
        class_names,
    )
    if not arguments.resume_from_predictions:
        predictions = build_predictions(
            test_data,
            actual,
            predicted,
            probabilities,
            encoder,
            class_names,
        )
    metrics_frame = metrics_dataframe(metrics)
    report_frame = report_dataframe(metrics, class_names)
    matrix_frame = matrix_dataframe(metrics["confusion_matrix"], class_names)
    normalized_frame = matrix_dataframe(
        metrics["confusion_matrix_normalized"],
        class_names,
    )

    paths["metrics_csv"].parent.mkdir(parents=True, exist_ok=True)
    metrics_frame.to_csv(
        paths["metrics_csv"],
        index=False,
        lineterminator="\n",
    )
    report_frame.to_csv(
        paths["classification_report_csv"],
        index=False,
        lineterminator="\n",
    )
    matrix_frame.to_csv(
        paths["confusion_matrix_csv"],
        index=False,
        lineterminator="\n",
    )
    normalized_frame.to_csv(
        paths["confusion_matrix_normalized_csv"],
        index=False,
        lineterminator="\n",
    )
    predictions.to_csv(
        paths["predictions_csv"],
        index=False,
        lineterminator="\n",
    )
    plot_confusion_matrix(
        np.asarray(metrics["confusion_matrix"]),
        class_names,
        paths["confusion_matrix_figure"],
    )
    plotted_auc = plot_multiclass_roc(
        actual,
        probabilities,
        class_names,
        paths["roc_figure"],
    )
    for class_name in class_names:
        expected = metrics["per_class"][class_name]["roc_auc_ovr"]
        if not np.isclose(plotted_auc[class_name], expected):
            raise RuntimeError(f"ROC-AUC mismatch for class {class_name}")

    hashed_outputs = {
        name: {
            "path": display_path(path),
            "sha256": sha256_file(path),
        }
        for name, path in paths.items()
        if name not in {"results_json", "results_markdown"}
    }
    results = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "protocol": {
            "evaluation": "one-time held-out test evaluation",
            "test_rows": len(test_data),
            "model_refit": False,
            "inference_calls": 1,
            "resumed_from_prediction_cache": (
                arguments.resume_from_predictions
            ),
            "class_prediction_rule": "maximum predicted probability",
            "averaging": "macro",
            "multiclass_roc_auc": "one-vs-rest macro average",
            "confusion_matrix_orientation": (
                "rows=actual classes, columns=predicted classes"
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
            "test": display_path(test_path),
            "test_sha256": sha256_file(test_path),
            "model_artifact": display_path(model_path),
            "model_artifact_sha256": sha256_file(model_path),
            "model_train_sha256": bundle["train_sha256"],
        },
        "classes": list(class_names),
        "metrics": metrics,
        "outputs": hashed_outputs,
    }
    paths["results_json"].write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    paths["results_markdown"].write_text(
        render_results_markdown(results),
        encoding="utf-8",
    )

    print(
        "Final held-out evaluation completed once: "
        f"{len(test_data)} test rows"
    )
    for name, value in metrics["overall"].items():
        print(f"{name}: {value:.4f}")
    print("Model refit: no")
    print(f"Results: {paths['results_markdown']}")


if __name__ == "__main__":
    main()
