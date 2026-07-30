import pino from 'pino'

import type { Environment } from './env.js'

export function createLogger(environment: Environment) {
  return pino({
    level: environment.LOG_LEVEL,
    base: {
      service: 'ai-food-recommendation-backend',
      environment: environment.NODE_ENV,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        '*.password',
      ],
      censor: '[REDACTED]',
    },
  })
}

export type AppLogger = ReturnType<typeof createLogger>
