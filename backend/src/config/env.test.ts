import { describe, expect, it } from 'vitest'

import { loadEnvironment } from './env.js'

describe('loadEnvironment', () => {
  it('uses safe defaults', () => {
    const environment = loadEnvironment({})

    expect(environment).toMatchObject({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      DATABASE_PATH: 'storage/app.db',
      CORS_ORIGINS:
        'http://localhost:5173,http://localhost,capacitor://localhost',
      AUTH_TOKEN_SECRET:
        'development-only-change-this-secret-before-production',
      AUTH_TOKEN_TTL_SECONDS: 3600,
      AUTH_TOKEN_ISSUER: 'ai-food-recommendation-backend',
      AUTH_TOKEN_AUDIENCE: 'ai-food-recommendation-mobile',
      LOG_LEVEL: 'info',
      OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      OPENROUTER_MODEL: 'openrouter/free',
      OPENROUTER_SITE_URL: 'http://localhost:5173',
      OPENROUTER_APP_NAME: 'NutriChoice',
      OPENROUTER_TIMEOUT_MS: 20_000,
    })
    expect(environment.corsOrigins).toEqual([
      'http://localhost:5173',
      'http://localhost',
      'capacitor://localhost',
    ])
    expect(environment.databasePath).toMatch(/storage\/app\.db$/)
  })

  it('accepts an optional OpenRouter configuration', () => {
    const environment = loadEnvironment({
      OPENROUTER_API_KEY: 'test-openrouter-key',
      OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      OPENROUTER_MODEL: 'openrouter/free',
      OPENROUTER_SITE_URL: 'http://localhost:5173',
      OPENROUTER_APP_NAME: 'NutriChoice Test',
      OPENROUTER_TIMEOUT_MS: '15000',
    })

    expect(environment).toMatchObject({
      OPENROUTER_API_KEY: 'test-openrouter-key',
      OPENROUTER_MODEL: 'openrouter/free',
      OPENROUTER_TIMEOUT_MS: 15_000,
    })
  })

  it('rejects an invalid port', () => {
    expect(() => loadEnvironment({ PORT: '70000' })).toThrow(
      'Invalid environment configuration',
    )
  })

  it('rejects the development token secret in production', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'production' })).toThrow(
      'AUTH_TOKEN_SECRET must be changed',
    )
  })
})
