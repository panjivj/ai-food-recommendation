#!/usr/bin/env python3
"""Extract impurity-based feature importance from the frozen Decision Tree."""

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

from preprocessing import FEATURE_COLUMNS, display_path, sha256_file
from tuning import DEFAULT_MODEL_ARTIFACT


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIRECTORY = REPOSITORY_ROOT / "ml" / "outputs"


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract impurity-based feature importance from the frozen "
            "Decision Tree model."
        ),
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL_ARTIFACT,
    )
    parser.add_argument(
        "--output-directory",
        type=Path,
        default=DEFAULT_OUTPUT_DIRECTORY,
    )
    return parser.parse_args()


def output_paths(output_directory: Path) -> dict[str, Path]:
    return {
        "results_json": output_directory / "feature_importance.json",
        "results_markdown": output_directory / "feature_importance.md",
        "importance_csv": output_directory / "feature_importance.csv",
        "figure": output_directory / "feature_importance.png",
    }


def load_frozen_bundle(model_path: Path) -> dict[str, Any]:
    if not model_path.is_file():
        raise FileNotFoundError(f"Model artifact not found: {model_path}")
    bundle = joblib.load(model_path)
    required = {"pipeline", "feature_columns", "classes"}
    missing = sorted(required - set(bundle))
    if missing:
        raise ValueError(f"Model artifact fields are missing: {missing}")
    if tuple(bundle["feature_columns"]) != FEATURE_COLUMNS:
        raise ValueError("Model artifact feature columns do not match")
    return bundle


def extract_feature_importance(
    bundle: Mapping[str, Any],
) -> pd.DataFrame:
    pipeline = bundle["pipeline"]
    if "preprocessor" not in pipeline.named_steps:
        raise ValueError("Model pipeline has no preprocessor")
    if "classifier" not in pipeline.named_steps:
        raise ValueError("Model pipeline has no classifier")

    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]
    if not hasattr(classifier, "feature_importances_"):
        raise TypeError(
            "The frozen classifier does not expose feature_importances_"
        )

    transformed_names = tuple(preprocessor.get_feature_names_out())
    expected_names = tuple(bundle["feature_columns"])
    if transformed_names != expected_names:
        raise ValueError(
            "Transformed feature order does not match the model bundle: "
            f"{transformed_names}"
        )

    importance = np.asarray(classifier.feature_importances_, dtype=float)
    if importance.shape != (len(expected_names),):
        raise ValueError(
            f"Unexpected feature importance shape: {importance.shape}"
        )
    if not np.isfinite(importance).all() or (importance < 0).any():
        raise ValueError("Feature importance contains invalid values")
    if not np.isclose(importance.sum(), 1.0):
        raise ValueError(
            f"Feature importance must sum to one, found {importance.sum()}"
        )

    frame = pd.DataFrame(
        {
            "feature": expected_names,
            "importance": importance,
        }
    ).sort_values(
        ["importance", "feature"],
        ascending=[False, True],
        kind="stable",
    )
    frame = frame.reset_index(drop=True)
    frame.insert(0, "rank", np.arange(1, len(frame) + 1))
    frame["importance_percent"] = frame["importance"] * 100
    return frame


def plot_feature_importance(
    importance: pd.DataFrame,
    figure_path: Path,
) -> None:
    plot_data = importance.sort_values(
        "importance",
        ascending=True,
        kind="stable",
    )
    sns.set_theme(
        context="notebook",
        style="whitegrid",
        palette="colorblind",
        font_scale=1.0,
    )
    figure, axis = plt.subplots(figsize=(9, 6))
    colors = sns.color_palette("Blues_r", n_colors=len(plot_data))
    bars = axis.barh(
        plot_data["feature"],
        plot_data["importance"],
        color=colors,
    )
    axis.bar_label(
        bars,
        labels=[
            f"{value:.4f}" for value in plot_data["importance"]
        ],
        padding=4,
        fontsize=9,
    )
    axis.set_xlabel("Feature importance")
    axis.set_ylabel("")
    axis.set_xlim(
        0,
        max(0.05, float(plot_data["importance"].max()) * 1.18),
    )
    axis.set_title(
        "Feature Importance Decision Tree",
        fontsize=15,
        fontweight="bold",
        pad=12,
    )
    sns.despine(ax=axis, top=True, right=True, left=True)
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
    return json.loads(dataframe.round(10).to_json(orient="records"))


