#!/usr/bin/env python3
"""Generate the minimum required exploratory data analysis artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from preprocessing import (
    DEFAULT_DATASET,
    DEFAULT_TEST,
    DEFAULT_TRAIN,
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    display_path,
    load_and_clean_dataset,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIRECTORY = REPOSITORY_ROOT / "ml" / "outputs" / "eda"
DEFAULT_SUMMARY_JSON = (
    REPOSITORY_ROOT / "ml" / "outputs" / "eda_summary.json"
)
DEFAULT_SUMMARY_MARKDOWN = (
    REPOSITORY_ROOT / "ml" / "outputs" / "eda_summary.md"
)

FEATURE_LABELS = {
    "serving_size_g": "Ukuran porsi (g)",
    "energy_kcal": "Energi (kkal)",
    "protein_g": "Protein (g)",
    "fat_g": "Lemak (g)",
    "carbohydrate_g": "Karbohidrat (g)",
    "fiber_g": "Serat (g)",
    "sodium_mg": "Natrium (mg)",
}
CLASS_LABELS = {
    "breakfast": "Sarapan",
    "dinner": "Makan malam",
    "lunch": "Makan siang",
    "snack": "Camilan",
}
FIGURE_FILES = {
    "histogram": "histogram_fitur.png",
    "correlation_matrix": "correlation_matrix.png",
    "boxplot": "boxplot_per_kelas.png",
    "class_distribution": "class_distribution.png",
}


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate EDA artifacts from the training dataset.",
    )
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--train", type=Path, default=DEFAULT_TRAIN)
    parser.add_argument("--test", type=Path, default=DEFAULT_TEST)
    parser.add_argument(
        "--output-directory",
        type=Path,
        default=DEFAULT_OUTPUT_DIRECTORY,
    )
    parser.add_argument(
        "--summary-json",
        type=Path,
        default=DEFAULT_SUMMARY_JSON,
    )
    parser.add_argument(
        "--summary-markdown",
        type=Path,
        default=DEFAULT_SUMMARY_MARKDOWN,
    )
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def configure_plot_style() -> None:
    sns.set_theme(
        context="notebook",
        style="whitegrid",
        palette="colorblind",
        font_scale=0.95,
    )
    plt.rcParams.update(
        {
            "figure.facecolor": "white",
            "axes.facecolor": "white",
            "savefig.facecolor": "white",
        }
    )


def save_figure(figure: plt.Figure, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight",
        pad_inches=0.15,
    )
    plt.close(figure)


def plot_histograms(train_data: pd.DataFrame, output_path: Path) -> None:
    figure, axes = plt.subplots(3, 3, figsize=(14, 11))
    axes_flat = axes.flatten()

    for index, column in enumerate(FEATURE_COLUMNS):
        axis = axes_flat[index]
        observed = train_data[column].dropna()
        sns.histplot(
            observed,
            bins="auto",
            color="#2878B5",
            edgecolor="white",
            alpha=0.85,
            ax=axis,
        )
        missing = int(train_data[column].isna().sum())
        axis.set_title(FEATURE_LABELS[column], fontweight="bold")
        axis.set_xlabel("")
        axis.set_ylabel("Frekuensi")
        axis.text(
            0.98,
            0.95,
            f"n={len(observed)}; kosong={missing}",
            transform=axis.transAxes,
            ha="right",
            va="top",
            fontsize=8,
            color="#444444",
        )

    for index in range(len(FEATURE_COLUMNS), len(axes_flat)):
        figure.delaxes(axes_flat[index])

    figure.suptitle(
        "Distribusi Fitur Numerik pada Data Latih",
        fontsize=16,
        fontweight="bold",
    )
    figure.tight_layout(rect=(0, 0, 1, 0.97))
    save_figure(figure, output_path)


def correlation_matrix(train_data: pd.DataFrame) -> pd.DataFrame:
    return train_data.loc[:, FEATURE_COLUMNS].corr(method="pearson")


def plot_correlation_matrix(
    correlations: pd.DataFrame,
    output_path: Path,
) -> None:
    labels = [FEATURE_LABELS[column] for column in correlations.columns]
    figure, axis = plt.subplots(figsize=(10, 8))
    sns.heatmap(
        correlations,
        annot=True,
        cmap="vlag",
        center=0,
        fmt=".2f",
        linewidths=0.5,
        linecolor="white",
        square=True,
        vmin=-1,
        vmax=1,
        xticklabels=labels,
        yticklabels=labels,
        cbar_kws={"label": "Korelasi Pearson", "shrink": 0.8},
        ax=axis,
    )
    axis.set_title(
        "Matriks Korelasi Fitur pada Data Latih",
        fontsize=15,
        fontweight="bold",
        pad=14,
    )
    axis.tick_params(axis="x", rotation=40)
    axis.tick_params(axis="y", rotation=0)
    save_figure(figure, output_path)


def plot_boxplots(train_data: pd.DataFrame, output_path: Path) -> None:
    figure, axes = plt.subplots(4, 2, figsize=(14, 16))
    axes_flat = axes.flatten()

    for index, column in enumerate(FEATURE_COLUMNS):
        axis = axes_flat[index]
        sns.boxplot(
            data=train_data,
            x=TARGET_COLUMN,
            y=column,
            order=EXPECTED_CLASSES,
            color="#78B7C5",
            width=0.6,
            fliersize=2.5,
            linewidth=1,
            ax=axis,
        )
        axis.set_title(FEATURE_LABELS[column], fontweight="bold")
        axis.set_xlabel("")
        axis.set_ylabel(FEATURE_LABELS[column])
        axis.set_xticks(
            range(len(EXPECTED_CLASSES)),
            [CLASS_LABELS[class_name] for class_name in EXPECTED_CLASSES],
            rotation=15,
        )

    for index in range(len(FEATURE_COLUMNS), len(axes_flat)):
        figure.delaxes(axes_flat[index])

    figure.suptitle(
        "Distribusi Fitur Menurut Kelas Waktu Makan",
        fontsize=16,
        fontweight="bold",
    )
    figure.tight_layout(rect=(0, 0, 1, 0.975))
    save_figure(figure, output_path)


def plot_class_distribution(
    full_data: pd.DataFrame,
    output_path: Path,
) -> None:
    counts = (
        full_data[TARGET_COLUMN]
        .value_counts()
        .reindex(EXPECTED_CLASSES)
        .fillna(0)
        .astype(int)
    )
    figure, axis = plt.subplots(figsize=(9, 6))
    bars = axis.bar(
        [CLASS_LABELS[class_name] for class_name in counts.index],
        counts.values,
        color=sns.color_palette("colorblind", n_colors=len(counts)),
        edgecolor="white",
        linewidth=1,
    )
    axis.set_title(
        "Distribusi Kelas pada Dataset Lengkap",
        fontsize=15,
        fontweight="bold",
        pad=12,
    )
    axis.set_xlabel("Kelas waktu makan")
    axis.set_ylabel("Jumlah menu")
    axis.set_ylim(0, max(counts.values) * 1.18)

    for bar, count in zip(bars, counts.values, strict=True):
        percent = count / len(full_data) * 100
        axis.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + max(counts.values) * 0.025,
            f"{count}\n({percent:.2f}%)",
            ha="center",
            va="bottom",
            fontsize=10,
        )

    sns.despine(ax=axis, top=True, right=True)
    save_figure(figure, output_path)


def descriptive_statistics(train_data: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for column in FEATURE_COLUMNS:
        values = train_data[column]
        rows.append(
            {
                "feature": column,
                "count": int(values.count()),
                "missing": int(values.isna().sum()),
                "mean": float(values.mean()),
                "std": float(values.std()),
                "minimum": float(values.min()),
                "q1": float(values.quantile(0.25)),
                "median": float(values.median()),
                "q3": float(values.quantile(0.75)),
                "maximum": float(values.max()),
                "skewness": float(values.skew()),
            }
        )
    return pd.DataFrame(rows)


def per_class_medians(train_data: pd.DataFrame) -> pd.DataFrame:
    medians = (
        train_data.groupby(TARGET_COLUMN, observed=True)[list(FEATURE_COLUMNS)]
        .median()
        .reindex(EXPECTED_CLASSES)
    )
    medians.index.name = TARGET_COLUMN
    return medians


def top_correlation_pairs(
    correlations: pd.DataFrame,
) -> list[dict[str, Any]]:
    pairs: list[dict[str, Any]] = []
    for left_index, left in enumerate(FEATURE_COLUMNS):
        for right in FEATURE_COLUMNS[left_index + 1 :]:
            value = float(correlations.loc[left, right])
            pairs.append(
                {
                    "feature_1": left,
                    "feature_2": right,
                    "correlation": round(value, 6),
                    "absolute_correlation": round(abs(value), 6),
                }
            )
    return sorted(
        pairs,
        key=lambda item: item["absolute_correlation"],
        reverse=True,
    )


def class_distribution(dataframe: pd.DataFrame) -> dict[str, dict[str, Any]]:
    counts = (
        dataframe[TARGET_COLUMN]
        .value_counts()
        .reindex(EXPECTED_CLASSES)
        .fillna(0)
        .astype(int)
    )
    return {
        class_name: {
            "count": int(count),
            "percent": round(float(count / len(dataframe) * 100), 4),
        }
        for class_name, count in counts.items()
    }


def dataframe_records(dataframe: pd.DataFrame) -> list[dict[str, Any]]:
    return json.loads(dataframe.round(6).to_json(orient="records"))


def build_summary(
    dataset_path: Path,
    train_path: Path,
    test_path: Path,
    output_directory: Path,
    full_data: pd.DataFrame,
    train_data: pd.DataFrame,
    test_data: pd.DataFrame,
    descriptions: pd.DataFrame,
    correlations: pd.DataFrame,
    medians: pd.DataFrame,
) -> dict[str, Any]:
    figure_paths = {
        name: output_directory / filename
        for name, filename in FIGURE_FILES.items()
    }
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "scope": {
            "feature_eda": "training data only",
            "class_distribution": "full dataset",
            "missing_value_plot_policy": (
                "Histogram and boxplot omit missing observations per feature "
                "without imputing them."
            ),
            "correlation_policy": (
                "Pearson pairwise complete observations on training data."
            ),
        },
        "environment": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "matplotlib": matplotlib.__version__,
            "seaborn": sns.__version__,
        },
        "inputs": {
            "dataset": display_path(dataset_path),
            "dataset_sha256": sha256_file(dataset_path),
            "train": display_path(train_path),
            "train_sha256": sha256_file(train_path),
            "test": display_path(test_path),
            "test_sha256": sha256_file(test_path),
        },
        "row_counts": {
            "full": len(full_data),
            "train": len(train_data),
            "test": len(test_data),
        },
        "class_distribution": {
            "full": class_distribution(full_data),
            "train": class_distribution(train_data),
            "test": class_distribution(test_data),
        },
        "descriptive_statistics_train": dataframe_records(descriptions),
        "per_class_medians_train": {
            class_name: {
                column: round(float(value), 6)
                for column, value in row.items()
            }
            for class_name, row in medians.to_dict(orient="index").items()
        },
        "top_correlation_pairs_train": top_correlation_pairs(correlations),
        "figures": {
            name: {
                "path": display_path(path),
                "sha256": sha256_file(path),
            }
            for name, path in figure_paths.items()
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


def render_summary_markdown(summary: dict[str, Any]) -> str:
    description_rows = [
        (
            item["feature"],
            item["count"],
            item["missing"],
            f'{item["mean"]:.3f}',
            f'{item["median"]:.3f}',
            f'{item["minimum"]:.3f}',
            f'{item["maximum"]:.3f}',
            f'{item["skewness"]:.3f}',
        )
        for item in summary["descriptive_statistics_train"]
    ]
    correlation_rows = [
        (
            item["feature_1"],
            item["feature_2"],
            f'{item["correlation"]:.3f}',
        )
        for item in summary["top_correlation_pairs_train"][:10]
    ]
    class_rows = [
        (
            class_name,
            details["count"],
            f'{details["percent"]:.4f}%',
        )
        for class_name, details in summary["class_distribution"]["full"].items()
    ]
    median_rows = [
        (
            class_name,
            *(
                f"{values[column]:.3f}"
                for column in FEATURE_COLUMNS
            ),
        )
        for class_name, values in summary["per_class_medians_train"].items()
    ]
    figure_lines = "\n".join(
        f'- {name}: `{details["path"]}`'
        for name, details in summary["figures"].items()
    )

    return f"""# Ringkasan Exploratory Data Analysis

