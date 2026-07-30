import { Router, type Request } from 'express'
import { z } from 'zod'

import { AppError } from '../errors/app-error.js'
import { requireAuthentication } from '../middleware/authenticate.js'
import type { TokenService } from '../services/auth/token.service.js'
import type {
  RecommendationExplanationGenerator,
} from '../services/recommendation-explanation.service.js'
import type {
  ReplacementConversationInterpreter,
} from '../services/replacement-conversation.service.js'
import type {
  RecommendationService,
} from '../services/recommendation.service.js'

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    )
  })

const dailyQuerySchema = z.strictObject({
  date: dateSchema.optional(),
})

const identifierSchema = z.string().trim().min(1).max(160)
const conversationTermSchema = z.string().trim().min(2).max(60)
const commaSeparatedConversationTerms = z
  .string()
  .trim()
  .max(600)
  .transform((value) =>
    value.split(',').map((term) => term.trim()).filter(Boolean),
  )
  .pipe(z.array(conversationTermSchema).max(8))
const alternativeQuerySchema = z.strictObject({
  date: dateSchema.optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  current_menu_id: identifierSchema,
  excluded_menu_ids: z
    .string()
    .trim()
    .max(12_000)
    .transform((value) => value.split(',').filter(Boolean))
    .pipe(z.array(identifierSchema).max(600))
    .optional(),
  excluded_ingredients: commaSeparatedConversationTerms.optional(),
  preferred_ingredients: commaSeparatedConversationTerms.optional(),
  limit: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().max(10))
    .default(3),
})
const conversationAlternativeBodySchema = z.strictObject({
  date: dateSchema,
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  current_menu_id: identifierSchema,
  excluded_menu_ids: z.array(identifierSchema).max(600).default([]),
  limit: z.number().int().min(1).max(10).default(3),
  message: z.string().trim().min(5).max(500),
})
const historyQuerySchema = z.strictObject({
  page: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().max(100_000))
    .default(1),
  limit: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().max(50))
    .default(20),
})
const replacementBodySchema = z.strictObject({
  current_menu_id: identifierSchema,
  replacement_menu_id: identifierSchema,
  excluded_menu_ids: z.array(identifierSchema).max(600).optional(),
  conversation_filters: z
    .strictObject({
      excluded_ingredients: z.array(conversationTermSchema).max(8),
      preferred_ingredients: z.array(conversationTermSchema).max(8),
    })
    .optional(),
})
const explanationBodySchema = z.strictObject({
  menu_id: identifierSchema,
})

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

function recommendationDate(request: Request): string {
  const result = dailyQuerySchema.safeParse(request.query)

  if (!result.success) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Recommendation date is invalid',
    )
  }

  return result.data.date ?? new Date().toISOString().slice(0, 10)
}

