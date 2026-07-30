import { Router } from 'express'

import {
  isDatabaseHealthy,
  type AppDatabase,
} from '../database/database.js'

export function createHealthRouter(database: AppDatabase): Router {
  const router = Router()

  router.get('/', (_request, response) => {
    const databaseHealthy = isDatabaseHealthy(database)

    response.status(databaseHealthy ? 200 : 503).json({
      status: databaseHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseHealthy ? 'ok' : 'unavailable',
      },
    })
  })

  return router
}
