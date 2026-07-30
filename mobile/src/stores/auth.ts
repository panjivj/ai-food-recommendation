import { defineStore } from 'pinia'
import { ApiError } from '@/services/api/client'
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type AuthSession,
} from '@/services/api/auth'
import {
  loadStoredSession,
  removeAccessToken,
  removePendingProfileName,
  storeAccessToken,
  storePendingProfileName,
} from '@/services/session-storage'
import type { AuthUser } from '@/types/domain'

interface AuthState {
  accessToken: string | null
  initialized: boolean
  pendingProfileName: string | null
  user: AuthUser | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: null,
    initialized: false,
    pendingProfileName: null,
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
  },
  actions: {
    async initialize() {
      if (this.initialized) {
        return
      }

      const stored = await loadStoredSession()
      this.accessToken = stored.accessToken
      this.pendingProfileName = stored.pendingProfileName

      if (this.accessToken) {
        try {
          this.user = await getCurrentUser(this.accessToken)
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await this.clearSession()
          }
        }
      }

      this.initialized = true
    },

    async register(name: string, email: string, password: string) {
      const session = await registerUser(email, password)
      await this.applySession(session, true)
      this.pendingProfileName = name.trim()
      await storePendingProfileName(this.pendingProfileName)
    },

    async login(email: string, password: string, remember: boolean) {
      const session = await loginUser(email, password)
      await this.applySession(session, remember)
      await this.clearPendingProfileName()
    },

    async logout() {
      await this.clearSession()
      this.initialized = true
    },

    async clearPendingProfileName() {
      this.pendingProfileName = null
      await removePendingProfileName()
    },

    async applySession(session: AuthSession, persist: boolean) {
      this.accessToken = session.accessToken
      this.user = session.user

      if (persist) {
        await storeAccessToken(session.accessToken)
      } else {
        await removeAccessToken()
      }
    },

    async clearSession() {
      this.accessToken = null
      this.user = null
      this.pendingProfileName = null
      await Promise.all([
        removeAccessToken(),
        removePendingProfileName(),
      ])
    },
  },
})
