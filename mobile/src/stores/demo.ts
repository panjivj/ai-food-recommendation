import { defineStore } from 'pinia'
import { initialFeedback } from '@/mocks/feedback'
import { demoRecommendation } from '@/mocks/recommendations'
import { demoUser } from '@/mocks/user'
import type { FeedbackAction, MealType } from '@/types/domain'

export const useDemoStore = defineStore('demo', {
  state: () => ({
    user: { ...demoUser },
    recommendation: {
      ...demoRecommendation,
      menuIds: { ...demoRecommendation.menuIds },
      alternativeMenuIds: [...demoRecommendation.alternativeMenuIds],
    },
    feedback: { ...initialFeedback },
  }),
  actions: {
    setFeedback(menuId: string, action: FeedbackAction) {
      this.feedback[menuId] = this.feedback[menuId] === action ? null : action
    },
    replaceMenu(mealType: MealType, menuId: string) {
      this.recommendation.menuIds[mealType] = menuId
    },
    resetDemo() {
      this.$reset()
    },
  },
})