EDA fitur dilakukan pada 491 baris data latih. Data uji tidak digunakan untuk
membuat histogram, correlation matrix, boxplot, atau statistik deskriptif.
Distribusi kelas dataset lengkap ditampilkan karena target tersebut sudah
digunakan untuk stratified split.

## Statistik Deskriptif Data Latih

{markdown_table(
    (
        "Fitur",
        "Terisi",
        "Kosong",
        "Rata-rata",
        "Median",
        "Minimum",
        "Maksimum",
        "Skewness",
    ),
    description_rows,
)}

## Sepuluh Korelasi Absolut Terbesar

{markdown_table(("Fitur 1", "Fitur 2", "Korelasi Pearson"), correlation_rows)}

## Median Fitur per Kelas pada Data Latih

{markdown_table(
    (
        "Kelas",
        "Porsi",
        "Energi",
        "Protein",
        "Lemak",
        "Karbohidrat",
        "Serat",
        "Natrium",
    ),
    median_rows,
)}

## Distribusi Kelas Dataset Lengkap

{markdown_table(("Kelas", "Jumlah", "Persentase"), class_rows)}

## Gambar

{figure_lines}

## Catatan Metodologis

- Histogram dan boxplot menggunakan nilai yang tersedia tanpa imputasi.
- Korelasi Pearson dihitung secara pairwise pada data latih.
- Korelasi tidak menyatakan hubungan sebab-akibat.
- Perbedaan distribusi antarkelas dapat mencerminkan proses kurasi dan
  pembentukan menu, sehingga harus dibahas sebagai keterbatasan generalisasi.
