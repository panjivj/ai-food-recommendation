import Database from 'better-sqlite3'

import type { AppDatabase } from '../database/database.js'

interface UserRow {
  id: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  createdAt: string
  updatedAt: string
}

export class DuplicateEmailError extends Error {
  constructor() {
    super('A user with this email already exists')
    this.name = 'DuplicateEmailError'
  }
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class UserRepository {
  private readonly insertUser
  private readonly selectByEmail
  private readonly selectById

  constructor(private readonly database: AppDatabase) {
    this.insertUser = database.prepare<[string, string, string]>(
      `INSERT INTO users (id, email, password_hash)
       VALUES (?, ?, ?)`,
    )
    this.selectByEmail = database.prepare<[string], UserRow>(
      `SELECT id, email, password_hash, created_at, updated_at
       FROM users
       WHERE email = ?`,
    )
    this.selectById = database.prepare<[string], UserRow>(
      `SELECT id, email, password_hash, created_at, updated_at
       FROM users
       WHERE id = ?`,
    )
  }

  create(id: string, email: string, passwordHash: string): UserRecord {
    try {
      this.insertUser.run(id, email, passwordHash)
    } catch (error) {
      if (
        error instanceof Database.SqliteError &&
        error.code === 'SQLITE_CONSTRAINT_UNIQUE'
      ) {
        throw new DuplicateEmailError()
      }

      throw error
    }

    const user = this.findById(id)

    if (!user) {
      throw new Error('Created user could not be loaded')
    }

    return user
  }

  findByEmail(email: string): UserRecord | undefined {
    const row = this.selectByEmail.get(email)
    return row ? toUserRecord(row) : undefined
  }

  findById(id: string): UserRecord | undefined {
    const row = this.selectById.get(id)
    return row ? toUserRecord(row) : undefined
  }
}
