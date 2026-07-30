import { createServer } from 'node:http'

import { createApp } from './app.js'
import { loadEnvironment } from './config/env.js'
import { createLogger } from './config/logger.js'
import { openDatabase, runMigrations } from './database/database.js'
import { OpenRouterRecommendationExplanationService } from './services/recommendation-explanation.service.js'
import { OpenRouterReplacementConversationService } from './services/replacement-conversation.service.js'

const environment = loadEnvironment()
const logger = createLogger(environment)
const database = openDatabase(environment.databasePath, logger)

runMigrations(database, logger)

const aiExplanation = environment.OPENROUTER_API_KEY
  ? new OpenRouterRecommendationExplanationService({
      apiKey: environment.OPENROUTER_API_KEY,
      appName: environment.OPENROUTER_APP_NAME,
      baseUrl: environment.OPENROUTER_BASE_URL,
      model: environment.OPENROUTER_MODEL,
      siteUrl: environment.OPENROUTER_SITE_URL,
      timeoutMs: environment.OPENROUTER_TIMEOUT_MS,
    })
  : undefined
const aiReplacementConversation = environment.OPENROUTER_API_KEY
  ? new OpenRouterReplacementConversationService({
      apiKey: environment.OPENROUTER_API_KEY,
      appName: environment.OPENROUTER_APP_NAME,
      baseUrl: environment.OPENROUTER_BASE_URL,
      model: environment.OPENROUTER_MODEL,
      siteUrl: environment.OPENROUTER_SITE_URL,
      timeoutMs: environment.OPENROUTER_TIMEOUT_MS,
    })
  : undefined

const app = createApp({
  ...(aiExplanation ? { aiExplanation } : {}),
  ...(aiReplacementConversation
    ? { aiReplacementConversation }
    : {}),
  authToken: {
    audience: environment.AUTH_TOKEN_AUDIENCE,
    issuer: environment.AUTH_TOKEN_ISSUER,
    secret: environment.AUTH_TOKEN_SECRET,
    ttlSeconds: environment.AUTH_TOKEN_TTL_SECONDS,
  },
  corsOrigins: environment.corsOrigins,
  database,
  logger,
})
const server = createServer(app)

server.listen(environment.PORT, environment.HOST, () => {
  logger.info(
    {
      host: environment.HOST,
      port: environment.PORT,
    },
    'HTTP server started',
  )
})

let shuttingDown = false

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  logger.info({ signal }, 'Shutting down')

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'HTTP server failed to close cleanly')
      process.exitCode = 1
    }

    database.close()
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
