import type { AppDatabase } from './database.js'
import {
  createBatchMenus,
  type BreakfastSpec,
  type FoodChoice,
  type MainSpec,
  type SnackSpec,
} from './menu-batch-factory.js'
import {
  seedMenus,
  type MenuSeed,
  type MenuSeedResult,
} from './menu-seeder.js'

const foods = {
  ayamKalasan: {
    allergens: ['soy'],
    code: 'FP024',
    label: 'Ayam Kalasan',
  },
  bebek: { code: 'FP003', label: 'Bebek Goreng' },
  cumi: {
    allergens: ['shellfish'],
    code: 'GP003',
    label: 'Cumi',
  },
  daunPaku: { code: 'DR062', label: 'Daun Paku Segar' },
  daunPakisLonggiho: {
    code: 'DR060',
    label: 'Daun Pakis Longgiho Segar',
  },
  daunPakisWambateu: {
    code: 'DR061',
    label: 'Daun Pakis Wambateu Segar',
  },
  daunPare: { code: 'DR064', label: 'Daun Pare Segar' },
  daunPepaya: { code: 'DR065', label: 'Daun Pepaya Segar' },
  daunSelasih: { code: 'DR067', label: 'Daun Selasih Segar' },
  daunSemanggi: { code: 'DR068', label: 'Daun Semanggi Segar' },
  daunSingkong: { code: 'DR071', label: 'Daun Singkong Segar' },
  daunSintrong: { code: 'DR075', label: 'Daun Sintrong Segar' },
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
  kacangBelimbing: { code: 'CP001', label: 'Kacang Belimbing' },
  kacangGude: { code: 'CP004', label: 'Kacang Gude' },
  kacangMerah: { code: 'CP008', label: 'Kacang Merah' },
  kacangMerahSegar: {
    code: 'CP009',
    label: 'Kacang Merah Segar',
  },
  kacangTolo: { code: 'CP014', label: 'Kacang Tolo' },
  kedelai: {
    allergens: ['soy'],
    code: 'CP007',
    label: 'Kedelai Rebus',
  },
  manggaIndramayu: {
    code: 'ER059',
    label: 'Mangga Indramayu',
  },
  manggaKopek: { code: 'ER060', label: 'Mangga Kopek' },
  manggaMuda: { code: 'ER063', label: 'Mangga Muda' },
  matoa: { code: 'ER066', label: 'Matoa' },
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
  nanas: { code: 'ER070', label: 'Nanas Segar' },
  nasi: { code: 'AP001', label: 'Nasi' },
  nasiMerah: { code: 'AP005', label: 'Nasi Merah' },
  pisangAngleng: {
    code: 'ER075',
    label: 'Pisang Angleng',
  },
  pisangAyam: { code: 'ER076', label: 'Pisang Ayam' },
  pisangGapi: { code: 'ER077', label: 'Pisang Gapi' },
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

const breakfasts: readonly BreakfastSpec[] = [
  {
    staple: foods.talasBelitung,
    protein: foods.kacangMerah,
    fruit: foods.pisangGapi,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.pisangAyam,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.pisangAngleng,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.manggaKopek,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.manggaMuda,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.manggaIndramayu,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.matoa,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.pisangGapi,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.pisangAyam,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.pisangAngleng,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.manggaKopek,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.manggaMuda,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.manggaIndramayu,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.matoa,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.pisangGapi,
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
  80, 90, 90, 80, 90, 90, 80, 100, 60, 100, 100, 100, 100, 50, 70, 90, 80,
  80,
] as const

const lunchVegetables = [
  foods.daunPakisLonggiho,
  foods.daunPakisWambateu,
  foods.daunPaku,
  foods.daunPare,
  foods.daunPepaya,
  foods.daunSelasih,
  foods.daunSemanggi,
  foods.daunSingkong,
  foods.daunSintrong,
  foods.daunPakisLonggiho,
  foods.daunPakisWambateu,
  foods.daunPaku,
  foods.daunPare,
  foods.daunPepaya,
  foods.daunSelasih,
  foods.daunSemanggi,
  foods.daunSingkong,
  foods.daunSintrong,
] as const

const dinnerVegetables = [
  foods.daunPakisWambateu,
  foods.daunPaku,
  foods.daunPare,
  foods.daunPepaya,
  foods.daunSelasih,
  foods.daunSemanggi,
  foods.daunSingkong,
  foods.daunSintrong,
  foods.daunPakisLonggiho,
  foods.daunPakisWambateu,
  foods.daunPaku,
  foods.daunPare,
  foods.daunPepaya,
  foods.daunSelasih,
  foods.daunSemanggi,
  foods.daunSingkong,
  foods.daunSintrong,
  foods.daunPakisLonggiho,
] as const

const lunches: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.daunPakisLonggiho,
  fruit: foods.manggaIndramayu,
}))

const dinners: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight:
    index === 13
      ? 50
      : Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.daunPakisWambateu,
  fruit: foods.matoa,
}))

const snacks: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.manggaIndramayu,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.matoa,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.pisangGapi,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.pisangAyam,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.pisangAngleng,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.manggaMuda,
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
    second: foods.manggaIndramayu,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.matoa,
    secondWeight: 120,
    secondRole: 'fruit',
  },
]

export const batchTenMenus: readonly MenuSeed[] = createBatchMenus({
  batchNumber: 10,
  breakfasts,
  lunches,
  dinners,
  snacks,
})

export function seedBatchTenMenus(database: AppDatabase): MenuSeedResult {
  if (batchTenMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 10 menus, received ${batchTenMenus.length}`,
    )
  }

  return seedMenus(database, batchTenMenus, 10)
}
