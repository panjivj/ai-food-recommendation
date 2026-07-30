import type { ErrorRequestHandler } from 'express'

import { AppError } from '../errors/app-error.js'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  const knownError =
    error instanceof AppError
      ? error
      : error instanceof SyntaxError &&
          'status' in error &&
          error.status === 400
        ? new AppError(400, 'INVALID_JSON', 'Request body contains invalid JSON')
      : new AppError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred')

  if (knownError.statusCode >= 500) {
    request.log.error({ err: error }, 'Request failed')
  } else {
    request.log.warn(
      { code: knownError.code, statusCode: knownError.statusCode },
      'Request rejected',
    )
  }

  response.status(knownError.statusCode).json({
    error: {
      code: knownError.code,
      message: knownError.message,
      requestId: request.id,
    },
  })
}
