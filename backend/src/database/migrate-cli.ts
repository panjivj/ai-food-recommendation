import { loadEnvironment } from '../config/env.js'
import { createLogger } from '../config/logger.js'
import { openDatabase, runMigrations } from './database.js'

const environment = loadEnvironment()
const logger = createLogger(environment)
const database = openDatabase(environment.databasePath, logger)

try {
  runMigrations(database, logger)
  logger.info('Database is up to date')
} finally {
  database.close()
}
