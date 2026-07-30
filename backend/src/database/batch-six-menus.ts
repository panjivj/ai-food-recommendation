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
  alpukat: { code: 'ER001', label: 'Alpukat' },
  ayamKalasan: {
    allergens: ['soy'],
    code: 'FP024',
    label: 'Ayam Kalasan',
  },
  bebek: { code: 'FP003', label: 'Bebek Goreng' },
  beberuk: { code: 'DP026', label: 'Beberuk' },
  cempedak: { code: 'ER021', label: 'Cempedak' },
  cumi: {
    allergens: ['shellfish'],
    code: 'GP003',
    label: 'Cumi',
  },
  duku: { code: 'ER022', label: 'Duku' },
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
  jambuBol: { code: 'ER033', label: 'Jambu Bol' },
  kacangBelimbing: { code: 'CP001', label: 'Kacang Belimbing' },
  kacangGude: { code: 'CP004', label: 'Kacang Gude' },
  kacangMerah: { code: 'CP008', label: 'Kacang Merah' },
  kacangMerahSegar: {
    code: 'CP009',
    label: 'Kacang Merah Segar',
  },
  kacangTolo: { code: 'CP014', label: 'Kacang Tolo' },
  kaparende: { code: 'DP036', label: 'Sayur Kaparende' },
  kedelai: {
    allergens: ['soy'],
    code: 'CP007',
    label: 'Kedelai Rebus',
  },
  kesemek: { code: 'ER048', label: 'Kesemek' },
  langsat: { code: 'ER051', label: 'Langsat' },
  lilinGedi: { code: 'DP041', label: 'Lilin Bungkus Gedi' },
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
  nangka: { code: 'ER071', label: 'Nangka' },
  nasi: { code: 'AP001', label: 'Nasi' },
  nasiMerah: { code: 'AP005', label: 'Nasi Merah' },
  rebungAsam: { code: 'DP040', label: 'Rebung Asam' },
  roti: {
    allergens: ['wheat'],
    code: 'AP024',
    label: 'Roti',
  },
  sayurBungaPepaya: {
    code: 'DP048',
    label: 'Sayur Bunga Pepaya',
  },
  sayurLilin: { code: 'DP051', label: 'Sayur Lilin Terubuk' },
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
  tinira: { code: 'DP058', label: 'Tinira Ninahu Nggaluku' },
  ubiGadung: { code: 'BP006', label: 'Ubi Gadung' },
  ubiKelapa: { code: 'BP002', label: 'Ubi Kukus' },
  ubiKuning: { code: 'BP011', label: 'Ubi Kuning' },
  ubiRebus: { code: 'BP003', label: 'Ubi Rebus' },
  ubiUngu: { code: 'BP012', label: 'Ubi Ungu' },
  waluhBalamak: { code: 'DP060', label: 'Waluh Balamak' },
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
    fruit: foods.cempedak,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.duku,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.kesemek,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.langsat,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.nangka,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.alpukat,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.jambuBol,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.cempedak,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.duku,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.kesemek,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.langsat,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.nangka,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.alpukat,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.jambuBol,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.cempedak,
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
  75, 90, 90, 80, 90, 90, 80, 100, 60, 100, 100, 100, 100, 60, 70, 90, 80,
  80,
] as const

const lunchVegetables = [
  foods.beberuk,
  foods.kaparende,
  foods.rebungAsam,
  foods.lilinGedi,
  foods.sayurBungaPepaya,
  foods.sayurLilin,
  foods.tinira,
  foods.waluhBalamak,
  foods.beberuk,
  foods.kaparende,
  foods.rebungAsam,
  foods.lilinGedi,
  foods.sayurBungaPepaya,
  foods.sayurLilin,
  foods.tinira,
  foods.waluhBalamak,
  foods.beberuk,
  foods.rebungAsam,
] as const

const dinnerVegetables = [
  foods.kaparende,
  foods.rebungAsam,
  foods.lilinGedi,
  foods.sayurBungaPepaya,
  foods.sayurLilin,
  foods.tinira,
  foods.waluhBalamak,
  foods.beberuk,
  foods.kaparende,
  foods.rebungAsam,
  foods.lilinGedi,
  foods.sayurBungaPepaya,
  foods.sayurLilin,
  foods.tinira,
  foods.waluhBalamak,
  foods.beberuk,
  foods.rebungAsam,
  foods.sayurBungaPepaya,
] as const

const lunches: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.beberuk,
  fruit: foods.alpukat,
}))

const dinners: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight: Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.rebungAsam,
  fruit: foods.jambuBol,
}))

const snacks: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.alpukat,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.jambuBol,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.cempedak,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.duku,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.kesemek,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.langsat,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.jagungMuda,
    firstWeight: 100,
    firstRole: 'staple',
    second: foods.nangka,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiKelapa,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.alpukat,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.jambuBol,
    secondWeight: 120,
    secondRole: 'fruit',
  },
]

export const batchSixMenus: readonly MenuSeed[] = createBatchMenus({
  batchNumber: 6,
  breakfasts,
  lunches,
  dinners,
  snacks,
})

export function seedBatchSixMenus(database: AppDatabase): MenuSeedResult {
  if (batchSixMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 6 menus, received ${batchSixMenus.length}`,
    )
  }

  return seedMenus(database, batchSixMenus, 6)
}
