from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np


ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from eda import (  # noqa: E402
    DEFAULT_DATASET,
    DEFAULT_TEST,
    DEFAULT_TRAIN,
    correlation_matrix,
    descriptive_statistics,
    per_class_medians,
    top_correlation_pairs,
)
from preprocessing import (  # noqa: E402
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    load_and_clean_dataset,
)


class EdaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.full_data, _ = load_and_clean_dataset(DEFAULT_DATASET)
        cls.train_data, _ = load_and_clean_dataset(DEFAULT_TRAIN)
        cls.test_data, _ = load_and_clean_dataset(DEFAULT_TEST)

    def test_split_reconstructs_full_dataset(self) -> None:
        train_ids = set(self.train_data["menu_id"])
        test_ids = set(self.test_data["menu_id"])
        self.assertFalse(train_ids & test_ids)
        self.assertEqual(train_ids | test_ids, set(self.full_data["menu_id"]))

    def test_correlation_matrix_is_complete_and_symmetric(self) -> None:
        correlations = correlation_matrix(self.train_data)
        self.assertEqual(correlations.shape, (7, 7))
        self.assertEqual(list(correlations.columns), list(FEATURE_COLUMNS))
        self.assertTrue(np.allclose(correlations, correlations.T))
        self.assertTrue(np.allclose(np.diag(correlations), 1))

    def test_descriptive_statistics_cover_all_features(self) -> None:
        descriptions = descriptive_statistics(self.train_data)
        self.assertEqual(descriptions["feature"].tolist(), list(FEATURE_COLUMNS))
        fiber = descriptions.loc[
            descriptions["feature"].eq("fiber_g")
        ].iloc[0]
        self.assertEqual(int(fiber["missing"]), 99)

    def test_per_class_medians_cover_all_classes(self) -> None:
        medians = per_class_medians(self.train_data)
        self.assertEqual(tuple(medians.index), EXPECTED_CLASSES)
        self.assertEqual(list(medians.columns), list(FEATURE_COLUMNS))

    def test_correlation_pairs_cover_every_unique_pair(self) -> None:
        correlations = correlation_matrix(self.train_data)
        pairs = top_correlation_pairs(correlations)
        expected_pairs = len(FEATURE_COLUMNS) * (len(FEATURE_COLUMNS) - 1) // 2
        self.assertEqual(len(pairs), expected_pairs)
        self.assertGreaterEqual(
            pairs[0]["absolute_correlation"],
            pairs[-1]["absolute_correlation"],
        )


if __name__ == "__main__":
    unittest.main()
