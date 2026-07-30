import { Router, type Request } from 'express'

import { AppError } from '../errors/app-error.js'
import { requireAuthentication } from '../middleware/authenticate.js'
import type { TokenService } from '../services/auth/token.service.js'
import type { CalorieNeedsService } from '../services/calorie-needs.service.js'

function authenticatedUserId(request: Request): string {
  if (!request.auth) {
    throw new AppError(
      401,
      'AUTHENTICATION_REQUIRED',
      'Authentication is required',
    )
  }

  return request.auth.userId
}

export function createCalorieNeedsRouter(
  calorieNeeds: CalorieNeedsService,
  tokens: TokenService,
): Router {
  const router = Router()

  router.use(requireAuthentication(tokens))

  router.get('/', (request, response) => {
    response.status(200).json({
      data: {
        calorieNeeds: calorieNeeds.get(authenticatedUserId(request)),
      },
    })
  })

  return router
}
