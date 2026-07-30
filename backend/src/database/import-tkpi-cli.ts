import path from 'node:path'

import { loadEnvironment } from '../config/env.js'
import { createLogger } from '../config/logger.js'
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
  const result = importTkpiDirectory(database, sourceDirectory)
  logger.info(
    {
      categories: result.categoryCount,
      files: result.importedFiles.length,
      foods: result.foodCount,
      sourceDirectory,
    },
    'TKPI import completed',
  )
} finally {
  database.close()
}

