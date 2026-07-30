import type { AppDatabase } from '../database/database.js'
import type {
  MenuMealType,
} from '../domain/menu.js'
import type {
  DailyRecommendation,
  DailyRecommendationItem,
  RecommendationCandidate,
  RecommendationHistoryResult,
} from '../domain/recommendation.js'

interface CandidateRow {
  allergens_json: string
  carbohydrate_g: number | null
  description: string
  energy_kcal: number
  fat_g: number | null
  fiber_g: number | null
  id: string
  ingredient_names_json: string
  meal_type: MenuMealType
  name: string
  protein_g: number | null
  serving_description: string
  serving_size_g: number
  slug: string
  sodium_mg: number | null
  tags_json: string
}

interface RecommendationRow {
  applied_feedback_rules_json: string
  applied_profile_rules_json: string
  daily_target_calories: number
  difference_from_daily_target_calories: number
  filter_stats_json: string
  generated_at: string
  id: string
  recommendation_date: string
  strategy_json: string
  total_recommended_calories: number
  warnings_json: string
}

interface RecommendationItemRow {
  meal_type: DailyRecommendationItem['mealType']
  menu_snapshot_json: string
  position: number
  reasons_json: string
  score_json: string
  target_calories: number
}

interface CountRow {
  total: number
}

const recommendationColumns = `
  id,
  recommendation_date,
  daily_target_calories,
  total_recommended_calories,
  difference_from_daily_target_calories,
  filter_stats_json,
  applied_profile_rules_json,
  applied_feedback_rules_json,
  strategy_json,
  warnings_json,
  generated_at
`

function parseJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T
  } catch (error) {
    throw new Error(`Stored recommendation contains invalid ${label}`, {
      cause: error,
    })
  }
}

function parseStringArray(value: string): string[] {
  const parsed = parseJson<unknown>(value, 'list data')

  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === 'string')
  ) {
    throw new Error('Recommendation candidate contains invalid list data')
  }

  return parsed
}

function toCandidate(row: CandidateRow): RecommendationCandidate {
  return {
    menu: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      mealType: row.meal_type,
      servingSizeG: row.serving_size_g,
      servingDescription: row.serving_description,
      nutrition: {
        energyKcal: row.energy_kcal,
        proteinG: row.protein_g,
        fatG: row.fat_g,
        carbohydrateG: row.carbohydrate_g,
        fiberG: row.fiber_g,
        sodiumMg: row.sodium_mg,
      },
      tags: parseStringArray(row.tags_json),
      allergens: parseStringArray(row.allergens_json),
      ingredientNames: parseStringArray(row.ingredient_names_json),
    },
  }
}

export class RecommendationRepository {
  private readonly selectCandidates

  constructor(private readonly database: AppDatabase) {
    this.selectCandidates = database.prepare<[], CandidateRow>(
      `SELECT
         m.id,
         m.slug,
         m.name,
         m.description,
         m.meal_type,
         m.serving_size_g,
         m.serving_description,
         n.energy_kcal,
         n.protein_g,
         n.fat_g,
         n.carbohydrate_g,
         n.fiber_g,
         n.sodium_mg,
         COALESCE(
           (
             SELECT json_group_array(ordered_tags.tag)
             FROM (
               SELECT tag
               FROM menu_tags
               WHERE menu_id = m.id
               ORDER BY tag
             ) AS ordered_tags
           ),
           '[]'
         ) AS tags_json,
         COALESCE(
           (
             SELECT json_group_array(ordered_allergens.allergen)
             FROM (
               SELECT allergen
               FROM menu_allergens
               WHERE menu_id = m.id
               ORDER BY allergen
             ) AS ordered_allergens
           ),
           '[]'
         ) AS allergens_json,
         COALESCE(
           (
             SELECT json_group_array(ordered_ingredients.name)
             FROM (
               SELECT food.name
               FROM menu_ingredients component
               JOIN food_ingredients food
                 ON food.id = component.food_ingredient_id
               WHERE component.menu_id = m.id
               ORDER BY component.sort_order, food.tkpi_code
             ) AS ordered_ingredients
           ),
           '[]'
         ) AS ingredient_names_json
       FROM menus m
       JOIN menu_nutrition n ON n.menu_id = m.id
       WHERE m.curation_status = 'approved'
         AND n.energy_kcal IS NOT NULL
       ORDER BY m.id`,
    )
  }

  findApprovedCandidates(): RecommendationCandidate[] {
    return this.selectCandidates.all().map(toCandidate)
  }

  findSnapshot(
    userId: string,
    date: string,
  ): DailyRecommendation | undefined {
    const row = this.database
      .prepare<[string, string], RecommendationRow>(
        `SELECT ${recommendationColumns}
         FROM recommendations
         WHERE user_id = ? AND recommendation_date = ?`,
      )
      .get(userId, date)

    return row ? this.hydrate(row) : undefined
  }

