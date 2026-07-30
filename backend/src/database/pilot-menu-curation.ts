import type { AppDatabase } from './database.js'
import { validateFoodCatalog } from './food-catalog-validator.js'

const approvedMenuIds = new Set([
  'pilot-003',
  'pilot-004',
  'pilot-005',
  'pilot-009',
  'pilot-010',
  'pilot-012',
  'pilot-015',
  'pilot-017',
  'pilot-018',
  'pilot-019',
  'pilot-021',
  'pilot-022',
  'pilot-024',
  'pilot-025',
])

interface ReviewCandidate {
  energy_kcal: number
  id: string
  max_energy_difference_percent: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  missing_sodium_components: number
  sodium_mg: number
}

interface RoleCount {
  beverages: number
  fruits: number
  proteins: number
  staples: number
  vegetables: number
}

export interface PilotCurationResult {
  approved: number
  changesRequested: number
}

const energyRanges = {
  breakfast: [250, 500],
  lunch: [350, 650],
  dinner: [350, 650],
  snack: [100, 300],
} as const

const sodiumLimits = {
  breakfast: 600,
  lunch: 800,
  dinner: 800,
  snack: 400,
} as const

function validateCandidate(
  database: AppDatabase,
  candidate: ReviewCandidate,
): void {
  const [minimumEnergy, maximumEnergy] = energyRanges[candidate.meal_type]
  const sodiumLimit = sodiumLimits[candidate.meal_type]

  if (
    candidate.energy_kcal < minimumEnergy ||
    candidate.energy_kcal > maximumEnergy
  ) {
    throw new Error(
      `${candidate.id} energy ${candidate.energy_kcal} is outside ` +
        `${minimumEnergy}-${maximumEnergy} kcal`,
    )
  }

  if (candidate.missing_sodium_components > 0) {
    throw new Error(`${candidate.id} has unavailable component sodium values`)
  }

  if (candidate.sodium_mg > sodiumLimit) {
    throw new Error(
      `${candidate.id} sodium ${candidate.sodium_mg} exceeds ${sodiumLimit} mg`,
    )
  }

  if (candidate.max_energy_difference_percent > 40) {
    throw new Error(
      `${candidate.id} uses a source with an energy-macro difference above 40%`,
    )
  }

  const roles = database
    .prepare<[string], RoleCount>(
      `SELECT
         SUM(component_role = 'staple') AS staples,
         SUM(component_role = 'protein') AS proteins,
         SUM(component_role = 'vegetable') AS vegetables,
         SUM(component_role = 'fruit') AS fruits,
         SUM(component_role = 'beverage') AS beverages
       FROM menu_ingredients
       WHERE menu_id = ?`,
    )
    .get(candidate.id)

  if (!roles || roles.fruits < 1) {
    throw new Error(`${candidate.id} must include fruit`)
  }

  if (
    (candidate.meal_type === 'lunch' || candidate.meal_type === 'dinner') &&
    (roles.staples < 1 || roles.proteins < 1 || roles.vegetables < 1)
  ) {
    throw new Error(
      `${candidate.id} must include staple, protein, vegetable, and fruit`,
    )
  }

  if (
    candidate.meal_type === 'breakfast' &&
    (roles.staples < 1 || roles.proteins + roles.beverages < 1)
  ) {
    throw new Error(
      `${candidate.id} breakfast must include staple and protein or dairy`,
    )
  }
}

export function reviewPilotMenus(
  database: AppDatabase,
): PilotCurationResult {
  const technicalValidation = validateFoodCatalog(database)

  if (technicalValidation.errors.length > 0) {
    throw new Error(
      `Technical validation must pass before review:\n${technicalValidation.errors.join('\n')}`,
    )
  }

  const candidates = database
    .prepare<[], ReviewCandidate>(
      `SELECT
         m.id,
         m.meal_type,
         n.energy_kcal,
         ROUND(SUM(COALESCE(f.sodium_mg, 0) * mi.amount_g / 100), 3)
           AS sodium_mg,
         SUM(f.sodium_mg IS NULL) AS missing_sodium_components,
         MAX(
           CASE
             WHEN f.energy_kcal > 0
               AND f.protein_g IS NOT NULL
               AND f.fat_g IS NOT NULL
               AND f.carbohydrate_g IS NOT NULL
             THEN
               ABS(
                 f.energy_kcal
                 - (
                   4 * f.protein_g
                   + 9 * f.fat_g
                   + 4 * f.carbohydrate_g
                 )
               ) / f.energy_kcal * 100
             ELSE 100
           END
         ) AS max_energy_difference_percent
       FROM menus m
       JOIN menu_nutrition n ON n.menu_id = m.id
       JOIN menu_ingredients mi ON mi.menu_id = m.id
       JOIN food_ingredients f ON f.id = mi.food_ingredient_id
       WHERE m.is_pilot = 1
       GROUP BY m.id
       ORDER BY m.id`,
    )
    .all()

  if (candidates.length !== approvedMenuIds.size) {
    throw new Error(
      `Expected ${approvedMenuIds.size} review candidates, ` +
        `found ${candidates.length}`,
    )
  }

  for (const candidate of candidates) {
    if (!approvedMenuIds.has(candidate.id)) {
      throw new Error(`Unexpected pilot menu ${candidate.id}`)
    }

    validateCandidate(database, candidate)
  }

  const deleteAutomatedReviews = database.prepare(`
    DELETE FROM menu_reviews
    WHERE menu_id = ?
      AND reviewer IN ('manual-curation-required', 'structured-curation-v1')
  `)
  const insertReview = database.prepare(`
    INSERT INTO menu_reviews (
      menu_id,
      reviewer,
      decision,
      notes,
      reviewed_at
    )
    VALUES (?, 'structured-curation-v1', ?, ?, ?)
  `)
  const updateStatus = database.prepare(`
    UPDATE menus
    SET
      curation_status = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `)
  const reviewedAt = new Date().toISOString()

  const applyReview = database.transaction(() => {
    for (const candidate of candidates) {
      const notes =
        `Lolos kurasi v1: ${candidate.energy_kcal.toFixed(1)} kkal, ` +
        `${candidate.sodium_mg.toFixed(1)} mg natrium; komposisi dan ` +
        'sumber lolos aturan pilot.'

      deleteAutomatedReviews.run(candidate.id)
      insertReview.run(
        candidate.id,
        'approved',
        `${notes} Status ini merupakan kurasi dataset edukatif, bukan sertifikasi klinis.`,
        reviewedAt,
      )
      updateStatus.run('approved', candidate.id)
    }
  })

  applyReview()

  return {
    approved: approvedMenuIds.size,
    changesRequested: 0,
  }
}
