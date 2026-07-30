import { defineStore } from 'pinia'
import {
  ApiError,
  userFacingApiError,
} from '@/services/api/client'
import {
  getConversationalRecommendationAlternatives,
  getDailyRecommendation,
  getRecommendationAlternatives,
  getWeeklyRecommendations,
  replaceRecommendationItem,
} from '@/services/api/recommendations'
import { useAuthStore } from '@/stores/auth'
import type {
  DailyRecommendationItem,
  DailyRecommendationResult,
  RecommendationAlternativeSearch,
  RecommendationMealType,
  ReplacementConversationInterpretation,
  WeeklyRecommendationPlan,
} from '@/types/domain'

interface RecommendationState {
  errorCode: string | null
  errorMessage: string | null
  loading: boolean
  recommendation: DailyRecommendationResult | null
  replacementErrorCode: string | null
  replacementErrorMessage: string | null
  replacementInterpretation: ReplacementConversationInterpretation | null
  replacementHasMore: boolean
  replacementLoading: boolean
  replacementLoadingMore: boolean
  replacementMoreMessage: string | null
  replacementSaving: boolean
  replacementSearch: RecommendationAlternativeSearch | null
  replacementSeenMenuIds: string[]
  replacementRequestSequence: number
  requestSequence: number
  selectedDate: string
  weeklyErrorMessage: string | null
  weeklyLoading: boolean
  weeklyPlan: WeeklyRecommendationPlan | null
  weeklyRequestSequence: number
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const useRecommendationStore = defineStore('recommendation', {
  state: (): RecommendationState => ({
    errorCode: null,
    errorMessage: null,
    loading: false,
    recommendation: null,
    replacementErrorCode: null,
    replacementErrorMessage: null,
    replacementInterpretation: null,
    replacementHasMore: false,
    replacementLoading: false,
    replacementLoadingMore: false,
    replacementMoreMessage: null,
    replacementSaving: false,
    replacementSearch: null,
    replacementSeenMenuIds: [],
    replacementRequestSequence: 0,
    requestSequence: 0,
    selectedDate: localDateKey(),
    weeklyErrorMessage: null,
    weeklyLoading: false,
    weeklyPlan: null,
    weeklyRequestSequence: 0,
  }),
  getters: {
    hasNoSafeRecommendation: (state) =>
      state.errorCode === 'NO_SAFE_RECOMMENDATION',
  },
  actions: {
    async fetch(date = localDateKey()): Promise<DailyRecommendationResult | null> {
      const requestSequence = ++this.requestSequence
      this.clearAlternatives()
      this.selectedDate = date
      this.loading = true
      this.errorCode = null
      this.errorMessage = null

      try {
        const recommendation = await getDailyRecommendation(
          this.requireToken(),
          date,
        )

        if (requestSequence !== this.requestSequence) {
          return null
        }

        this.recommendation = recommendation
        return recommendation
      } catch (error) {
        if (requestSequence !== this.requestSequence) {
          return null
        }

        this.recommendation = null
        this.errorCode =
          error instanceof ApiError ? error.code : 'UNKNOWN_ERROR'
        this.errorMessage = userFacingApiError(
          error,
          'Rekomendasi belum dapat dimuat. Silakan coba kembali.',
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

    async fetchWeekly(
      startDate = localDateKey(),
    ): Promise<WeeklyRecommendationPlan | null> {
      const requestSequence = ++this.weeklyRequestSequence
      this.weeklyLoading = true
      this.weeklyErrorMessage = null

      try {
        const plan = await getWeeklyRecommendations(
          this.requireToken(),
          startDate,
        )

        if (requestSequence !== this.weeklyRequestSequence) {
          return null
        }

        this.weeklyPlan = plan
        return plan
      } catch (error) {
        if (requestSequence !== this.weeklyRequestSequence) {
          return null
        }

        this.weeklyPlan = null
        this.weeklyErrorMessage = userFacingApiError(
          error,
          'Rencana tujuh hari belum dapat dimuat. Silakan coba kembali.',
        )

        if (error instanceof ApiError && error.status === 401) {
          await useAuthStore().logout()
        }

        return null
      } finally {
        if (requestSequence === this.weeklyRequestSequence) {
          this.weeklyLoading = false
        }
      }
    },

    async fetchAlternatives(
      mealType: RecommendationMealType,
      currentMenuId: string,
      limit = 3,
    ): Promise<RecommendationAlternativeSearch | null> {
      const recommendation = this.recommendation

      if (!recommendation) {
        this.replacementErrorCode = 'RECOMMENDATION_NOT_LOADED'
        this.replacementErrorMessage =
          'Rekomendasi harian perlu dimuat sebelum mencari pengganti.'
        return null
      }

      const requestSequence = ++this.replacementRequestSequence
      this.replacementLoading = true
      this.replacementLoadingMore = false
      this.replacementErrorCode = null
      this.replacementErrorMessage = null
      this.replacementMoreMessage = null
      this.replacementHasMore = false
      this.replacementSearch = null
      this.replacementSeenMenuIds = []
      this.replacementInterpretation = null

      try {
        const weeklyMenuIds =
          this.weeklyPlan?.days.some(
            (day) => day.date === recommendation.date,
          )
            ? this.weeklyPlan.days.flatMap((day) =>
                day.items.map((item) => item.menu.id),
              )
            : []
        const replacement = await getRecommendationAlternatives({
          token: this.requireToken(),
          date: recommendation.date,
          mealType,
          currentMenuId,
          excludedMenuIds: [
            ...new Set([
              ...recommendation.items.map((item) => item.menu.id),
              ...weeklyMenuIds,
            ]),
          ],
          limit,
        })

        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        this.replacementSearch = replacement
        this.replacementSeenMenuIds = replacement.alternatives.map(
          (item) => item.menu.id,
        )
        this.replacementHasMore = replacement.hasMore
        if (!replacement.hasMore) {
          this.replacementMoreMessage =
            'Semua pilihan menu yang aman sudah ditampilkan.'
        }
        return replacement
      } catch (error) {
        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        this.replacementErrorCode =
          error instanceof ApiError ? error.code : 'UNKNOWN_ERROR'
        this.replacementErrorMessage = userFacingApiError(
          error,
          'Alternatif menu belum dapat dimuat. Silakan coba kembali.',
        )

        if (error instanceof ApiError && error.status === 401) {
          await useAuthStore().logout()
        }

        return null
      } finally {
        if (requestSequence === this.replacementRequestSequence) {
          this.replacementLoading = false
        }
      }
    },

    async fetchConversationalAlternatives(
      mealType: RecommendationMealType,
      currentMenuId: string,
      message: string,
      limit = 3,
    ): Promise<RecommendationAlternativeSearch | null> {
      const recommendation = this.recommendation

      if (!recommendation) {
        this.replacementErrorCode = 'RECOMMENDATION_NOT_LOADED'
        this.replacementErrorMessage =
          'Rekomendasi harian perlu dimuat sebelum mencari pengganti.'
        return null
      }

      const requestSequence = ++this.replacementRequestSequence
      this.replacementLoading = true
      this.replacementLoadingMore = false
      this.replacementErrorCode = null
      this.replacementErrorMessage = null
      this.replacementMoreMessage = null
      this.replacementHasMore = false
      this.replacementSearch = null
      this.replacementSeenMenuIds = []
      this.replacementInterpretation = null

      try {
        const weeklyMenuIds =
          this.weeklyPlan?.days.some(
            (day) => day.date === recommendation.date,
          )
            ? this.weeklyPlan.days.flatMap((day) =>
                day.items.map((item) => item.menu.id),
              )
            : []
        const result =
          await getConversationalRecommendationAlternatives({
            token: this.requireToken(),
            date: recommendation.date,
            mealType,
            currentMenuId,
            excludedMenuIds: [
              ...new Set([
                ...recommendation.items.map((item) => item.menu.id),
                ...weeklyMenuIds,
              ]),
            ],
            limit,
            message,
          })

        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        this.replacementInterpretation = result.interpretation
        this.replacementSearch = result.replacement
        this.replacementSeenMenuIds =
          result.replacement.alternatives.map(
            (item) => item.menu.id,
          )
        this.replacementHasMore = result.replacement.hasMore

        if (!result.replacement.hasMore) {
          this.replacementMoreMessage =
            'Semua pilihan yang sesuai permintaan sudah ditampilkan.'
        }

        return result.replacement
      } catch (error) {
        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        this.replacementErrorCode =
          error instanceof ApiError ? error.code : 'UNKNOWN_ERROR'
        this.replacementErrorMessage = userFacingApiError(
          error,
          'Permintaan penggantian belum dapat dipahami. Silakan coba kembali.',
        )

        if (error instanceof ApiError && error.status === 401) {
          await useAuthStore().logout()
        }

        return null
      } finally {
        if (requestSequence === this.replacementRequestSequence) {
          this.replacementLoading = false
        }
      }
    },

    async fetchMoreAlternatives(): Promise<RecommendationAlternativeSearch | null> {
      const recommendation = this.recommendation
      const currentSearch = this.replacementSearch

      if (
        !recommendation ||
        !currentSearch ||
        !this.replacementHasMore ||
        this.replacementLoadingMore
      ) {
        return currentSearch
      }

      const requestSequence = ++this.replacementRequestSequence
      this.replacementLoadingMore = true
      this.replacementMoreMessage = null

      try {
        const weeklyMenuIds =
          this.weeklyPlan?.days.some(
            (day) => day.date === recommendation.date,
          )
            ? this.weeklyPlan.days.flatMap((day) =>
                day.items.map((item) => item.menu.id),
              )
            : []
        const excludedMenuIds = [
          ...recommendation.items.map((item) => item.menu.id),
          ...weeklyMenuIds,
          ...this.replacementSeenMenuIds,
        ]
        const replacement = await getRecommendationAlternatives({
          token: this.requireToken(),
          date: recommendation.date,
          mealType: currentSearch.mealType,
          currentMenuId: currentSearch.currentMenuId,
          excludedMenuIds: [...new Set(excludedMenuIds)],
          limit: currentSearch.limit,
          ...(currentSearch.appliedConversationFilters
            ? {
                conversationFilters:
                  currentSearch.appliedConversationFilters,
              }
            : {}),
        })

        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        this.replacementSearch = replacement
        this.replacementSeenMenuIds = [
          ...this.replacementSeenMenuIds,
          ...replacement.alternatives.map((item) => item.menu.id),
        ]
        this.replacementHasMore = replacement.hasMore

        if (!replacement.hasMore) {
          this.replacementMoreMessage =
            'Ini adalah batch terakhir dari pilihan menu yang aman.'
        }

        return replacement
      } catch (error) {
        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        if (
          error instanceof ApiError &&
          error.code === 'NO_SAFE_ALTERNATIVE'
        ) {
          this.replacementHasMore = false
          this.replacementMoreMessage =
            'Semua pilihan menu yang aman sudah ditampilkan.'
          return currentSearch
        }

        this.replacementMoreMessage = userFacingApiError(
          error,
          'Pilihan berikutnya belum dapat dimuat. Silakan coba kembali.',
        )

        if (error instanceof ApiError && error.status === 401) {
          await useAuthStore().logout()
        }

        return currentSearch
      } finally {
        if (requestSequence === this.replacementRequestSequence) {
          this.replacementLoadingMore = false
        }
      }
    },

    async applyAlternative(
      mealType: RecommendationMealType,
      alternative: DailyRecommendationItem,
    ): Promise<DailyRecommendationResult | null> {
      const recommendation = this.recommendation
      const currentSearch = this.replacementSearch
      const currentItem = recommendation?.items.find(
        (item) => item.mealType === mealType,
      )

      if (
        !recommendation ||
        !currentItem ||
        alternative.mealType !== mealType
      ) {
        return null
      }

      const requestSequence = ++this.replacementRequestSequence
      this.replacementSaving = true
      this.replacementErrorCode = null
      this.replacementErrorMessage = null

      try {
        const weeklyMenuIds =
          this.weeklyPlan?.days.some(
            (day) => day.date === recommendation.date,
          )
            ? this.weeklyPlan.days.flatMap((day) =>
                day.items.map((item) => item.menu.id),
              )
            : []
        const updated = await replaceRecommendationItem({
          token: this.requireToken(),
          date: recommendation.date,
          mealType,
          currentMenuId: currentItem.menu.id,
          replacementMenuId: alternative.menu.id,
          ...(currentSearch?.appliedConversationFilters
            ? {
                conversationFilters:
                  currentSearch.appliedConversationFilters,
              }
            : {}),
          ...(weeklyMenuIds.length > 0
            ? { excludedMenuIds: [...new Set(weeklyMenuIds)] }
            : {}),
        })

        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        this.recommendation = updated
        this.clearAlternatives()
        return updated
      } catch (error) {
        if (requestSequence !== this.replacementRequestSequence) {
          return null
        }

        this.replacementErrorCode =
          error instanceof ApiError ? error.code : 'UNKNOWN_ERROR'
        this.replacementErrorMessage = userFacingApiError(
          error,
          'Menu pengganti belum dapat disimpan. Silakan coba kembali.',
        )

        if (error instanceof ApiError && error.status === 401) {
          await useAuthStore().logout()
        }

        return null
      } finally {
        if (requestSequence === this.replacementRequestSequence) {
          this.replacementSaving = false
        }
      }
    },

    clearAlternatives() {
      this.replacementRequestSequence += 1
      this.replacementErrorCode = null
      this.replacementErrorMessage = null
      this.replacementHasMore = false
      this.replacementInterpretation = null
      this.replacementLoading = false
      this.replacementLoadingMore = false
      this.replacementMoreMessage = null
      this.replacementSaving = false
      this.replacementSearch = null
      this.replacementSeenMenuIds = []
    },

    reset() {
      this.requestSequence += 1
      this.clearAlternatives()
      this.errorCode = null
      this.errorMessage = null
      this.loading = false
      this.recommendation = null
      this.selectedDate = localDateKey()
      this.weeklyErrorMessage = null
      this.weeklyLoading = false
      this.weeklyPlan = null
      this.weeklyRequestSequence += 1
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
  },
})
