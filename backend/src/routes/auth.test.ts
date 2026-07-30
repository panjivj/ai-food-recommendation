import pino from 'pino'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../app.js'
import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from '../database/database.js'

interface AuthResponseBody {
  data: {
    accessToken: string
    expiresIn: number
    tokenType: string
    user: {
      id: string
      email: string
      createdAt: string
      updatedAt: string
    }
  }
}

const logger = pino({ level: 'silent' })
const authToken = {
  audience: 'test-mobile',
  issuer: 'test-backend',
  secret: 'test-only-token-secret-with-at-least-32-characters',
  ttlSeconds: 3600,
}
const credentials = {
  email: 'Pengguna@Example.com',
  password: 'password-aman',
}

let database: AppDatabase

beforeEach(() => {
  database = openDatabase(':memory:', logger)
  runMigrations(database, logger)
})

afterEach(() => {
  database.close()
})

function createTestApp() {
  return createApp({
    authToken,
    corsOrigins: ['http://localhost:5173'],
    database,
    logger,
  })
}

describe('authentication API', () => {
  it('registers a user, hashes the password, and authenticates /me', async () => {
    const app = createTestApp()
    const registration = await request(app)
      .post('/api/v1/auth/register')
      .send(credentials)
      .expect(201)
    const body = registration.body as AuthResponseBody

    expect(body.data).toMatchObject({
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: {
        email: 'pengguna@example.com',
      },
    })
    expect(body.data.accessToken).toEqual(expect.any(String))
    expect(body.data.user.id).toEqual(expect.any(String))

    const storedUser = database
      .prepare<[], { email: string; password_hash: string }>(
        `SELECT email, password_hash
         FROM users`,
      )
      .get()

    expect(storedUser?.email).toBe('pengguna@example.com')
    expect(storedUser?.password_hash).toMatch(/^\$argon2id\$/)
    expect(storedUser?.password_hash).not.toContain(credentials.password)

    const profile = await request(app)
      .get('/api/v1/auth/me')
      .set('authorization', `Bearer ${body.data.accessToken}`)
      .expect(200)

    expect(profile.body).toMatchObject({
      data: {
        user: {
          id: body.data.user.id,
          email: 'pengguna@example.com',
        },
      },
    })
  })

  it('logs in with a normalized email and valid password', async () => {
    const app = createTestApp()
    await request(app)
      .post('/api/v1/auth/register')
      .send(credentials)
      .expect(201)

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: '  PENGGUNA@example.COM ',
        password: credentials.password,
      })
      .expect(200)
    const body = login.body as AuthResponseBody

    expect(body.data.accessToken).toEqual(expect.any(String))
    expect(body.data.user.email).toBe('pengguna@example.com')
  })

  it('rejects duplicate email registration', async () => {
    const app = createTestApp()
    await request(app)
      .post('/api/v1/auth/register')
      .send(credentials)
      .expect(201)

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...credentials,
        email: credentials.email.toUpperCase(),
      })
      .expect(409)

    expect(response.body).toMatchObject({
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
      },
    })
  })

  it.each([
    ['registered email with a wrong password', 'pengguna@example.com'],
    ['an unknown email', 'tidak-ada@example.com'],
  ])('rejects invalid credentials for %s', async (_scenario, email) => {
    const app = createTestApp()
    await request(app)
      .post('/api/v1/auth/register')
      .send(credentials)
      .expect(201)

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'password-salah' })
      .expect(401)

    expect(response.body).toMatchObject({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      },
    })
  })

  it('validates registration input', async () => {
    const response = await request(createTestApp())
      .post('/api/v1/auth/register')
      .send({
        email: 'bukan-email',
        password: 'pendek',
      })
      .expect(422)

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
      },
    })
  })

  it('requires a valid Bearer token for /me', async () => {
    const app = createTestApp()

    const missingToken = await request(app)
      .get('/api/v1/auth/me')
      .expect(401)
    expect(missingToken.body).toMatchObject({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
      },
    })

    const invalidToken = await request(app)
      .get('/api/v1/auth/me')
      .set('authorization', 'Bearer token-tidak-valid')
      .expect(401)
    expect(invalidToken.body).toMatchObject({
      error: {
        code: 'INVALID_ACCESS_TOKEN',
      },
    })
  })
})