def build_results(
    model_path: Path,
    paths: Mapping[str, Path],
    importance: pd.DataFrame,
) -> dict[str, Any]:
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "method": {
            "name": "Decision Tree impurity-based feature importance",
            "scikit_learn_attribute": "feature_importances_",
            "definition": (
                "Normalized total reduction of the split criterion "
                "(mean decrease in impurity) contributed by each feature."
            ),
            "data_access": (
                "Extracted from the frozen fitted model; held-out test data "
                "was not loaded or scored."
            ),
            "limitations": [
                (
                    "Importance menjelaskan perilaku model yang telah di-fit, "
                    "bukan hubungan sebab-akibat dengan kelas waktu makan."
                ),
                (
                    "Fitur yang berkorelasi dapat saling membagi, "
                    "menggantikan, atau mendistorsi importance yang terlihat."
                ),
                (
                    "Impurity-based importance tidak menunjukkan apakah "
                    "suatu fitur menaikkan atau menurunkan probabilitas kelas."
                ),
            ],
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
        "input": {
            "model_artifact": display_path(model_path),
            "model_artifact_sha256": sha256_file(model_path),
        },
        "importance_sum": float(importance["importance"].sum()),
        "ranking": dataframe_records(importance),
        "outputs": {
            name: {
                "path": display_path(path),
                "sha256": sha256_file(path),
            }
            for name, path in paths.items()
            if name not in {"results_json", "results_markdown"}
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


def render_results_markdown(results: Mapping[str, Any]) -> str:
    rows = [
        (
            item["rank"],
            f'`{item["feature"]}`',
            f'{item["importance"]:.4f}',
            f'{item["importance_percent"]:.2f}%',
        )
        for item in results["ranking"]
    ]
    limitations = "\n".join(
        f"- {limitation}"
        for limitation in results["method"]["limitations"]
    )
    return f"""# Feature Importance Decision Tree

Feature importance diekstrak dari atribut `feature_importances_` pada Decision
Tree final yang telah di-fit. Held-out test set tidak dimuat atau dievaluasi
ulang pada tahap ini.

## Ranking Fitur

{markdown_table(("Peringkat", "Fitur", "Importance", "Persentase"), rows)}

Total importance: {results["importance_sum"]:.4f}.

![Feature importance Decision Tree](feature_importance.png)

## Interpretasi

Nilai merupakan kontribusi relatif fitur terhadap total penurunan impurity
pada seluruh split pohon. Nilai lebih besar berarti fitur lebih sering atau
lebih kuat digunakan model untuk memisahkan kelas.

## Keterbatasan

{limitations}
"""


def main() -> None:
    arguments = parse_arguments()
    model_path = arguments.model.resolve()
    paths = output_paths(arguments.output_directory.resolve())

    bundle = load_frozen_bundle(model_path)
    importance = extract_feature_importance(bundle)
    paths["importance_csv"].parent.mkdir(parents=True, exist_ok=True)
    importance.to_csv(
        paths["importance_csv"],
        index=False,
        lineterminator="\n",
    )
    plot_feature_importance(importance, paths["figure"])

    results = build_results(model_path, paths, importance)
    paths["results_json"].write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    paths["results_markdown"].write_text(
        render_results_markdown(results),
        encoding="utf-8",
    )

    print("Feature importance extracted from frozen Decision Tree")
    print(f"Top feature: {importance.iloc[0]['feature']}")
    print("Held-out test data used: no")
    print(f"Results: {paths['results_markdown']}")


if __name__ == "__main__":
    main()
