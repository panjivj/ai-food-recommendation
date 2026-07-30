#!/usr/bin/env python3
"""Export and audit the curated menu classification dataset.

This script intentionally uses only the Python standard library so the dataset
can be exported before the machine-learning dependencies are installed.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sqlite3
import statistics
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE = REPOSITORY_ROOT / "backend" / "storage" / "app.db"
DEFAULT_DATASET = REPOSITORY_ROOT / "ml" / "data" / "menu_ml.csv"
DEFAULT_AUDIT_JSON = REPOSITORY_ROOT / "ml" / "outputs" / "dataset_audit.json"
DEFAULT_AUDIT_MARKDOWN = (
    REPOSITORY_ROOT / "ml" / "outputs" / "dataset_audit.md"
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
EXPECTED_CLASSES = ("breakfast", "lunch", "dinner", "snack")
EXPORT_COLUMNS = (*METADATA_COLUMNS, *FEATURE_COLUMNS, TARGET_COLUMN)

DATASET_QUERY = """
SELECT
  m.id AS menu_id,
  m.name AS menu_name,
  m.serving_size_g,
  n.energy_kcal,
  n.protein_g,
  n.fat_g,
  n.carbohydrate_g,
  n.fiber_g,
  n.sodium_mg,
  m.meal_type,
  m.nutrition_source,
  m.calculation_version,
  m.curation_batch
