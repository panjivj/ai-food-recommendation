import { Router, type Request } from 'express'
import { z } from 'zod'

import { AppError } from '../errors/app-error.js'
import { requireAuthentication } from '../middleware/authenticate.js'
import type { TokenService } from '../services/auth/token.service.js'
import type { FeedbackService } from '../services/feedback.service.js'

const menuIdSchema = z.string().trim().min(1).max(160)
const feedbackPatchSchema = z
  .strictObject({
    liked: z.boolean().optional(),
    disliked: z.boolean().optional(),
    consumed: z.boolean().optional(),
  })
  .refine(
    (patch) => Object.values(patch).some((value) => value !== undefined),
  )
  .refine((patch) => !(patch.liked === true && patch.disliked === true))

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

function menuId(request: Request): string {
  const result = menuIdSchema.safeParse(request.params.menuId)

  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Menu ID is invalid')
  }

  return result.data
}

export function createFeedbackRouter(
  feedback: FeedbackService,
  tokens: TokenService,
): Router {
  const router = Router()

  router.use(requireAuthentication(tokens))

  router.get('/:menuId', (request, response) => {
    response.status(200).json({
      data: {
        feedback: feedback.get(
          authenticatedUserId(request),
          menuId(request),
        ),
      },
    })
  })

  router.put('/:menuId', (request, response) => {
    const patch = feedbackPatchSchema.safeParse(request.body)

    if (!patch.success) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        'Feedback payload is invalid',
      )
    }

    response.status(200).json({
      data: {
        feedback: feedback.update(
          authenticatedUserId(request),
          menuId(request),
          patch.data,
        ),
      },
    })
  })

  return router
}
