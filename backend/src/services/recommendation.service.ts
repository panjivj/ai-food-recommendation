import { createHash } from 'node:crypto'

import type {
  MealTargetName,
} from '../domain/calorie-needs.js'
import type {
  UserProfile,
} from '../domain/profile.js'
import type {
  RecommendationFeedbackRules,
} from '../domain/feedback.js'
import type {
  DailyRecommendation,
  DailyRecommendationItem,
  RecommendationAlternativeSearch,
  RecommendationCandidate,
  RecommendationFilterStats,
  RecommendationHistoryResult,
  RecommendationReason,
  RecommendationScore,
  ReplacementConversationFilters,
  WeeklyRecommendationPlan,
} from '../domain/recommendation.js'
import { AppError } from '../errors/app-error.js'
import type {
  RecommendationRepository,
} from '../repositories/recommendation.repository.js'
import { calculateCalorieNeeds } from './calorie-needs.service.js'
import type { ProfileService } from './profile.service.js'
import type { FeedbackService } from './feedback.service.js'

type KnownAllergen =
  | 'egg'
  | 'fish'
  | 'milk'
  | 'peanut'
  | 'shellfish'
  | 'soy'
  | 'tree_nut'
  | 'wheat'

interface MatchableProfileTerm {
  matchTerms: string[]
  original: string
}

interface ScoredCandidate {
  candidate: RecommendationCandidate
  score: RecommendationScore
}

interface FilteredCandidates {
  candidates: RecommendationCandidate[]
  stats: RecommendationFilterStats
}

interface RecommendationRuleProfile {
  allergies: readonly string[]
  dislikedMenuIds: readonly string[]
  dislikedFoods: readonly string[]
  foodPreferences: readonly string[]
  userId: string
}

const mealOrder: readonly MealTargetName[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
]

const scoringWeights = {
  calorieFit: 75,
  preferenceMatch: 20,
  dailyRotation: 5,
} as const

const allergenAliases: Record<KnownAllergen, readonly string[]> = {
  egg: ['egg', 'telur'],
  fish: ['fish', 'ikan'],
  milk: ['milk', 'susu', 'dairy', 'laktosa'],
  peanut: ['peanut', 'kacang tanah'],
  shellfish: [
    'shellfish',
    'kerang',
    'udang',
    'kepiting',
    'rajungan',
    'lobster',
    'cumi',
    'cumi cumi',
  ],
  soy: ['soy', 'soya', 'kedelai', 'tahu', 'tempe'],
  tree_nut: [
    'tree nut',
    'kacang pohon',
    'almond',
    'mete',
    'kenari',
  ],
  wheat: ['wheat', 'gandum', 'terigu', 'gluten'],
}

const ignoredTermWords = new Set([
  'alergi',
  'dan',
  'dengan',
  'makanan',
  'masakan',
  'menu',
  'pada',
  'pilihan',
  'suka',
  'terhadap',
  'tidak',
  'yang',
])

