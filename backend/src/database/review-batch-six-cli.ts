import path from 'node:path'

import { loadEnvironment } from '../config/env.js'
import { createLogger } from '../config/logger.js'
import { seedBatchSixMenus } from './batch-six-menus.js'
import { openDatabase, runMigrations } from './database.js'
import { reviewMenuBatch } from './menu-batch-reviewer.js'
import { importTkpiDirectory } from './tkpi-importer.js'

const environment = loadEnvironment()
const logger = createLogger(environment)
const database = openDatabase(environment.databasePath, logger)
const sourceDirectory = path.resolve(
  process.argv[2] ?? path.join('..', 'data', 'tkpi-json'),
)

try {
  runMigrations(database, logger)
  importTkpiDirectory(database, sourceDirectory)
  seedBatchSixMenus(database)
  const result = reviewMenuBatch(database, 6)
  logger.info(result, 'Batch 6 menu review completed')
} finally {
  database.close()
}
