import { defineStore } from 'pinia'
import { ApiError } from '@/services/api/client'
import {
  createProfile,
  getProfile,
  updateProfile,
} from '@/services/api/profile'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import type { UserProfile, UserProfileInput } from '@/types/domain'

interface ProfileState {
  loaded: boolean
  profile: UserProfile | null
}

export const useProfileStore = defineStore('profile', {
  state: (): ProfileState => ({
    loaded: false,
    profile: null,
  }),
  actions: {
    async fetch(): Promise<UserProfile | null> {
      const token = this.requireToken()

      try {
        const profile = await getProfile(token)
        this.setProfile(profile)
        return profile
      } catch (error) {
        if (error instanceof ApiError && error.code === 'PROFILE_NOT_FOUND') {
          this.profile = null
          this.loaded = true
          return null
        }

        await this.handleAuthenticationFailure(error)
        throw error
      }
    },

    async create(input: UserProfileInput): Promise<UserProfile> {
      try {
        const profile = await createProfile(this.requireToken(), input)
        this.setProfile(profile)
        return profile
      } catch (error) {
        await this.handleAuthenticationFailure(error)
        throw error
      }
    },

    async update(input: UserProfileInput): Promise<UserProfile> {
      try {
        const profile = await updateProfile(this.requireToken(), input)
        this.setProfile(profile)
        return profile
      } catch (error) {
        await this.handleAuthenticationFailure(error)
        throw error
      }
    },

    reset() {
      this.profile = null
      this.loaded = false
    },

    setProfile(profile: UserProfile) {
      this.profile = profile
      this.loaded = true

      const auth = useAuthStore()
      const demo = useDemoStore()
      demo.user = {
        id: profile.userId,
        email: auth.user?.email ?? demo.user.email,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        healthConditions: [...profile.healthConditions],
        allergies: [...profile.allergies],
        dislikedFoods: [...profile.dislikedFoods],
        foodPreferences: [...profile.foodPreferences],
      }
    },

    requireToken(): string {
      const token = useAuthStore().accessToken

      if (!token) {
        throw new ApiError(
          401,
          'AUTHENTICATION_REQUIRED',
          'Authentication is required',
        )
      }

      return token
    },

    async handleAuthenticationFailure(error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        await useAuthStore().logout()
        this.reset()
      }
    },
  },
})
