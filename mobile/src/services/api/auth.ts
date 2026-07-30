import { apiRequest } from './client'
import type { AuthUser } from '@/types/domain'

export interface AuthSession {
  accessToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: AuthUser
}

interface AuthResponse {
  data: AuthSession
}

interface CurrentUserResponse {
  data: {
    user: AuthUser
  }
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { email, password },
  })

  return response.data
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  return response.data
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await apiRequest<CurrentUserResponse>('/auth/me', {
    token,
  })

  return response.data.user
}