FROM menus AS m
JOIN menu_nutrition AS n ON n.menu_id = m.id
WHERE m.curation_status = 'approved'
ORDER BY m.id
"""


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export and audit the approved menu ML dataset.",
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=DEFAULT_DATABASE,
        help=f"SQLite database path (default: {DEFAULT_DATABASE})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_DATASET,
        help=f"CSV output path (default: {DEFAULT_DATASET})",
    )
    parser.add_argument(
        "--audit-json",
        type=Path,
        default=DEFAULT_AUDIT_JSON,
        help=f"JSON audit output path (default: {DEFAULT_AUDIT_JSON})",
    )
    parser.add_argument(
        "--audit-markdown",
        type=Path,
        default=DEFAULT_AUDIT_MARKDOWN,
        help=(
            "Markdown audit output path "
            f"(default: {DEFAULT_AUDIT_MARKDOWN})"
        ),
    )
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def display_path(path: Path) -> str:
    resolved = path.resolve()
    try:
        return str(resolved.relative_to(REPOSITORY_ROOT))
    except ValueError:
        return str(resolved)


def fetch_rows(database_path: Path) -> list[dict[str, Any]]:
    if not database_path.is_file():
        raise FileNotFoundError(f"Database not found: {database_path}")

    connection = sqlite3.connect(
        f"file:{database_path.resolve()}?mode=ro",
        uri=True,
    )
    connection.row_factory = sqlite3.Row

    try:
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            raise RuntimeError(f"SQLite integrity check failed: {integrity}")

        rows = [
            dict(row)
            for row in connection.execute(DATASET_QUERY).fetchall()
        ]
    finally:
        connection.close()

    if not rows:
        raise RuntimeError("The approved-menu query returned no rows")

    return rows


def write_csv(rows: Sequence[dict[str, Any]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as destination:
        writer = csv.DictWriter(destination, fieldnames=EXPORT_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    column: "" if row[column] is None else row[column]
                    for column in EXPORT_COLUMNS
                }
            )


def percentile(sorted_values: Sequence[float], proportion: float) -> float:
    if not sorted_values:
        raise ValueError("Cannot calculate a percentile of an empty sequence")
    if len(sorted_values) == 1:
        return sorted_values[0]

    position = (len(sorted_values) - 1) * proportion
    lower_index = math.floor(position)
    upper_index = math.ceil(position)
    if lower_index == upper_index:
        return sorted_values[lower_index]

    fraction = position - lower_index
    return (
        sorted_values[lower_index] * (1 - fraction)
        + sorted_values[upper_index] * fraction
    )


def numeric_summary(
    rows: Sequence[dict[str, Any]],
    column: str,
) -> dict[str, Any]:
    values = sorted(
        float(row[column])
        for row in rows
        if row[column] is not None
    )
    missing = len(rows) - len(values)
    q1 = percentile(values, 0.25)
    q3 = percentile(values, 0.75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers = [
        value
        for value in values
        if value < lower_bound or value > upper_bound
    ]

    return {
        "count": len(values),
        "missing": missing,
        "missing_percent": round(missing / len(rows) * 100, 4),
        "minimum": min(values),
        "q1": round(q1, 6),
        "median": round(statistics.median(values), 6),
        "mean": round(statistics.fmean(values), 6),
        "q3": round(q3, 6),
        "maximum": max(values),
        "iqr_lower_bound": round(lower_bound, 6),
        "iqr_upper_bound": round(upper_bound, 6),
        "iqr_outlier_count": len(outliers),
        "iqr_outlier_percent": round(len(outliers) / len(values) * 100, 4),
    }


def duplicate_count(
    rows: Iterable[dict[str, Any]],
    columns: Sequence[str],
) -> int:
    counter = Counter(tuple(row[column] for column in columns) for row in rows)
    return sum(count - 1 for count in counter.values() if count > 1)


def build_audit(
    rows: Sequence[dict[str, Any]],
    database_path: Path,
    dataset_path: Path,
) -> dict[str, Any]:
    row_count = len(rows)
    class_counts = Counter(str(row[TARGET_COLUMN]) for row in rows)
    unexpected_classes = sorted(set(class_counts) - set(EXPECTED_CLASSES))
    missing_expected_classes = sorted(set(EXPECTED_CLASSES) - set(class_counts))

    invalid_nonfinite: dict[str, int] = {}
    invalid_negative: dict[str, int] = {}
    for column in FEATURE_COLUMNS:
        present_values = [
            float(row[column])
            for row in rows
            if row[column] is not None
        ]
        invalid_nonfinite[column] = sum(
            not math.isfinite(value) for value in present_values
        )
        invalid_negative[column] = sum(value < 0 for value in present_values)

    invalid_serving_size = sum(
        row["serving_size_g"] is None
        or float(row["serving_size_g"]) <= 0
        for row in rows
    )

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": {
            "database": display_path(database_path),
            "database_sha256": sha256_file(database_path),
            "selection": "menus with curation_status = approved",
            "nutrition_sources": sorted(
                {str(row["nutrition_source"]) for row in rows}
            ),
            "calculation_versions": sorted(
                {str(row["calculation_version"]) for row in rows}
            ),
            "curation_batch_distribution": dict(
                sorted(
                    Counter(
                        str(row["curation_batch"]) for row in rows
                    ).items(),
                    key=lambda item: int(item[0]),
                )
            ),
        },
        "export": {
            "dataset": display_path(dataset_path),
            "dataset_sha256": sha256_file(dataset_path),
            "columns": list(EXPORT_COLUMNS),
            "metadata_columns_not_for_model": list(METADATA_COLUMNS),
            "feature_columns": list(FEATURE_COLUMNS),
            "target_column": TARGET_COLUMN,
        },
        "row_count": row_count,
        "column_count": len(EXPORT_COLUMNS),
        "class_distribution": {
            class_name: {
                "count": class_counts.get(class_name, 0),
                "percent": round(
                    class_counts.get(class_name, 0) / row_count * 100,
                    4,
                ),
            }
            for class_name in EXPECTED_CLASSES
        },
        "integrity": {
            "unique_menu_ids": len({row["menu_id"] for row in rows}),
            "unique_normalized_names": len(
                {
                    str(row["menu_name"]).strip().casefold()
                    for row in rows
                }
            ),
            "duplicate_menu_ids": duplicate_count(rows, ("menu_id",)),
            "duplicate_normalized_names": (
                row_count
                - len(
                    {
                        str(row["menu_name"]).strip().casefold()
                        for row in rows
                    }
                )
            ),
            "duplicate_feature_and_target_rows": duplicate_count(
                rows,
                (*FEATURE_COLUMNS, TARGET_COLUMN),
            ),
            "duplicate_feature_rows_across_any_target": duplicate_count(
                rows,
                FEATURE_COLUMNS,
            ),
            "unexpected_classes": unexpected_classes,
            "missing_expected_classes": missing_expected_classes,
            "invalid_nonfinite_values": invalid_nonfinite,
            "invalid_negative_values": invalid_negative,
            "invalid_serving_size_count": invalid_serving_size,
        },
        "numeric_summary": {
            column: numeric_summary(rows, column)
            for column in FEATURE_COLUMNS
        },
        "warnings": [
            (
                "menu_id dan menu_name merupakan metadata keterlacakan dan "
                "tidak boleh digunakan sebagai fitur model."
            ),
            (
                "Outlier IQR merupakan kandidat pemeriksaan domain, bukan "
                "instruksi penghapusan otomatis; variasi gizi yang valid dapat "
                "memiliki nilai ekstrem."
            ),
            (
                "Label meal_type berasal dari kurasi menu, bukan perilaku "
                "pengguna yang diamati, sehingga klaim personalisasi harus "
                "dibatasi."
            ),
            (
                "Distribusi fitur dapat mencerminkan aturan pembentukan menu "
                "terkurasi; risiko leakage dan keterbatasan generalisasi harus "
                "dibahas."
            ),
        ],
    }


def markdown_table(headers: Sequence[str], rows: Sequence[Sequence[Any]]) -> str:
    header = "| " + " | ".join(headers) + " |"
    divider = "|" + "|".join("---" for _ in headers) + "|"
    body = [
        "| " + " | ".join(str(value) for value in row) + " |"
        for row in rows
    ]
    return "\n".join([header, divider, *body])


def format_number(value: Any) -> str:
    if isinstance(value, float):
        return f"{value:.6g}"
    return str(value)


def render_audit_markdown(audit: dict[str, Any]) -> str:
    class_rows = [
        (
            class_name,
            details["count"],
            f'{details["percent"]:.4f}%',
        )
        for class_name, details in audit["class_distribution"].items()
    ]
    numeric_rows = [
        (
            column,
            summary["count"],
            summary["missing"],
            f'{summary["missing_percent"]:.4f}%',
            format_number(summary["minimum"]),
            format_number(summary["median"]),
            format_number(summary["maximum"]),
            summary["iqr_outlier_count"],
        )
        for column, summary in audit["numeric_summary"].items()
    ]
    integrity = audit["integrity"]
    integrity_rows = [
        ("Baris data", audit["row_count"]),
        ("Kolom", audit["column_count"]),
        ("ID menu unik", integrity["unique_menu_ids"]),
        ("Nama menu unik", integrity["unique_normalized_names"]),
        ("Duplikasi ID menu", integrity["duplicate_menu_ids"]),
        ("Duplikasi nama ternormalisasi", integrity["duplicate_normalized_names"]),
        (
            "Duplikasi fitur dan target",
            integrity["duplicate_feature_and_target_rows"],
        ),
        (
            "Duplikasi fitur tanpa melihat target",
            integrity["duplicate_feature_rows_across_any_target"],
        ),
        ("Kelas tidak terduga", integrity["unexpected_classes"]),
        ("Kelas wajib yang tidak tersedia", integrity["missing_expected_classes"]),
        ("Ukuran porsi tidak valid", integrity["invalid_serving_size_count"]),
        (
            "Jumlah nilai nonfinite",
            sum(integrity["invalid_nonfinite_values"].values()),
        ),
        (
            "Jumlah nilai negatif",
            sum(integrity["invalid_negative_values"].values()),
        ),
    ]

    warning_lines = "\n".join(
        f"- {warning}" for warning in audit["warnings"]
    )
    feature_lines = "\n".join(
        f"- `{column}`" for column in audit["export"]["feature_columns"]
    )

    return f"""# Audit Dataset Klasifikasi Menu

