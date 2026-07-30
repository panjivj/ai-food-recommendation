import type { AppDatabase } from './database.js'
import {
  seedMenus,
  type Allergen,
  type ComponentRole,
  type MealType,
  type MenuComponentSeed,
  type MenuSeed,
  type MenuSeedResult,
} from './menu-seeder.js'

interface FoodChoice {
  allergens?: Allergen[]
  code: string
  label: string
}

interface BreakfastSpec {
  fruit: FoodChoice
  protein: FoodChoice
  proteinRole?: ComponentRole
  proteinWeight?: number
  staple: FoodChoice
  stapleWeight?: number
}

interface MainSpec {
  fruit: FoodChoice
  protein: FoodChoice
  proteinWeight: number
  staple: FoodChoice
  vegetable: FoodChoice
}

interface SnackSpec {
  first: FoodChoice
  firstRole: ComponentRole
  firstWeight: number
  second: FoodChoice
  secondRole: ComponentRole
  secondWeight: number
}

const foods = {
  apel: { code: 'ER003', label: 'Apel' },
  ayamKalasan: {
    allergens: ['soy'],
    code: 'FP024',
    label: 'Ayam Kalasan',
  },
  bayam: { code: 'DP001', label: 'Bayam' },
  bebek: { code: 'FP003', label: 'Bebek Goreng' },
  buncis: { code: 'DP003', label: 'Buncis' },
  cumi: {
    allergens: ['shellfish'],
    code: 'GP003',
    label: 'Cumi',
  },
  daunKatuk: { code: 'DP005', label: 'Daun Katuk' },
  daunKelor: { code: 'DP006', label: 'Daun Kelor' },
  daunSingkong: { code: 'DP008', label: 'Daun Singkong' },
  ikanBaung: {
    allergens: ['fish'],
    code: 'GP006',
    label: 'Ikan Baung',
  },
  ikanLais: {
    allergens: ['fish'],
    code: 'GP017',
    label: 'Ikan Lais',
  },
  ikanMas: {
    allergens: ['fish'],
    code: 'GP019',
    label: 'Pepes Ikan Mas',
  },
  ikanPapuyu: {
    allergens: ['fish'],
    code: 'GP023',
    label: 'Ikan Papuyu',
  },
  ikanPatin: {
    allergens: ['fish'],
    code: 'GP024',
    label: 'Ikan Patin',
  },
  jagungMuda: { code: 'AP010', label: 'Jagung Rebus' },
  jagungPipil: { code: 'AP012', label: 'Jagung Pipil' },
  jambu: { code: 'ER031', label: 'Jambu Biji' },
  jeruk: { code: 'ER039', label: 'Jeruk' },
  kacangBelimbing: { code: 'CP001', label: 'Kacang Belimbing' },
  kacangGude: { code: 'CP004', label: 'Kacang Gude' },
  kacangMerah: { code: 'CP008', label: 'Kacang Merah' },
  kacangMerahSegar: {
    code: 'CP009',
    label: 'Kacang Merah Segar',
  },
  kacangPanjang: { code: 'DP012', label: 'Kacang Panjang' },
  kacangTolo: { code: 'CP014', label: 'Kacang Tolo' },
  kangkung: { code: 'DP013', label: 'Kangkung' },
  kangkungRebus: { code: 'DP014', label: 'Kangkung Rebus' },
  kedelai: {
    allergens: ['soy'],
    code: 'CP007',
    label: 'Kedelai Rebus',
  },
  melon: { code: 'ER067', label: 'Melon' },
  mujairGoreng: {
    allergens: ['fish'],
    code: 'GP020',
    label: 'Mujahir Goreng',
  },
  mujairPepes: {
    allergens: ['fish'],
    code: 'GP021',
    label: 'Pepes Mujahir',
  },
  nanas: { code: 'ER069', label: 'Nanas' },
  nasi: { code: 'AP001', label: 'Nasi' },
  nasiMerah: { code: 'AP005', label: 'Nasi Merah' },
  pisang: { code: 'ER074', label: 'Pisang Ambon' },
  roti: {
    allergens: ['wheat'],
    code: 'AP024',
    label: 'Roti',
  },
  semangka: { code: 'ER105', label: 'Semangka' },
  singkong: { code: 'BP008', label: 'Singkong Kukus' },
  susuSkim: {
    allergens: ['milk'],
    code: 'JP010',
    label: 'Susu Skim',
  },
  suweg: { code: 'BP009', label: 'Suweg Kukus' },
  tahu: {
    allergens: ['soy'],
    code: 'CP062',
    label: 'Tahu',
  },
  talasBelitung: { code: 'BP004', label: 'Talas Belitung' },
  talasBogor: { code: 'BP010', label: 'Talas Bogor' },
  tempe: {
    allergens: ['soy'],
    code: 'CP083',
    label: 'Tempe',
  },
  ubiGadung: { code: 'BP006', label: 'Ubi Gadung' },
  ubiKelapa: { code: 'BP002', label: 'Ubi Kukus' },
  ubiKuning: { code: 'BP011', label: 'Ubi Kuning' },
  ubiRebus: { code: 'BP003', label: 'Ubi Rebus' },
  ubiUngu: { code: 'BP012', label: 'Ubi Ungu' },
  wortel: { code: 'DP020', label: 'Wortel' },
  wortelKukus: { code: 'DP021', label: 'Wortel Kukus' },
  yoghurt: {
    allergens: ['milk'],
    code: 'JP011',
    label: 'Yoghurt',
  },
} as const satisfies Record<string, FoodChoice>

