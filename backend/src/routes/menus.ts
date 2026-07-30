import { Router, type Request } from 'express'
import { z } from 'zod'

import type { MenuListFilters } from '../domain/menu.js'
import { AppError } from '../errors/app-error.js'
import type { MenuService } from '../services/menu.service.js'

const positiveIntegerQuery = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)

const calorieQuery = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/)
  .transform(Number)
  .pipe(z.number().max(5_000))

const menuQuerySchema = z
  .strictObject({
    page: positiveIntegerQuery.pipe(z.number().max(100_000)).default(1),
    limit: positiveIntegerQuery.pipe(z.number().max(100)).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    meal_type: z
      .enum(['breakfast', 'lunch', 'dinner', 'snack', 'all_day'])
      .optional(),
    min_calories: calorieQuery.optional(),
    max_calories: calorieQuery.optional(),
  })
  .refine(
    (query) =>
      query.min_calories === undefined ||
      query.max_calories === undefined ||
      query.min_calories <= query.max_calories,
  )

const identifierSchema = z.string().trim().min(1).max(160)

function validationError(message: string): AppError {
  return new AppError(422, 'VALIDATION_ERROR', message)
}

function parseFilters(request: Request): MenuListFilters {
  const result = menuQuerySchema.safeParse(request.query)

  if (!result.success) {
    throw validationError('Menu query parameters are invalid')
  }

  const filters: MenuListFilters = {
    page: result.data.page,
    limit: result.data.limit,
  }

  if (result.data.search !== undefined) {
    filters.search = result.data.search
  }

  if (result.data.meal_type !== undefined) {
    filters.mealType = result.data.meal_type
  }

  if (result.data.min_calories !== undefined) {
    filters.minimumCalories = result.data.min_calories
  }

  if (result.data.max_calories !== undefined) {
    filters.maximumCalories = result.data.max_calories
  }

  return filters
}

function parseIdentifier(request: Request): string {
  const result = identifierSchema.safeParse(request.params.identifier)

  if (!result.success) {
    throw validationError('Menu identifier is invalid')
  }

  return result.data
}

export function createMenuRouter(menus: MenuService): Router {
  const router = Router()

  router.get('/', (request, response) => {
    const result = menus.list(parseFilters(request))

    response.status(200).json({
      data: {
        menus: result.items,
      },
      meta: {
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    })
  })

  router.get('/:identifier', (request, response) => {
    response.status(200).json({
      data: {
        menu: menus.get(parseIdentifier(request)),
      },
    })
  })

  return router
}
