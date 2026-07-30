import { defineStore } from 'pinia'
import {
  ApiError,
  userFacingApiError,
} from '@/services/api/client'
import {
  getMenuFeedback,
  updateMenuFeedback,
} from '@/services/api/feedback'
import { useAuthStore } from '@/stores/auth'
import type {
  FeedbackAction,
  UserMenuFeedback,
  UserMenuFeedbackPatch,
} from '@/types/domain'

interface FeedbackState {
  errorMessage: string | null
  feedback: UserMenuFeedback | null
  loading: boolean
  menuId: string | null
  requestSequence: number
  saving: boolean
}

export const useFeedbackStore = defineStore('feedback', {
  state: (): FeedbackState => ({
    errorMessage: null,
    feedback: null,
    loading: false,
    menuId: null,
    requestSequence: 0,
    saving: false,
  }),
  actions: {
    async fetch(menuId: string): Promise<UserMenuFeedback | null> {
      const requestSequence = ++this.requestSequence
      this.menuId = menuId
      this.feedback = null
      this.loading = true
      this.errorMessage = null

      try {
        const feedback = await getMenuFeedback(
          this.requireToken(),
          menuId,
        )

        if (requestSequence !== this.requestSequence) {
          return null
        }

        this.feedback = feedback
        return feedback
      } catch (error) {
        if (requestSequence !== this.requestSequence) {
          return null
        }

        this.errorMessage = userFacingApiError(
          error,
          'Status feedback belum dapat dimuat.',
        )
        await this.handleAuthenticationFailure(error)
        return null
      } finally {
        if (requestSequence === this.requestSequence) {
          this.loading = false
        }
      }
    },

    async toggle(action: FeedbackAction): Promise<UserMenuFeedback | null> {
      const current = this.feedback
      if (!current || this.saving) return null

      const patch: UserMenuFeedbackPatch =
        action === 'like'
          ? { liked: !current.liked }
          : action === 'dislike'
            ? { disliked: !current.disliked }
            : { consumed: !current.consumed }

      this.saving = true
      this.errorMessage = null

      try {
        const feedback = await updateMenuFeedback(
          this.requireToken(),
          current.menuId,
          patch,
        )
        this.feedback = feedback
        return feedback
      } catch (error) {
        this.errorMessage = userFacingApiError(
          error,
          'Feedback belum dapat disimpan. Silakan coba kembali.',
        )
        await this.handleAuthenticationFailure(error)
        return null
      } finally {
        this.saving = false
      }
    },

    reset() {
      this.requestSequence += 1
      this.errorMessage = null
      this.feedback = null
      this.loading = false
      this.menuId = null
      this.saving = false
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
