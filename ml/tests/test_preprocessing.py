from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np


ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from preprocessing import (  # noqa: E402
    DEFAULT_DATASET,
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    build_numeric_preprocessor,
    encode_targets,
    load_and_clean_dataset,
    stratified_split,
)


class PreprocessingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataframe, cls.cleaning = load_and_clean_dataset(DEFAULT_DATASET)

    def test_dataset_passes_cleaning_without_row_removal(self) -> None:
        self.assertEqual(len(self.dataframe), 614)
        self.assertEqual(self.cleaning["removed_rows"], 0)
        self.assertEqual(self.cleaning["duplicate_menu_ids"], 0)
        self.assertEqual(self.cleaning["duplicate_normalized_names"], 0)
        self.assertEqual(
            self.cleaning["duplicate_feature_and_target_rows"],
            0,
        )
        self.assertEqual(self.cleaning["missing_values"]["fiber_g"], 122)

    def test_split_is_deterministic_stratified_and_disjoint(self) -> None:
        first_train, first_test = stratified_split(self.dataframe)
        second_train, second_test = stratified_split(self.dataframe)

        self.assertEqual(
            first_train["menu_id"].tolist(),
            second_train["menu_id"].tolist(),
        )
        self.assertEqual(
            first_test["menu_id"].tolist(),
            second_test["menu_id"].tolist(),
        )
        self.assertEqual(len(first_train), 491)
        self.assertEqual(len(first_test), 123)
        self.assertFalse(
            set(first_train["menu_id"]) & set(first_test["menu_id"])
        )
        self.assertEqual(
            set(first_train[TARGET_COLUMN]),
            set(EXPECTED_CLASSES),
        )
        self.assertEqual(
            set(first_test[TARGET_COLUMN]),
            set(EXPECTED_CLASSES),
        )

    def test_imputation_and_scaling_are_fit_on_training_only(self) -> None:
        train_data, test_data = stratified_split(self.dataframe)
        preprocessor = build_numeric_preprocessor()
        transformed_train = preprocessor.fit_transform(train_data)
        transformed_test = preprocessor.transform(test_data)

        self.assertEqual(transformed_train.shape, (491, len(FEATURE_COLUMNS)))
        self.assertEqual(transformed_test.shape, (123, len(FEATURE_COLUMNS)))
        self.assertTrue(np.isfinite(transformed_train).all())
        self.assertTrue(np.isfinite(transformed_test).all())

    def test_target_encoding_is_stable(self) -> None:
        train_data, test_data = stratified_split(self.dataframe)
        encoder, encoded_train, encoded_test = encode_targets(
            train_data[TARGET_COLUMN],
            test_data[TARGET_COLUMN],
        )

        self.assertEqual(tuple(encoder.classes_), EXPECTED_CLASSES)
        self.assertEqual(set(encoded_train), {0, 1, 2, 3})
        self.assertEqual(set(encoded_test), {0, 1, 2, 3})


if __name__ == "__main__":
    unittest.main()
