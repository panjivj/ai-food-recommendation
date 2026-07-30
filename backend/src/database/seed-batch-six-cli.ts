import path from 'node:path'

import { loadEnvironment } from '../config/env.js'
import { createLogger } from '../config/logger.js'
import { seedBatchSixMenus } from './batch-six-menus.js'
import { openDatabase, runMigrations } from './database.js'
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
  const result = seedBatchSixMenus(database)
  logger.info(result, 'Batch 6 menu seed completed')
} finally {
  database.close()
}
