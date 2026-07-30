import { describe, expect, it } from 'vitest'

import type {
  DailyRecommendation,
  DailyRecommendationItem,
  RecommendationCandidate,
  RecommendationMenu,
} from '../domain/recommendation.js'
import { findRecommendationAlternatives } from './recommendation.service.js'

function menu(
  id: string,
  ingredientNames: string[],
): RecommendationMenu {
  return {
    id,
    slug: id,
    name: ingredientNames.join(', '),
    description: 'Menu pengujian keragaman bahan.',
    mealType: 'breakfast',
    servingSizeG: 300,
    servingDescription: '1 porsi',
    nutrition: {
      energyKcal: 500,
      proteinG: 15,
      fatG: 10,
      carbohydrateG: 75,
      fiberG: 7,
      sodiumMg: 150,
    },
    tags: ['sarapan'],
    allergens: [],
    ingredientNames,
  }
}

function item(recommendationMenu: RecommendationMenu): DailyRecommendationItem {
  return {
    mealType: 'breakfast',
    targetCalories: 500,
    menu: recommendationMenu,
    score: {
      total: 75,
      breakdown: {
        calorieFit: 75,
        preferenceMatch: 0,
        dailyRotation: 0,
      },
      calorieDifference: 0,
      calorieDifferencePercent: 0,
      matchedPreferences: [],
    },
    reasons: [],
  }
}

const emptyFilterStats = {
  candidateCount: 0,
  eligibleCount: 0,
  excludedByAllergy: 0,
  excludedByConversation: 0,
  excludedByDislikedFood: 0,
  excludedByFeedback: 0,
  excludedBySameDayMenu: 0,
}

const dailyRecommendation: DailyRecommendation = {
  id: 'daily-1',
  date: '2026-07-28',
  dailyTargetCalories: 2_000,
  totalRecommendedCalories: 500,
  differenceFromDailyTargetCalories: -1_500,
  items: [item(menu('current-menu', ['Oat', 'Susu', 'Pisang']))],
  filterStats: {
    breakfast: emptyFilterStats,
    lunch: emptyFilterStats,
    dinner: emptyFilterStats,
    snack: emptyFilterStats,
  },
  appliedProfileRules: {
    allergies: [],
    dislikedFoods: [],
    foodPreferences: [],
    resolvedAllergens: [],
    unresolvedAllergies: [],
  },
  appliedFeedbackRules: {
    likedMenuIds: [],
    dislikedMenuIds: [],
    consumedMenuIds: [],
  },
  strategy: {
    version: 'rule-based-v1',
    calorieFitWeight: 75,
    preferenceWeight: 20,
    dailyRotationWeight: 5,
    deterministic: true,
  },
  warnings: [],
  generatedAt: '2026-07-28T00:00:00.000Z',
}

const candidates: RecommendationCandidate[] = [
  {
    menu: menu('talas-pisang', [
      'Talas Belitung',
      'Kacang Merah',
      'Pisang',
    ]),
  },
  {
    menu: menu('talas-mangga', [
      'Talas Belitung',
      'Kacang Merah',
      'Mangga',
    ]),
  },
  {
    menu: menu('ubi-tahu', ['Ubi Cilembu', 'Tahu', 'Melon']),
  },
  {
    menu: menu('jagung-telur', ['Jagung', 'Telur', 'Jeruk']),
  },
]

describe('recommendation alternative diversity', () => {
  it('prioritizes different primary ingredient pairs across batches', () => {
    const profile = {
      userId: 'user-1',
      allergies: [],
      dislikedFoods: [],
      foodPreferences: [],
      dislikedMenuIds: [],
    }
    const firstBatch = findRecommendationAlternatives(
      profile.userId,
      profile,
      candidates,
      dailyRecommendation,
      'breakfast',
      'current-menu',
      [],
      3,
    )
    const primaryPairs = firstBatch.alternatives.map((alternative) =>
      alternative.menu.ingredientNames.slice(0, 2).join('|'),
    )

    expect(firstBatch.alternatives).toHaveLength(3)
    expect(new Set(primaryPairs)).toHaveLength(3)
    expect(firstBatch.hasMore).toBe(true)

    const secondBatch = findRecommendationAlternatives(
      profile.userId,
      profile,
      candidates,
      dailyRecommendation,
      'breakfast',
      'current-menu',
      firstBatch.alternatives.map((alternative) => alternative.menu.id),
      3,
    )

    expect(secondBatch.alternatives).toHaveLength(1)
    expect(secondBatch.hasMore).toBe(false)
    expect(
      secondBatch.alternatives[0]?.menu.ingredientNames.slice(0, 2),
    ).toEqual(['Talas Belitung', 'Kacang Merah'])
  })

  it('applies conversational exclusions and temporary preferences', () => {
    const profile = {
      userId: 'user-1',
      allergies: [],
      dislikedFoods: [],
      foodPreferences: [],
      dislikedMenuIds: [],
    }
    const filters = {
      mealType: 'breakfast' as const,
      excludedIngredients: ['Talas'],
      preferredIngredients: ['Buah'],
    }
    const result = findRecommendationAlternatives(
      profile.userId,
      profile,
      candidates,
      dailyRecommendation,
      'breakfast',
      'current-menu',
      [],
      3,
      filters,
    )

    expect(result.appliedConversationFilters).toEqual(filters)
    expect(result.filterStats.excludedByConversation).toBe(2)
    expect(
      result.alternatives.every(
        (alternative) =>
          !alternative.menu.ingredientNames.some((ingredient) =>
            ingredient.includes('Talas'),
          ),
      ),
    ).toBe(true)
    expect(
      result.alternatives.every((alternative) =>
        alternative.score.matchedPreferences.includes('Buah'),
      ),
    ).toBe(true)
    expect(
      result.alternatives.every((alternative) =>
        alternative.reasons.some(
          (reason) => reason.code === 'CONVERSATION_FILTERS',
        ),
      ),
    ).toBe(true)
  })
})
