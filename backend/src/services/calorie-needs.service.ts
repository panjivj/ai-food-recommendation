import type {
  CalorieNeeds,
  MealCalorieTarget,
  MealTargetName,
} from '../domain/calorie-needs.js'
import type {
  ActivityLevel,
  Gender,
  Goal,
  UserProfile,
} from '../domain/profile.js'
import { AppError } from '../errors/app-error.js'
import type { ProfileService } from './profile.service.js'

const supportedAgeRange = {
  minimum: 19,
  maximum: 78,
} as const

const activityFactors: Record<ActivityLevel, number> = {
  low: 1.4,
  moderate: 1.6,
  high: 1.8,
}

const requestedGoalAdjustments: Record<Goal, number> = {
  maintain: 0,
  weight_loss: -500,
  weight_gain: 300,
}

const minimumWeightLossTargetCalories = 1_200

const mealPercentages: Record<MealTargetName, number> = {
  breakfast: 25,
  lunch: 35,
  dinner: 30,
  snack: 10,
}

const references = [
  {
    title:
      'Mifflin et al. — A new predictive equation for resting energy expenditure',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
  },
  {
    title: 'NIDDK — Body Weight Planner',
    url: 'https://www.niddk.nih.gov/bwp',
  },
  {
    title: 'CDC — Steps for Losing Weight',
    url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/',
  },
  {
    title: 'NHLBI — Clinical Guidelines on Overweight and Obesity',
    url: 'https://www.nhlbi.nih.gov/files/docs/guidelines/ob_gdlns.pdf',
  },
  {
    title: 'NIDDK — Your Game Plan to Prevent Type 2 Diabetes',
    url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-type-2-diabetes/game-plan',
  },
  {
    title: 'NHS — Healthy Ways to Gain Weight',
    url: 'https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/',
  },
] as const

function roundCalories(value: number): number {
  return Math.round(value)
}

function roundBodyMassIndex(value: number): number {
  return Math.round(value * 10) / 10
}

function sexConstant(gender: Gender): number {
  return gender === 'male' ? 5 : -161
}

function bmrEquation(gender: Gender): string {
  return gender === 'male'
    ? '10 × weightKg + 6.25 × heightCm - 5 × age + 5'
    : '10 × weightKg + 6.25 × heightCm - 5 × age - 161'
}

function goalPolicy(goal: Goal): string {
  switch (goal) {
    case 'maintain':
      return 'No calorie adjustment is applied to estimated TDEE.'
    case 'weight_loss':
      return 'Request a 500 kcal/day deficit without forcing the target below 1,200 kcal/day or below a feasible deficit.'
    case 'weight_gain':
      return 'Add 300 kcal/day to estimated TDEE for gradual weight gain.'
  }
}

function distributeCalories(
  dailyTargetCalories: number,
): Record<MealTargetName, MealCalorieTarget> {
  const breakfast = roundCalories(
    dailyTargetCalories * (mealPercentages.breakfast / 100),
  )
  const lunch = roundCalories(
    dailyTargetCalories * (mealPercentages.lunch / 100),
  )
  const dinner = roundCalories(
    dailyTargetCalories * (mealPercentages.dinner / 100),
  )
  const snack = dailyTargetCalories - breakfast - lunch - dinner

  return {
    breakfast: {
      percentage: mealPercentages.breakfast,
      calories: breakfast,
    },
    lunch: {
      percentage: mealPercentages.lunch,
      calories: lunch,
    },
    dinner: {
      percentage: mealPercentages.dinner,
      calories: dinner,
    },
    snack: {
      percentage: mealPercentages.snack,
      calories: snack,
    },
  }
}

function calculateDailyTarget(
  tdeeCalories: number,
  goal: Goal,
): {
  appliedAdjustment: number
  dailyTarget: number
  requestedAdjustment: number
} {
  const requestedAdjustment = requestedGoalAdjustments[goal]

  if (goal !== 'weight_loss') {
    const dailyTarget = roundCalories(tdeeCalories + requestedAdjustment)
    return {
      dailyTarget,
      requestedAdjustment,
      appliedAdjustment: dailyTarget - tdeeCalories,
    }
  }

  const requestedTarget = tdeeCalories + requestedAdjustment
  const safeTarget = Math.min(
    tdeeCalories,
    Math.max(minimumWeightLossTargetCalories, requestedTarget),
  )
  const dailyTarget = roundCalories(safeTarget)

  return {
    dailyTarget,
    requestedAdjustment,
    appliedAdjustment: dailyTarget - tdeeCalories,
  }
}

export function calculateCalorieNeeds(
  profile: UserProfile,
  calculatedAt = new Date(),
): CalorieNeeds {
  if (
    profile.age < supportedAgeRange.minimum ||
    profile.age > supportedAgeRange.maximum
  ) {
    throw new AppError(
      422,
      'CALORIE_CALCULATION_UNSUPPORTED',
      `Mifflin-St Jeor calculation is limited to ages ${supportedAgeRange.minimum}-${supportedAgeRange.maximum}`,
    )
  }

  const rawBmr =
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    sexConstant(profile.gender)
  const bmrCalories = roundCalories(rawBmr)
  const activityFactor = activityFactors[profile.activityLevel]
  const tdeeCalories = roundCalories(rawBmr * activityFactor)
  const target = calculateDailyTarget(tdeeCalories, profile.goal)
  const warnings = [
    'This estimate does not account for pregnancy, breastfeeding, medication, illness, or measured body composition.',
  ]

  if (
    profile.goal === 'weight_loss' &&
    target.appliedAdjustment > target.requestedAdjustment
  ) {
    warnings.push(
      'The requested 500 kcal deficit was reduced because the estimated expenditure is too close to the 1,200 kcal safety floor.',
    )
  }

  if (profile.healthConditions.length > 0) {
    warnings.push(
      'Health conditions stored in the profile do not automatically modify this formula; consult a qualified health professional.',
    )
  }

  const heightM = profile.heightCm / 100

  return {
    input: {
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      bodyMassIndex: roundBodyMassIndex(
        profile.weightKg / (heightM * heightM),
      ),
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      profileUpdatedAt: profile.updatedAt,
    },
    method: {
      name: 'mifflin_st_jeor',
      version: 'v1',
      bmrEquation: bmrEquation(profile.gender),
      activityFactor,
      activityPolicy:
        'Internal mapping within the NIDDK PAL range: low 1.4, moderate 1.6, high 1.8.',
      goalPolicy: goalPolicy(profile.goal),
      mealDistributionPolicy:
        'Internal application policy: breakfast 25%, lunch 35%, dinner 30%, snack 10%.',
      roundingPolicy:
        'TDEE uses unrounded BMR; displayed daily calories are rounded to whole kcal, and meal rounding remainder is assigned to snack.',
    },
    bmrCalories,
    tdeeCalories,
    goalAdjustment: {
      requestedCalories: target.requestedAdjustment,
      appliedCalories: target.appliedAdjustment,
      minimumWeightLossTargetCalories:
        profile.goal === 'weight_loss'
          ? minimumWeightLossTargetCalories
          : null,
    },
    dailyTargetCalories: target.dailyTarget,
    mealTargets: distributeCalories(target.dailyTarget),
    warnings,
    disclaimer:
      'Educational estimate only; it is not a diagnosis or an individualized clinical nutrition prescription.',
    references: [...references],
    calculatedAt: calculatedAt.toISOString(),
  }
}

export class CalorieNeedsService {
  constructor(private readonly profiles: ProfileService) {}

  get(userId: string): CalorieNeeds {
    return calculateCalorieNeeds(this.profiles.get(userId))
  }
}
