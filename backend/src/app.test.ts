import pino from 'pino'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createApp } from './app.js'
import {
  openDatabase,
  runMigrations,
  type AppDatabase,
} from './database/database.js'

const logger = pino({ level: 'silent' })
const authToken = {
  audience: 'test-mobile',
  issuer: 'test-backend',
  secret: 'test-only-token-secret-with-at-least-32-characters',
  ttlSeconds: 3600,
}
let database: AppDatabase

beforeEach(() => {
  database = openDatabase(':memory:', logger)
  runMigrations(database, logger)
})

afterEach(() => {
  database.close()
})

describe('backend application', () => {
  it('reports that the API and database are healthy', async () => {
    const app = createApp({
      authToken,
      corsOrigins: ['http://localhost:5173'],
      database,
      logger,
    })

    const response = await request(app).get('/api/v1/health').expect(200)

    expect(response.body).toMatchObject({
      status: 'ok',
      checks: {
        database: 'ok',
      },
    })
    expect(response.headers).toHaveProperty('x-request-id')
  })

  it('returns a consistent error for unknown routes', async () => {
    const app = createApp({
      authToken,
      corsOrigins: ['http://localhost:5173'],
      database,
      logger,
    })

    const response = await request(app).get('/unknown').expect(404)

    expect(response.body).toMatchObject({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route GET /unknown was not found',
      },
    })
    const body = response.body as { error: { requestId: unknown } }
    expect(body.error.requestId).toEqual(expect.any(String))
  })

  it('returns a client error for malformed JSON', async () => {
    const app = createApp({
      authToken,
      corsOrigins: ['http://localhost:5173'],
      database,
      logger,
    })

    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send('{"email":')
      .expect(400)

    expect(response.body).toMatchObject({
      error: {
        code: 'INVALID_JSON',
      },
    })
  })
})
