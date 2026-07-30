import 'dotenv/config'

import path from 'node:path'

import { z } from 'zod'

const developmentTokenSecret =
  'development-only-change-this-secret-before-production'
const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().trim().min(1).optional(),
)

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_PATH: z.string().min(1).default('storage/app.db'),
  CORS_ORIGINS: z
    .string()
    .min(1)
    .default('http://localhost:5173,http://localhost,capacitor://localhost'),
  AUTH_TOKEN_SECRET: z.string().min(32).default(developmentTokenSecret),
  AUTH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(300)
    .max(86_400)
    .default(3600),
  AUTH_TOKEN_ISSUER: z
    .string()
    .min(1)
    .default('ai-food-recommendation-backend'),
  AUTH_TOKEN_AUDIENCE: z
    .string()
    .min(1)
    .default('ai-food-recommendation-mobile'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  OPENROUTER_API_KEY: optionalSecret,
  OPENROUTER_BASE_URL: z
    .string()
    .url()
    .default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().trim().min(1).default('openrouter/free'),
  OPENROUTER_SITE_URL: z.string().url().default('http://localhost:5173'),
  OPENROUTER_APP_NAME: z.string().trim().min(1).default('NutriChoice'),
  OPENROUTER_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(60_000)
    .default(20_000),
})

export type Environment = z.infer<typeof environmentSchema> & {
  corsOrigins: string[]
  databasePath: string
}

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Environment {
  const parsed = environmentSchema.safeParse(source)

  if (!parsed.success) {
    const details = z.prettifyError(parsed.error)
    throw new Error(`Invalid environment configuration:\n${details}`)
  }

  if (
    parsed.data.NODE_ENV === 'production' &&
    parsed.data.AUTH_TOKEN_SECRET === developmentTokenSecret
  ) {
    throw new Error(
      'AUTH_TOKEN_SECRET must be changed before running in production',
    )
  }

  return {
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((origin) =>
      origin.trim(),
    ),
    databasePath:
      parsed.data.DATABASE_PATH === ':memory:'
        ? ':memory:'
        : path.resolve(parsed.data.DATABASE_PATH),
  }
}
