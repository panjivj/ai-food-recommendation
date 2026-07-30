import type { AppDatabase } from '../database/database.js'
import type {
  MenuAllergen,
  MenuDetail,
  MenuIngredient,
  MenuListFilters,
  MenuListResult,
  MenuMealType,
  MenuNutrition,
  MenuNutritionSummary,
  MenuSummary,
} from '../domain/menu.js'

interface CountRow {
  total: number
}

interface IngredientRow {
  amount_g: number
  category: string
  component_role: string
  name: string
  preparation_note: string
  source_reference: string
  tkpi_code: string
}

interface AllergenRow {
  allergen: string
  evidence: string
}

interface NutritionRow {
  ash_g: number | null
  beta_carotene_mcg: number | null
  calcium_mg: number | null
  carbohydrate_g: number | null
  copper_mg: number | null
  energy_kcal: number | null
  fat_g: number | null
  fiber_g: number | null
  iron_mg: number | null
  niacin_mg: number | null
  phosphorus_mg: number | null
  potassium_mg: number | null
  protein_g: number | null
  retinol_mcg: number | null
  riboflavin_mg: number | null
  sodium_mg: number | null
  thiamin_mg: number | null
  total_carotene_mcg: number | null
  vitamin_c_mg: number | null
  water_g: number | null
  zinc_mg: number | null
}

interface MenuRow extends NutritionRow {
  allergens_json: string
  calculation_version: string
  description: string
  id: string
  meal_type: MenuMealType
  name: string
  nutrition_source: string
  serving_description: string
  serving_size_g: number
  slug: string
  tags_json: string
}

const nutritionColumns = `
  n.water_g,
  n.energy_kcal,
  n.protein_g,
  n.fat_g,
  n.carbohydrate_g,
  n.fiber_g,
  n.ash_g,
  n.calcium_mg,
  n.phosphorus_mg,
  n.iron_mg,
  n.sodium_mg,
  n.potassium_mg,
  n.copper_mg,
  n.zinc_mg,
  n.retinol_mcg,
  n.beta_carotene_mcg,
  n.total_carotene_mcg,
  n.thiamin_mg,
  n.riboflavin_mg,
  n.niacin_mg,
  n.vitamin_c_mg
`

const menuColumns = `
  m.id,
  m.slug,
  m.name,
  m.description,
  m.meal_type,
  m.serving_size_g,
  m.serving_description,
  m.nutrition_source,
  m.calculation_version,
  ${nutritionColumns},
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
  ) AS allergens_json
`

function parseStringArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value)

  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === 'string')
  ) {
    throw new Error('Menu contains an invalid string array')
  }

  return parsed
}

function toNutritionSummary(row: NutritionRow): MenuNutritionSummary {
  return {
    energyKcal: row.energy_kcal,
    proteinG: row.protein_g,
    fatG: row.fat_g,
    carbohydrateG: row.carbohydrate_g,
    fiberG: row.fiber_g,
    sodiumMg: row.sodium_mg,
  }
}

function toNutrition(row: NutritionRow): MenuNutrition {
  return {
    ...toNutritionSummary(row),
    waterG: row.water_g,
    ashG: row.ash_g,
    calciumMg: row.calcium_mg,
    phosphorusMg: row.phosphorus_mg,
    ironMg: row.iron_mg,
    potassiumMg: row.potassium_mg,
    copperMg: row.copper_mg,
    zincMg: row.zinc_mg,
    retinolMcg: row.retinol_mcg,
    betaCaroteneMcg: row.beta_carotene_mcg,
    totalCaroteneMcg: row.total_carotene_mcg,
    thiaminMg: row.thiamin_mg,
    riboflavinMg: row.riboflavin_mg,
    niacinMg: row.niacin_mg,
    vitaminCMg: row.vitamin_c_mg,
  }
}

function toSummary(row: MenuRow): MenuSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    mealType: row.meal_type,
    servingSizeG: row.serving_size_g,
    servingDescription: row.serving_description,
    nutrition: toNutritionSummary(row),
    tags: parseStringArray(row.tags_json),
    allergens: parseStringArray(row.allergens_json),
  }
}

