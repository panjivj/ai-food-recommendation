import Database from 'better-sqlite3'

import type { AppDatabase } from '../database/database.js'
import type {
  ActivityLevel,
  Gender,
  Goal,
  ProfileInput,
  UserProfile,
} from '../domain/profile.js'

interface ProfileRow {
  id: string
  user_id: string
  name: string
  age: number
  gender: Gender
  height_cm: number
  weight_kg: number
  activity_level: ActivityLevel
  goal: Goal
  health_conditions: string
  allergies: string
  disliked_foods: string
  food_preferences: string
  created_at: string
  updated_at: string
}

export class ProfileAlreadyExistsError extends Error {
  constructor() {
    super('A profile already exists for this user')
    this.name = 'ProfileAlreadyExistsError'
  }
}

function parseStringList(value: string): string[] {
  const parsed: unknown = JSON.parse(value)

  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === 'string')
  ) {
    throw new Error('Profile contains an invalid string list')
  }

  return parsed
}

function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    activityLevel: row.activity_level,
    goal: row.goal,
    healthConditions: parseStringList(row.health_conditions),
    allergies: parseStringList(row.allergies),
    dislikedFoods: parseStringList(row.disliked_foods),
    foodPreferences: parseStringList(row.food_preferences),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class ProfileRepository {
  private readonly insertProfile
  private readonly selectByUserId
  private readonly updateProfile

  constructor(private readonly database: AppDatabase) {
    this.insertProfile = database.prepare<
      [
        string,
        string,
        string,
        number,
        Gender,
        number,
        number,
        ActivityLevel,
        Goal,
        string,
        string,
        string,
        string,
      ]
    >(
      `INSERT INTO user_profiles (
         id,
         user_id,
         name,
         age,
         gender,
         height_cm,
         weight_kg,
         activity_level,
         goal,
         health_conditions,
         allergies,
         disliked_foods,
         food_preferences
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    this.selectByUserId = database.prepare<[string], ProfileRow>(
      `SELECT
         id,
         user_id,
         name,
         age,
         gender,
         height_cm,
         weight_kg,
         activity_level,
         goal,
         health_conditions,
         allergies,
         disliked_foods,
         food_preferences,
         created_at,
         updated_at
       FROM user_profiles
       WHERE user_id = ?`,
    )
    this.updateProfile = database.prepare<
      [
        string,
        number,
        Gender,
        number,
        number,
        ActivityLevel,
        Goal,
        string,
        string,
        string,
        string,
        string,
      ]
    >(
      `UPDATE user_profiles
       SET
         name = ?,
         age = ?,
         gender = ?,
         height_cm = ?,
         weight_kg = ?,
         activity_level = ?,
         goal = ?,
         health_conditions = ?,
         allergies = ?,
         disliked_foods = ?,
         food_preferences = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE user_id = ?`,
    )
  }

  create(id: string, userId: string, input: ProfileInput): UserProfile {
    try {
      this.insertProfile.run(
        id,
        userId,
        input.name,
        input.age,
        input.gender,
        input.heightCm,
        input.weightKg,
        input.activityLevel,
        input.goal,
        JSON.stringify(input.healthConditions),
        JSON.stringify(input.allergies),
        JSON.stringify(input.dislikedFoods),
        JSON.stringify(input.foodPreferences),
      )
    } catch (error) {
      if (
        error instanceof Database.SqliteError &&
        error.code === 'SQLITE_CONSTRAINT_UNIQUE'
      ) {
        throw new ProfileAlreadyExistsError()
      }

      throw error
    }

    const profile = this.findByUserId(userId)

    if (!profile) {
      throw new Error('Created profile could not be loaded')
    }

    return profile
  }

  findByUserId(userId: string): UserProfile | undefined {
    const row = this.selectByUserId.get(userId)
    return row ? toUserProfile(row) : undefined
  }

  update(userId: string, input: ProfileInput): UserProfile | undefined {
    const result = this.updateProfile.run(
      input.name,
      input.age,
      input.gender,
      input.heightCm,
      input.weightKg,
      input.activityLevel,
      input.goal,
      JSON.stringify(input.healthConditions),
      JSON.stringify(input.allergies),
      JSON.stringify(input.dislikedFoods),
      JSON.stringify(input.foodPreferences),
      userId,
    )

    if (result.changes === 0) {
      return undefined
    }

    return this.findByUserId(userId)
  }
}
