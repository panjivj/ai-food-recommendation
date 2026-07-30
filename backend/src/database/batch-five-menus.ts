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
  ayamKalasan: {
    allergens: ['soy'],
    code: 'FP024',
    label: 'Ayam Kalasan',
  },
  bayamRebus: { code: 'DP002', label: 'Bayam Rebus' },
  bebek: { code: 'FP003', label: 'Bebek Goreng' },
  belimbing: { code: 'ER006', label: 'Belimbing' },
  buahNaga: { code: 'ER012', label: 'Buah Naga Merah' },
  cumi: {
    allergens: ['shellfish'],
    code: 'GP003',
    label: 'Cumi',
  },
  daunKacangPanjang: {
    code: 'DP004',
    label: 'Daun Kacang Panjang Kukus',
  },
  daunTalas: { code: 'DP009', label: 'Daun Talas Rebus' },
  daunUbiMerah: { code: 'DP010', label: 'Daun Ubi Merah Kukus' },
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
  jambuAir: { code: 'ER030', label: 'Jambu Air' },
  jerukBali: { code: 'ER035', label: 'Jeruk Bali' },
  kacangBelimbing: { code: 'CP001', label: 'Kacang Belimbing' },
  kacangGude: { code: 'CP004', label: 'Kacang Gude' },
  kacangMerah: { code: 'CP008', label: 'Kacang Merah' },
  kacangMerahSegar: {
    code: 'CP009',
    label: 'Kacang Merah Segar',
  },
  kacangPanjangKukus: {
    code: 'DP011',
    label: 'Kacang Panjang Kukus',
  },
  kacangTolo: { code: 'CP014', label: 'Kacang Tolo' },
  kedelai: {
    allergens: ['soy'],
    code: 'CP007',
    label: 'Kedelai Rebus',
  },
  kedondong: { code: 'ER043', label: 'Kedondong' },
  mangga: { code: 'ER054', label: 'Mangga' },
  manggis: { code: 'ER064', label: 'Manggis' },
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
  nasi: { code: 'AP001', label: 'Nasi' },
  nasiMerah: { code: 'AP005', label: 'Nasi Merah' },
  paria: { code: 'DP015', label: 'Paria Putih Kukus' },
  roti: {
    allergens: ['wheat'],
    code: 'AP024',
    label: 'Roti',
  },
  selada: { code: 'DP016', label: 'Selada Rebus' },
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
  taoge: { code: 'DP018', label: 'Taoge Seduh' },
  tempe: {
    allergens: ['soy'],
    code: 'CP083',
    label: 'Tempe',
  },
  terung: { code: 'DP019', label: 'Terung Kukus' },
  ubiGadung: { code: 'BP006', label: 'Ubi Gadung' },
  ubiKelapa: { code: 'BP002', label: 'Ubi Kukus' },
  ubiKuning: { code: 'BP011', label: 'Ubi Kuning' },
  ubiRebus: { code: 'BP003', label: 'Ubi Rebus' },
  ubiUngu: { code: 'BP012', label: 'Ubi Ungu' },
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
    fruit: foods.buahNaga,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.mangga,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.belimbing,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.jambuAir,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.jerukBali,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.kedondong,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.manggis,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.buahNaga,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.mangga,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.belimbing,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.jambuAir,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.jerukBali,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.kedondong,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.manggis,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.buahNaga,
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
  foods.bayamRebus,
  foods.daunKacangPanjang,
  foods.daunTalas,
  foods.daunUbiMerah,
  foods.kacangPanjangKukus,
  foods.paria,
  foods.selada,
  foods.taoge,
  foods.terung,
  foods.bayamRebus,
  foods.daunKacangPanjang,
  foods.daunTalas,
  foods.daunUbiMerah,
  foods.kacangPanjangKukus,
  foods.paria,
  foods.selada,
  foods.taoge,
  foods.terung,
] as const

const dinnerVegetables = [
  foods.daunKacangPanjang,
  foods.daunTalas,
  foods.daunUbiMerah,
  foods.kacangPanjangKukus,
  foods.paria,
  foods.selada,
  foods.taoge,
  foods.terung,
  foods.bayamRebus,
  foods.daunKacangPanjang,
  foods.daunTalas,
  foods.daunUbiMerah,
  foods.kacangPanjangKukus,
  foods.paria,
  foods.selada,
  foods.taoge,
  foods.terung,
  foods.bayamRebus,
] as const

const lunchSpecs: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.bayamRebus,
  fruit: foods.buahNaga,
}))

const dinnerSpecs: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight: Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.daunTalas,
  fruit: foods.mangga,
}))

const snackSpecs: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.buahNaga,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.mangga,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.belimbing,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.jambuAir,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.jerukBali,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.kedondong,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.jagungMuda,
    firstWeight: 100,
    firstRole: 'staple',
    second: foods.manggis,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiKelapa,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.buahNaga,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.mangga,
    secondWeight: 120,
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
    id: `batch-05-${number.toString().padStart(3, '0')}`,
    slug: `batch-05-${slugify(name)}`,
    name,
    description: `${name}, komposisi unik Batch 5 dengan porsi berbasis TKPI.`,
    mealType,
    components,
    tags: [mealTag[mealType], 'batch-05', 'tkpi-terukur'],
    allergens: [...new Set(allergensFrom(...choices))],
    curationNotes:
      'Kandidat Batch 5. Makro, natrium, nama, dan komposisi diperiksa sebelum approval.',
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

export const batchFiveMenus: readonly MenuSeed[] = [
  ...breakfastMenus,
  ...createMainMenus(lunchSpecs, 16, 'lunch'),
  ...createMainMenus(dinnerSpecs, 34, 'dinner'),
  ...snackMenus,
]

export function seedBatchFiveMenus(database: AppDatabase): MenuSeedResult {
  if (batchFiveMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 5 menus, received ${batchFiveMenus.length}`,
    )
  }

  return seedMenus(database, batchFiveMenus, 5)
}
