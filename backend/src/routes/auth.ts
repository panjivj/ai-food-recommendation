import { Router, type Request } from 'express'
import { z } from 'zod'

import { AppError } from '../errors/app-error.js'
import { requireAuthentication } from '../middleware/authenticate.js'
import type { AuthService } from '../services/auth/auth.service.js'
import type { TokenService } from '../services/auth/token.service.js'

const credentialsSchema = z.strictObject({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
})

function parseCredentials(request: Request) {
  const result = credentialsSchema.safeParse(request.body)

  if (!result.success) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Email and password are invalid',
    )
  }

  return result.data
}

export function createAuthRouter(
  auth: AuthService,
  tokens: TokenService,
): Router {
  const router = Router()

  router.post('/register', async (request, response) => {
    const credentials = parseCredentials(request)
    const result = await auth.register(
      credentials.email,
      credentials.password,
    )

    response.status(201).json({ data: result })
  })

  router.post('/login', async (request, response) => {
    const credentials = parseCredentials(request)
    const result = await auth.login(credentials.email, credentials.password)

    response.status(200).json({ data: result })
  })

  router.get(
    '/me',
    requireAuthentication(tokens),
    (request, response) => {
      if (!request.auth) {
        throw new AppError(
          401,
          'AUTHENTICATION_REQUIRED',
          'Authentication is required',
        )
      }

      response.status(200).json({
        data: {
          user: auth.getUser(request.auth.userId),
        },
      })
    },
  )

  return router
}
