import path from 'node:path'

import pino from 'pino'
import { afterEach, describe, expect, it } from 'vitest'

import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from './database.js'
import {
  batchTwoMenus,
  seedBatchTwoMenus,
} from './batch-two-menus.js'
import { seedBatchElevenMenus } from './batch-eleven-menus.js'
import { seedBatchEightMenus } from './batch-eight-menus.js'
import { seedBatchFiveMenus } from './batch-five-menus.js'
import { seedBatchFourMenus } from './batch-four-menus.js'
import { seedBatchNineMenus } from './batch-nine-menus.js'
import { seedBatchSevenMenus } from './batch-seven-menus.js'
import { seedBatchSixMenus } from './batch-six-menus.js'
import { seedBatchTenMenus } from './batch-ten-menus.js'
import { seedBatchThreeMenus } from './batch-three-menus.js'
import { validateFoodCatalog } from './food-catalog-validator.js'
import { reviewMenuBatch } from './menu-batch-reviewer.js'
import { seedMenus } from './menu-seeder.js'
import { reviewPilotMenus } from './pilot-menu-curation.js'
import { seedPilotMenus } from './pilot-menus.js'
import { importTkpiDirectory } from './tkpi-importer.js'

const logger = pino({ level: 'silent' })
const tkpiDirectory = path.resolve(process.cwd(), '..', 'data', 'tkpi-json')
let database: AppDatabase | undefined

afterEach(() => {
  database?.close()
  database = undefined
})

