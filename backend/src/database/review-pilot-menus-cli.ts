import path from 'node:path'

import { loadEnvironment } from '../config/env.js'
import { createLogger } from '../config/logger.js'
import { openDatabase, runMigrations } from './database.js'
import { reviewPilotMenus } from './pilot-menu-curation.js'
import { seedPilotMenus } from './pilot-menus.js'
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
  seedPilotMenus(database)
  const result = reviewPilotMenus(database)
  logger.info(result, 'Pilot menu review completed')
} finally {
  database.close()
}

