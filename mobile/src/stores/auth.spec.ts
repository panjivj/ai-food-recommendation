import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '@/services/api/auth'
import {
  loadStoredSession,
  removeAccessToken,
  removePendingProfileName,
  storeAccessToken,
  storePendingProfileName,
} from '@/services/session-storage'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/api/auth', () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}))

vi.mock('@/services/session-storage', () => ({
  loadStoredSession: vi.fn(),
  removeAccessToken: vi.fn(),
  removePendingProfileName: vi.fn(),
  storeAccessToken: vi.fn(),
  storePendingProfileName: vi.fn(),
}))

const user = {
  id: 'user-1',
  email: 'alya@example.com',
  createdAt: '2026-07-28T00:00:00.000Z',
  updatedAt: '2026-07-28T00:00:00.000Z',
}
const session = {
  accessToken: 'access-token',
  expiresIn: 3600,
  tokenType: 'Bearer' as const,
  user,
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(loadStoredSession).mockResolvedValue({
      accessToken: null,
      pendingProfileName: null,
    })
  })

  it('persists registration and the pending profile name', async () => {
    vi.mocked(registerUser).mockResolvedValue(session)
    const store = useAuthStore()

    await store.register(' Alya Putri ', user.email, 'password-aman')

    expect(store.user).toEqual(user)
    expect(store.pendingProfileName).toBe('Alya Putri')
    expect(storeAccessToken).toHaveBeenCalledWith('access-token')
    expect(storePendingProfileName).toHaveBeenCalledWith('Alya Putri')
  })

  it('keeps a non-remembered login only in memory', async () => {
    vi.mocked(loginUser).mockResolvedValue(session)
    const store = useAuthStore()

    await store.login(user.email, 'password-aman', false)

    expect(store.accessToken).toBe('access-token')
    expect(removeAccessToken).toHaveBeenCalled()
    expect(storeAccessToken).not.toHaveBeenCalled()
  })

  it('restores and verifies a persisted session', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue({
      accessToken: 'stored-token',
      pendingProfileName: null,
    })
    vi.mocked(getCurrentUser).mockResolvedValue(user)
    const store = useAuthStore()

    await store.initialize()

    expect(getCurrentUser).toHaveBeenCalledWith('stored-token')
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(user)
    expect(removePendingProfileName).not.toHaveBeenCalled()
  })
})
