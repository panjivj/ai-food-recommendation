import type { AppDatabase } from './database.js'

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'all_day'
export type ComponentRole =
  | 'staple'
  | 'protein'
  | 'vegetable'
  | 'fruit'
  | 'beverage'
  | 'condiment'
  | 'complete_dish'
  | 'other'
export type Allergen =
  | 'egg'
  | 'fish'
  | 'milk'
  | 'other'
  | 'peanut'
  | 'shellfish'
  | 'soy'
  | 'tree_nut'
  | 'wheat'

export interface MenuComponentSeed {
  amountG: number
  role: ComponentRole
  tkpiCode: string
}

export interface MenuSeed {
  allergens: Allergen[]
  components: MenuComponentSeed[]
  curationNotes?: string
  description: string
  id: string
  mealType: MealType
  name: string
  slug: string
  tags: string[]
}

const nutrientColumns = [
  'water_g',
  'energy_kcal',
  'protein_g',
  'fat_g',
  'carbohydrate_g',
  'fiber_g',
  'ash_g',
  'calcium_mg',
  'phosphorus_mg',
  'iron_mg',
  'sodium_mg',
  'potassium_mg',
  'copper_mg',
  'zinc_mg',
  'retinol_mcg',
  'beta_carotene_mcg',
  'total_carotene_mcg',
  'thiamin_mg',
  'riboflavin_mg',
  'niacin_mg',
  'vitamin_c_mg',
] as const

type NutrientColumn = (typeof nutrientColumns)[number]
type NutrientRow = Record<NutrientColumn, number | null> & { id: number }

export interface MenuSeedResult {
  seeded: number
  skippedApproved: number
}

