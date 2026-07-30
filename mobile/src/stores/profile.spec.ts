import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { getProfile } from '@/services/api/profile'
import { useAuthStore } from '@/stores/auth'
import { useDemoStore } from '@/stores/demo'
import { useProfileStore } from '@/stores/profile'
import type { UserProfile } from '@/types/domain'

vi.mock('@/services/api/profile', () => ({
  createProfile: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}))

const profile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  name: 'Alya Putri',
  age: 22,
  gender: 'female',
  heightCm: 160,
  weightKg: 56,
  activityLevel: 'moderate',
  goal: 'maintain',
  healthConditions: [],
  allergies: ['Kacang tanah'],
  dislikedFoods: ['Jeroan'],
  foodPreferences: ['Makanan rumahan'],
  createdAt: '2026-07-28T00:00:00.000Z',
  updatedAt: '2026-07-28T00:00:00.000Z',
}

describe('profile store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    const auth = useAuthStore()
    auth.accessToken = 'access-token'
    auth.user = {
      id: 'user-1',
      email: 'alya@example.com',
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }
  })

  it('loads a profile and synchronizes the transitional demo store', async () => {
    vi.mocked(getProfile).mockResolvedValue(profile)
    const profiles = useProfileStore()

    await profiles.fetch()

    expect(getProfile).toHaveBeenCalledWith('access-token')
    expect(profiles.profile).toEqual(profile)
    expect(useDemoStore().user).toMatchObject({
      id: 'user-1',
      email: 'alya@example.com',
      name: 'Alya Putri',
      allergies: ['Kacang tanah'],
      foodPreferences: ['Makanan rumahan'],
    })
  })
})
