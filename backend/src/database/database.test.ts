import pino from 'pino'
import { afterEach, describe, expect, it } from 'vitest'

import {
  isDatabaseHealthy,
  openDatabase,
  runMigrations,
  type AppDatabase,
} from './database.js'

const logger = pino({ level: 'silent' })
let database: AppDatabase | undefined

afterEach(() => {
  database?.close()
  database = undefined
})

describe('database migrations', () => {
  it('applies migrations idempotently', () => {
    database = openDatabase(':memory:', logger)

    runMigrations(database, logger)
    runMigrations(database, logger)

    const result = database
      .prepare<[], { count: number }>(
        'SELECT COUNT(*) AS count FROM schema_migrations',
      )
      .get()

    expect(result?.count).toBe(9)
    expect(isDatabaseHealthy(database)).toBe(true)
  })
})
