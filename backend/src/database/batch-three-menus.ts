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

function createMenu(
  number: number,
  name: string,
  mealType: MealType,
  components: MenuComponentSeed[],
  allergens: Allergen[] = [],
): MenuSeed {
  const mealTag: Record<MealType, string> = {
    all_day: 'semua-waktu',
    breakfast: 'sarapan',
    dinner: 'makan-malam',
    lunch: 'makan-siang',
    snack: 'camilan',
  }

  return {
    id: `batch-03-${number.toString().padStart(3, '0')}`,
    slug: `batch-03-${slugify(name)}`,
    name,
    description: `${name}, komposisi unik Batch 3 dengan porsi berbasis TKPI.`,
    mealType,
    components,
    tags: [mealTag[mealType], 'batch-03', 'tkpi-terukur'],
    allergens: [...new Set(allergens)],
    curationNotes:
      'Kandidat Batch 3. Makro, natrium, nama, dan komposisi diperiksa sebelum approval.',
  }
}

const foods = {
  apple: { code: 'ER003', label: 'Apel' },
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
  ubiGadung: { code: 'BP006', label: 'Ubi Gadung Kukus' },
  ubiKuning: { code: 'BP011', label: 'Ubi Kuning' },
  ubiKelapa: { code: 'BP002', label: 'Ubi Kukus' },
  ubiRebus: { code: 'BP003', label: 'Ubi Rebus' },
  ubiUngu: { code: 'BP012', label: 'Ubi Ungu' },
  watermelon: { code: 'ER105', label: 'Semangka' },
  wortel: { code: 'DP020', label: 'Wortel' },
  wortelKukus: { code: 'DP021', label: 'Wortel Kukus' },
  yoghurt: {
    allergens: ['milk'],
    code: 'JP011',
    label: 'Yoghurt',
  },
} as const satisfies Record<string, FoodChoice>

function allergensFrom(...choices: FoodChoice[]): Allergen[] {
  return choices.flatMap((choice) => choice.allergens ?? [])
}

function mainMenu(
  number: number,
  mealType: 'lunch' | 'dinner',
  staple: FoodChoice,
  protein: FoodChoice,
  proteinWeight: number,
  vegetable: FoodChoice,
  fruit: FoodChoice,
): MenuSeed {
  const isLunch = mealType === 'lunch'
  const name =
    `${staple.label}, ${protein.label}, ${vegetable.label}, ` +
    `dan ${fruit.label}`

  return createMenu(
    number,
    name,
    mealType,
    [
      component(staple, isLunch ? 120 : 110, 'staple'),
      component(protein, proteinWeight, 'protein'),
      component(vegetable, isLunch ? 200 : 220, 'vegetable'),
      component(fruit, 100, 'fruit'),
    ],
    allergensFrom(staple, protein, vegetable, fruit),
  )
}

