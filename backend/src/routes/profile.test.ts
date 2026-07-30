import pino from 'pino'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from '../database/database.js'
import type { ProfileInput, UserProfile } from '../domain/profile.js'

interface RegistrationBody {
  data: {
    accessToken: string
    user: {
      id: string
    }
  }
}

interface ProfileBody {
  data: {
    profile: UserProfile
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
  allergies: [' Kacang tanah ', 'kacang tanah'],
  dislikedFoods: ['Jeroan'],
  foodPreferences: ['Makanan rumahan'],
}

let database: AppDatabase
let app: ReturnType<typeof createApp>

beforeEach(() => {
  database = openDatabase(':memory:', logger)
  runMigrations(database, logger)
  app = createApp({
    authToken,
    corsOrigins: ['http://localhost:5173'],
    database,
    logger,
  })
})

afterEach(() => {
  database.close()
})

async function register(email: string): Promise<RegistrationBody['data']> {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email,
      password: 'password-aman',
    })
    .expect(201)

  return (response.body as RegistrationBody).data
}

describe('profile API', () => {
  it('creates, normalizes, and reads the authenticated user profile', async () => {
    const registration = await register('alya@example.com')

    const createdResponse = await request(app)
      .post('/api/v1/profile')
      .set('authorization', `Bearer ${registration.accessToken}`)
      .send(profileInput)
      .expect(201)
    const created = (createdResponse.body as ProfileBody).data.profile

    expect(created).toMatchObject({
      userId: registration.user.id,
      name: 'Alya Putri',
      allergies: ['Kacang tanah'],
      dislikedFoods: ['Jeroan'],
      foodPreferences: ['Makanan rumahan'],
    })
    expect(created.id).toEqual(expect.any(String))
    expect(created.createdAt).toEqual(expect.any(String))

    const getResponse = await request(app)
      .get('/api/v1/profile')
      .set('authorization', `Bearer ${registration.accessToken}`)
      .expect(200)
    const loaded = (getResponse.body as ProfileBody).data.profile

    expect(loaded).toEqual(created)
  })

  it('updates an existing profile', async () => {
    const registration = await register('edit@example.com')
    await request(app)
      .post('/api/v1/profile')
      .set('authorization', `Bearer ${registration.accessToken}`)
      .send(profileInput)
      .expect(201)

    const updateResponse = await request(app)
      .put('/api/v1/profile')
      .set('authorization', `Bearer ${registration.accessToken}`)
      .send({
        ...profileInput,
        name: 'Alya P.',
        weightKg: 55.5,
        goal: 'weight_loss',
        healthConditions: ['Hipertensi'],
      })
      .expect(200)
    const updated = (updateResponse.body as ProfileBody).data.profile

    expect(updated).toMatchObject({
      name: 'Alya P.',
      weightKg: 55.5,
      goal: 'weight_loss',
      healthConditions: ['Hipertensi'],
    })
  })

  it('rejects a second profile for the same user', async () => {
    const registration = await register('duplicate@example.com')
    const authorization = `Bearer ${registration.accessToken}`

    await request(app)
      .post('/api/v1/profile')
      .set('authorization', authorization)
      .send(profileInput)
      .expect(201)

    const response = await request(app)
      .post('/api/v1/profile')
      .set('authorization', authorization)
      .send(profileInput)
      .expect(409)

    expect(response.body).toMatchObject({
      error: {
        code: 'PROFILE_ALREADY_EXISTS',
      },
    })
  })

  it('returns not found before a profile is created', async () => {
    const registration = await register('empty@example.com')
    const authorization = `Bearer ${registration.accessToken}`

    for (const profileRequest of [
      request(app).get('/api/v1/profile'),
      request(app).put('/api/v1/profile').send(profileInput),
    ]) {
      const response = await profileRequest
        .set('authorization', authorization)
        .expect(404)

      expect(response.body).toMatchObject({
        error: {
          code: 'PROFILE_NOT_FOUND',
        },
      })
    }
  })

  it('isolates profiles by authenticated user', async () => {
    const firstUser = await register('first@example.com')
    const secondUser = await register('second@example.com')

    await request(app)
      .post('/api/v1/profile')
      .set('authorization', `Bearer ${firstUser.accessToken}`)
      .send(profileInput)
      .expect(201)

    const response = await request(app)
      .get('/api/v1/profile')
      .set('authorization', `Bearer ${secondUser.accessToken}`)
      .expect(404)

    expect(response.body).toMatchObject({
      error: {
        code: 'PROFILE_NOT_FOUND',
      },
    })
  })

  it('validates profile values and rejects unknown fields', async () => {
    const registration = await register('invalid@example.com')

    const response = await request(app)
      .post('/api/v1/profile')
      .set('authorization', `Bearer ${registration.accessToken}`)
      .send({
        ...profileInput,
        age: 8,
        weightKg: 500,
        unknownField: true,
      })
      .expect(422)

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
      },
    })
  })

  it('requires authentication and cascades profile deletion with its user', async () => {
    await request(app).get('/api/v1/profile').expect(401)

    const registration = await register('cascade@example.com')
    await request(app)
      .post('/api/v1/profile')
      .set('authorization', `Bearer ${registration.accessToken}`)
      .send(profileInput)
      .expect(201)

    database
      .prepare<[string]>('DELETE FROM users WHERE id = ?')
      .run(registration.user.id)

    const result = database
      .prepare<[], { count: number }>(
        'SELECT COUNT(*) AS count FROM user_profiles',
      )
      .get()

    expect(result?.count).toBe(0)
  })
})
