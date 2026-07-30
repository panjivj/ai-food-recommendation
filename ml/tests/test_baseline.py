from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier


ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from baseline import (  # noqa: E402
    CV_FOLDS,
    METRIC_NAMES,
    baseline_estimators,
    build_baseline_pipeline,
    cross_validation,
    scoring,
)
from preprocessing import (  # noqa: E402
    DEFAULT_TRAIN,
    EXPECTED_CLASSES,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    encode_targets,
    load_and_clean_dataset,
)


class BaselineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.train_data, _ = load_and_clean_dataset(DEFAULT_TRAIN)
        _, cls.encoded_target, _ = encode_targets(
            cls.train_data[TARGET_COLUMN],
            cls.train_data[TARGET_COLUMN],
        )

    def test_three_required_estimators_are_configured(self) -> None:
        estimators = baseline_estimators()
        self.assertEqual(
            tuple(estimators),
            ("decision_tree", "random_forest", "svm_rbf"),
        )
        self.assertIsInstance(
            estimators["decision_tree"],
            DecisionTreeClassifier,
        )
        self.assertIsInstance(
            estimators["random_forest"],
            RandomForestClassifier,
        )
        self.assertIsInstance(estimators["svm_rbf"], SVC)

    def test_pipeline_contains_preprocessor_and_classifier(self) -> None:
        first = build_baseline_pipeline(
            baseline_estimators()["decision_tree"]
        )
        second = build_baseline_pipeline(
            baseline_estimators()["decision_tree"]
        )
        self.assertEqual(
            tuple(first.named_steps),
            ("preprocessor", "classifier"),
        )
        self.assertIsNot(
            first.named_steps["preprocessor"],
            second.named_steps["preprocessor"],
        )

    def test_scoring_contains_all_required_metrics(self) -> None:
        self.assertEqual(tuple(scoring()), METRIC_NAMES)

    def test_every_cross_validation_fold_is_stratified(self) -> None:
        features = self.train_data.loc[:, FEATURE_COLUMNS]
        splitter = cross_validation()
        self.assertEqual(splitter.n_splits, CV_FOLDS)

        all_classes = set(range(len(EXPECTED_CLASSES)))
        validation_indices: list[int] = []
        for train_indices, validation_fold_indices in splitter.split(
            features,
            self.encoded_target,
        ):
            self.assertFalse(set(train_indices) & set(validation_fold_indices))
            self.assertEqual(
                set(np.unique(self.encoded_target[train_indices])),
                all_classes,
            )
            self.assertEqual(
                set(np.unique(self.encoded_target[validation_fold_indices])),
                all_classes,
            )
            validation_indices.extend(validation_fold_indices.tolist())

        self.assertEqual(sorted(validation_indices), list(range(491)))


if __name__ == "__main__":
    unittest.main()