const breakfastSpecs: readonly BreakfastSpec[] = [
  {
    staple: foods.talasBelitung,
    protein: foods.kacangMerah,
    fruit: foods.semangka,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.jambu,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.melon,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.jeruk,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.apel,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.nanas,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.semangka,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.jambu,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.melon,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.nanas,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.jeruk,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.pisang,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.apel,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.jambu,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.melon,
  },
]

const proteins = [
  foods.ayamKalasan,
  foods.mujairPepes,
  foods.ikanBaung,
  foods.ikanMas,
  foods.ikanPapuyu,
  foods.ikanPatin,
  foods.cumi,
  foods.tahu,
  foods.tempe,
  foods.kacangMerah,
  foods.kacangMerahSegar,
  foods.kacangTolo,
  foods.kacangGude,
  foods.mujairGoreng,
  foods.bebek,
  foods.ikanLais,
  foods.kedelai,
  foods.kacangBelimbing,
] as const

const proteinWeights = [
  80, 90, 90, 80, 90, 90, 80, 100, 70, 100, 100, 100, 100, 60, 70, 90, 80,
  80,
] as const

const lunchVegetables = [
  foods.bayam,
  foods.buncis,
  foods.daunKatuk,
  foods.daunKelor,
  foods.daunSingkong,
  foods.kacangPanjang,
  foods.kangkung,
  foods.kangkungRebus,
  foods.wortel,
  foods.wortelKukus,
  foods.bayam,
  foods.buncis,
  foods.daunKatuk,
  foods.daunKelor,
  foods.daunSingkong,
  foods.kacangPanjang,
  foods.kangkung,
  foods.wortel,
] as const

const dinnerVegetables = [
  foods.buncis,
  foods.daunKatuk,
  foods.daunKelor,
  foods.daunSingkong,
  foods.kacangPanjang,
  foods.kangkung,
  foods.kangkungRebus,
  foods.wortel,
  foods.wortelKukus,
  foods.bayam,
  foods.buncis,
  foods.daunKatuk,
  foods.daunKelor,
  foods.daunSingkong,
  foods.kacangPanjang,
  foods.kangkung,
  foods.kangkungRebus,
  foods.wortelKukus,
] as const

const lunchSpecs: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.bayam,
  fruit: foods.semangka,
}))

const dinnerSpecs: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight: Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.buncis,
  fruit: foods.pisang,
}))

const snackSpecs: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.apel,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 120,
    firstRole: 'beverage',
    second: foods.semangka,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.melon,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.jambu,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.pisang,
    secondWeight: 80,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.jeruk,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.jagungMuda,
    firstWeight: 100,
    firstRole: 'staple',
    second: foods.nanas,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiKelapa,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.semangka,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.apel,
    secondWeight: 100,
    secondRole: 'fruit',
  },
]

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
  number: number,
  name: string,
  mealType: MealType,
  components: MenuComponentSeed[],
  choices: FoodChoice[],
): MenuSeed {
  const mealTag: Record<MealType, string> = {
    all_day: 'semua-waktu',
    breakfast: 'sarapan',
    dinner: 'makan-malam',
    lunch: 'makan-siang',
    snack: 'camilan',
  }

  return {
    id: `batch-04-${number.toString().padStart(3, '0')}`,
    slug: `batch-04-${slugify(name)}`,
    name,
    description: `${name}, komposisi unik Batch 4 dengan porsi berbasis TKPI.`,
    mealType,
    components,
    tags: [mealTag[mealType], 'batch-04', 'tkpi-terukur'],
    allergens: [...new Set(allergensFrom(...choices))],
    curationNotes:
      'Kandidat Batch 4. Makro, natrium, nama, dan komposisi diperiksa sebelum approval.',
  }
}

const breakfastMenus = breakfastSpecs.map((spec, index) => {
  const choices = [spec.staple, spec.protein, spec.fruit]
  const name =
    `${spec.staple.label}, ${spec.protein.label}, dan ${spec.fruit.label}`

  return createMenu(
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

function createMainMenus(
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

const snackMenus = snackSpecs.map((spec, index) => {
  const choices = [spec.first, spec.second]
  const name = `${spec.first.label} dan ${spec.second.label}`

  return createMenu(
    52 + index,
    name,
    'snack',
    [
      component(spec.first, spec.firstWeight, spec.firstRole),
      component(spec.second, spec.secondWeight, spec.secondRole),
    ],
    choices,
  )
})

export const batchFourMenus: readonly MenuSeed[] = [
  ...breakfastMenus,
  ...createMainMenus(lunchSpecs, 16, 'lunch'),
  ...createMainMenus(dinnerSpecs, 34, 'dinner'),
  ...snackMenus,
]

export function seedBatchFourMenus(database: AppDatabase): MenuSeedResult {
  if (batchFourMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 4 menus, received ${batchFourMenus.length}`,
    )
  }

  return seedMenus(database, batchFourMenus, 4)
}