export function createRecommendationRouter(
  recommendations: RecommendationService,
  tokens: TokenService,
  explanations?: RecommendationExplanationGenerator,
  conversations?: ReplacementConversationInterpreter,
): Router {
  const router = Router()

  router.use(requireAuthentication(tokens))

  router.get('/history', (request, response) => {
    const result = historyQuerySchema.safeParse(request.query)

    if (!result.success) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        'Recommendation history query is invalid',
      )
    }

    const history = recommendations.listHistory(
      authenticatedUserId(request),
      result.data.page,
      result.data.limit,
    )

    response.status(200).json({
      data: {
        recommendations: history.items,
      },
      meta: {
        pagination: {
          page: history.page,
          limit: history.limit,
          total: history.total,
          totalPages: history.totalPages,
        },
      },
    })
  })

  router.get('/weekly', (request, response) => {
    const result = z
      .strictObject({ start_date: dateSchema })
      .safeParse(request.query)

    if (!result.success) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        'Weekly recommendation start date is invalid',
      )
    }

    response.status(200).json({
      data: {
        plan: recommendations.getWeekly(
          authenticatedUserId(request),
          result.data.start_date,
        ),
      },
    })
  })

  router.get('/daily/alternatives', (request, response) => {
    const result = alternativeQuerySchema.safeParse(request.query)

    if (!result.success) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        'Alternative recommendation query is invalid',
      )
    }

    response.status(200).json({
      data: {
        replacement: recommendations.getAlternatives(
          authenticatedUserId(request),
          result.data.date ?? new Date().toISOString().slice(0, 10),
          result.data.meal_type,
          result.data.current_menu_id,
          result.data.excluded_menu_ids ?? [],
          result.data.limit,
          result.data.excluded_ingredients ||
            result.data.preferred_ingredients
            ? {
                mealType: result.data.meal_type,
                excludedIngredients:
                  result.data.excluded_ingredients ?? [],
                preferredIngredients:
                  result.data.preferred_ingredients ?? [],
              }
            : undefined,
        ),
      },
    })
  })

  router.post(
    '/daily/alternatives/conversation',
    async (request, response) => {
      const body = conversationAlternativeBodySchema.safeParse(
        request.body,
      )

      if (!body.success) {
        throw new AppError(
          422,
          'VALIDATION_ERROR',
          'Conversational alternative request is invalid',
        )
      }

      if (!conversations) {
        throw new AppError(
          503,
          'AI_REPLACEMENT_ASSISTANT_NOT_CONFIGURED',
          'AI replacement assistant is not configured',
        )
      }

      const userId = authenticatedUserId(request)
      const currentRecommendation = recommendations.getDaily(
        userId,
        body.data.date,
      )
      const currentItem = currentRecommendation.items.find(
        (item) => item.mealType === body.data.meal_type,
      )

      if (
        !currentItem ||
        currentItem.menu.id !== body.data.current_menu_id
      ) {
        throw new AppError(
          422,
          'INVALID_REPLACEMENT_MENU',
          'Current menu does not match the stored meal slot',
        )
      }

      const interpretation = await conversations.interpret({
        mealType: body.data.meal_type,
        message: body.data.message,
      })
      const filters = {
        mealType: interpretation.mealType,
        excludedIngredients: interpretation.excludedIngredients,
        preferredIngredients: interpretation.preferredIngredients,
      }

      response.status(200).json({
        data: {
          interpretation,
          replacement: recommendations.getAlternatives(
            userId,
            body.data.date,
            body.data.meal_type,
            body.data.current_menu_id,
            body.data.excluded_menu_ids,
            body.data.limit,
            filters,
          ),
        },
      })
    },
  )

  router.get('/daily', (request, response) => {
    response.status(200).json({
      data: {
        recommendation: recommendations.getDaily(
          authenticatedUserId(request),
          recommendationDate(request),
        ),
      },
    })
  })

  router.post(
    '/daily/:date/items/:mealType/explanation',
    async (request, response) => {
      const date = dateSchema.safeParse(request.params.date)
      const mealType = z
        .enum(['breakfast', 'lunch', 'dinner', 'snack'])
        .safeParse(request.params.mealType)
      const body = explanationBodySchema.safeParse(request.body)

      if (!date.success || !mealType.success || !body.success) {
        throw new AppError(
          422,
          'VALIDATION_ERROR',
          'AI explanation request is invalid',
        )
      }

      if (!explanations) {
        throw new AppError(
          503,
          'AI_EXPLANATION_NOT_CONFIGURED',
          'AI explanation provider is not configured',
        )
      }

      const recommendation = recommendations.getDaily(
        authenticatedUserId(request),
        date.data,
      )
      const item = recommendation.items.find(
        (candidate) => candidate.mealType === mealType.data,
      )

      if (!item || item.menu.id !== body.data.menu_id) {
        throw new AppError(
          409,
          'RECOMMENDATION_ITEM_CHANGED',
          'The recommendation item no longer matches this meal slot',
        )
      }

      response.status(200).json({
        data: {
          explanation: await explanations.generate({
            recommendation,
            item,
          }),
        },
      })
    },
  )

  router.put(
    '/daily/:date/items/:mealType',
    (request, response) => {
      const date = dateSchema.safeParse(request.params.date)
      const mealType = z
        .enum(['breakfast', 'lunch', 'dinner', 'snack'])
        .safeParse(request.params.mealType)
      const body = replacementBodySchema.safeParse(request.body)

      if (!date.success || !mealType.success || !body.success) {
        throw new AppError(
          422,
          'VALIDATION_ERROR',
          'Recommendation replacement request is invalid',
        )
      }

      response.status(200).json({
        data: {
          recommendation: recommendations.replaceDailyItem(
            authenticatedUserId(request),
            date.data,
            mealType.data,
            body.data.current_menu_id,
            body.data.replacement_menu_id,
            body.data.excluded_menu_ids ?? [],
            body.data.conversation_filters
              ? {
                  mealType: mealType.data,
                  excludedIngredients:
                    body.data.conversation_filters
                      .excluded_ingredients,
                  preferredIngredients:
                    body.data.conversation_filters
                      .preferred_ingredients,
                }
              : undefined,
          ),
        },
      })
    },
  )

  return router
}