export class MenuRepository {
  constructor(private readonly database: AppDatabase) {}

  list(filters: MenuListFilters): MenuListResult {
    const conditions = [`m.curation_status = 'approved'`]
    const parameters: Array<number | string> = []

    if (filters.search !== undefined) {
      conditions.push('INSTR(LOWER(m.name), LOWER(?)) > 0')
      parameters.push(filters.search)
    }

    if (filters.mealType !== undefined) {
      conditions.push('m.meal_type = ?')
      parameters.push(filters.mealType)
    }

    if (filters.minimumCalories !== undefined) {
      conditions.push('n.energy_kcal >= ?')
      parameters.push(filters.minimumCalories)
    }

    if (filters.maximumCalories !== undefined) {
      conditions.push('n.energy_kcal <= ?')
      parameters.push(filters.maximumCalories)
    }

    const where = conditions.join('\nAND ')
    const count = this.database
      .prepare<unknown[], CountRow>(
        `SELECT COUNT(*) AS total
         FROM menus m
         JOIN menu_nutrition n ON n.menu_id = m.id
         WHERE ${where}`,
      )
      .get(...parameters)

    if (!count) {
      throw new Error('Menu count query returned no result')
    }

    const offset = (filters.page - 1) * filters.limit
    const rows = this.database
      .prepare<unknown[], MenuRow>(
        `SELECT ${menuColumns}
         FROM menus m
         JOIN menu_nutrition n ON n.menu_id = m.id
         WHERE ${where}
         ORDER BY m.name COLLATE NOCASE, m.id
         LIMIT ? OFFSET ?`,
      )
      .all(...parameters, filters.limit, offset)

    return {
      items: rows.map(toSummary),
      page: filters.page,
      limit: filters.limit,
      total: count.total,
      totalPages:
        count.total === 0 ? 0 : Math.ceil(count.total / filters.limit),
    }
  }

  findApproved(identifier: string): MenuDetail | undefined {
    const row = this.database
      .prepare<[string, string], MenuRow>(
        `SELECT ${menuColumns}
         FROM menus m
         JOIN menu_nutrition n ON n.menu_id = m.id
         WHERE m.curation_status = 'approved'
           AND (m.id = ? OR m.slug = ?)
         LIMIT 1`,
      )
      .get(identifier, identifier)

    if (!row) {
      return undefined
    }

    const ingredientRows = this.database
      .prepare<[string], IngredientRow>(
        `SELECT
           f.tkpi_code,
           f.name,
           mi.amount_g,
           mi.component_role,
           mi.preparation_note,
           f.source_reference,
           c.name AS category
         FROM menu_ingredients mi
         JOIN food_ingredients f ON f.id = mi.food_ingredient_id
         JOIN food_categories c ON c.id = f.category_id
         WHERE mi.menu_id = ?
         ORDER BY mi.sort_order, f.tkpi_code`,
      )
      .all(row.id)
    const allergenRows = this.database
      .prepare<[string], AllergenRow>(
        `SELECT allergen, evidence
         FROM menu_allergens
         WHERE menu_id = ?
         ORDER BY allergen`,
      )
      .all(row.id)

    return {
      ...toSummary(row),
      nutrition: toNutrition(row),
      ingredients: ingredientRows.map(
        (ingredient): MenuIngredient => ({
          tkpiCode: ingredient.tkpi_code,
          name: ingredient.name,
          amountG: ingredient.amount_g,
          componentRole: ingredient.component_role,
          preparationNote: ingredient.preparation_note,
          sourceReference: ingredient.source_reference,
          category: ingredient.category,
        }),
      ),
      allergens: allergenRows.map(
        (allergen): MenuAllergen => ({
          name: allergen.allergen,
          evidence: allergen.evidence,
        }),
      ),
      nutritionSource: row.nutrition_source,
      calculationVersion: row.calculation_version,
    }
  }
}
