import { defineStore } from 'pinia'
import {
  ApiError,
  userFacingApiError,
} from '@/services/api/client'
import { getMenuDetail } from '@/services/api/menus'
import { generateRecommendationAiExplanation } from '@/services/api/recommendations'
import { useAuthStore } from '@/stores/auth'
import type {
  MenuDetail,
  RecommendationAiExplanation,
  RecommendationMealType,
} from '@/types/domain'

interface MenuDetailState {
  aiErrorCode: string | null
  aiErrorMessage: string | null
  aiExplanation: RecommendationAiExplanation | null
  aiLoading: boolean
  aiRequestSequence: number
  errorCode: string | null
  errorMessage: string | null
  loading: boolean
  menu: MenuDetail | null
  requestSequence: number
}

export const useMenuDetailStore = defineStore('menu-detail', {
  state: (): MenuDetailState => ({
    aiErrorCode: null,
    aiErrorMessage: null,
    aiExplanation: null,
    aiLoading: false,
    aiRequestSequence: 0,
    errorCode: null,
    errorMessage: null,
    loading: false,
    menu: null,
    requestSequence: 0,
  }),
  actions: {
    async fetch(identifier: string): Promise<MenuDetail | null> {
      const requestSequence = ++this.requestSequence
      this.loading = true
      this.errorCode = null
      this.errorMessage = null
      this.menu = null
      this.clearAiExplanation()

      try {
        const menu = await getMenuDetail(
          identifier,
          useAuthStore().accessToken ?? undefined,
        )

        if (requestSequence !== this.requestSequence) {
          return null
        }

        this.menu = menu
        return menu
      } catch (error) {
        if (requestSequence !== this.requestSequence) {
          return null
        }

        this.errorCode =
          error instanceof ApiError ? error.code : 'UNKNOWN_ERROR'
        this.errorMessage = userFacingApiError(
          error,
          'Detail menu belum dapat dimuat. Silakan coba kembali.',
        )

        if (error instanceof ApiError && error.status === 401) {
          await useAuthStore().logout()
        }

        return null
      } finally {
        if (requestSequence === this.requestSequence) {
          this.loading = false
        }
      }
    },

    async fetchAiExplanation(input: {
      date: string
      mealType: RecommendationMealType
      menuId: string
    }): Promise<RecommendationAiExplanation | null> {
      const token = useAuthStore().accessToken

      if (!token) {
        this.aiErrorCode = 'AUTHENTICATION_REQUIRED'
        this.aiErrorMessage = 'Sesi masuk diperlukan untuk menggunakan AI.'
        return null
      }

      const requestSequence = ++this.aiRequestSequence
      this.aiLoading = true
      this.aiErrorCode = null
      this.aiErrorMessage = null
      this.aiExplanation = null

      try {
        const explanation =
          await generateRecommendationAiExplanation({
            ...input,
            token,
          })

        if (requestSequence !== this.aiRequestSequence) {
          return null
        }

        this.aiExplanation = explanation
        return explanation
      } catch (error) {
        if (requestSequence !== this.aiRequestSequence) {
          return null
        }

        this.aiErrorCode =
          error instanceof ApiError ? error.code : 'UNKNOWN_ERROR'
        this.aiErrorMessage = userFacingApiError(
          error,
          'Penjelasan AI belum dapat dibuat. Silakan coba kembali.',
        )

        if (error instanceof ApiError && error.status === 401) {
          await useAuthStore().logout()
        }

        return null
      } finally {
        if (requestSequence === this.aiRequestSequence) {
          this.aiLoading = false
        }
      }
    },

    clearAiExplanation() {
      this.aiRequestSequence += 1
      this.aiErrorCode = null
      this.aiErrorMessage = null
      this.aiExplanation = null
      this.aiLoading = false
    },

    reset() {
      this.requestSequence += 1
      this.errorCode = null
      this.errorMessage = null
      this.loading = false
      this.menu = null
      this.clearAiExplanation()
    },
  },
})
