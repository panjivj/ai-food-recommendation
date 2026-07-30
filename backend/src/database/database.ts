import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'

import type { AppLogger } from '../config/logger.js'
import { migrationChecksum, migrations } from './migrations.js'

interface AppliedMigration {
  version: number
  name: string
  checksum: string
}

export type AppDatabase = Database.Database

export function openDatabase(
  databasePath: string,
  logger: AppLogger,
): AppDatabase {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true })
  }

  const database = new Database(databasePath)
  database.pragma('foreign_keys = ON')
  database.pragma('busy_timeout = 5000')

  if (databasePath !== ':memory:') {
    database.pragma('journal_mode = WAL')
  }

  logger.info({ databasePath }, 'SQLite connection opened')
  return database
}

export function runMigrations(
  database: AppDatabase,
  logger: AppLogger,
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const findApplied = database.prepare<
    [number],
    AppliedMigration
  >(
    `SELECT version, name, checksum
     FROM schema_migrations
     WHERE version = ?`,
  )

  const applyMigration = database.transaction(
    (version: number, name: string, checksum: string, sql: string) => {
      database.exec(sql)
      database
        .prepare(
          `INSERT INTO schema_migrations (version, name, checksum)
           VALUES (?, ?, ?)`,
        )
        .run(version, name, checksum)
    },
  )

  for (const migration of migrations) {
    const checksum = migrationChecksum(migration)
    const applied = findApplied.get(migration.version)

    if (applied) {
      if (applied.name !== migration.name || applied.checksum !== checksum) {
        throw new Error(
          `Migration ${migration.version} has changed after being applied`,
        )
      }

      continue
    }

    applyMigration(
      migration.version,
      migration.name,
      checksum,
      migration.sql,
    )
    logger.info(
      { migration: migration.name, version: migration.version },
      'Database migration applied',
    )
  }
}

export function isDatabaseHealthy(database: AppDatabase): boolean {
  const result = database
    .prepare<[], { ok: number }>('SELECT 1 AS ok')
    .get()

  return result?.ok === 1
}
