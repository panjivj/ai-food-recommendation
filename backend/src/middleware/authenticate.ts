import type { RequestHandler } from 'express'

import { AppError } from '../errors/app-error.js'
import type { TokenService } from '../services/auth/token.service.js'

export function requireAuthentication(tokens: TokenService): RequestHandler {
  return async (request, _response, next) => {
    const authorization = request.header('authorization')

    if (!authorization) {
      throw new AppError(
        401,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required',
      )
    }

    const [scheme, token, ...remainder] = authorization.trim().split(/\s+/)

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !token ||
      remainder.length > 0
    ) {
      throw new AppError(
        401,
        'INVALID_AUTHORIZATION_HEADER',
        'Authorization header must use the Bearer scheme',
      )
    }

    request.auth = {
      userId: await tokens.verify(token),
    }

    next()
  }
}
