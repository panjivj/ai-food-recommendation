import {
  type Allergen,
  type ComponentRole,
  type MealType,
  type MenuComponentSeed,
  type MenuSeed,
} from './menu-seeder.js'

export interface FoodChoice {
  allergens?: Allergen[]
  code: string
  label: string
}

export interface BreakfastSpec {
  fruit: FoodChoice
  protein: FoodChoice
  proteinRole?: ComponentRole
  proteinWeight?: number
  staple: FoodChoice
  stapleWeight?: number
}

export interface MainSpec {
  fruit: FoodChoice
  protein: FoodChoice
  proteinWeight: number
  staple: FoodChoice
  vegetable: FoodChoice
}

export interface SnackSpec {
  first: FoodChoice
  firstRole: ComponentRole
  firstWeight: number
  second: FoodChoice
  secondRole: ComponentRole
  secondWeight: number
}

interface BatchDefinition {
  batchNumber: number
  breakfasts: readonly BreakfastSpec[]
  dinners: readonly MainSpec[]
  lunches: readonly MainSpec[]
  snacks: readonly SnackSpec[]
}

const component = (
  food: FoodChoice,
  amountG: number,
  role: ComponentRole,
): MenuComponentSeed => ({ amountG, role, tkpiCode: food.code })

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-|-$/g, '')

function allergensFrom(...choices: FoodChoice[]): Allergen[] {
  return choices.flatMap((choice) => choice.allergens ?? [])
}

function createMenu(
  batchNumber: number,
  number: number,
  name: string,
  mealType: MealType,
  components: MenuComponentSeed[],
  choices: FoodChoice[],
): MenuSeed {
  const batchLabel = batchNumber.toString().padStart(2, '0')
  const mealTag: Record<MealType, string> = {
    all_day: 'semua-waktu',
    breakfast: 'sarapan',
    dinner: 'makan-malam',
    lunch: 'makan-siang',
    snack: 'camilan',
  }

  return {
    id: `batch-${batchLabel}-${number.toString().padStart(3, '0')}`,
    slug: `batch-${batchLabel}-${slugify(name)}`,
    name,
    description:
      `${name}, komposisi unik Batch ${batchNumber} ` +
      'dengan porsi berbasis TKPI.',
    mealType,
    components,
    tags: [
      mealTag[mealType],
      `batch-${batchLabel}`,
      'tkpi-terukur',
    ],
    allergens: [...new Set(allergensFrom(...choices))],
    curationNotes:
      `Kandidat Batch ${batchNumber}. Makro, natrium, nama, dan ` +
      'komposisi diperiksa sebelum approval.',
  }
}

function createBreakfastMenus(
  batchNumber: number,
  specs: readonly BreakfastSpec[],
): MenuSeed[] {
  return specs.map((spec, index) => {
    const choices = [spec.staple, spec.protein, spec.fruit]
    const name =
      `${spec.staple.label}, ${spec.protein.label}, dan ${spec.fruit.label}`

    return createMenu(
      batchNumber,
      index + 1,
      name,
      'breakfast',
      [
        component(spec.staple, spec.stapleWeight ?? 150, 'staple'),
        component(
          spec.protein,
          spec.proteinWeight ?? 80,
          spec.proteinRole ?? 'protein',
        ),
        component(spec.fruit, 100, 'fruit'),
      ],
      choices,
    )
  })
}

function createMainMenus(
  batchNumber: number,
  specs: readonly MainSpec[],
  firstNumber: number,
  mealType: 'lunch' | 'dinner',
): MenuSeed[] {
  const isLunch = mealType === 'lunch'

  return specs.map((spec, index) => {
    const choices = [
      spec.staple,
      spec.protein,
      spec.vegetable,
      spec.fruit,
    ]
    const name =
      `${spec.staple.label}, ${spec.protein.label}, ` +
      `${spec.vegetable.label}, dan ${spec.fruit.label}`

    return createMenu(
      batchNumber,
      firstNumber + index,
      name,
      mealType,
      [
        component(spec.staple, isLunch ? 120 : 110, 'staple'),
        component(spec.protein, spec.proteinWeight, 'protein'),
        component(spec.vegetable, isLunch ? 200 : 220, 'vegetable'),
        component(spec.fruit, 100, 'fruit'),
      ],
      choices,
    )
  })
}

function createSnackMenus(
  batchNumber: number,
  specs: readonly SnackSpec[],
  firstNumber: number,
): MenuSeed[] {
  return specs.map((spec, index) => {
    const choices = [spec.first, spec.second]
    const name = `${spec.first.label} dan ${spec.second.label}`

    return createMenu(
      batchNumber,
      firstNumber + index,
      name,
      'snack',
      [
        component(spec.first, spec.firstWeight, spec.firstRole),
        component(spec.second, spec.secondWeight, spec.secondRole),
      ],
      choices,
    )
  })
}

export function createBatchMenus(
  definition: BatchDefinition,
): readonly MenuSeed[] {
  if (
    !Number.isInteger(definition.batchNumber) ||
    definition.batchNumber < 2
  ) {
    throw new Error('Batch number must be an integer of 2 or more')
  }

  const firstLunch = definition.breakfasts.length + 1
  const firstDinner = firstLunch + definition.lunches.length
  const firstSnack = firstDinner + definition.dinners.length

  return [
    ...createBreakfastMenus(definition.batchNumber, definition.breakfasts),
    ...createMainMenus(
      definition.batchNumber,
      definition.lunches,
      firstLunch,
      'lunch',
    ),
    ...createMainMenus(
      definition.batchNumber,
      definition.dinners,
      firstDinner,
      'dinner',
    ),
    ...createSnackMenus(
      definition.batchNumber,
      definition.snacks,
      firstSnack,
    ),
  ]
}
