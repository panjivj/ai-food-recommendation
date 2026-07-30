import path from 'node:path'

import pino from 'pino'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from '../database/database.js'
import { reviewPilotMenus } from '../database/pilot-menu-curation.js'
import { seedPilotMenus } from '../database/pilot-menus.js'
import { importTkpiDirectory } from '../database/tkpi-importer.js'
import type { MenuDetail, MenuSummary } from '../domain/menu.js'

interface MenuListBody {
  data: {
    menus: MenuSummary[]
  }
  meta: {
    pagination: {
      limit: number
      page: number
      total: number
      totalPages: number
    }
  }
}

interface MenuDetailBody {
  data: {
    menu: MenuDetail
  }
}

const logger = pino({ level: 'silent' })
const authToken = {
  audience: 'test-mobile',
  issuer: 'test-backend',
  secret: 'test-only-token-secret-with-at-least-32-characters',
  ttlSeconds: 3600,
}
const tkpiDirectory = path.resolve(process.cwd(), '..', 'data', 'tkpi-json')

let database: AppDatabase
let app: ReturnType<typeof createApp>

beforeAll(() => {
  database = openDatabase(':memory:', logger)
  runMigrations(database, logger)
  importTkpiDirectory(database, tkpiDirectory)
  seedPilotMenus(database)
  reviewPilotMenus(database)

  database
    .prepare(
      `INSERT INTO menus (
         id,
         slug,
         name,
         description,
         meal_type,
         serving_size_g,
         serving_description,
         curation_status,
         nutrition_source
       )
       VALUES (
         'draft-hidden',
         'draft-hidden',
         'Menu Draft Tersembunyi',
         'Menu uji yang tidak boleh tampil.',
         'breakfast',
         100,
         '1 porsi (100 g)',
         'draft',
         'Test fixture'
       )`,
    )
    .run()
  database
    .prepare(
      `INSERT INTO menu_nutrition (
         menu_id,
         energy_kcal,
         protein_g,
         fat_g,
         carbohydrate_g,
         fiber_g,
         sodium_mg
       )
       VALUES ('draft-hidden', 250, 10, 5, 40, 3, 100)`,
    )
    .run()

  app = createApp({
    authToken,
    corsOrigins: ['http://localhost:5173'],
    database,
    logger,
  })
})

afterAll(() => {
  database.close()
})

