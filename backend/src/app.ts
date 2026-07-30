import { randomUUID } from 'node:crypto'

import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'

import type { AppLogger } from './config/logger.js'
import type { AppDatabase } from './database/database.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { MenuRepository } from './repositories/menu.repository.js'
import { FeedbackRepository } from './repositories/feedback.repository.js'
import { ProfileRepository } from './repositories/profile.repository.js'
import { RecommendationRepository } from './repositories/recommendation.repository.js'
import { UserRepository } from './repositories/user.repository.js'
import { createAuthRouter } from './routes/auth.js'
import { createCalorieNeedsRouter } from './routes/calorie-needs.js'
import { createHealthRouter } from './routes/health.js'
import { createFeedbackRouter } from './routes/feedback.js'
import { createMenuRouter } from './routes/menus.js'
import { createProfileRouter } from './routes/profile.js'
import { createRecommendationRouter } from './routes/recommendations.js'
import { AuthService } from './services/auth/auth.service.js'
import {
  TokenService,
  type TokenConfiguration,
} from './services/auth/token.service.js'
import { CalorieNeedsService } from './services/calorie-needs.service.js'
import { FeedbackService } from './services/feedback.service.js'
import { MenuService } from './services/menu.service.js'
import { ProfileService } from './services/profile.service.js'
import { RecommendationService } from './services/recommendation.service.js'
import type {
  RecommendationExplanationGenerator,
} from './services/recommendation-explanation.service.js'
import type {
  ReplacementConversationInterpreter,
} from './services/replacement-conversation.service.js'

interface AppDependencies {
  aiExplanation?: RecommendationExplanationGenerator
  aiReplacementConversation?: ReplacementConversationInterpreter
  authToken: TokenConfiguration
  corsOrigins: string[]
  database: AppDatabase
  logger: AppLogger
}

export function createApp({
  aiExplanation,
  aiReplacementConversation,
  authToken,
  corsOrigins,
  database,
  logger,
}: AppDependencies): Express {
  const app = express()
  const users = new UserRepository(database)
  const menuRepository = new MenuRepository(database)
  const feedbackRepository = new FeedbackRepository(database)
  const profileRepository = new ProfileRepository(database)
  const recommendationRepository = new RecommendationRepository(database)
  const tokens = new TokenService(authToken)
  const auth = new AuthService(users, tokens, authToken.ttlSeconds)
  const menus = new MenuService(menuRepository)
  const feedback = new FeedbackService(feedbackRepository)
  const profiles = new ProfileService(profileRepository)
  const calorieNeeds = new CalorieNeedsService(profiles)
  const recommendations = new RecommendationService(
    profiles,
    recommendationRepository,
    feedback,
  )

  app.disable('x-powered-by')
  app.use(
    pinoHttp({
      logger,
      genReqId(request, response) {
        const requestId = request.headers['x-request-id']
        const id =
          typeof requestId === 'string' && requestId.length > 0
            ? requestId
            : randomUUID()

        response.setHeader('x-request-id', id)
        return id
      },
    }),
  )
  app.use(helmet())
  app.use(cors({ origin: corsOrigins }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/v1/health', createHealthRouter(database))
  app.use('/api/v1/auth', createAuthRouter(auth, tokens))
  app.use(
    '/api/v1/calorie-needs',
    createCalorieNeedsRouter(calorieNeeds, tokens),
  )
  app.use('/api/v1/menus', createMenuRouter(menus))
  app.use('/api/v1/feedback', createFeedbackRouter(feedback, tokens))
  app.use('/api/v1/profile', createProfileRouter(profiles, tokens))
  app.use(
    '/api/v1/recommendations',
    createRecommendationRouter(
      recommendations,
      tokens,
      aiExplanation,
      aiReplacementConversation,
    ),
  )

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
