import pino from 'pino'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from '../database/database.js'
import type { CalorieNeeds } from '../domain/calorie-needs.js'
import type { ProfileInput } from '../domain/profile.js'

interface RegistrationBody {
  data: {
    accessToken: string
  }
}

interface CalorieNeedsBody {
  data: {
    calorieNeeds: CalorieNeeds
  }
}

const logger = pino({ level: 'silent' })
const authToken = {
  audience: 'test-mobile',
  issuer: 'test-backend',
  secret: 'test-only-token-secret-with-at-least-32-characters',
  ttlSeconds: 3600,
}
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
      email: `calorie-${registrationSequence}@example.com`,
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

async function getCalorieNeeds(
  accessToken: string,
  statusCode = 200,
) {
  return request(app)
    .get('/api/v1/calorie-needs')
    .set('authorization', `Bearer ${accessToken}`)
    .expect(statusCode)
}

describe('calorie needs API', () => {
  it('requires authentication and an existing profile', async () => {
    await request(app).get('/api/v1/calorie-needs').expect(401)

    const accessToken = await register()
    const response = await getCalorieNeeds(accessToken, 404)

    expect(response.body).toMatchObject({
      error: {
        code: 'PROFILE_NOT_FOUND',
      },
    })
  })

  it('calculates transparent BMR, TDEE, BMI, and exact meal targets', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    const response = await getCalorieNeeds(accessToken)
    const result = (response.body as CalorieNeedsBody).data.calorieNeeds

    expect(result).toMatchObject({
      input: {
        age: 22,
        gender: 'female',
        heightCm: 160,
        weightKg: 56,
        bodyMassIndex: 21.9,
        activityLevel: 'moderate',
        goal: 'maintain',
      },
      method: {
        name: 'mifflin_st_jeor',
        version: 'v1',
        activityFactor: 1.6,
        bmrEquation:
          '10 × weightKg + 6.25 × heightCm - 5 × age - 161',
      },
      bmrCalories: 1289,
      tdeeCalories: 2062,
      dailyTargetCalories: 2062,
      goalAdjustment: {
        requestedCalories: 0,
        appliedCalories: 0,
        minimumWeightLossTargetCalories: null,
      },
      mealTargets: {
        breakfast: { percentage: 25, calories: 516 },
        lunch: { percentage: 35, calories: 722 },
        dinner: { percentage: 30, calories: 619 },
        snack: { percentage: 10, calories: 205 },
      },
    })
    expect(
      Object.values(result.mealTargets).reduce(
        (total, meal) => total + meal.calories,
        0,
      ),
    ).toBe(result.dailyTargetCalories)
    expect(result.input.profileUpdatedAt.length).toBeGreaterThan(0)
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.references).toHaveLength(6)
    expect(result.disclaimer).toContain('Educational')
  })

  it('applies loss, maintenance, and gain adjustments consistently', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    const scenarios = [
      {
        goal: 'weight_loss',
        dailyTargetCalories: 1562,
        requestedCalories: -500,
        appliedCalories: -500,
      },
      {
        goal: 'maintain',
        dailyTargetCalories: 2062,
        requestedCalories: 0,
        appliedCalories: 0,
      },
      {
        goal: 'weight_gain',
        dailyTargetCalories: 2362,
        requestedCalories: 300,
        appliedCalories: 300,
      },
    ] as const

    for (const scenario of scenarios) {
      await request(app)
        .put('/api/v1/profile')
        .set('authorization', `Bearer ${accessToken}`)
        .send({
          ...profileInput,
          goal: scenario.goal,
        })
        .expect(200)

      const response = await getCalorieNeeds(accessToken)
      const result = (response.body as CalorieNeedsBody).data.calorieNeeds

      expect(result.input.goal).toBe(scenario.goal)
      expect(result.dailyTargetCalories).toBe(
        scenario.dailyTargetCalories,
      )
      expect(result.goalAdjustment).toMatchObject({
        requestedCalories: scenario.requestedCalories,
        appliedCalories: scenario.appliedCalories,
      })
    }
  })

  it('uses the male Mifflin-St Jeor constant when selected in profile', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      age: 30,
      gender: 'male',
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'low',
    })

    const response = await getCalorieNeeds(accessToken)
    const result = (response.body as CalorieNeedsBody).data.calorieNeeds

    expect(result).toMatchObject({
      method: {
        activityFactor: 1.4,
        bmrEquation:
          '10 × weightKg + 6.25 × heightCm - 5 × age + 5',
      },
      bmrCalories: 1649,
      tdeeCalories: 2308,
      dailyTargetCalories: 2308,
    })
  })

  it('recalculates from the latest profile instead of returning stale data', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    const firstResponse = await getCalorieNeeds(accessToken)
    const first = (firstResponse.body as CalorieNeedsBody).data.calorieNeeds

    await request(app)
      .put('/api/v1/profile')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        ...profileInput,
        weightKg: 70,
        activityLevel: 'high',
      })
      .expect(200)

    const secondResponse = await getCalorieNeeds(accessToken)
    const second = (secondResponse.body as CalorieNeedsBody).data.calorieNeeds

    expect(first.input.weightKg).toBe(56)
    expect(second.input.weightKg).toBe(70)
    expect(second.method.activityFactor).toBe(1.8)
    expect(second.bmrCalories).toBeGreaterThan(first.bmrCalories)
    expect(second.tdeeCalories).toBeGreaterThan(first.tdeeCalories)
  })

  it.each([18, 79])(
    'rejects age %i outside the source equation sample range',
    async (age) => {
      const accessToken = await register()
      await createProfile(accessToken, { age })

      const response = await getCalorieNeeds(accessToken, 422)

      expect(response.body).toMatchObject({
        error: {
          code: 'CALORIE_CALCULATION_UNSUPPORTED',
        },
      })
    },
  )

  it('reduces an infeasible loss deficit and reports the safeguard', async () => {
    const accessToken = await register()
    await createProfile(accessToken, {
      age: 78,
      gender: 'female',
      heightCm: 100,
      weightKg: 30,
      activityLevel: 'low',
      goal: 'weight_loss',
      healthConditions: ['Needs clinical review'],
    })

    const response = await getCalorieNeeds(accessToken)
    const result = (response.body as CalorieNeedsBody).data.calorieNeeds

    expect(result).toMatchObject({
      bmrCalories: 374,
      tdeeCalories: 524,
      dailyTargetCalories: 524,
      goalAdjustment: {
        requestedCalories: -500,
        appliedCalories: 0,
        minimumWeightLossTargetCalories: 1200,
      },
    })
    expect(result.warnings).toHaveLength(3)
    expect(result.warnings.join(' ')).toContain('safety floor')
    expect(result.warnings.join(' ')).toContain('Health conditions')
  })
})
