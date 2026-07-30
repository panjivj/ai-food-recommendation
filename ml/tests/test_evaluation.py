from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np


ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from evaluation import (  # noqa: E402
    calculate_metrics,
    enforce_one_time_guard,
    output_paths,
    plot_confusion_matrix,
    plot_multiclass_roc,
)


class EvaluationTests(unittest.TestCase):
    def test_perfect_multiclass_metrics(self) -> None:
        actual = np.array([0, 1, 2, 3, 0, 1, 2, 3])
        probabilities = np.full((8, 4), 0.02)
        probabilities[np.arange(8), actual] = 0.94
        metrics = calculate_metrics(
            actual,
            actual.copy(),
            probabilities,
            ("breakfast", "dinner", "lunch", "snack"),
        )

        for value in metrics["overall"].values():
            self.assertAlmostEqual(value, 1.0)
        self.assertEqual(
            metrics["confusion_matrix"],
            [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]],
        )
        self.assertEqual(metrics["per_class"]["snack"]["support"], 2)

    def test_metrics_use_macro_average(self) -> None:
        actual = np.array([0, 0, 0, 1, 2, 3])
        predicted = np.array([0, 0, 0, 0, 2, 3])
        probabilities = np.array(
            [
                [0.8, 0.1, 0.05, 0.05],
                [0.7, 0.1, 0.1, 0.1],
                [0.6, 0.2, 0.1, 0.1],
                [0.4, 0.3, 0.2, 0.1],
                [0.1, 0.1, 0.7, 0.1],
                [0.1, 0.1, 0.2, 0.6],
            ]
        )
        metrics = calculate_metrics(
            actual,
            predicted,
            probabilities,
            ("breakfast", "dinner", "lunch", "snack"),
        )

        self.assertAlmostEqual(metrics["overall"]["accuracy"], 5 / 6)
        self.assertLess(
            metrics["overall"]["recall_macro"],
            metrics["overall"]["accuracy"],
        )

    def test_one_time_guard_rejects_existing_output(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            paths = output_paths(Path(temporary_directory))
            paths["metrics_csv"].touch()
            with self.assertRaises(FileExistsError):
                enforce_one_time_guard(paths, overwrite=False)
            enforce_one_time_guard(paths, overwrite=True)

    def test_evaluation_figures_can_be_rendered(self) -> None:
        actual = np.array([0, 1, 2, 3, 0, 1, 2, 3])
        probabilities = np.full((8, 4), 0.02)
        probabilities[np.arange(8), actual] = 0.94
        classes = ("breakfast", "dinner", "lunch", "snack")
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            confusion_path = root / "confusion.png"
            roc_path = root / "roc.png"
            plot_confusion_matrix(np.eye(4, dtype=int) * 2, classes, confusion_path)
            plot_multiclass_roc(
                actual,
                probabilities,
                classes,
                roc_path,
            )
            self.assertGreater(confusion_path.stat().st_size, 0)
            self.assertGreater(roc_path.stat().st_size, 0)


if __name__ == "__main__":
    unittest.main()