  createSnapshot(
    userId: string,
    recommendation: DailyRecommendation,
  ): DailyRecommendation {
    const create = this.database.transaction(() => {
      const result = this.database
        .prepare(
          `INSERT OR IGNORE INTO recommendations (
             id,
             user_id,
             recommendation_date,
             daily_target_calories,
             total_recommended_calories,
             difference_from_daily_target_calories,
             filter_stats_json,
             applied_profile_rules_json,
             applied_feedback_rules_json,
             strategy_json,
             warnings_json,
             generated_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          recommendation.id,
          userId,
          recommendation.date,
          recommendation.dailyTargetCalories,
          recommendation.totalRecommendedCalories,
          recommendation.differenceFromDailyTargetCalories,
          JSON.stringify(recommendation.filterStats),
          JSON.stringify(recommendation.appliedProfileRules),
          JSON.stringify(recommendation.appliedFeedbackRules),
          JSON.stringify(recommendation.strategy),
          JSON.stringify(recommendation.warnings),
          recommendation.generatedAt,
        )

      if (result.changes === 1) {
        const insertItem = this.database.prepare(
          `INSERT INTO recommendation_items (
             recommendation_id,
             meal_type,
             position,
             target_calories,
             menu_id_snapshot,
             menu_snapshot_json,
             score_json,
             reasons_json
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )

        recommendation.items.forEach((item, position) => {
          insertItem.run(
            recommendation.id,
            item.mealType,
            position,
            item.targetCalories,
            item.menu.id,
            JSON.stringify(item.menu),
            JSON.stringify(item.score),
            JSON.stringify(item.reasons),
          )
        })
      }

      const stored = this.findSnapshot(userId, recommendation.date)

      if (!stored) {
        throw new Error('Recommendation snapshot could not be persisted')
      }

      return stored
    })

    return create()
  }

  replaceSnapshotItem(
    userId: string,
    recommendation: DailyRecommendation,
    replacement: DailyRecommendationItem,
  ): DailyRecommendation {
    const replace = this.database.transaction(() => {
      const recommendationUpdate = this.database
        .prepare(
          `UPDATE recommendations
           SET total_recommended_calories = ?,
               difference_from_daily_target_calories = ?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?
             AND user_id = ?
             AND recommendation_date = ?`,
        )
        .run(
          recommendation.totalRecommendedCalories,
          recommendation.differenceFromDailyTargetCalories,
          recommendation.id,
          userId,
          recommendation.date,
        )

      if (recommendationUpdate.changes !== 1) {
        throw new Error('Recommendation snapshot was not found')
      }

      const itemUpdate = this.database
        .prepare(
          `UPDATE recommendation_items
           SET target_calories = ?,
               menu_id_snapshot = ?,
               menu_snapshot_json = ?,
               score_json = ?,
               reasons_json = ?,
               replaced_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE recommendation_id = ? AND meal_type = ?`,
        )
        .run(
          replacement.targetCalories,
          replacement.menu.id,
          JSON.stringify(replacement.menu),
          JSON.stringify(replacement.score),
          JSON.stringify(replacement.reasons),
          recommendation.id,
          replacement.mealType,
        )

      if (itemUpdate.changes !== 1) {
        throw new Error('Recommendation item snapshot was not found')
      }

      const stored = this.findSnapshot(userId, recommendation.date)

      if (!stored) {
        throw new Error('Updated recommendation snapshot could not be read')
      }

      return stored
    })

    return replace()
  }

  listHistory(
    userId: string,
    page: number,
    limit: number,
  ): RecommendationHistoryResult {
    const count = this.database
      .prepare<[string], CountRow>(
        `SELECT COUNT(*) AS total
         FROM recommendations
         WHERE user_id = ?`,
      )
      .get(userId)

    if (!count) {
      throw new Error('Recommendation history count returned no result')
    }

    const rows = this.database
      .prepare<[string, number, number], RecommendationRow>(
        `SELECT ${recommendationColumns}
         FROM recommendations
         WHERE user_id = ?
         ORDER BY recommendation_date DESC, created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(userId, limit, (page - 1) * limit)

    return {
      items: rows.map((row) => this.hydrate(row)),
      page,
      limit,
      total: count.total,
      totalPages:
        count.total === 0 ? 0 : Math.ceil(count.total / limit),
    }
  }

  private hydrate(row: RecommendationRow): DailyRecommendation {
    const items = this.database
      .prepare<[string], RecommendationItemRow>(
        `SELECT
           meal_type,
           position,
           target_calories,
           menu_snapshot_json,
           score_json,
           reasons_json
         FROM recommendation_items
         WHERE recommendation_id = ?
         ORDER BY position`,
      )
      .all(row.id)
      .map(
        (item): DailyRecommendationItem => ({
          mealType: item.meal_type,
          targetCalories: item.target_calories,
          menu: parseJson(
            item.menu_snapshot_json,
            'menu snapshot',
          ),
          score: parseJson(item.score_json, 'score snapshot'),
          reasons: parseJson(item.reasons_json, 'reason snapshot'),
        }),
      )

    return {
      id: row.id,
      date: row.recommendation_date,
      dailyTargetCalories: row.daily_target_calories,
      totalRecommendedCalories: row.total_recommended_calories,
      differenceFromDailyTargetCalories:
        row.difference_from_daily_target_calories,
      items,
      filterStats: parseJson(
        row.filter_stats_json,
        'filter statistics snapshot',
      ),
      appliedProfileRules: parseJson(
        row.applied_profile_rules_json,
        'profile rule snapshot',
      ),
      appliedFeedbackRules: parseJson(
        row.applied_feedback_rules_json,
        'feedback rule snapshot',
      ),
      strategy: parseJson(row.strategy_json, 'strategy snapshot'),
      warnings: parseJson(row.warnings_json, 'warning snapshot'),
      generatedAt: row.generated_at,
    }
  }
}
