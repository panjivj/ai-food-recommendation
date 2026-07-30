import { apiRequest } from './client'
import type { UserProfile, UserProfileInput } from '@/types/domain'

interface ProfileResponse {
  data: {
    profile: UserProfile
  }
}

export async function getProfile(token: string): Promise<UserProfile> {
  const response = await apiRequest<ProfileResponse>('/profile', { token })
  return response.data.profile
}

export async function createProfile(
  token: string,
  input: UserProfileInput,
): Promise<UserProfile> {
  const response = await apiRequest<ProfileResponse>('/profile', {
    method: 'POST',
    body: input,
    token,
  })

  return response.data.profile
}

export async function updateProfile(
  token: string,
  input: UserProfileInput,
): Promise<UserProfile> {
  const response = await apiRequest<ProfileResponse>('/profile', {
    method: 'PUT',
    body: input,
    token,
  })

  return response.data.profile
}
