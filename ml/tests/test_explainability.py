from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np


ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from explainability import (  # noqa: E402
    DEFAULT_MODEL_ARTIFACT,
    extract_feature_importance,
    load_frozen_bundle,
    plot_feature_importance,
)
from preprocessing import FEATURE_COLUMNS  # noqa: E402


class ExplainabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bundle = load_frozen_bundle(DEFAULT_MODEL_ARTIFACT)

    def test_importance_matches_feature_schema_and_sums_to_one(self) -> None:
        importance = extract_feature_importance(self.bundle)

        self.assertEqual(set(importance["feature"]), set(FEATURE_COLUMNS))
        self.assertAlmostEqual(float(importance["importance"].sum()), 1.0)
        self.assertTrue((importance["importance"] >= 0).all())
        self.assertEqual(importance["rank"].tolist(), list(range(1, 8)))

    def test_importance_is_sorted_descending(self) -> None:
        importance = extract_feature_importance(self.bundle)
        values = importance["importance"].to_numpy()
        self.assertTrue(np.all(values[:-1] >= values[1:]))

    def test_extraction_does_not_modify_model_artifact(self) -> None:
        before = DEFAULT_MODEL_ARTIFACT.read_bytes()
        extract_feature_importance(self.bundle)
        after = DEFAULT_MODEL_ARTIFACT.read_bytes()
        self.assertEqual(before, after)

    def test_feature_order_mismatch_is_rejected(self) -> None:
        modified = dict(self.bundle)
        modified["feature_columns"] = list(reversed(FEATURE_COLUMNS))
        with self.assertRaises(ValueError):
            extract_feature_importance(modified)

    def test_figure_can_be_rendered(self) -> None:
        importance = extract_feature_importance(self.bundle)
        with tempfile.TemporaryDirectory() as temporary_directory:
            figure_path = Path(temporary_directory) / "importance.png"
            plot_feature_importance(importance, figure_path)
            self.assertGreater(figure_path.stat().st_size, 0)


if __name__ == "__main__":
    unittest.main()