"""


def write_json(data: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as destination:
        json.dump(data, destination, ensure_ascii=False, indent=2)
        destination.write("\n")


def main() -> None:
    arguments = parse_arguments()
    dataset_path = arguments.dataset.resolve()
    train_path = arguments.train.resolve()
    test_path = arguments.test.resolve()
    output_directory = arguments.output_directory.resolve()
    summary_json_path = arguments.summary_json.resolve()
    summary_markdown_path = arguments.summary_markdown.resolve()

    full_data, _ = load_and_clean_dataset(dataset_path)
    train_data, _ = load_and_clean_dataset(train_path)
    test_data, _ = load_and_clean_dataset(test_path)

    if set(train_data["menu_id"]) & set(test_data["menu_id"]):
        raise ValueError("Training and test data contain overlapping menu IDs")
    if len(train_data) + len(test_data) != len(full_data):
        raise ValueError("Training and test row counts do not reconstruct full data")
    if set(train_data["menu_id"]) | set(test_data["menu_id"]) != set(
        full_data["menu_id"]
    ):
        raise ValueError("Training and test IDs do not reconstruct full data")

    configure_plot_style()
    output_directory.mkdir(parents=True, exist_ok=True)
    plot_histograms(
        train_data,
        output_directory / FIGURE_FILES["histogram"],
    )
    correlations = correlation_matrix(train_data)
    plot_correlation_matrix(
        correlations,
        output_directory / FIGURE_FILES["correlation_matrix"],
    )
    plot_boxplots(
        train_data,
        output_directory / FIGURE_FILES["boxplot"],
    )
    plot_class_distribution(
        full_data,
        output_directory / FIGURE_FILES["class_distribution"],
    )

    descriptions = descriptive_statistics(train_data)
    medians = per_class_medians(train_data)
    descriptions.to_csv(
        output_directory / "descriptive_statistics.csv",
        index=False,
        lineterminator="\n",
    )
    correlations.to_csv(
        output_directory / "correlation_matrix.csv",
        lineterminator="\n",
    )
    medians.to_csv(
        output_directory / "per_class_medians.csv",
        lineterminator="\n",
    )

    summary = build_summary(
        dataset_path=dataset_path,
        train_path=train_path,
        test_path=test_path,
        output_directory=output_directory,
        full_data=full_data,
        train_data=train_data,
        test_data=test_data,
        descriptions=descriptions,
        correlations=correlations,
        medians=medians,
    )
    write_json(summary, summary_json_path)
    summary_markdown_path.parent.mkdir(parents=True, exist_ok=True)
    summary_markdown_path.write_text(
        render_summary_markdown(summary),
        encoding="utf-8",
    )

    print(f"EDA completed for {len(train_data)} training rows")
    print(f"Figures and tables: {output_directory}")
    print(f"Summary JSON: {summary_json_path}")
    print(f"Summary Markdown: {summary_markdown_path}")


if __name__ == "__main__":
    main()
