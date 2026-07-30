import { randomUUID } from 'node:crypto'

import type { ProfileInput, UserProfile } from '../domain/profile.js'
import { AppError } from '../errors/app-error.js'
import {
  ProfileAlreadyExistsError,
  type ProfileRepository,
} from '../repositories/profile.repository.js'

function normalizeList(values: string[]): string[] {
  const normalized = new Map<string, string>()

  for (const value of values) {
    const trimmed = value.trim()
    const key = trimmed.toLocaleLowerCase('id-ID')

    if (!normalized.has(key)) {
      normalized.set(key, trimmed)
    }
  }

  return [...normalized.values()]
}

function normalizeProfile(input: ProfileInput): ProfileInput {
  return {
    ...input,
    name: input.name.trim(),
    healthConditions: normalizeList(input.healthConditions),
    allergies: normalizeList(input.allergies),
    dislikedFoods: normalizeList(input.dislikedFoods),
    foodPreferences: normalizeList(input.foodPreferences),
  }
}

export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}

  create(userId: string, input: ProfileInput): UserProfile {
    try {
      return this.profiles.create(randomUUID(), userId, normalizeProfile(input))
    } catch (error) {
      if (error instanceof ProfileAlreadyExistsError) {
        throw new AppError(
          409,
          'PROFILE_ALREADY_EXISTS',
          'A profile already exists for this user',
        )
      }

      throw error
    }
  }

  get(userId: string): UserProfile {
    const profile = this.profiles.findByUserId(userId)

    if (!profile) {
      throw this.profileNotFound()
    }

    return profile
  }

  update(userId: string, input: ProfileInput): UserProfile {
    const profile = this.profiles.update(userId, normalizeProfile(input))

    if (!profile) {
      throw this.profileNotFound()
    }

    return profile
  }

  private profileNotFound(): AppError {
    return new AppError(
      404,
      'PROFILE_NOT_FOUND',
      'A profile has not been created for this user',
    )
  }
}
