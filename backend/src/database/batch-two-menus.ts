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

const component = (
  tkpiCode: string,
  amountG: number,
  role: ComponentRole,
): MenuComponentSeed => ({ amountG, role, tkpiCode })

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-|-$/g, '')

function menu(
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
    id: `batch-02-${number.toString().padStart(3, '0')}`,
    slug: `batch-02-${slugify(name)}`,
    name,
    description: `${name}, disusun dari komponen pangan TKPI dengan porsi terukur.`,
    mealType,
    components,
    tags: [mealTag[mealType], 'batch-02', 'tkpi-terukur'],
    allergens,
    curationNotes:
      'Kandidat Batch 2. Komponen dipilih dari data TKPI dengan makro dan natrium tersedia.',
  }
}

export const batchTwoMenus: readonly MenuSeed[] = [
  menu(
    1,
    'Ubi Kuning, Yoghurt, dan Jambu Biji',
    'breakfast',
    [
      component('BP011', 150, 'staple'),
      component('JP011', 150, 'beverage'),
      component('ER031', 100, 'fruit'),
    ],
    ['milk'],
  ),
  menu(
    2,
    'Ubi Cilembu, Kacang Merah, dan Apel',
    'breakfast',
    [
      component('BP075', 120, 'staple'),
      component('CP008', 80, 'protein'),
      component('ER003', 100, 'fruit'),
    ],
  ),
  menu(
    3,
    'Jagung Pipil, Tahu, dan Melon',
    'breakfast',
    [
      component('AP012', 120, 'staple'),
      component('CP062', 80, 'protein'),
      component('ER067', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    4,
    'Singkong Kukus, Kacang Merah, dan Jeruk',
    'breakfast',
    [
      component('BP008', 150, 'staple'),
      component('CP009', 80, 'protein'),
      component('ER039', 100, 'fruit'),
    ],
  ),
  menu(
    5,
    'Talas Kukus, Kacang Tolo, dan Nanas',
    'breakfast',
    [
      component('BP010', 150, 'staple'),
      component('CP014', 80, 'protein'),
      component('ER069', 100, 'fruit'),
    ],
  ),
  menu(
    6,
    'Jagung Rebus, Yoghurt, dan Pisang Ambon',
    'breakfast',
    [
      component('AP010', 120, 'staple'),
      component('JP011', 150, 'beverage'),
      component('ER074', 100, 'fruit'),
    ],
    ['milk'],
  ),
  menu(
    7,
    'Roti, Susu Skim, dan Jambu Biji',
    'breakfast',
    [
      component('AP024', 60, 'staple'),
      component('JP010', 200, 'beverage'),
      component('ER031', 100, 'fruit'),
    ],
    ['milk', 'wheat'],
  ),
  menu(
    8,
    'Ubi Kukus, Kacang Merah, dan Melon',
    'breakfast',
    [
      component('BP002', 180, 'staple'),
      component('CP008', 80, 'protein'),
      component('ER067', 100, 'fruit'),
    ],
  ),
  menu(
    9,
    'Ubi Rebus, Yoghurt, dan Apel',
    'breakfast',
    [
      component('BP003', 120, 'staple'),
      component('JP011', 150, 'beverage'),
      component('ER003', 100, 'fruit'),
    ],
    ['milk'],
  ),
  menu(
    10,
    'Ubi Ungu Kukus, Kacang Tolo, dan Jeruk',
    'breakfast',
    [
      component('BP012', 120, 'staple'),
      component('CP014', 80, 'protein'),
      component('ER039', 100, 'fruit'),
    ],
  ),
  menu(
    11,
    'Jagung Rebus, Tahu, dan Nanas',
    'breakfast',
    [
      component('AP010', 120, 'staple'),
      component('CP062', 80, 'protein'),
      component('ER069', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    12,
    'Ubi Kuning, Kacang Merah, dan Pisang Ambon',
    'breakfast',
    [
      component('BP011', 150, 'staple'),
      component('CP009', 80, 'protein'),
      component('ER074', 100, 'fruit'),
    ],
  ),
  menu(
    13,
    'Singkong Kukus, Yoghurt, dan Melon',
    'breakfast',
    [
      component('BP008', 150, 'staple'),
      component('JP011', 150, 'beverage'),
      component('ER067', 100, 'fruit'),
    ],
    ['milk'],
  ),
  menu(
    14,
    'Talas Kukus, Kacang Gude, dan Jambu Biji',
    'breakfast',
    [
      component('BP010', 150, 'staple'),
      component('CP004', 80, 'protein'),
      component('ER031', 100, 'fruit'),
    ],
  ),
  menu(
    15,
    'Jagung Pipil, Kacang Merah, dan Apel',
    'breakfast',
    [
      component('AP012', 120, 'staple'),
      component('CP008', 80, 'protein'),
      component('ER003', 100, 'fruit'),
    ],
  ),
  menu(
    16,
    'Nasi, Ayam Kalasan, Buncis, dan Apel',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('FP024', 80, 'protein'),
      component('DP003', 200, 'vegetable'),
      component('ER003', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    17,
    'Nasi Merah, Pepes Mujahir, Daun Kelor, dan Jeruk',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('GP021', 90, 'protein'),
      component('DP006', 200, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    18,
    'Nasi, Ikan Baung, Daun Singkong, dan Melon',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('GP006', 90, 'protein'),
      component('DP008', 200, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    19,
    'Nasi Merah, Pepes Ikan Mas, Kacang Panjang, dan Nanas',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('GP019', 80, 'protein'),
      component('DP012', 200, 'vegetable'),
      component('ER069', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    20,
    'Nasi, Ikan Papuyu, Kangkung, dan Jambu Biji',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('GP023', 90, 'protein'),
      component('DP013', 200, 'vegetable'),
      component('ER031', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    21,
    'Nasi Merah, Ikan Patin, Kangkung Rebus, dan Pisang',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('GP024', 90, 'protein'),
      component('DP014', 200, 'vegetable'),
      component('ER074', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    22,
    'Nasi, Cumi, Wortel, dan Melon',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('GP003', 80, 'protein'),
      component('DP020', 200, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
    ['shellfish'],
  ),
  menu(
    23,
    'Nasi Merah, Tahu, Wortel Kukus, dan Jeruk',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('CP062', 100, 'protein'),
      component('DP021', 200, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    24,
    'Nasi, Tempe, Bayam, dan Apel',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('CP083', 70, 'protein'),
      component('DP001', 200, 'vegetable'),
      component('ER003', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    25,
    'Nasi Merah, Kacang Merah, Buncis, dan Nanas',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('CP008', 100, 'protein'),
      component('DP003', 200, 'vegetable'),
      component('ER069', 100, 'fruit'),
    ],
  ),
  menu(
    26,
    'Nasi, Kacang Merah Segar, Daun Kelor, dan Melon',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('CP009', 100, 'protein'),
      component('DP006', 200, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
  ),
  menu(
    27,
    'Nasi Merah, Kacang Tolo, Daun Singkong, dan Jambu',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('CP014', 100, 'protein'),
      component('DP008', 200, 'vegetable'),
      component('ER031', 100, 'fruit'),
    ],
  ),
  menu(
    28,
    'Nasi, Kacang Gude, Kacang Panjang, dan Jeruk',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('CP004', 100, 'protein'),
      component('DP012', 200, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
  ),
  menu(
    29,
    'Nasi Merah, Mujahir Goreng, Kangkung, dan Nanas',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('GP020', 60, 'protein'),
      component('DP013', 200, 'vegetable'),
      component('ER069', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    30,
    'Nasi, Bebek Goreng, Kangkung Rebus, dan Melon',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('FP003', 70, 'protein'),
      component('DP014', 200, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
  ),
  menu(
    31,
    'Nasi Merah, Ikan Lais, Wortel, dan Apel',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('GP017', 90, 'protein'),
      component('DP020', 200, 'vegetable'),
      component('ER003', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    32,
    'Nasi, Kedelai Rebus, Wortel Kukus, dan Jeruk',
    'lunch',
    [
      component('AP001', 120, 'staple'),
      component('CP007', 80, 'protein'),
      component('DP021', 200, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    33,
    'Nasi Merah, Kacang Belimbing, Daun Katuk, dan Nanas',
    'lunch',
    [
      component('AP005', 120, 'staple'),
      component('CP001', 80, 'protein'),
      component('DP005', 200, 'vegetable'),
      component('ER069', 100, 'fruit'),
    ],
  ),
  menu(
    34,
    'Nasi Merah, Ayam Kalasan, Daun Kelor, dan Melon',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('FP024', 75, 'protein'),
      component('DP006', 220, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    35,
    'Nasi, Pepes Mujahir, Buncis, dan Jambu Biji',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('GP021', 85, 'protein'),
      component('DP003', 220, 'vegetable'),
      component('ER031', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    36,
    'Nasi Merah, Ikan Baung, Kacang Panjang, dan Jeruk',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('GP006', 85, 'protein'),
      component('DP012', 220, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    37,
    'Nasi, Pepes Ikan Mas, Daun Singkong, dan Nanas',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('GP019', 75, 'protein'),
      component('DP008', 220, 'vegetable'),
      component('ER069', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    38,
    'Nasi Merah, Ikan Papuyu, Kangkung, dan Apel',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('GP023', 85, 'protein'),
      component('DP014', 220, 'vegetable'),
      component('ER003', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    39,
    'Nasi, Ikan Patin, Wortel, dan Melon',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('GP024', 85, 'protein'),
      component('DP020', 220, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    40,
    'Nasi Merah, Cumi, Bayam, dan Jeruk',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('GP003', 75, 'protein'),
      component('DP001', 220, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
    ['shellfish'],
  ),
  menu(
    41,
    'Nasi, Tahu, Kangkung Kukus, dan Jambu Biji',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('CP062', 90, 'protein'),
      component('DP013', 220, 'vegetable'),
      component('ER031', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    42,
    'Nasi Merah, Tempe, Daun Kelor, dan Nanas',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('CP083', 65, 'protein'),
      component('DP006', 220, 'vegetable'),
      component('ER069', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    43,
    'Nasi, Kacang Merah, Kacang Panjang, dan Melon',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('CP008', 90, 'protein'),
      component('DP012', 220, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
  ),
  menu(
    44,
    'Nasi Merah, Kacang Merah Segar, Wortel, dan Apel',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('CP009', 90, 'protein'),
      component('DP020', 220, 'vegetable'),
      component('ER003', 100, 'fruit'),
    ],
  ),
  menu(
    45,
    'Nasi, Kacang Tolo, Buncis, dan Jeruk',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('CP014', 90, 'protein'),
      component('DP003', 220, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
  ),
  menu(
    46,
    'Nasi Merah, Kacang Gude, Daun Singkong, dan Jambu',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('CP004', 90, 'protein'),
      component('DP008', 220, 'vegetable'),
      component('ER031', 100, 'fruit'),
    ],
  ),
  menu(
    47,
    'Nasi, Mujahir Goreng, Kangkung, dan Melon',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('GP020', 55, 'protein'),
      component('DP013', 220, 'vegetable'),
      component('ER067', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    48,
    'Nasi Merah, Bebek Goreng, Kangkung Rebus, dan Nanas',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('FP003', 65, 'protein'),
      component('DP014', 220, 'vegetable'),
      component('ER069', 100, 'fruit'),
    ],
  ),
  menu(
    49,
    'Nasi, Ikan Lais, Wortel Kukus, dan Apel',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('GP017', 85, 'protein'),
      component('DP021', 220, 'vegetable'),
      component('ER003', 100, 'fruit'),
    ],
    ['fish'],
  ),
  menu(
    50,
    'Nasi Merah, Kedelai Rebus, Daun Katuk, dan Jeruk',
    'dinner',
    [
      component('AP005', 110, 'staple'),
      component('CP007', 75, 'protein'),
      component('DP005', 220, 'vegetable'),
      component('ER039', 100, 'fruit'),
    ],
    ['soy'],
  ),
  menu(
    51,
    'Nasi, Kacang Belimbing, Bayam, dan Jambu Biji',
    'dinner',
    [
      component('AP001', 110, 'staple'),
      component('CP001', 75, 'protein'),
      component('DP001', 220, 'vegetable'),
      component('ER031', 100, 'fruit'),
    ],
  ),
  menu(
    52,
    'Yoghurt dan Jambu Biji',
    'snack',
    [
      component('JP011', 100, 'beverage'),
      component('ER031', 150, 'fruit'),
    ],
    ['milk'],
  ),
  menu(
    53,
    'Yoghurt dan Jeruk Manis',
    'snack',
    [
      component('JP011', 100, 'beverage'),
      component('ER039', 150, 'fruit'),
    ],
    ['milk'],
  ),
  menu(
    54,
    'Ubi Kuning dan Melon',
    'snack',
    [
      component('BP011', 100, 'staple'),
      component('ER067', 100, 'fruit'),
    ],
  ),
  menu(
    55,
    'Ubi Kukus dan Apel',
    'snack',
    [
      component('BP002', 100, 'staple'),
      component('ER003', 100, 'fruit'),
    ],
  ),
  menu(
    56,
    'Kacang Merah dan Nanas',
    'snack',
    [
      component('CP008', 60, 'protein'),
      component('ER069', 100, 'fruit'),
    ],
  ),
  menu(
    57,
    'Kacang Merah Segar dan Jambu Biji',
    'snack',
    [
      component('CP009', 60, 'protein'),
      component('ER031', 100, 'fruit'),
    ],
  ),
  menu(
    58,
    'Jagung Rebus dan Pisang Ambon',
    'snack',
    [
      component('AP010', 80, 'staple'),
      component('ER074', 80, 'fruit'),
    ],
  ),
  menu(
    59,
    'Talas Kukus dan Jeruk',
    'snack',
    [
      component('BP010', 80, 'staple'),
      component('ER039', 100, 'fruit'),
    ],
  ),
  menu(
    60,
    'Kacang Tolo dan Melon',
    'snack',
    [
      component('CP014', 60, 'protein'),
      component('ER067', 100, 'fruit'),
    ],
  ),
]

export function seedBatchTwoMenus(database: AppDatabase): MenuSeedResult {
  if (batchTwoMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 2 menus, received ${batchTwoMenus.length}`,
    )
  }

  return seedMenus(database, batchTwoMenus, 2)
}