const fruitTerms = [
  'alpukat',
  'anggur',
  'apel',
  'belimbing',
  'cempedak',
  'duku',
  'durian',
  'jambu',
  'jeruk',
  'kedondong',
  'mangga',
  'manggis',
  'melon',
  'nanas',
  'nangka',
  'pepaya',
  'pisang',
  'rambutan',
  'salak',
  'sawo',
  'semangka',
  'sirsak',
] as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function roundCalories(value: number): number {
  return Math.round(value * 10) / 10
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function containsTerm(haystack: string, term: string): boolean {
  if (term.length < 2) {
    return false
  }

  return ` ${haystack} `.includes(` ${term} `)
}

function toMatchableTerms(
  values: readonly string[],
  includeIndividualWords = false,
): MatchableProfileTerm[] {
  return values.map((original) => {
    const normalized = normalizeText(original)
    const meaningfulWords = normalized
      .split(' ')
      .filter((word) => word.length >= 2 && !ignoredTermWords.has(word))
    const matchTerms = new Set<string>()

    if (normalized.length >= 2) {
      matchTerms.add(normalized)
    }

    if (meaningfulWords.length > 0) {
      matchTerms.add(meaningfulWords.join(' '))
    }

    if (includeIndividualWords) {
      for (const word of meaningfulWords) {
        if (word.length >= 3) {
          matchTerms.add(word)
        }
      }
    }

    return {
      original,
      matchTerms: [...matchTerms],
    }
  })
}

function toConversationTerms(
  values: readonly string[],
  includeIndividualWords = false,
): MatchableProfileTerm[] {
  return toMatchableTerms(values, includeIndividualWords).map((term) => {
    const normalized = normalizeText(term.original)

    if (normalized !== 'buah' && normalized !== 'fruit') {
      return term
    }

    return {
      ...term,
      matchTerms: [...new Set([...term.matchTerms, ...fruitTerms])],
    }
  })
}

function searchableText(candidate: RecommendationCandidate): string {
  return normalizeText(
    [
      candidate.menu.name,
      ...candidate.menu.tags,
      ...candidate.menu.ingredientNames,
    ].join(' '),
  )
}

function termMatches(
  searchable: string,
  profileTerm: MatchableProfileTerm,
): boolean {
  return profileTerm.matchTerms.some((term) =>
    containsTerm(searchable, term),
  )
}

function resolvedAllergens(
  allergies: readonly string[],
): {
  resolved: Set<KnownAllergen>
  unresolved: string[]
} {
  const resolved = new Set<KnownAllergen>()
  const unresolved: string[] = []

  for (const original of allergies) {
    const normalized = normalizeText(original)
    let matched = false

    for (const [allergen, aliases] of Object.entries(allergenAliases) as Array<
      [KnownAllergen, readonly string[]]
    >) {
      if (aliases.some((alias) => containsTerm(normalized, alias))) {
        resolved.add(allergen)
        matched = true
      }
    }

    if (!matched) {
      unresolved.push(original)
    }
  }

  return { resolved, unresolved }
}

function rotationScore(key: string): number {
  const hash = createHash('sha256').update(key).digest()
  const ratio = hash.readUInt32BE(0) / 0xffffffff
  return roundScore(ratio * scoringWeights.dailyRotation)
}

export function scoreRecommendationCandidate(
  candidate: RecommendationCandidate,
  targetCalories: number,
  preferences: readonly MatchableProfileTerm[],
  rotationKey: string,
): RecommendationScore {
  const calorieDifference = Math.abs(
    candidate.menu.nutrition.energyKcal - targetCalories,
  )
  const calorieDifferencePercent =
    targetCalories === 0 ? 100 : (calorieDifference / targetCalories) * 100
  const calorieFit = roundScore(
    scoringWeights.calorieFit *
      Math.max(0, 1 - Math.min(calorieDifferencePercent, 100) / 100),
  )
  const searchable = searchableText(candidate)
  const matchedPreferences = preferences
    .filter((preference) => termMatches(searchable, preference))
    .map((preference) => preference.original)
  const preferenceMatch =
    preferences.length === 0
      ? 0
      : roundScore(
          scoringWeights.preferenceMatch *
            (matchedPreferences.length / preferences.length),
        )
  const dailyRotation = rotationScore(rotationKey)

  return {
    total: roundScore(calorieFit + preferenceMatch + dailyRotation),
    breakdown: {
      calorieFit,
      preferenceMatch,
      dailyRotation,
    },
    calorieDifference: roundCalories(calorieDifference),
    calorieDifferencePercent: roundScore(calorieDifferencePercent),
    matchedPreferences,
  }
}

function buildReasons(
  item: ScoredCandidate,
  targetCalories: number,
): RecommendationReason[] {
  const { menu } = item.candidate
  const { score } = item
  const reasons: RecommendationReason[] = [
    {
      code: 'CALORIE_FIT',
      message:
        `${menu.nutrition.energyKcal.toFixed(1)} kkal; selisih ` +
        `${score.calorieDifference.toFixed(1)} kkal ` +
        `(${score.calorieDifferencePercent.toFixed(2)}%) dari target ` +
        `${targetCalories} kkal.`,
    },
  ]

  if (score.matchedPreferences.length > 0) {
    reasons.push({
      code: 'PREFERENCE_MATCH',
      message:
        'Cocok dengan preferensi: ' +
        score.matchedPreferences.join(', ') +
        '.',
    })
  } else {
    reasons.push({
      code: 'NO_PREFERENCE_MATCH',
      message:
        'Tidak ada kecocokan preferensi tekstual; pemilihan mengutamakan kalori dan keamanan.',
    })
  }

  reasons.push(
    {
      code: 'DAILY_ROTATION',
      message:
        'Skor rotasi harian deterministik digunakan untuk variasi pada kandidat dengan kualitas serupa.',
    },
    {
      code: 'SAFETY_FILTERS',
      message:
        'Menu lolos filter alergi, makanan tidak disukai dari profil dan feedback, serta duplikasi menu pada tanggal ini.',
    },
  )

  return reasons
}

function recommendationId(
  userId: string,
  date: string,
  profileUpdatedAt: string,
): string {
  return createHash('sha256')
    .update(`rule-based-v1|${userId}|${date}|${profileUpdatedAt}`)
    .digest('hex')
    .slice(0, 24)
}

function slotCandidates(
  candidates: readonly RecommendationCandidate[],
  mealType: MealTargetName,
): RecommendationCandidate[] {
  return candidates.filter(
    (candidate) =>
      candidate.menu.mealType === mealType ||
      candidate.menu.mealType === 'all_day',
  )
}

function filterCandidates(
  candidates: readonly RecommendationCandidate[],
  mealType: MealTargetName,
  resolved: Set<KnownAllergen>,
  allergyTerms: readonly MatchableProfileTerm[],
  dislikedTerms: readonly MatchableProfileTerm[],
  dislikedMenuIds: ReadonlySet<string>,
  excludedMenuIds: ReadonlySet<string>,
  conversationExcludedTerms: readonly MatchableProfileTerm[] = [],
): FilteredCandidates {
  const available = slotCandidates(candidates, mealType)
  const stats: RecommendationFilterStats = {
    candidateCount: available.length,
    excludedByAllergy: 0,
    excludedByConversation: 0,
    excludedByDislikedFood: 0,
    excludedByFeedback: 0,
    excludedBySameDayMenu: 0,
    eligibleCount: 0,
  }
  const eligible: RecommendationCandidate[] = []

  for (const candidate of available) {
    const searchable = searchableText(candidate)
    const hasKnownAllergen = candidate.menu.allergens.some((allergen) =>
      resolved.has(allergen as KnownAllergen),
    )
    const hasAllergyTerm = allergyTerms.some((term) =>
      termMatches(searchable, term),
    )

    if (hasKnownAllergen || hasAllergyTerm) {
      stats.excludedByAllergy += 1
      continue
    }

    if (dislikedTerms.some((term) => termMatches(searchable, term))) {
      stats.excludedByDislikedFood += 1
      continue
    }

    if (dislikedMenuIds.has(candidate.menu.id)) {
      stats.excludedByFeedback += 1
      continue
    }

    if (
      conversationExcludedTerms.some((term) =>
        termMatches(searchable, term),
      )
    ) {
      stats.excludedByConversation += 1
      continue
    }

    if (excludedMenuIds.has(candidate.menu.id)) {
      stats.excludedBySameDayMenu += 1
      continue
    }

    eligible.push(candidate)
  }

  stats.eligibleCount = eligible.length

  return {
    candidates: eligible,
    stats,
  }
}

function rankCandidates(
  candidates: readonly RecommendationCandidate[],
  targetCalories: number,
  preferences: readonly MatchableProfileTerm[],
  rotationKey: (
    candidate: RecommendationCandidate,
  ) => string,
): ScoredCandidate[] {
  return candidates
    .map(
      (candidate): ScoredCandidate => ({
        candidate,
        score: scoreRecommendationCandidate(
          candidate,
          targetCalories,
          preferences,
          rotationKey(candidate),
        ),
      }),
    )
    .sort(compareScoredCandidates)
}

function compareScoredCandidates(
  left: ScoredCandidate,
  right: ScoredCandidate,
): number {
  return (
    right.score.total - left.score.total ||
    left.score.calorieDifference - right.score.calorieDifference ||
    left.candidate.menu.id.localeCompare(right.candidate.menu.id)
  )
}

function primaryIngredientKey(item: ScoredCandidate): string {
  const primaryIngredients = item.candidate.menu.ingredientNames
    .slice(0, 2)
    .map(normalizeText)
    .filter(Boolean)

  return (
    primaryIngredients.join('|') ||
    normalizeText(item.candidate.menu.name)
  )
}

function selectDiverseCandidates(
  ranked: readonly ScoredCandidate[],
  limit: number,
): ScoredCandidate[] {
  const selected: ScoredCandidate[] = []
  const selectedMenuIds = new Set<string>()
  const primaryIngredientKeys = new Set<string>()

  for (const item of ranked) {
    const ingredientKey = primaryIngredientKey(item)

    if (primaryIngredientKeys.has(ingredientKey)) {
      continue
    }

    selected.push(item)
    selectedMenuIds.add(item.candidate.menu.id)
    primaryIngredientKeys.add(ingredientKey)

    if (selected.length === limit) {
      return selected
    }
  }

  for (const item of ranked) {
    if (selectedMenuIds.has(item.candidate.menu.id)) {
      continue
    }

    selected.push(item)

    if (selected.length === limit) {
      break
    }
  }

  return selected.sort(compareScoredCandidates)
}

function selectForMeal(
  candidates: readonly RecommendationCandidate[],
  mealType: MealTargetName,
  targetCalories: number,
  profile: UserProfile,
  date: string,
  resolved: Set<KnownAllergen>,
  allergyTerms: readonly MatchableProfileTerm[],
  dislikedTerms: readonly MatchableProfileTerm[],
  dislikedMenuIds: ReadonlySet<string>,
  preferences: readonly MatchableProfileTerm[],
  usedMenuIds: Set<string>,
): {
  item: DailyRecommendationItem
  stats: RecommendationFilterStats
} {
  const filtered = filterCandidates(
    candidates,
    mealType,
    resolved,
    allergyTerms,
    dislikedTerms,
    dislikedMenuIds,
    usedMenuIds,
  )

  if (filtered.candidates.length === 0) {
    throw new AppError(
      422,
      'NO_SAFE_RECOMMENDATION',
      `No approved ${mealType} menu satisfies the current profile filters`,
    )
  }

  const scored = rankCandidates(
    filtered.candidates,
    targetCalories,
    preferences,
    (candidate) =>
      `${profile.userId}|${date}|${mealType}|${candidate.menu.id}`,
  )
  const selected = scored[0]

  if (!selected) {
    throw new Error('Eligible recommendation candidates could not be ranked')
  }

  usedMenuIds.add(selected.candidate.menu.id)

  return {
    item: {
      mealType,
      targetCalories,
      menu: selected.candidate.menu,
      score: selected.score,
      reasons: buildReasons(selected, targetCalories),
    },
    stats: filtered.stats,
  }
}

export function generateDailyRecommendation(
  userId: string,
  profile: UserProfile,
  candidates: readonly RecommendationCandidate[],
  date: string,
  generatedAt = new Date(),
  feedbackRules: RecommendationFeedbackRules = {
    likedMenuIds: [],
    dislikedMenuIds: [],
    consumedMenuIds: [],
  },
  additionalExcludedMenuIds: ReadonlySet<string> = new Set(),
): DailyRecommendation {
  const calorieNeeds = calculateCalorieNeeds(profile, generatedAt)
  const allergyResolution = resolvedAllergens(profile.allergies)
  const allergyTerms = toMatchableTerms(profile.allergies)
  const dislikedTerms = toMatchableTerms(profile.dislikedFoods)
  const preferences = toMatchableTerms(profile.foodPreferences, true)
  const dislikedMenuIds = new Set(feedbackRules.dislikedMenuIds)
  const usedMenuIds = new Set(additionalExcludedMenuIds)
  const items: DailyRecommendationItem[] = []
  const filterStats = {} as Record<
    MealTargetName,
    RecommendationFilterStats
  >

  for (const mealType of mealOrder) {
    const selection = selectForMeal(
      candidates,
      mealType,
      calorieNeeds.mealTargets[mealType].calories,
      profile,
      date,
      allergyResolution.resolved,
      allergyTerms,
      dislikedTerms,
      dislikedMenuIds,
      preferences,
      usedMenuIds,
    )

    items.push(selection.item)
    filterStats[mealType] = selection.stats
  }

  const totalRecommendedCalories = roundCalories(
    items.reduce(
      (total, item) => total + item.menu.nutrition.energyKcal,
      0,
    ),
  )
  const warnings = [
    'Recommendation v1 uses rule-based text matching and curated menu allergen labels; it is not a clinical safety guarantee.',
  ]

  if (allergyResolution.unresolved.length > 0) {
    warnings.push(
      'Some allergy terms have no canonical allergen mapping and were filtered only by menu and ingredient text.',
    )
  }

  if (
    feedbackRules.likedMenuIds.length > 0 ||
    feedbackRules.consumedMenuIds.length > 0
  ) {
    warnings.push(
      'Liked and consumed feedback is stored for a future scoring version and is not weighted by rule-based-v1.',
    )
  }

  return {
    id: recommendationId(userId, date, profile.updatedAt),
    date,
    dailyTargetCalories: calorieNeeds.dailyTargetCalories,
    totalRecommendedCalories,
    differenceFromDailyTargetCalories: roundCalories(
      totalRecommendedCalories - calorieNeeds.dailyTargetCalories,
    ),
    items,
    filterStats,
    appliedProfileRules: {
      allergies: [...profile.allergies],
      resolvedAllergens: [...allergyResolution.resolved].sort(),
      unresolvedAllergies: allergyResolution.unresolved,
      dislikedFoods: [...profile.dislikedFoods],
      foodPreferences: [...profile.foodPreferences],
    },
    appliedFeedbackRules: {
      likedMenuIds: [...feedbackRules.likedMenuIds].sort(),
      dislikedMenuIds: [...feedbackRules.dislikedMenuIds].sort(),
      consumedMenuIds: [...feedbackRules.consumedMenuIds].sort(),
    },
    strategy: {
      version: 'rule-based-v1',
      calorieFitWeight: scoringWeights.calorieFit,
      preferenceWeight: scoringWeights.preferenceMatch,
      dailyRotationWeight: scoringWeights.dailyRotation,
      deterministic: true,
    },
    warnings,
    generatedAt: generatedAt.toISOString(),
  }
}

function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function findRecommendationAlternatives(
  userId: string,
  profile: RecommendationRuleProfile,
  candidates: readonly RecommendationCandidate[],
  dailyRecommendation: DailyRecommendation,
  mealType: MealTargetName,
  currentMenuId: string,
  additionalExcludedMenuIds: readonly string[],
  limit: number,
  conversationFilters?: ReplacementConversationFilters,
): RecommendationAlternativeSearch {
  const currentItem = dailyRecommendation.items.find(
    (item) => item.mealType === mealType,
  )

  if (!currentItem || currentItem.menu.id !== currentMenuId) {
    throw new AppError(
      422,
      'INVALID_REPLACEMENT_MENU',
      'Current menu does not match the stored meal slot',
    )
  }

  const allergyResolution = resolvedAllergens(profile.allergies)
  const allergyTerms = toMatchableTerms(profile.allergies)
  const dislikedTerms = toMatchableTerms(profile.dislikedFoods)
  const dislikedMenuIds = new Set(profile.dislikedMenuIds)
  const conversationExcludedTerms = toConversationTerms(
    conversationFilters?.excludedIngredients ?? [],
  )
  const preferences = [
    ...toMatchableTerms(profile.foodPreferences, true),
    ...toConversationTerms(
      conversationFilters?.preferredIngredients ?? [],
      true,
    ),
  ]
  const excludedMenuIds = new Set([
    ...dailyRecommendation.items.map((item) => item.menu.id),
    currentMenuId,
    ...additionalExcludedMenuIds,
  ])
  const filtered = filterCandidates(
    candidates,
    mealType,
    allergyResolution.resolved,
    allergyTerms,
    dislikedTerms,
    dislikedMenuIds,
    excludedMenuIds,
    conversationExcludedTerms,
  )
  const targetCalories =
    dailyRecommendation.items.find((item) => item.mealType === mealType)
      ?.targetCalories

  if (targetCalories === undefined) {
    throw new Error('Daily recommendation is missing the selected meal slot')
  }

  const ranked = rankCandidates(
    filtered.candidates,
    targetCalories,
    preferences,
    (candidate) =>
      `${userId}|${dailyRecommendation.date}|${mealType}|${candidate.menu.id}`,
  )
  const selectedCandidates = selectDiverseCandidates(ranked, limit)
  const alternatives = selectedCandidates.map(
    (rankedCandidate): DailyRecommendationItem => ({
      mealType,
      targetCalories,
      menu: rankedCandidate.candidate.menu,
      score: rankedCandidate.score,
      reasons: [
        ...buildReasons(rankedCandidate, targetCalories),
        ...(conversationFilters
          ? [
              {
                code: 'CONVERSATION_FILTERS' as const,
                message:
                  'Filter sementara dari permintaan percakapan telah diterapkan.',
              },
            ]
          : []),
      ],
    }),
  )

  if (alternatives.length === 0) {
    throw new AppError(
      422,
      'NO_SAFE_ALTERNATIVE',
      `No safe alternative is available for the ${mealType} slot`,
    )
  }

  return {
    date: dailyRecommendation.date,
    mealType,
    currentMenuId,
    targetCalories,
    limit,
    excludedMenuIds: [...excludedMenuIds].sort(),
    alternatives,
    appliedConversationFilters: conversationFilters ?? null,
    hasMore: ranked.length > alternatives.length,
    filterStats: filtered.stats,
    appliedProfileRules: dailyRecommendation.appliedProfileRules,
    appliedFeedbackRules: dailyRecommendation.appliedFeedbackRules,
    strategy: dailyRecommendation.strategy,
    warnings: dailyRecommendation.warnings,
  }
}

export class RecommendationService {
  constructor(
    private readonly profiles: ProfileService,
    private readonly recommendations: RecommendationRepository,
    private readonly feedback: FeedbackService,
  ) {}

  getDaily(userId: string, date: string): DailyRecommendation {
    const stored = this.recommendations.findSnapshot(userId, date)

    if (stored) {
      return stored
    }

    const generated = generateDailyRecommendation(
      userId,
      this.profiles.get(userId),
      this.recommendations.findApprovedCandidates(),
      date,
      new Date(),
      this.feedback.getRecommendationRules(userId),
    )

    return this.recommendations.createSnapshot(userId, generated)
  }

  getWeekly(userId: string, startDate: string): WeeklyRecommendationPlan {
    const dates = Array.from(
      { length: 7 },
      (_, index) => addCalendarDays(startDate, index),
    )
    const storedByDate = new Map(
      dates.flatMap((date) => {
        const stored = this.recommendations.findSnapshot(userId, date)
        return stored ? [[date, stored] as const] : []
      }),
    )
    const reservedMenuIds = new Set(
      [...storedByDate.values()].flatMap((recommendation) =>
        recommendation.items.map((item) => item.menu.id),
      ),
    )
    const profile = this.profiles.get(userId)
    const candidates = this.recommendations.findApprovedCandidates()
    const feedbackRules = this.feedback.getRecommendationRules(userId)
    const generatedMenuIds = new Set<string>()
    const days: DailyRecommendation[] = []

    for (const date of dates) {
      const stored = storedByDate.get(date)

      if (stored) {
        days.push(stored)
        continue
      }

      const exclusions = new Set([
        ...reservedMenuIds,
        ...generatedMenuIds,
      ])
      const generated = generateDailyRecommendation(
        userId,
        profile,
        candidates,
        date,
        new Date(),
        feedbackRules,
        exclusions,
      )
      const snapshot = this.recommendations.createSnapshot(userId, generated)

      snapshot.items.forEach((item) => generatedMenuIds.add(item.menu.id))
      days.push(snapshot)
    }

    const allMenuIds = days.flatMap((recommendation) =>
      recommendation.items.map((item) => item.menu.id),
    )
    const uniqueMenuCount = new Set(allMenuIds).size
    const isFullyUnique = uniqueMenuCount === allMenuIds.length
    const warnings = isFullyUnique
      ? []
      : [
          'Beberapa snapshot yang telah tersimpan sebelum rencana mingguan dibuat memiliki menu yang sama. Snapshot lama dipertahankan.',
        ]

    return {
      startDate,
      endDate: dates[dates.length - 1] ?? startDate,
      days,
      totalMenus: allMenuIds.length,
      uniqueMenuCount,
      isFullyUnique,
      warnings,
    }
  }

  getAlternatives(
    userId: string,
    date: string,
    mealType: MealTargetName,
    currentMenuId: string,
    excludedMenuIds: readonly string[],
    limit: number,
    conversationFilters?: ReplacementConversationFilters,
  ): RecommendationAlternativeSearch {
    const candidates = this.recommendations.findApprovedCandidates()
    const dailyRecommendation = this.getDaily(userId, date)
    const profileRules: RecommendationRuleProfile = {
      userId,
      allergies: dailyRecommendation.appliedProfileRules.allergies,
      dislikedFoods:
        dailyRecommendation.appliedProfileRules.dislikedFoods,
      foodPreferences:
        dailyRecommendation.appliedProfileRules.foodPreferences,
      dislikedMenuIds:
        dailyRecommendation.appliedFeedbackRules.dislikedMenuIds,
    }

    return findRecommendationAlternatives(
      userId,
      profileRules,
      candidates,
      dailyRecommendation,
      mealType,
      currentMenuId,
      excludedMenuIds,
      limit,
      conversationFilters,
    )
  }

  replaceDailyItem(
    userId: string,
    date: string,
    mealType: MealTargetName,
    currentMenuId: string,
    replacementMenuId: string,
    additionalExcludedMenuIds: readonly string[] = [],
    conversationFilters?: ReplacementConversationFilters,
  ): DailyRecommendation {
    const dailyRecommendation = this.getDaily(userId, date)
    const currentItem = dailyRecommendation.items.find(
      (item) => item.mealType === mealType,
    )

    if (!currentItem || currentItem.menu.id !== currentMenuId) {
      throw new AppError(
        409,
        'RECOMMENDATION_ITEM_CHANGED',
        'The current recommendation item has already changed',
      )
    }

    const candidates = this.recommendations.findApprovedCandidates()
    const profileRules: RecommendationRuleProfile = {
      userId,
      allergies: dailyRecommendation.appliedProfileRules.allergies,
      dislikedFoods:
        dailyRecommendation.appliedProfileRules.dislikedFoods,
      foodPreferences:
        dailyRecommendation.appliedProfileRules.foodPreferences,
      dislikedMenuIds:
        dailyRecommendation.appliedFeedbackRules.dislikedMenuIds,
    }
    const search = findRecommendationAlternatives(
      userId,
      profileRules,
      candidates,
      dailyRecommendation,
      mealType,
      currentMenuId,
      additionalExcludedMenuIds,
      candidates.length,
      conversationFilters,
    )
    const replacement = search.alternatives.find(
      (item) => item.menu.id === replacementMenuId,
    )

    if (!replacement) {
      throw new AppError(
        422,
        'INVALID_REPLACEMENT_MENU',
        'Replacement menu does not satisfy the snapshot rules',
      )
    }

    const items = dailyRecommendation.items.map((item) =>
      item.mealType === mealType ? replacement : item,
    )
    const totalRecommendedCalories = roundCalories(
      items.reduce(
        (total, item) => total + item.menu.nutrition.energyKcal,
        0,
      ),
    )
    const updated: DailyRecommendation = {
      ...dailyRecommendation,
      items,
      totalRecommendedCalories,
      differenceFromDailyTargetCalories: roundCalories(
        totalRecommendedCalories -
          dailyRecommendation.dailyTargetCalories,
      ),
    }

    return this.recommendations.replaceSnapshotItem(
      userId,
      updated,
      replacement,
    )
  }

  listHistory(
    userId: string,
    page: number,
    limit: number,
  ): RecommendationHistoryResult {
    return this.recommendations.listHistory(userId, page, limit)
  }
}
