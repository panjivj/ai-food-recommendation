from __future__ import annotations

import sys
import unittest
from pathlib import Path

from sklearn.model_selection import GridSearchCV


ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from baseline import build_baseline_pipeline, baseline_estimators  # noqa: E402
from tuning import (  # noqa: E402
    SEARCH_SCORING,
    grid_combination_count,
    parameter_grid,
)


class TuningTests(unittest.TestCase):
    def test_parameter_grid_contains_expected_dimensions(self) -> None:
        grid = parameter_grid()
        self.assertEqual(
            tuple(grid),
            (
                "classifier__criterion",
                "classifier__max_depth",
                "classifier__min_samples_split",
                "classifier__min_samples_leaf",
                "classifier__class_weight",
            ),
        )
        self.assertEqual(grid_combination_count(grid), 216)

    def test_grid_values_are_bounded_and_include_baseline(self) -> None:
        grid = parameter_grid()
        self.assertIn("gini", grid["classifier__criterion"])
        self.assertIn(None, grid["classifier__max_depth"])
        self.assertIn(2, grid["classifier__min_samples_split"])
        self.assertIn(1, grid["classifier__min_samples_leaf"])
        self.assertIn(None, grid["classifier__class_weight"])

    def test_search_can_be_constructed_around_full_pipeline(self) -> None:
        pipeline = build_baseline_pipeline(
            baseline_estimators()["decision_tree"]
        )
        search = GridSearchCV(
            estimator=pipeline,
            param_grid=parameter_grid(),
            scoring=SEARCH_SCORING,
            cv=5,
        )
        self.assertEqual(
            tuple(search.estimator.named_steps),
            ("preprocessor", "classifier"),
        )
        self.assertEqual(search.scoring, "f1_macro")


if __name__ == "__main__":
    unittest.main()