describe('TKPI catalog and pilot menus', () => {
  it('imports all TKPI records idempotently while preserving missing values', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)

    const first = importTkpiDirectory(database, tkpiDirectory)
    const second = importTkpiDirectory(database, tkpiDirectory)
    const counts = database
      .prepare<
        [],
        { categories: number; foods: number; missing_retinol: number }
      >(
        `SELECT
           (SELECT COUNT(*) FROM food_categories) AS categories,
           (SELECT COUNT(*) FROM food_ingredients) AS foods,
           (
             SELECT COUNT(*)
             FROM food_ingredients
             WHERE retinol_mcg IS NULL
           ) AS missing_retinol`,
      )
      .get()

    expect(first.categoryCount).toBe(12)
    expect(first.foodCount).toBe(1_145)
    expect(second).toEqual(first)
    expect(counts).toEqual({
      categories: 12,
      foods: 1_145,
      missing_retinol: 605,
    })
  })

  it('seeds and approves the 14 retained pilot menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)

    const first = seedPilotMenus(database)
    const second = seedPilotMenus(database)
    const counts = database
      .prepare<
        [],
        {
          ingredients: number
          menus: number
          nutrition: number
          pending_reviews: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus WHERE is_pilot = 1) AS menus,
           (SELECT COUNT(*) FROM menu_ingredients) AS ingredients,
           (SELECT COUNT(*) FROM menu_nutrition) AS nutrition,
           (
             SELECT COUNT(*)
             FROM menu_reviews
             WHERE decision = 'pending'
           ) AS pending_reviews`,
      )
      .get()
    const sample = database
      .prepare<[string], { energy_kcal: number }>(
        `SELECT energy_kcal
         FROM menu_nutrition
         WHERE menu_id = ?`,
      )
      .get('pilot-009')

    expect(first).toEqual({ seeded: 14, skippedApproved: 0 })
    expect(second).toEqual({ seeded: 14, skippedApproved: 0 })
    expect(counts).toEqual({
      menus: 14,
      ingredients: 50,
      nutrition: 14,
      pending_reviews: 14,
    })
    expect(sample?.energy_kcal).toBe(533)
    expect(validateFoodCatalog(database)).toEqual({
      errors: [],
      stats: {
        categories: 12,
        foods: 1_145,
        menuComponents: 50,
        pendingManualReviews: 14,
        pilotMenus: 14,
        signatures: 14,
        totalMenus: 14,
      },
    })

    expect(reviewPilotMenus(database)).toEqual({
      approved: 14,
      changesRequested: 0,
    })
    expect(reviewPilotMenus(database)).toEqual({
      approved: 14,
      changesRequested: 0,
    })

    const reviewCounts = database
      .prepare<
        [],
        { approved: number; changes_requested: number; pending: number }
      >(
        `SELECT
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_status = 'approved'
           ) AS approved,
           (
             SELECT COUNT(*)
             FROM menu_reviews
             WHERE decision = 'changes_requested'
           ) AS changes_requested,
           (
             SELECT COUNT(*)
             FROM menu_reviews
             WHERE decision = 'pending'
           ) AS pending`,
      )
      .get()

    expect(reviewCounts).toEqual({
      approved: 14,
      changes_requested: 0,
      pending: 0,
    })
  })

  it('creates 60 unique Batch 2 menus and rejects duplicate menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)

    expect(seedBatchTwoMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 2)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_two: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 2
               AND curation_status = 'approved'
           ) AS approved_batch_two,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_two: 60,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 74,
      signatures: 74,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])

    const first = batchTwoMenus[0]

    expect(first).toBeDefined()

    if (!first) {
      throw new Error('Batch 2 fixture is empty')
    }

    expect(() =>
      seedMenus(
        database!,
        [
          {
            ...first,
            id: 'duplicate-signature',
            name: 'Nama Baru tetapi Komponen Sama',
            slug: 'duplicate-signature',
          },
        ],
        99,
      ),
    ).toThrow(/UNIQUE constraint failed/)

    expect(() =>
      seedMenus(
        database!,
        [
          {
            ...first,
            components: first.components.map((item, index) => ({
              ...item,
              amountG: item.amountG + (index === 0 ? 1 : 0),
            })),
            id: 'duplicate-ingredient-set',
            name: 'Nama Unik dengan Bahan yang Sama',
            slug: 'duplicate-ingredient-set',
          },
        ],
        99,
      ),
    ).toThrow(/UNIQUE constraint failed/)

    expect(() =>
      seedMenus(
        database!,
        [
          {
            ...first,
            components: first.components.map((item, index) => ({
              ...item,
              amountG: item.amountG + (index === 0 ? 1 : 0),
            })),
            id: 'duplicate-name',
            name: ` ${first.name.toUpperCase()} `,
            slug: 'duplicate-name',
          },
        ],
        99,
      ),
    ).toThrow(/UNIQUE constraint failed/)
  })

  it('adds 60 globally unique and approved Batch 3 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)

    expect(seedBatchThreeMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 3)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchThreeMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_three: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 3
               AND curation_status = 'approved'
           ) AS approved_batch_three,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_three: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 134,
      signatures: 134,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 4 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)

    expect(seedBatchFourMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 4)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchFourMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_four: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 4
               AND curation_status = 'approved'
           ) AS approved_batch_four,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_four: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 194,
      signatures: 194,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 5 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)
    seedBatchFourMenus(database)

    expect(seedBatchFiveMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 5)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchFiveMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_five: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 5
               AND curation_status = 'approved'
           ) AS approved_batch_five,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_five: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 254,
      signatures: 254,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 6 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)
    seedBatchFourMenus(database)
    seedBatchFiveMenus(database)

    expect(seedBatchSixMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 6)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchSixMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_six: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 6
               AND curation_status = 'approved'
           ) AS approved_batch_six,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_six: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 314,
      signatures: 314,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 7 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)
    seedBatchFourMenus(database)
    seedBatchFiveMenus(database)
    seedBatchSixMenus(database)

    expect(seedBatchSevenMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 7)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchSevenMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_seven: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 7
               AND curation_status = 'approved'
           ) AS approved_batch_seven,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_seven: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 374,
      signatures: 374,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 8 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)
    seedBatchFourMenus(database)
    seedBatchFiveMenus(database)
    seedBatchSixMenus(database)
    seedBatchSevenMenus(database)

    expect(seedBatchEightMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 8)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchEightMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_eight: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 8
               AND curation_status = 'approved'
           ) AS approved_batch_eight,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_eight: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 434,
      signatures: 434,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 9 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)
    seedBatchFourMenus(database)
    seedBatchFiveMenus(database)
    seedBatchSixMenus(database)
    seedBatchSevenMenus(database)
    seedBatchEightMenus(database)

    expect(seedBatchNineMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 9)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchNineMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_nine: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 9
               AND curation_status = 'approved'
           ) AS approved_batch_nine,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_nine: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 494,
      signatures: 494,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 10 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)
    seedBatchFourMenus(database)
    seedBatchFiveMenus(database)
    seedBatchSixMenus(database)
    seedBatchSevenMenus(database)
    seedBatchEightMenus(database)
    seedBatchNineMenus(database)

    expect(seedBatchTenMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 10)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchTenMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_ten: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 10
               AND curation_status = 'approved'
           ) AS approved_batch_ten,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_ten: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 554,
      signatures: 554,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })

  it('adds 60 globally unique and approved Batch 11 menus', () => {
    database = openDatabase(':memory:', logger)
    runMigrations(database, logger)
    importTkpiDirectory(database, tkpiDirectory)
    seedPilotMenus(database)
    seedBatchTwoMenus(database)
    seedBatchThreeMenus(database)
    seedBatchFourMenus(database)
    seedBatchFiveMenus(database)
    seedBatchSixMenus(database)
    seedBatchSevenMenus(database)
    seedBatchEightMenus(database)
    seedBatchNineMenus(database)
    seedBatchTenMenus(database)

    expect(seedBatchElevenMenus(database)).toEqual({
      seeded: 60,
      skippedApproved: 0,
    })
    expect(reviewMenuBatch(database, 11)).toEqual({
      approved: 60,
      changesRequested: 0,
      reviewed: 60,
    })
    expect(seedBatchElevenMenus(database)).toEqual({
      seeded: 0,
      skippedApproved: 60,
    })

    const counts = database
      .prepare<
        [],
        {
          approved_batch_eleven: number
          duplicate_ingredient_sets: number
          duplicate_names: number
          duplicate_signatures: number
          menus: number
          signatures: number
        }
      >(
        `SELECT
           (SELECT COUNT(*) FROM menus) AS menus,
           (
             SELECT COUNT(*)
             FROM menu_component_signatures
           ) AS signatures,
           (
             SELECT COUNT(*)
             FROM menus
             WHERE curation_batch = 11
               AND curation_status = 'approved'
           ) AS approved_batch_eleven,
           (
             SELECT COUNT(*)
             FROM (
               SELECT LOWER(TRIM(name))
               FROM menus
               GROUP BY LOWER(TRIM(name))
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_names,
           (
             SELECT COUNT(*)
             FROM (
               SELECT signature
               FROM menu_component_signatures
               GROUP BY signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_signatures,
           (
             SELECT COUNT(*)
             FROM (
               SELECT ingredient_set_signature
               FROM menu_component_signatures
               GROUP BY ingredient_set_signature
               HAVING COUNT(*) > 1
             )
           ) AS duplicate_ingredient_sets`,
      )
      .get()

    expect(counts).toEqual({
      approved_batch_eleven: 60,
      duplicate_ingredient_sets: 0,
      duplicate_names: 0,
      duplicate_signatures: 0,
      menus: 614,
      signatures: 614,
    })
    expect(validateFoodCatalog(database).errors).toEqual([])
  })
})
