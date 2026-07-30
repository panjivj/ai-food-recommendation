import { loadEnvironment } from '../config/env.js'
import { createLogger } from '../config/logger.js'
import { openDatabase, runMigrations } from './database.js'
import { validateFoodCatalog } from './food-catalog-validator.js'

const environment = loadEnvironment()
const logger = createLogger(environment)
const database = openDatabase(environment.databasePath, logger)

try {
  runMigrations(database, logger)
  const result = validateFoodCatalog(database)

  if (result.errors.length > 0) {
    logger.error(
      { errors: result.errors, stats: result.stats },
      'Food catalog validation failed',
    )
    process.exitCode = 1
  } else {
    logger.info(
      { stats: result.stats },
      'Food catalog technical validation passed',
    )
  }
} finally {
  database.close()
}