describe('menu catalog API', () => {
  it('lists only approved menus with default pagination', async () => {
    const response = await request(app).get('/api/v1/menus').expect(200)
    const body = response.body as MenuListBody

    expect(body.meta.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 14,
      totalPages: 1,
    })
    expect(body.data.menus).toHaveLength(14)
    expect(body.data.menus.every((menu) => menu.id !== 'draft-hidden')).toBe(
      true,
    )
    const firstMenu = body.data.menus[0]

    expect(firstMenu).toBeDefined()
    expect(typeof firstMenu?.id).toBe('string')
    expect(typeof firstMenu?.slug).toBe('string')
    expect(typeof firstMenu?.name).toBe('string')
    expect(typeof firstMenu?.mealType).toBe('string')
    expect(typeof firstMenu?.servingSizeG).toBe('number')
    expect(typeof firstMenu?.nutrition.energyKcal).toBe('number')
    expect(typeof firstMenu?.nutrition.proteinG).toBe('number')
    expect(Array.isArray(firstMenu?.tags)).toBe(true)
    expect(Array.isArray(firstMenu?.allergens)).toBe(true)
  })

  it('paginates deterministically', async () => {
    const firstResponse = await request(app)
      .get('/api/v1/menus?page=1&limit=5')
      .expect(200)
    const thirdResponse = await request(app)
      .get('/api/v1/menus?page=3&limit=5')
      .expect(200)
    const first = firstResponse.body as MenuListBody
    const third = thirdResponse.body as MenuListBody

    expect(first.data.menus).toHaveLength(5)
    expect(third.data.menus).toHaveLength(4)
    expect(third.meta.pagination).toEqual({
      page: 3,
      limit: 5,
      total: 14,
      totalPages: 3,
    })
    expect(
      new Set([
        ...first.data.menus.map((menu) => menu.id),
        ...third.data.menus.map((menu) => menu.id),
      ]).size,
    ).toBe(9)
  })

  it('filters by search text, meal type, and calorie range', async () => {
    const response = await request(app)
      .get(
        '/api/v1/menus?search=ubi&meal_type=breakfast&min_calories=280&max_calories=400',
      )
      .expect(200)
    const body = response.body as MenuListBody

    expect(body.meta.pagination.total).toBe(2)
    expect(body.data.menus.map((menu) => menu.id)).toEqual([
      'pilot-004',
      'pilot-003',
    ])
    expect(
      body.data.menus.every(
        (menu) =>
          menu.mealType === 'breakfast' &&
          menu.name.toLocaleLowerCase('id-ID').includes('ubi') &&
          menu.nutrition.energyKcal !== null &&
          menu.nutrition.energyKcal >= 280 &&
          menu.nutrition.energyKcal <= 400,
      ),
    ).toBe(true)
  })

  it('treats search text literally instead of as a SQL wildcard', async () => {
    const response = await request(app)
      .get('/api/v1/menus?search=%25')
      .expect(200)
    const body = response.body as MenuListBody

    expect(body.data.menus).toEqual([])
    expect(body.meta.pagination).toMatchObject({
      total: 0,
      totalPages: 0,
    })
  })

  it('returns complete menu details by ID or slug', async () => {
    const idResponse = await request(app)
      .get('/api/v1/menus/pilot-003')
      .expect(200)
    const slugResponse = await request(app)
      .get('/api/v1/menus/ubi-kuning-yoghurt-dan-apel')
      .expect(200)
    const menu = (idResponse.body as MenuDetailBody).data.menu
    const slugMenu = (slugResponse.body as MenuDetailBody).data.menu

    expect(slugMenu.id).toBe(menu.id)
    expect(menu).toMatchObject({
      id: 'pilot-003',
      mealType: 'breakfast',
      servingSizeG: 400,
      nutrition: {
        energyKcal: 285,
        proteinG: 6.5,
        fatG: 4.6,
        carbohydrateG: 54.5,
        fiberG: 2.3,
        sodiumMg: 68.1,
      },
      nutritionSource: 'Tabel Komposisi Pangan Indonesia 2017',
      calculationVersion: 'tkpi-weighted-v1',
      tags: ['buah', 'sarapan', 'umbi'],
      allergens: [
        {
          name: 'milk',
        },
      ],
    })
    expect(typeof menu.allergens[0]?.evidence).toBe('string')
    expect(menu.ingredients).toHaveLength(3)
    expect(menu.ingredients[0]).toMatchObject({
      tkpiCode: 'BP011',
      name: 'Ubi jalar, kuning, kukus',
      amountG: 150,
      componentRole: 'staple',
    })
    expect(typeof menu.ingredients[0]?.category).toBe('string')
    expect(typeof menu.ingredients[0]?.sourceReference).toBe('string')
  })

  it('hides draft menus and returns a domain-specific not-found error', async () => {
    for (const identifier of ['draft-hidden', 'menu-tidak-ada']) {
      const response = await request(app)
        .get(`/api/v1/menus/${identifier}`)
        .expect(404)

      expect(response.body).toMatchObject({
        error: {
          code: 'MENU_NOT_FOUND',
        },
      })
    }
  })

  it('rejects malformed, contradictory, and unknown query parameters', async () => {
    const invalidQueries = [
      'page=0',
      'limit=101',
      'meal_type=brunch',
      'min_calories=500&max_calories=200',
      'unknown=value',
      'page=1&page=2',
    ]

    for (const query of invalidQueries) {
      const response = await request(app)
        .get(`/api/v1/menus?${query}`)
        .expect(422)

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
        },
      })
    }
  })
})
