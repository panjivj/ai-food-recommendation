import path from 'node:path'

import pino from 'pino'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from '../database/database.js'
import { reviewPilotMenus } from '../database/pilot-menu-curation.js'
import { seedPilotMenus } from '../database/pilot-menus.js'
import { importTkpiDirectory } from '../database/tkpi-importer.js'
import type { UserMenuFeedback } from '../domain/feedback.js'
import type { DailyRecommendation } from '../domain/recommendation.js'

interface RegistrationBody {
  data: {
    accessToken: string
  }
}

interface FeedbackBody {
  data: {
    feedback: UserMenuFeedback
  }
}

interface RecommendationBody {
  data: {
    recommendation: DailyRecommendation
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
      email: `feedback-${registrationSequence}@example.com`,
      password: 'password-aman',
    })
    .expect(201)

  return (response.body as RegistrationBody).data.accessToken
}

async function createProfile(accessToken: string): Promise<void> {
  await request(app)
    .post('/api/v1/profile')
    .set('authorization', `Bearer ${accessToken}`)
    .send({
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
    })
    .expect(201)
}

async function getDaily(
  accessToken: string,
  date: string,
): Promise<DailyRecommendation> {
  const response = await request(app)
    .get(`/api/v1/recommendations/daily?date=${date}`)
    .set('authorization', `Bearer ${accessToken}`)
    .expect(200)

  return (response.body as RecommendationBody).data.recommendation
}

describe('user menu feedback API', () => {
  it('requires authentication and an existing menu', async () => {
    await request(app).get('/api/v1/feedback/pilot-003').expect(401)

    const accessToken = await register()
    const missing = await request(app)
      .get('/api/v1/feedback/menu-tidak-ada')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(404)

    expect(missing.body).toMatchObject({
      error: {
        code: 'MENU_NOT_FOUND',
      },
    })
  })

  it('stores like and consumed independently while dislike is exclusive', async () => {
    const accessToken = await register()
    const empty = await request(app)
      .get('/api/v1/feedback/pilot-003')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect((empty.body as FeedbackBody).data.feedback).toMatchObject({
      menuId: 'pilot-003',
      liked: false,
      disliked: false,
      consumed: false,
      updatedAt: null,
    })

    const likedAndConsumed = await request(app)
      .put('/api/v1/feedback/pilot-003')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ liked: true, consumed: true })
      .expect(200)

    expect(
      (likedAndConsumed.body as FeedbackBody).data.feedback,
    ).toMatchObject({
      liked: true,
      disliked: false,
      consumed: true,
    })

    const disliked = await request(app)
      .put('/api/v1/feedback/pilot-003')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ disliked: true })
      .expect(200)

    expect((disliked.body as FeedbackBody).data.feedback).toMatchObject({
      liked: false,
      disliked: true,
      consumed: true,
    })

    const cleared = await request(app)
      .put('/api/v1/feedback/pilot-003')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ disliked: false, consumed: false })
      .expect(200)

    expect((cleared.body as FeedbackBody).data.feedback).toMatchObject({
      liked: false,
      disliked: false,
      consumed: false,
      updatedAt: null,
    })
    expect(
      database
        .prepare<[], { total: number }>(
          'SELECT COUNT(*) AS total FROM user_menu_feedback',
        )
        .get()?.total,
    ).toBe(0)
  })

  it('isolates feedback by user and validates contradictory patches', async () => {
    const firstToken = await register()
    const secondToken = await register()

    await request(app)
      .put('/api/v1/feedback/pilot-003')
      .set('authorization', `Bearer ${firstToken}`)
      .send({ liked: true })
      .expect(200)

    const secondUser = await request(app)
      .get('/api/v1/feedback/pilot-003')
      .set('authorization', `Bearer ${secondToken}`)
      .expect(200)

    expect((secondUser.body as FeedbackBody).data.feedback.liked).toBe(
      false,
    )

    for (const payload of [
      {},
      { liked: true, disliked: true },
      { liked: 'yes' },
      { unknown: true },
    ]) {
      const response = await request(app)
        .put('/api/v1/feedback/pilot-003')
        .set('authorization', `Bearer ${firstToken}`)
        .send(payload)
        .expect(422)

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
        },
      })
    }
  })

  it('avoids disliked menus on new dates without changing existing snapshots', async () => {
    const accessToken = await register()
    await createProfile(accessToken)
    const existing = await getDaily(accessToken, '2026-07-28')
    const dislikedItem = existing.items[0]

    expect(dislikedItem).toBeDefined()

    await request(app)
      .put(`/api/v1/feedback/${dislikedItem?.menu.id}`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ disliked: true })
      .expect(200)

    expect(await getDaily(accessToken, '2026-07-28')).toEqual(existing)

    const next = await getDaily(accessToken, '2026-07-29')

    expect(
      next.items.some((item) => item.menu.id === dislikedItem?.menu.id),
    ).toBe(false)
    expect(next.appliedFeedbackRules.dislikedMenuIds).toEqual([
      dislikedItem?.menu.id,
    ])
    expect(next.filterStats.breakfast.excludedByFeedback).toBeGreaterThan(
      0,
    )
  })

  it('snapshots liked and consumed signals for a future scoring version', async () => {
    const accessToken = await register()
    await createProfile(accessToken)

    await request(app)
      .put('/api/v1/feedback/pilot-003')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ liked: true, consumed: true })
      .expect(200)
    await request(app)
      .put('/api/v1/feedback/pilot-004')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ consumed: true })
      .expect(200)

    const recommendation = await getDaily(accessToken, '2026-07-30')

    expect(recommendation.appliedFeedbackRules).toEqual({
      likedMenuIds: ['pilot-003'],
      dislikedMenuIds: [],
      consumedMenuIds: ['pilot-003', 'pilot-004'],
    })
    expect(recommendation.warnings.join(' ')).toContain(
      'future scoring version',
    )
  })
})