export const batchThreeMenus: readonly MenuSeed[] = [
  createMenu(
    1,
    'Talas Belitung, Kacang Merah, dan Jeruk',
    'breakfast',
    [
      component(foods.talasBelitung, 150, 'staple'),
      component(foods.kacangMerah, 80, 'protein'),
      component(foods.jeruk, 100, 'fruit'),
    ],
  ),
  createMenu(
    2,
    'Ubi Gadung, Kacang Merah Segar, dan Melon',
    'breakfast',
    [
      component(foods.ubiGadung, 180, 'staple'),
      component(foods.kacangMerahSegar, 80, 'protein'),
      component(foods.melon, 100, 'fruit'),
    ],
  ),
  createMenu(
    3,
    'Suweg Kukus, Kacang Tolo, dan Apel',
    'breakfast',
    [
      component(foods.suweg, 180, 'staple'),
      component(foods.kacangTolo, 80, 'protein'),
      component(foods.apple, 100, 'fruit'),
    ],
  ),
  createMenu(
    4,
    'Talas Bogor, Tahu, dan Pisang Ambon',
    'breakfast',
    [
      component(foods.talasBogor, 150, 'staple'),
      component(foods.tahu, 80, 'protein'),
      component(foods.pisang, 100, 'fruit'),
    ],
    ['soy'],
  ),
  createMenu(
    5,
    'Ubi Kuning, Kacang Gude, dan Nanas',
    'breakfast',
    [
      component(foods.ubiKuning, 150, 'staple'),
      component(foods.kacangGude, 80, 'protein'),
      component(foods.nanas, 100, 'fruit'),
    ],
  ),
  createMenu(
    6,
    'Ubi Ungu, Yoghurt, dan Jambu Biji',
    'breakfast',
    [
      component(foods.ubiUngu, 120, 'staple'),
      component(foods.yoghurt, 150, 'beverage'),
      component(foods.jambu, 100, 'fruit'),
    ],
    ['milk'],
  ),
  createMenu(
    7,
    'Singkong Kukus, Kacang Tolo, dan Pisang',
    'breakfast',
    [
      component(foods.singkong, 150, 'staple'),
      component(foods.kacangTolo, 80, 'protein'),
      component(foods.pisang, 100, 'fruit'),
    ],
  ),
  createMenu(
    8,
    'Jagung Rebus, Kacang Merah, dan Jeruk',
    'breakfast',
    [
      component(foods.jagungMuda, 120, 'staple'),
      component(foods.kacangMerah, 80, 'protein'),
      component(foods.jeruk, 100, 'fruit'),
    ],
  ),
  createMenu(
    9,
    'Jagung Pipil, Kacang Merah Segar, dan Nanas',
    'breakfast',
    [
      component(foods.jagungPipil, 120, 'staple'),
      component(foods.kacangMerahSegar, 80, 'protein'),
      component(foods.nanas, 100, 'fruit'),
    ],
  ),
  createMenu(
    10,
    'Roti, Susu Skim, dan Melon',
    'breakfast',
    [
      component(foods.roti, 60, 'staple'),
      component(foods.susuSkim, 200, 'beverage'),
      component(foods.melon, 100, 'fruit'),
    ],
    ['milk', 'wheat'],
  ),
  createMenu(
    11,
    'Ubi Kukus, Kacang Gude, dan Apel',
    'breakfast',
    [
      component(foods.ubiKelapa, 180, 'staple'),
      component(foods.kacangGude, 80, 'protein'),
      component(foods.apple, 100, 'fruit'),
    ],
  ),
  createMenu(
    12,
    'Ubi Rebus, Tahu, dan Jambu Biji',
    'breakfast',
    [
      component(foods.ubiRebus, 120, 'staple'),
      component(foods.tahu, 80, 'protein'),
      component(foods.jambu, 100, 'fruit'),
    ],
    ['soy'],
  ),
  createMenu(
    13,
    'Talas Belitung, Yoghurt, dan Pisang Ambon',
    'breakfast',
    [
      component(foods.talasBelitung, 150, 'staple'),
      component(foods.yoghurt, 150, 'beverage'),
      component(foods.pisang, 100, 'fruit'),
    ],
    ['milk'],
  ),
  createMenu(
    14,
    'Suweg Kukus, Kacang Merah, dan Jeruk',
    'breakfast',
    [
      component(foods.suweg, 180, 'staple'),
      component(foods.kacangMerah, 80, 'protein'),
      component(foods.jeruk, 100, 'fruit'),
    ],
  ),
  createMenu(
    15,
    'Ubi Gadung, Kacang Tolo, dan Nanas',
    'breakfast',
    [
      component(foods.ubiGadung, 180, 'staple'),
      component(foods.kacangTolo, 80, 'protein'),
      component(foods.nanas, 100, 'fruit'),
    ],
  ),
  mainMenu(
    16,
    'lunch',
    foods.nasiMerah,
    foods.ayamKalasan,
    80,
    foods.kacangPanjang,
    foods.jambu,
  ),
  mainMenu(
    17,
    'lunch',
    foods.nasi,
    foods.mujairPepes,
    90,
    foods.kangkung,
    foods.melon,
  ),
  mainMenu(
    18,
    'lunch',
    foods.nasiMerah,
    foods.ikanBaung,
    90,
    foods.kangkungRebus,
    foods.nanas,
  ),
  mainMenu(
    19,
    'lunch',
    foods.nasi,
    foods.ikanMas,
    80,
    foods.wortel,
    foods.apple,
  ),
  mainMenu(
    20,
    'lunch',
    foods.nasiMerah,
    foods.ikanPapuyu,
    90,
    foods.wortelKukus,
    foods.jeruk,
  ),
  mainMenu(
    21,
    'lunch',
    foods.nasi,
    foods.ikanPatin,
    90,
    foods.daunKatuk,
    foods.jambu,
  ),
  mainMenu(
    22,
    'lunch',
    foods.nasiMerah,
    foods.cumi,
    80,
    foods.daunKelor,
    foods.nanas,
  ),
  mainMenu(
    23,
    'lunch',
    foods.nasi,
    foods.tahu,
    100,
    foods.daunSingkong,
    foods.melon,
  ),
  mainMenu(
    24,
    'lunch',
    foods.nasiMerah,
    foods.tempe,
    70,
    foods.kacangPanjang,
    foods.jeruk,
  ),
  mainMenu(
    25,
    'lunch',
    foods.nasi,
    foods.kacangMerah,
    100,
    foods.kangkung,
    foods.apple,
  ),
  mainMenu(
    26,
    'lunch',
    foods.nasiMerah,
    foods.kacangMerahSegar,
    100,
    foods.kangkungRebus,
    foods.jambu,
  ),
  mainMenu(
    27,
    'lunch',
    foods.nasi,
    foods.kacangTolo,
    100,
    foods.wortel,
    foods.nanas,
  ),
  mainMenu(
    28,
    'lunch',
    foods.nasiMerah,
    foods.kacangGude,
    100,
    foods.wortelKukus,
    foods.melon,
  ),
  mainMenu(
    29,
    'lunch',
    foods.nasi,
    foods.mujairGoreng,
    60,
    foods.daunKatuk,
    foods.jeruk,
  ),
  mainMenu(
    30,
    'lunch',
    foods.nasiMerah,
    foods.bebek,
    70,
    foods.daunKelor,
    foods.apple,
  ),
  mainMenu(
    31,
    'lunch',
    foods.nasi,
    foods.ikanLais,
    90,
    foods.daunSingkong,
    foods.jambu,
  ),
  mainMenu(
    32,
    'lunch',
    foods.nasiMerah,
    foods.kedelai,
    80,
    foods.kacangPanjang,
    foods.nanas,
  ),
  mainMenu(
    33,
    'lunch',
    foods.nasi,
    foods.kacangBelimbing,
    80,
    foods.kangkung,
    foods.melon,
  ),
  mainMenu(
    34,
    'dinner',
    foods.nasi,
    foods.ayamKalasan,
    75,
    foods.wortel,
    foods.jeruk,
  ),
  mainMenu(
    35,
    'dinner',
    foods.nasiMerah,
    foods.mujairPepes,
    85,
    foods.wortelKukus,
    foods.nanas,
  ),
  mainMenu(
    36,
    'dinner',
    foods.nasi,
    foods.ikanBaung,
    85,
    foods.daunKatuk,
    foods.apple,
  ),
  mainMenu(
    37,
    'dinner',
    foods.nasiMerah,
    foods.ikanMas,
    75,
    foods.daunKelor,
    foods.melon,
  ),
  mainMenu(
    38,
    'dinner',
    foods.nasi,
    foods.ikanPapuyu,
    85,
    foods.daunSingkong,
    foods.nanas,
  ),
  mainMenu(
    39,
    'dinner',
    foods.nasiMerah,
    foods.ikanPatin,
    85,
    foods.kacangPanjang,
    foods.jeruk,
  ),
  mainMenu(
    40,
    'dinner',
    foods.nasi,
    foods.cumi,
    75,
    foods.kangkung,
    foods.jambu,
  ),
  mainMenu(
    41,
    'dinner',
    foods.nasiMerah,
    foods.tahu,
    90,
    foods.kangkungRebus,
    foods.apple,
  ),
  mainMenu(
    42,
    'dinner',
    foods.nasi,
    foods.tempe,
    65,
    foods.wortel,
    foods.nanas,
  ),
  mainMenu(
    43,
    'dinner',
    foods.nasiMerah,
    foods.kacangMerah,
    90,
    foods.wortelKukus,
    foods.jeruk,
  ),
  mainMenu(
    44,
    'dinner',
    foods.nasi,
    foods.kacangMerahSegar,
    90,
    foods.daunKatuk,
    foods.jambu,
  ),
  mainMenu(
    45,
    'dinner',
    foods.nasiMerah,
    foods.kacangTolo,
    90,
    foods.daunKelor,
    foods.apple,
  ),
  mainMenu(
    46,
    'dinner',
    foods.nasi,
    foods.kacangGude,
    90,
    foods.daunSingkong,
    foods.melon,
  ),
  mainMenu(
    47,
    'dinner',
    foods.nasiMerah,
    foods.mujairGoreng,
    55,
    foods.kacangPanjang,
    foods.jambu,
  ),
  mainMenu(
    48,
    'dinner',
    foods.nasi,
    foods.bebek,
    65,
    foods.kangkung,
    foods.jeruk,
  ),
  mainMenu(
    49,
    'dinner',
    foods.nasiMerah,
    foods.ikanLais,
    85,
    foods.kangkungRebus,
    foods.nanas,
  ),
  mainMenu(
    50,
    'dinner',
    foods.nasi,
    foods.kedelai,
    75,
    foods.wortel,
    foods.apple,
  ),
  mainMenu(
    51,
    'dinner',
    foods.nasiMerah,
    foods.kacangBelimbing,
    75,
    foods.wortelKukus,
    foods.melon,
  ),
  createMenu(
    52,
    'Yoghurt dan Melon',
    'snack',
    [
      component(foods.yoghurt, 100, 'beverage'),
      component(foods.melon, 150, 'fruit'),
    ],
    ['milk'],
  ),
  createMenu(
    53,
    'Yoghurt dan Nanas',
    'snack',
    [
      component(foods.yoghurt, 100, 'beverage'),
      component(foods.nanas, 150, 'fruit'),
    ],
    ['milk'],
  ),
  createMenu(
    54,
    'Ubi Rebus dan Jambu Biji',
    'snack',
    [
      component(foods.ubiRebus, 80, 'staple'),
      component(foods.jambu, 100, 'fruit'),
    ],
  ),
  createMenu(
    55,
    'Talas Belitung dan Melon',
    'snack',
    [
      component(foods.talasBelitung, 80, 'staple'),
      component(foods.melon, 100, 'fruit'),
    ],
  ),
  createMenu(
    56,
    'Kacang Gude dan Apel',
    'snack',
    [
      component(foods.kacangGude, 60, 'protein'),
      component(foods.apple, 100, 'fruit'),
    ],
  ),
  createMenu(
    57,
    'Kacang Belimbing dan Jeruk',
    'snack',
    [
      component(foods.kacangBelimbing, 50, 'protein'),
      component(foods.jeruk, 100, 'fruit'),
    ],
  ),
  createMenu(
    58,
    'Jagung Pipil dan Semangka',
    'snack',
    [
      component(foods.jagungPipil, 80, 'staple'),
      component(foods.watermelon, 150, 'fruit'),
    ],
  ),
  createMenu(
    59,
    'Suweg Kukus dan Pisang Ambon',
    'snack',
    [
      component(foods.suweg, 100, 'staple'),
      component(foods.pisang, 80, 'fruit'),
    ],
  ),
  createMenu(
    60,
    'Kedelai Rebus dan Nanas',
    'snack',
    [
      component(foods.kedelai, 50, 'protein'),
      component(foods.nanas, 100, 'fruit'),
    ],
    ['soy'],
  ),
]

export function seedBatchThreeMenus(database: AppDatabase): MenuSeedResult {
  if (batchThreeMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 3 menus, received ${batchThreeMenus.length}`,
    )
  }

  return seedMenus(database, batchThreeMenus, 3)
}

