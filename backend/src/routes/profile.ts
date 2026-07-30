import { Router, type Request } from 'express'
import { z } from 'zod'

import type { ProfileInput } from '../domain/profile.js'
import { AppError } from '../errors/app-error.js'
import { requireAuthentication } from '../middleware/authenticate.js'
import type { ProfileService } from '../services/profile.service.js'
import type { TokenService } from '../services/auth/token.service.js'

const stringListSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(20)

const profileSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  age: z.number().int().min(13).max(100),
  gender: z.enum(['male', 'female']),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: z.enum(['low', 'moderate', 'high']),
  goal: z.enum(['maintain', 'weight_loss', 'weight_gain']),
  healthConditions: stringListSchema.default([]),
  allergies: stringListSchema.default([]),
  dislikedFoods: stringListSchema.default([]),
  foodPreferences: stringListSchema.default([]),
})

function parseProfile(request: Request): ProfileInput {
  const result = profileSchema.safeParse(request.body)

  if (!result.success) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Profile data is invalid',
    )
  }

  return result.data
}

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

export function createProfileRouter(
  profiles: ProfileService,
  tokens: TokenService,
): Router {
  const router = Router()

  router.use(requireAuthentication(tokens))

  router.get('/', (request, response) => {
    response.status(200).json({
      data: {
        profile: profiles.get(authenticatedUserId(request)),
      },
    })
  })

  router.post('/', (request, response) => {
    response.status(201).json({
      data: {
        profile: profiles.create(
          authenticatedUserId(request),
          parseProfile(request),
        ),
      },
    })
  })

  router.put('/', (request, response) => {
    response.status(200).json({
      data: {
        profile: profiles.update(
          authenticatedUserId(request),
          parseProfile(request),
        ),
      },
    })
  })

  return router
}