function roundNutrient(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function componentSignature(
  components: readonly MenuComponentSeed[],
): string {
  return [...components]
    .sort((left, right) => left.tkpiCode.localeCompare(right.tkpiCode))
    .map((item) => `${item.tkpiCode}:${item.amountG.toFixed(3)}`)
    .join('|')
}

export function ingredientSetSignature(
  components: readonly MenuComponentSeed[],
): string {
  return [...components]
    .sort((left, right) => left.tkpiCode.localeCompare(right.tkpiCode))
    .map((item) => item.tkpiCode)
    .join('|')
}

export function seedMenus(
  database: AppDatabase,
  menus: readonly MenuSeed[],
  curationBatch: number,
): MenuSeedResult {
  if (menus.length === 0) {
    throw new Error('At least one menu seed is required')
  }

  if (!Number.isInteger(curationBatch) || curationBatch < 1) {
    throw new Error('Curation batch must be a positive integer')
  }

  const ids = new Set(menus.map((menu) => menu.id))
  const slugs = new Set(menus.map((menu) => menu.slug))
  const normalizedNames = new Set(
    menus.map((menu) => menu.name.trim().toLocaleLowerCase('id-ID')),
  )
  const signatures = new Set(
    menus.map((menu) => componentSignature(menu.components)),
  )
  const ingredientSets = new Set(
    menus.map((menu) => ingredientSetSignature(menu.components)),
  )

  if (
    ids.size !== menus.length ||
    slugs.size !== menus.length ||
    normalizedNames.size !== menus.length ||
    signatures.size !== menus.length ||
    ingredientSets.size !== menus.length
  ) {
    throw new Error(
      `Batch ${curationBatch} contains duplicate IDs, slugs, names, components, or ingredient sets`,
    )
  }

  for (const menu of menus) {
    const componentCodes = new Set(
      menu.components.map((item) => item.tkpiCode),
    )

    if (componentCodes.size !== menu.components.length) {
      throw new Error(`Menu ${menu.id} contains the same TKPI food twice`)
    }
  }

  const findStatus = database.prepare<[string], { curation_status: string }>(
    'SELECT curation_status FROM menus WHERE id = ?',
  )
  const findSignature = database.prepare<
    [string],
    { ingredient_set_signature: string; signature: string }
  >(
    `SELECT signature, ingredient_set_signature
     FROM menu_component_signatures
     WHERE menu_id = ?`,
  )
  const findFood = database.prepare<[string], NutrientRow>(
    `SELECT id, ${nutrientColumns.join(', ')}
     FROM food_ingredients
     WHERE tkpi_code = ?`,
  )
  const upsertMenu = database.prepare(`
    INSERT INTO menus (
      id,
      slug,
      name,
      description,
      meal_type,
      serving_size_g,
      serving_description,
      curation_status,
      is_pilot,
      nutrition_source,
      calculation_version,
      curation_notes,
      curation_batch
    )
    VALUES (
      @id,
      @slug,
      @name,
      @description,
      @mealType,
      @servingSizeG,
      @servingDescription,
      'draft',
      @isPilot,
      'Tabel Komposisi Pangan Indonesia 2017',
      'tkpi-weighted-v1',
      @curationNotes,
      @curationBatch
    )
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      description = excluded.description,
      meal_type = excluded.meal_type,
      serving_size_g = excluded.serving_size_g,
      serving_description = excluded.serving_description,
      nutrition_source = excluded.nutrition_source,
      calculation_version = excluded.calculation_version,
      curation_notes = excluded.curation_notes,
      curation_batch = excluded.curation_batch,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `)
  const upsertSignature = database.prepare(`
    INSERT INTO menu_component_signatures (
      menu_id,
      signature,
      ingredient_set_signature
    )
    VALUES (?, ?, ?)
    ON CONFLICT(menu_id) DO UPDATE SET
      signature = excluded.signature,
      ingredient_set_signature = excluded.ingredient_set_signature,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `)
  const deleteIngredients = database.prepare(
    'DELETE FROM menu_ingredients WHERE menu_id = ?',
  )
  const insertIngredient = database.prepare(`
    INSERT INTO menu_ingredients (
      menu_id,
      food_ingredient_id,
      amount_g,
      component_role,
      preparation_note,
      sort_order
    )
    VALUES (?, ?, ?, ?, '', ?)
  `)
  const upsertNutrition = database.prepare(`
    INSERT INTO menu_nutrition (
      menu_id,
      ${nutrientColumns.join(', ')}
    )
    VALUES (
      @menuId,
      ${nutrientColumns.map((column) => `@${column}`).join(', ')}
    )
    ON CONFLICT(menu_id) DO UPDATE SET
      ${nutrientColumns
        .map((column) => `${column} = excluded.${column}`)
        .join(', ')},
      calculated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `)
  const deleteTags = database.prepare('DELETE FROM menu_tags WHERE menu_id = ?')
  const insertTag = database.prepare(
    'INSERT INTO menu_tags (menu_id, tag) VALUES (?, ?)',
  )
  const deleteAllergens = database.prepare(
    'DELETE FROM menu_allergens WHERE menu_id = ?',
  )
  const insertAllergen = database.prepare(`
    INSERT INTO menu_allergens (menu_id, allergen, evidence)
    VALUES (?, ?, ?)
  `)
  const deletePendingReview = database.prepare(`
    DELETE FROM menu_reviews
    WHERE menu_id = ?
      AND reviewer = 'manual-curation-required'
      AND decision = 'pending'
  `)
  const insertPendingReview = database.prepare(`
    INSERT INTO menu_reviews (menu_id, reviewer, decision, notes)
    VALUES (
      ?,
      'manual-curation-required',
      'pending',
      'Verifikasi porsi, kesesuaian komponen, dan alergen sebelum disetujui.'
    )
  `)

  let seeded = 0
  let skippedApproved = 0

  const seed = database.transaction(() => {
    for (const menu of menus) {
      const signature = componentSignature(menu.components)
      const ingredientSet = ingredientSetSignature(menu.components)
      const existing = findStatus.get(menu.id)

      if (existing?.curation_status === 'approved') {
        const storedSignature = findSignature.get(menu.id)

        if (
          storedSignature &&
          (storedSignature.signature !== signature ||
            storedSignature.ingredient_set_signature !== ingredientSet)
        ) {
          throw new Error(
            `Approved menu ${menu.id} differs from its stored signature`,
          )
        }

        if (!storedSignature) {
          upsertSignature.run(menu.id, signature, ingredientSet)
        }

        skippedApproved += 1
        continue
      }

      const servingSizeG = menu.components.reduce(
        (total, item) => total + item.amountG,
        0,
      )
      const resolvedComponents = menu.components.map((item) => {
        const food = findFood.get(item.tkpiCode)

        if (!food) {
          throw new Error(
            `TKPI code ${item.tkpiCode} for menu ${menu.id} was not imported`,
          )
        }

        return { food, item }
      })
      const nutrition = Object.fromEntries(
        nutrientColumns.map((column) => {
          const values = resolvedComponents.map(({ food, item }) => {
            const value = food[column]
            return value === null ? null : (value * item.amountG) / 100
          })

          return [
            column,
            values.some((value) => value === null)
              ? null
              : roundNutrient(
                  values.reduce<number>(
                    (total, value) => total + (value ?? 0),
                    0,
                  ),
                ),
          ]
        }),
      ) as Record<NutrientColumn, number | null>

      if (
        nutrition.energy_kcal === null ||
        nutrition.protein_g === null ||
        nutrition.fat_g === null ||
        nutrition.carbohydrate_g === null
      ) {
        throw new Error(`Menu ${menu.id} has incomplete macronutrient data`)
      }

      upsertMenu.run({
        ...menu,
        curationBatch,
        curationNotes:
          menu.curationNotes ??
          `Batch ${curationBatch}; ukuran porsi dan asumsi alergen wajib diperiksa.`,
        isPilot: curationBatch === 1 ? 1 : 0,
        servingDescription: `1 porsi (${servingSizeG} g)`,
        servingSizeG,
      })
      upsertSignature.run(menu.id, signature, ingredientSet)

      deleteIngredients.run(menu.id)
      resolvedComponents.forEach(({ food, item }, index) => {
        insertIngredient.run(
          menu.id,
          food.id,
          item.amountG,
          item.role,
          index,
        )
      })

      upsertNutrition.run({ menuId: menu.id, ...nutrition })

      deleteTags.run(menu.id)
      for (const tag of [...new Set(menu.tags)]) {
        insertTag.run(menu.id, tag)
      }

      deleteAllergens.run(menu.id)
      for (const allergen of [...new Set(menu.allergens)]) {
        insertAllergen.run(
          menu.id,
          allergen,
          'Label konservatif berdasarkan komponen dan nama pangan; resep rinci tetap perlu diperhatikan.',
        )
      }

      deletePendingReview.run(menu.id)
      insertPendingReview.run(menu.id)
      seeded += 1
    }
  })

  seed()

  return { seeded, skippedApproved }
}
