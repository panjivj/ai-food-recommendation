import type { AppDatabase } from './database.js'

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

export interface MenuBatchReviewResult {
  approved: number
  changesRequested: number
  reviewed: number
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

function candidateIssues(
  database: AppDatabase,
  candidate: ReviewCandidate,
): string[] {
  const issues: string[] = []
  const [minimumEnergy, maximumEnergy] = energyRanges[candidate.meal_type]
  const sodiumLimit = sodiumLimits[candidate.meal_type]

  if (
    candidate.energy_kcal < minimumEnergy ||
    candidate.energy_kcal > maximumEnergy
  ) {
    issues.push(
      `energi ${candidate.energy_kcal.toFixed(1)} kkal di luar rentang ` +
        `${minimumEnergy}-${maximumEnergy} kkal`,
    )
  }

  if (candidate.missing_sodium_components > 0) {
    issues.push('terdapat komponen tanpa data natrium')
  } else if (candidate.sodium_mg > sodiumLimit) {
    issues.push(
      `natrium ${candidate.sodium_mg.toFixed(1)} mg melebihi ${sodiumLimit} mg`,
    )
  }

  if (candidate.max_energy_difference_percent > 40) {
    issues.push('terdapat sumber dengan perbedaan energi-makro di atas 40%')
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
    issues.push('tidak memiliki komponen buah')
  }

  if (
    roles &&
    (candidate.meal_type === 'lunch' || candidate.meal_type === 'dinner') &&
    (roles.staples < 1 || roles.proteins < 1 || roles.vegetables < 1)
  ) {
    issues.push('makan utama belum lengkap')
  }

  if (
    roles &&
    candidate.meal_type === 'breakfast' &&
    (roles.staples < 1 || roles.proteins + roles.beverages < 1)
  ) {
    issues.push('sarapan belum memiliki makanan pokok dan protein/produk susu')
  }

  return issues
}

export function reviewMenuBatch(
  database: AppDatabase,
  curationBatch: number,
): MenuBatchReviewResult {
  if (!Number.isInteger(curationBatch) || curationBatch < 2) {
    throw new Error('Reusable batch review requires a batch number of 2 or more')
  }

  const candidates = database
    .prepare<[number], ReviewCandidate>(
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
       WHERE m.curation_batch = ?
       GROUP BY m.id
       ORDER BY m.id`,
    )
    .all(curationBatch)

  if (candidates.length === 0) {
    throw new Error(`No menus found for curation batch ${curationBatch}`)
  }

  const reviewer = `structured-curation-v1-batch-${curationBatch}`
  const deleteReviews = database.prepare(`
    DELETE FROM menu_reviews
    WHERE menu_id = ?
      AND reviewer IN ('manual-curation-required', ?)
  `)
  const insertReview = database.prepare(`
    INSERT INTO menu_reviews (
      menu_id,
      reviewer,
      decision,
      notes,
      reviewed_at
    )
    VALUES (?, ?, ?, ?, ?)
  `)
  const updateStatus = database.prepare(`
    UPDATE menus
    SET
      curation_status = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `)
  const reviewedAt = new Date().toISOString()
  let approved = 0
  let changesRequested = 0

  const applyReview = database.transaction(() => {
    for (const candidate of candidates) {
      const issues = candidateIssues(database, candidate)
      const passes = issues.length === 0
      const decision = passes ? 'approved' : 'changes_requested'
      const notes = passes
        ? `Lolos kurasi batch ${curationBatch}: ` +
          `${candidate.energy_kcal.toFixed(1)} kkal dan ` +
          `${candidate.sodium_mg.toFixed(1)} mg natrium.`
        : `Perubahan diperlukan: ${issues.join('; ')}.`

      deleteReviews.run(candidate.id, reviewer)
      insertReview.run(
        candidate.id,
        reviewer,
        decision,
        `${notes} Kurasi dataset edukatif, bukan sertifikasi klinis.`,
        reviewedAt,
      )
      updateStatus.run(passes ? 'approved' : 'draft', candidate.id)

      if (passes) {
        approved += 1
      } else {
        changesRequested += 1
      }
    }
  })

  applyReview()

  return {
    approved,
    changesRequested,
    reviewed: candidates.length,
  }
}

