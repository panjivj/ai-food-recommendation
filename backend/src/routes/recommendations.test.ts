import path from 'node:path'

import pino from 'pino'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createApp } from '../app.js'
import { seedBatchTwoMenus } from '../database/batch-two-menus.js'
import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from '../database/database.js'
import { reviewPilotMenus } from '../database/pilot-menu-curation.js'
import { reviewMenuBatch } from '../database/menu-batch-reviewer.js'
import { seedPilotMenus } from '../database/pilot-menus.js'
import { importTkpiDirectory } from '../database/tkpi-importer.js'
import type { ProfileInput } from '../domain/profile.js'
import type {
  DailyRecommendation,
  RecommendationAlternativeSearch,
  WeeklyRecommendationPlan,
} from '../domain/recommendation.js'

interface RegistrationBody {
  data: {
    accessToken: string
  }
}

interface RecommendationBody {
  data: {
    recommendation: DailyRecommendation
  }
}

interface AlternativeBody {
  data: {
    replacement: RecommendationAlternativeSearch
  }
}

interface HistoryBody {
  data: {
    recommendations: DailyRecommendation[]
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

interface WeeklyBody {
  data: {
    plan: WeeklyRecommendationPlan
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
const profileInput: ProfileInput = {
  name: 'Alya Putri',
  age: 22,
  gender: 'female',
  heightCm: 160,
  weightKg: 56,
  activityLevel: 'moderate',
  goal: 'maintain',
  healthConditions: [],
  allergies: [],
  dislikedFoods: [],
  foodPreferences: [],
}

let database: AppDatabase
let app: ReturnType<typeof createApp>
let registrationSequence: number

beforeEach(() => {
  database = openDatabase(':memory:', logger)
  runMigrations(database, logger)
  importTkpiDirectory(database, tkpiDirectory)
  seedPilotMenus(database)
  reviewPilotMenus(database)
  app = createApp({
    authToken,
    corsOrigins: ['http://localhost:5173'],
    database,
    logger,
  })
  registrationSequence = 0
})

afterEach(() => {
  database.close()
})

async function register(): Promise<string> {
  registrationSequence += 1
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: `recommendation-${registrationSequence}@example.com`,
      password: 'password-aman',
    })
    .expect(201)

  return (response.body as RegistrationBody).data.accessToken
}

async function createProfile(
  accessToken: string,
  overrides: Partial<ProfileInput> = {},
): Promise<void> {
  await request(app)
    .post('/api/v1/profile')
    .set('authorization', `Bearer ${accessToken}`)
    .send({
      ...profileInput,
      ...overrides,
    })
    .expect(201)
}

async function getRecommendation(
  accessToken: string,
  date = '2026-07-28',
  statusCode = 200,
) {
  return request(app)
    .get(`/api/v1/recommendations/daily?date=${date}`)
    .set('authorization', `Bearer ${accessToken}`)
    .expect(statusCode)
}

function bodyRecommendation(response: {
  body: unknown
}): DailyRecommendation {
  return (response.body as RecommendationBody).data.recommendation
}

function bodyReplacement(response: {
  body: unknown
}): RecommendationAlternativeSearch {
  return (response.body as AlternativeBody).data.replacement
}

describe('daily recommendation API', () => {
  it('requires authentication and an existing profile', async () => {
    await request(app)
      .get('/api/v1/recommendations/daily?date=2026-07-28')
      .expect(401)

    const accessToken = await register()
    const response = await getRecommendation(
      accessToken,
      '2026-07-28',
      404,
    )

    expect(response.body).toMatchObject({
      error: {
        code: 'PROFILE_NOT_FOUND',
      },
    })
  })

  it('selects one unique approved menu for every calorie target', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    const response = await getRecommendation(accessToken)
    const recommendation = bodyRecommendation(response)
    const menuIds = recommendation.items.map((item) => item.menu.id)

    expect(recommendation).toMatchObject({
      date: '2026-07-28',
      dailyTargetCalories: 2062,
      strategy: {
        version: 'rule-based-v1',
        calorieFitWeight: 75,
        preferenceWeight: 20,
        dailyRotationWeight: 5,
        deterministic: true,
      },
    })
    expect(recommendation.items.map((item) => item.mealType)).toEqual([
      'breakfast',
      'lunch',
      'dinner',
      'snack',
    ])
    expect(recommendation.items.map((item) => item.targetCalories)).toEqual([
      516, 722, 619, 205,
    ])
    expect(new Set(menuIds).size).toBe(4)
    expect(menuIds.every((id) => id.startsWith('pilot-'))).toBe(true)
    expect(recommendation.totalRecommendedCalories).toBeGreaterThan(0)
    expect(
      recommendation.items.every(
        (item) =>
          item.menu.mealType === item.mealType &&
          item.score.total >= 0 &&
          item.score.total <= 100 &&
          item.reasons.some((reason) => reason.code === 'CALORIE_FIT') &&
          item.reasons.some((reason) => reason.code === 'SAFETY_FILTERS'),
      ),
    ).toBe(true)
  })

  it('generates seven persisted days without repeating a menu', async () => {
    seedBatchTwoMenus(database)
    const review = reviewMenuBatch(database, 2)
    expect(review.approved).toBeGreaterThanOrEqual(28)

    const accessToken = await register()
    await createProfile(accessToken)
    const response = await request(app)
      .get('/api/v1/recommendations/weekly')
      .query({ start_date: '2026-07-28' })
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)
    const plan = (response.body as WeeklyBody).data.plan
    const menuIds = plan.days.flatMap((day) =>
      day.items.map((item) => item.menu.id),
    )

    expect(plan).toMatchObject({
      startDate: '2026-07-28',
      endDate: '2026-08-03',
      totalMenus: 28,
      uniqueMenuCount: 28,
      isFullyUnique: true,
      warnings: [],
    })
    expect(plan.days.map((day) => day.date)).toEqual([
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
    ])
    expect(new Set(menuIds).size).toBe(28)

    const selectedDay = bodyRecommendation(
      await getRecommendation(accessToken, '2026-08-01'),
    )
    expect(selectedDay).toEqual(plan.days[4])

    const firstBreakfast = plan.days[0]?.items.find(
      (item) => item.mealType === 'breakfast',
    )
    const secondBreakfast = plan.days[1]?.items.find(
      (item) => item.mealType === 'breakfast',
    )
    const duplicateReplacement = await request(app)
      .put(
        `/api/v1/recommendations/daily/${plan.startDate}/items/breakfast`,
      )
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        current_menu_id: firstBreakfast?.menu.id,
        replacement_menu_id: secondBreakfast?.menu.id,
        excluded_menu_ids: menuIds,
      })
      .expect(422)

    expect(duplicateReplacement.body).toMatchObject({
      error: {
        code: 'INVALID_REPLACEMENT_MENU',
      },
    })
  })

  it('generates an authenticated AI explanation for the stored menu only', async () => {
    const accessToken = await register()
    await createProfile(accessToken)
    const daily = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const breakfast = daily.items.find(
      (item) => item.mealType === 'breakfast',
    )

    await request(app)
      .post(
        `/api/v1/recommendations/daily/${daily.date}/items/breakfast/explanation`,
      )
      .set('authorization', `Bearer ${accessToken}`)
      .send({ menu_id: breakfast?.menu.id })
      .expect(503)

    const generate = vi.fn().mockResolvedValue({
      summary: 'Menu dipilih karena sesuai dengan kebutuhan pengguna.',
      highlights: [
        {
          title: 'Kecocokan energi',
          detail: 'Komposisi menu mendukung target waktu makan.',
        },
        {
          title: 'Preferensi',
          detail: 'Pilihan mempertimbangkan preferensi yang tersimpan.',
        },
      ],
      disclaimer: 'Nilai gizi tetap berasal dari backend.',
      generatedAt: '2026-07-28T10:00:00.000Z',
      model: 'test/model',
    })
    app = createApp({
      aiExplanation: { generate },
      authToken,
      corsOrigins: ['http://localhost:5173'],
      database,
      logger,
    })

    const response = await request(app)
      .post(
        `/api/v1/recommendations/daily/${daily.date}/items/breakfast/explanation`,
      )
      .set('authorization', `Bearer ${accessToken}`)
      .send({ menu_id: breakfast?.menu.id })
      .expect(200)

    const body = response.body as {
      data: {
        explanation: {
          highlights: unknown[]
          model: string
          summary: string
        }
      }
    }
    expect(body.data.explanation.model).toBe('test/model')
    expect(body.data.explanation.summary).toContain('Menu dipilih')
    expect(body.data.explanation.highlights).toHaveLength(2)
    expect(generate).toHaveBeenCalledWith({
      recommendation: daily,
      item: breakfast,
    })

    await request(app)
      .post(
        `/api/v1/recommendations/daily/${daily.date}/items/breakfast/explanation`,
      )
      .set('authorization', `Bearer ${accessToken}`)
      .send({ menu_id: 'menu-yang-berbeda' })
      .expect(409)
  })

  it('returns stable selections and scores for the same user and date', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    const first = bodyRecommendation(
      await getRecommendation(accessToken, '2026-07-28'),
    )
    const second = bodyRecommendation(
      await getRecommendation(accessToken, '2026-07-28'),
    )

    expect(second.id).toBe(first.id)
    expect(
      second.items.map((item) => ({
        id: item.menu.id,
        score: item.score,
      })),
    ).toEqual(
      first.items.map((item) => ({
        id: item.menu.id,
        score: item.score,
      })),
    )

    const recommendationCount = database
      .prepare<[], { total: number }>(
        'SELECT COUNT(*) AS total FROM recommendations',
      )
      .get()
    const itemCount = database
      .prepare<[], { total: number }>(
        'SELECT COUNT(*) AS total FROM recommendation_items',
      )
      .get()

    expect(recommendationCount?.total).toBe(1)
    expect(itemCount?.total).toBe(4)
  })

  it('keeps the stored snapshot unchanged after profile and catalog changes', async () => {
    const accessToken = await register()
    await createProfile(accessToken)
    const first = bodyRecommendation(
      await getRecommendation(accessToken, '2026-07-28'),
    )
    const firstMenu = first.items[0]

    expect(firstMenu).toBeDefined()

    await request(app)
      .put('/api/v1/profile')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        ...profileInput,
        weightKg: 90,
        goal: 'weight_gain',
        allergies: ['Susu'],
        dislikedFoods: ['Nasi'],
        foodPreferences: ['Ikan'],
      })
      .expect(200)

    database
      .prepare(
        `UPDATE menus
         SET name = 'Nama katalog telah berubah',
             curation_status = 'archived'
         WHERE id = ?`,
      )
      .run(firstMenu?.menu.id)
    database
      .prepare(
        `UPDATE menu_nutrition
         SET energy_kcal = 999
         WHERE menu_id = ?`,
      )
      .run(firstMenu?.menu.id)

    const second = bodyRecommendation(
      await getRecommendation(accessToken, '2026-07-28'),
    )

    expect(second).toEqual(first)
    expect(second.items[0]?.menu.name).toBe(firstMenu?.menu.name)
    expect(second.items[0]?.menu.nutrition.energyKcal).toBe(
      firstMenu?.menu.nutrition.energyKcal,
    )
    expect(second.appliedProfileRules.allergies).toEqual([])

    const alternativesAfterArchive = await request(app)
      .get('/api/v1/recommendations/daily/alternatives')
      .query({
        date: second.date,
        meal_type: firstMenu?.mealType,
        current_menu_id: firstMenu?.menu.id,
      })
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(
      bodyReplacement(alternativesAfterArchive).alternatives.length,
    ).toBeGreaterThan(0)
  })

  it('excludes Indonesian allergy aliases as hard filters', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      allergies: ['Susu'],
    })

    const recommendation = bodyRecommendation(
      await getRecommendation(accessToken),
    )

    expect(recommendation.appliedProfileRules).toMatchObject({
      allergies: ['Susu'],
      resolvedAllergens: ['milk'],
      unresolvedAllergies: [],
    })
    expect(
      recommendation.items.every(
        (item) => !item.menu.allergens.includes('milk'),
      ),
    ).toBe(true)
    expect(
      Object.values(recommendation.filterStats).some(
        (stats) => stats.excludedByAllergy > 0,
      ),
    ).toBe(true)
  })

  it('excludes disliked foods using menu and ingredient text', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      dislikedFoods: ['Nasi Merah'],
    })

    const recommendation = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const selectedText = recommendation.items
      .flatMap((item) => [item.menu.name, ...item.menu.ingredientNames])
      .join(' ')
      .toLocaleLowerCase('id-ID')

    expect(selectedText).not.toContain('nasi merah')
    expect(
      Object.values(recommendation.filterStats).some(
        (stats) => stats.excludedByDislikedFood > 0,
      ),
    ).toBe(true)
  })

  it('rewards matched preferences and explains every score component', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      foodPreferences: ['Tahu'],
    })

    const recommendation = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const breakfast = recommendation.items.find(
      (item) => item.mealType === 'breakfast',
    )

    expect(breakfast).toBeDefined()
    expect(
      [
        breakfast?.menu.name,
        ...(breakfast?.menu.ingredientNames ?? []),
      ]
        .join(' ')
        .toLocaleLowerCase('id-ID'),
    ).toContain('tahu')
    expect(breakfast?.score.matchedPreferences).toEqual(['Tahu'])
    expect(breakfast?.score.breakdown.preferenceMatch).toBe(20)
    expect(breakfast?.score.total).toBe(
      Math.round(
        ((breakfast?.score.breakdown.calorieFit ?? 0) +
          (breakfast?.score.breakdown.preferenceMatch ?? 0) +
          (breakfast?.score.breakdown.dailyRotation ?? 0)) *
          100,
      ) / 100,
    )
    expect(
      breakfast?.reasons.some(
        (reason) => reason.code === 'PREFERENCE_MATCH',
      ),
    ).toBe(true)
  })

  it('reports unresolved allergy terms and still applies text filtering', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      allergies: ['Jambu Biji'],
    })

    const recommendation = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const selectedText = recommendation.items
      .flatMap((item) => [item.menu.name, ...item.menu.ingredientNames])
      .join(' ')
      .toLocaleLowerCase('id-ID')

    expect(
      recommendation.appliedProfileRules.unresolvedAllergies,
    ).toEqual(['Jambu Biji'])
    expect(selectedText).not.toContain('jambu biji')
    expect(recommendation.warnings.join(' ')).toContain(
      'no canonical allergen mapping',
    )
  })

  it('fails safely when profile filters remove every menu for a meal', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      dislikedFoods: ['Nasi'],
    })

    const response = await getRecommendation(
      accessToken,
      '2026-07-28',
      422,
    )

    expect(response.body).toMatchObject({
      error: {
        code: 'NO_SAFE_RECOMMENDATION',
      },
    })
  })

  it('validates calendar dates and rejects unknown query parameters', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    for (const query of [
      'date=2026-02-30',
      'date=28-07-2026',
      'unknown=value',
    ]) {
      const response = await request(app)
        .get(`/api/v1/recommendations/daily?${query}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(422)

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
        },
      })
    }
  })

  it('returns ranked alternatives without any menu already used that day', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      foodPreferences: ['Tahu'],
    })
    const daily = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const breakfast = daily.items.find(
      (item) => item.mealType === 'breakfast',
    )

    expect(breakfast).toBeDefined()

    const response = await request(app)
      .get('/api/v1/recommendations/daily/alternatives')
      .query({
        date: daily.date,
        meal_type: 'breakfast',
        current_menu_id: breakfast?.menu.id,
        limit: 3,
      })
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)
    const replacement = bodyReplacement(response)
    const dailyMenuIds = new Set(
      daily.items.map((item) => item.menu.id),
    )

    expect(replacement).toMatchObject({
      date: '2026-07-28',
      mealType: 'breakfast',
      currentMenuId: breakfast?.menu.id,
      targetCalories: breakfast?.targetCalories,
      hasMore: false,
      limit: 3,
      strategy: daily.strategy,
      appliedProfileRules: {
        foodPreferences: ['Tahu'],
      },
    })
    expect(replacement.alternatives.length).toBeGreaterThan(0)
    expect(
      replacement.alternatives.every(
        (item) =>
          item.mealType === 'breakfast' &&
          !dailyMenuIds.has(item.menu.id) &&
          item.reasons.some((reason) => reason.code === 'CALORIE_FIT') &&
          item.reasons.some((reason) => reason.code === 'SAFETY_FILTERS'),
      ),
    ).toBe(true)
    expect(
      replacement.alternatives.map((item) => item.score.total),
    ).toEqual(
      [...replacement.alternatives]
        .map((item) => item.score.total)
        .sort((left, right) => right - left),
    )
    expect(replacement.filterStats.excludedBySameDayMenu).toBeGreaterThan(0)
  })

  it('uses an AI interpretation only as temporary deterministic filters', async () => {
    const accessToken = await register()
    await createProfile(accessToken)
    const daily = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const breakfast = daily.items.find(
      (item) => item.mealType === 'breakfast',
    )
    const requestBody = {
      date: daily.date,
      meal_type: 'breakfast',
      current_menu_id: breakfast?.menu.id,
      excluded_menu_ids: [],
      limit: 3,
      message: 'Tanpa talas dan lebih banyak buah.',
    }

    await request(app)
      .post('/api/v1/recommendations/daily/alternatives/conversation')
      .set('authorization', `Bearer ${accessToken}`)
      .send(requestBody)
      .expect(503)

    const interpretation = {
      excludedIngredients: ['Bahan yang tidak ada'],
      preferredIngredients: ['Buah'],
      mealType: 'breakfast' as const,
      originalRequest: requestBody.message,
      model: 'test/model',
      interpretedAt: '2026-07-29T00:00:00.000Z',
    }
    const interpret = vi.fn().mockResolvedValue(interpretation)
    app = createApp({
      aiReplacementConversation: { interpret },
      authToken,
      corsOrigins: ['http://localhost:5173'],
      database,
      logger,
    })

    const response = await request(app)
      .post('/api/v1/recommendations/daily/alternatives/conversation')
      .set('authorization', `Bearer ${accessToken}`)
      .send(requestBody)
      .expect(200)
    const body = response.body as {
      data: {
        interpretation: typeof interpretation
        replacement: RecommendationAlternativeSearch
      }
    }

    expect(interpret).toHaveBeenCalledWith({
      mealType: 'breakfast',
      message: requestBody.message,
    })
    expect(body.data.interpretation).toEqual(interpretation)
    expect(body.data.replacement.appliedConversationFilters).toEqual({
      excludedIngredients: interpretation.excludedIngredients,
      preferredIngredients: interpretation.preferredIngredients,
      mealType: 'breakfast',
    })
    expect(
      body.data.replacement.alternatives.every((item) =>
        item.reasons.some(
          (reason) => reason.code === 'CONVERSATION_FILTERS',
        ),
      ),
    ).toBe(true)

    const selected = body.data.replacement.alternatives[0]
    expect(selected).toBeDefined()

    const replaced = await request(app)
      .put(
        `/api/v1/recommendations/daily/${daily.date}/items/breakfast`,
      )
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        current_menu_id: breakfast?.menu.id,
        replacement_menu_id: selected?.menu.id,
        conversation_filters: {
          excluded_ingredients: interpretation.excludedIngredients,
          preferred_ingredients: interpretation.preferredIngredients,
        },
      })
      .expect(200)
    const updated = bodyRecommendation(replaced)
    const updatedBreakfast = updated.items.find(
      (item) => item.mealType === 'breakfast',
    )

    expect(updatedBreakfast?.menu.id).toBe(selected?.menu.id)
    expect(
      updatedBreakfast?.reasons.some(
        (reason) => reason.code === 'CONVERSATION_FILTERS',
      ),
    ).toBe(true)
  })

  it('applies allergy filters and client-provided daily exclusions', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      allergies: ['Susu'],
    })
    const daily = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const breakfast = daily.items.find(
      (item) => item.mealType === 'breakfast',
    )
    const firstSearch = bodyReplacement(
      await request(app)
        .get('/api/v1/recommendations/daily/alternatives')
        .query({
          date: daily.date,
          meal_type: 'breakfast',
          current_menu_id: breakfast?.menu.id,
        })
        .set('authorization', `Bearer ${accessToken}`)
        .expect(200),
    )
    const firstAlternative = firstSearch.alternatives[0]

    expect(firstAlternative).toBeDefined()
    expect(
      firstSearch.alternatives.every(
        (item) => !item.menu.allergens.includes('milk'),
      ),
    ).toBe(true)
    expect(firstSearch.filterStats.excludedByAllergy).toBeGreaterThan(0)

    const noRemainingAlternative = await request(app)
      .get('/api/v1/recommendations/daily/alternatives')
      .query({
        date: daily.date,
        meal_type: 'breakfast',
        current_menu_id: breakfast?.menu.id,
        excluded_menu_ids: firstAlternative?.menu.id,
      })
      .set('authorization', `Bearer ${accessToken}`)
      .expect(422)

    expect(noRemainingAlternative.body).toMatchObject({
      error: {
        code: 'NO_SAFE_ALTERNATIVE',
      },
    })
  })

  it('validates alternative queries and the current slot menu', async () => {
    const accessToken = await register()
    await createProfile(accessToken)
    const daily = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const lunch = daily.items.find((item) => item.mealType === 'lunch')

    for (const query of [
      {
        date: '2026-02-30',
        meal_type: 'breakfast',
        current_menu_id: 'pilot-003',
      },
      {
        date: daily.date,
        meal_type: 'brunch',
        current_menu_id: 'pilot-003',
      },
      {
        date: daily.date,
        meal_type: 'breakfast',
        current_menu_id: 'pilot-003',
        limit: 11,
      },
    ]) {
      const response = await request(app)
        .get('/api/v1/recommendations/daily/alternatives')
        .query(query)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(422)

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
        },
      })
    }

    const wrongSlot = await request(app)
      .get('/api/v1/recommendations/daily/alternatives')
      .query({
        date: daily.date,
        meal_type: 'breakfast',
        current_menu_id: lunch?.menu.id,
      })
      .set('authorization', `Bearer ${accessToken}`)
      .expect(422)

    expect(wrongSlot.body).toMatchObject({
      error: {
        code: 'INVALID_REPLACEMENT_MENU',
      },
    })
  })

  it('persists a selected replacement in the daily snapshot', async () => {
    const accessToken = await register()
    await createProfile(accessToken)
    const daily = bodyRecommendation(
      await getRecommendation(accessToken),
    )
    const breakfast = daily.items.find(
      (item) => item.mealType === 'breakfast',
    )
    const replacementSearch = bodyReplacement(
      await request(app)
        .get('/api/v1/recommendations/daily/alternatives')
        .query({
          date: daily.date,
          meal_type: 'breakfast',
          current_menu_id: breakfast?.menu.id,
        })
        .set('authorization', `Bearer ${accessToken}`)
        .expect(200),
    )
    const replacement = replacementSearch.alternatives[0]

    expect(replacement).toBeDefined()

    const replaceResponse = await request(app)
      .put(
        `/api/v1/recommendations/daily/${daily.date}/items/breakfast`,
      )
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        current_menu_id: breakfast?.menu.id,
        replacement_menu_id: replacement?.menu.id,
      })
      .expect(200)
    const updated = bodyRecommendation(replaceResponse)
    const updatedBreakfast = updated.items.find(
      (item) => item.mealType === 'breakfast',
    )

    expect(updated.id).toBe(daily.id)
    expect(updatedBreakfast).toEqual(replacement)
    expect(updated.totalRecommendedCalories).not.toBe(
      daily.totalRecommendedCalories,
    )
    expect(
      bodyRecommendation(
        await getRecommendation(accessToken, daily.date),
      ),
    ).toEqual(updated)

    const storedItem = database
      .prepare<
        [string, string],
        {
          menu_id_snapshot: string
          menu_snapshot_json: string
          score_json: string
          reasons_json: string
        }
      >(
        `SELECT
           menu_id_snapshot,
           menu_snapshot_json,
           score_json,
           reasons_json
         FROM recommendation_items
         WHERE recommendation_id = ? AND meal_type = ?`,
      )
      .get(daily.id, 'breakfast')

    expect(storedItem?.menu_id_snapshot).toBe(replacement?.menu.id)
    expect(JSON.parse(storedItem?.menu_snapshot_json ?? '{}')).toEqual(
      replacement?.menu,
    )
    expect(JSON.parse(storedItem?.score_json ?? '{}')).toEqual(
      replacement?.score,
    )
    expect(JSON.parse(storedItem?.reasons_json ?? '[]')).toEqual(
      replacement?.reasons,
    )

    const staleReplace = await request(app)
      .put(
        `/api/v1/recommendations/daily/${daily.date}/items/breakfast`,
      )
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        current_menu_id: breakfast?.menu.id,
        replacement_menu_id: replacement?.menu.id,
      })
      .expect(409)

    expect(staleReplace.body).toMatchObject({
      error: {
        code: 'RECOMMENDATION_ITEM_CHANGED',
      },
    })
  })

  it('returns paginated recommendation history in descending date order', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    for (const date of [
      '2026-07-26',
      '2026-07-28',
      '2026-07-27',
    ]) {
      await getRecommendation(accessToken, date)
    }

    const firstPage = await request(app)
      .get('/api/v1/recommendations/history?page=1&limit=2')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)
    const firstBody = firstPage.body as HistoryBody

    expect(firstBody.meta.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    })
    expect(
      firstBody.data.recommendations.map(
        (recommendation) => recommendation.date,
      ),
    ).toEqual(['2026-07-28', '2026-07-27'])
    expect(
      firstBody.data.recommendations.every(
        (recommendation) => recommendation.items.length === 4,
      ),
    ).toBe(true)

    const secondPage = await request(app)
      .get('/api/v1/recommendations/history?page=2&limit=2')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)
    const secondBody = secondPage.body as HistoryBody

    expect(
      secondBody.data.recommendations.map(
        (recommendation) => recommendation.date,
      ),
    ).toEqual(['2026-07-26'])
  })
})
