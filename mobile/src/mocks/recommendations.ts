import type { DailyRecommendation } from '@/types/domain'

export const demoRecommendation: DailyRecommendation = {
  date: '2026-07-25',
  calorieTarget: 1900,
  menuIds: {
    breakfast: 'menu-oat-pisang',
    lunch: 'menu-nasi-ayam',
    dinner: 'menu-sup-ikan',
  },
  alternativeMenuIds: ['menu-gado-gado', 'menu-soto-ayam'],
}