Dokumen ini dihasilkan otomatis oleh `ml/export_dataset.py`. Angka pada dokumen
ini berasal dari sumber SQLite yang dicatat pada bagian keterlacakan.

## Keterlacakan

- Waktu audit (UTC): `{audit["generated_at_utc"]}`
- Database sumber: `{audit["source"]["database"]}`
- SHA-256 database: `{audit["source"]["database_sha256"]}`
- Dataset hasil ekspor: `{audit["export"]["dataset"]}`
- SHA-256 dataset: `{audit["export"]["dataset_sha256"]}`
- Seleksi baris: `{audit["source"]["selection"]}`
- Sumber nutrisi: `{", ".join(audit["source"]["nutrition_sources"])}`
- Versi kalkulasi: `{", ".join(audit["source"]["calculation_versions"])}`

## Peran Kolom

Metadata yang tidak boleh digunakan sebagai fitur model:

- `menu_id`
- `menu_name`

Fitur kandidat:

{feature_lines}

Target: `{audit["export"]["target_column"]}`

## Ringkasan Integritas

{markdown_table(("Pemeriksaan", "Hasil"), integrity_rows)}

## Distribusi Kelas

{markdown_table(("Kelas", "Jumlah", "Persentase"), class_rows)}

## Ringkasan Fitur Numerik

{markdown_table(
    (
        "Fitur",
        "Terisi",
        "Kosong",
        "Kosong (%)",
        "Minimum",
        "Median",
        "Maksimum",
        "Kandidat outlier IQR",
    ),
    numeric_rows,
)}

Kandidat outlier dihitung menggunakan batas 1,5 × IQR. Angka ini merupakan
indikator untuk pemeriksaan domain dan bukan instruksi penghapusan otomatis.

## Peringatan Metodologis

{warning_lines}
"""


def write_json(data: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as destination:
        json.dump(data, destination, ensure_ascii=False, indent=2)
        destination.write("\n")


def write_text(content: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")


def main() -> None:
    arguments = parse_arguments()
    database_path = arguments.database.resolve()
    dataset_path = arguments.output.resolve()
    audit_json_path = arguments.audit_json.resolve()
    audit_markdown_path = arguments.audit_markdown.resolve()

    rows = fetch_rows(database_path)
    write_csv(rows, dataset_path)
    audit = build_audit(rows, database_path, dataset_path)
    write_json(audit, audit_json_path)
    write_text(render_audit_markdown(audit), audit_markdown_path)

    print(f"Exported {len(rows)} rows to {dataset_path}")
    print(f"Audit JSON: {audit_json_path}")
    print(f"Audit Markdown: {audit_markdown_path}")


if __name__ == "__main__":
    main()
