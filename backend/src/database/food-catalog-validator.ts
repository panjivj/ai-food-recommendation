import type { AppDatabase } from './database.js'

export interface FoodCatalogValidation {
  errors: string[]
  stats: {
    categories: number
    foods: number
    menuComponents: number
    pendingManualReviews: number
    pilotMenus: number
    signatures: number
    totalMenus: number
  }
}

interface CatalogStats {
  categories: number
  foods: number
  menu_components: number
  pending_manual_reviews: number
  pilot_menus: number
  signatures: number
  total_menus: number
}

interface MenuId {
  id: string
}

export function validateFoodCatalog(
  database: AppDatabase,
): FoodCatalogValidation {
  const errors: string[] = []
  const stats = database
    .prepare<[], CatalogStats>(
      `SELECT
         (SELECT COUNT(*) FROM food_categories) AS categories,
         (SELECT COUNT(*) FROM food_ingredients) AS foods,
         (SELECT COUNT(*) FROM menus WHERE is_pilot = 1) AS pilot_menus,
         (SELECT COUNT(*) FROM menus) AS total_menus,
         (SELECT COUNT(*) FROM menu_ingredients) AS menu_components,
         (
           SELECT COUNT(*)
           FROM menu_component_signatures
         ) AS signatures,
         (
           SELECT COUNT(*)
           FROM menu_reviews
           WHERE decision = 'pending'
         ) AS pending_manual_reviews`,
    )
    .get()

  if (!stats) {
    throw new Error('Unable to read food catalog statistics')
  }

  if (stats.categories !== 12) {
    errors.push(`Expected 12 TKPI categories, found ${stats.categories}`)
  }

  if (stats.foods !== 1_145) {
    errors.push(`Expected 1145 TKPI foods, found ${stats.foods}`)
  }

  if (stats.pilot_menus !== 14) {
    errors.push(`Expected 14 approved pilot menus, found ${stats.pilot_menus}`)
  }

  if (stats.signatures !== stats.total_menus) {
    errors.push(
      `Expected one unique signature per menu, found ${stats.signatures} ` +
        `signatures for ${stats.total_menus} menus`,
    )
  }

  const withoutComponents = database
    .prepare<[], MenuId>(
      `SELECT m.id
       FROM menus m
       LEFT JOIN menu_ingredients mi ON mi.menu_id = m.id
       GROUP BY m.id
       HAVING COUNT(mi.food_ingredient_id) = 0`,
    )
    .all()

  for (const menu of withoutComponents) {
    errors.push(`Menu ${menu.id} has no components`)
  }

  const servingMismatches = database
    .prepare<[], MenuId>(
      `SELECT m.id
       FROM menus m
       JOIN menu_ingredients mi ON mi.menu_id = m.id
       GROUP BY m.id
       HAVING ABS(m.serving_size_g - SUM(mi.amount_g)) > 0.001`,
    )
    .all()

  for (const menu of servingMismatches) {
    errors.push(`Menu ${menu.id} serving size does not match its components`)
  }

  const missingMacros = database
    .prepare<[], MenuId>(
      `SELECT m.id
       FROM menus m
       LEFT JOIN menu_nutrition n ON n.menu_id = m.id
       WHERE (
           n.menu_id IS NULL
           OR n.energy_kcal IS NULL
           OR n.protein_g IS NULL
           OR n.fat_g IS NULL
           OR n.carbohydrate_g IS NULL
         )`,
    )
    .all()

  for (const menu of missingMacros) {
    errors.push(`Menu ${menu.id} has incomplete macronutrients`)
  }

  const calculationMismatches = database
    .prepare<[], MenuId>(
      `SELECT m.id
       FROM menus m
       JOIN menu_nutrition n ON n.menu_id = m.id
       JOIN menu_ingredients mi ON mi.menu_id = m.id
       JOIN food_ingredients f ON f.id = mi.food_ingredient_id
       GROUP BY m.id
       HAVING
         ABS(n.energy_kcal - ROUND(SUM(f.energy_kcal * mi.amount_g / 100), 3))
           > 0.001
         OR ABS(n.protein_g - ROUND(SUM(f.protein_g * mi.amount_g / 100), 3))
           > 0.001
         OR ABS(n.fat_g - ROUND(SUM(f.fat_g * mi.amount_g / 100), 3))
           > 0.001
         OR ABS(
           n.carbohydrate_g
           - ROUND(SUM(f.carbohydrate_g * mi.amount_g / 100), 3)
         ) > 0.001`,
    )
    .all()

  for (const menu of calculationMismatches) {
    errors.push(`Menu ${menu.id} has stale calculated macronutrients`)
  }

  return {
    errors,
    stats: {
      categories: stats.categories,
      foods: stats.foods,
      menuComponents: stats.menu_components,
      pendingManualReviews: stats.pending_manual_reviews,
      pilotMenus: stats.pilot_menus,
      signatures: stats.signatures,
      totalMenus: stats.total_menus,
    },
  }
}
