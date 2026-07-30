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
  daunKecipir: { code: 'DR036', label: 'Daun Kecipir Segar' },
  daunKemang: { code: 'DR039', label: 'Daun Kemang Segar' },
  daunKenikir: { code: 'DR040', label: 'Daun Kenikir Segar' },
  daunKesum: { code: 'DR041', label: 'Daun Kesum Segar' },
  daunKubis: { code: 'DR044', label: 'Daun Kubis Segar' },
  daunLabuWaluh: {
    code: 'DR047',
    label: 'Daun Labu Waluh Segar',
  },
  daunLeilem: { code: 'DR049', label: 'Daun Leilem Segar' },
  daunLobak: { code: 'DR051', label: 'Daun Lobak Segar' },
  daunLompong: {
    code: 'DR052',
    label: 'Daun Lompong Talas Segar',
  },
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
  kemang: { code: 'ER047', label: 'Kemang' },
  kokosan: { code: 'ER049', label: 'Kokosan' },
  manggaBenggala: {
    code: 'ER055',
    label: 'Mangga Benggala',
  },
  manggaGedung: { code: 'ER056', label: 'Mangga Gedung' },
  manggaGolek: { code: 'ER057', label: 'Mangga Golek' },
  manggaHarumanis: {
    code: 'ER058',
    label: 'Mangga Harumanis',
  },
  manggaKwini: { code: 'ER061', label: 'Mangga Kwini' },
  manggaManalagi: {
    code: 'ER062',
    label: 'Mangga Manalagi',
  },
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
    fruit: foods.manggaManalagi,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.manggaKwini,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.kokosan,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.manggaGedung,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.manggaGolek,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.kemang,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.manggaBenggala,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.manggaManalagi,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.manggaKwini,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.kokosan,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.manggaGedung,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.manggaGolek,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.kemang,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.manggaBenggala,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.manggaManalagi,
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
  80, 90, 90, 80, 90, 90, 80, 100, 60, 100, 100, 100, 100, 60, 70, 90, 80,
  80,
] as const

const lunchVegetables = [
  foods.daunKecipir,
  foods.daunKemang,
  foods.daunKenikir,
  foods.daunKesum,
  foods.daunKubis,
  foods.daunLabuWaluh,
  foods.daunLeilem,
  foods.daunLobak,
  foods.daunLompong,
  foods.daunKecipir,
  foods.daunKemang,
  foods.daunKenikir,
  foods.daunKesum,
  foods.daunKubis,
  foods.daunLabuWaluh,
  foods.daunLeilem,
  foods.daunLobak,
  foods.daunLompong,
] as const

const dinnerVegetables = [
  foods.daunKemang,
  foods.daunKenikir,
  foods.daunKesum,
  foods.daunKubis,
  foods.daunLabuWaluh,
  foods.daunLeilem,
  foods.daunLobak,
  foods.daunLompong,
  foods.daunKecipir,
  foods.daunKemang,
  foods.daunKenikir,
  foods.daunKesum,
  foods.daunKubis,
  foods.daunLabuWaluh,
  foods.daunLeilem,
  foods.daunLobak,
  foods.daunLompong,
  foods.daunKecipir,
] as const

const lunches: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.daunKecipir,
  fruit: foods.kemang,
}))

const dinners: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight: Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.daunKemang,
  fruit: foods.manggaBenggala,
}))

const snacks: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.kemang,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.manggaBenggala,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.manggaManalagi,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.kokosan,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.manggaGedung,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.manggaGolek,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.jagungMuda,
    firstWeight: 100,
    firstRole: 'staple',
    second: foods.manggaHarumanis,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiKelapa,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.kemang,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.manggaBenggala,
    secondWeight: 120,
    secondRole: 'fruit',
  },
]

export const batchNineMenus: readonly MenuSeed[] = createBatchMenus({
  batchNumber: 9,
  breakfasts,
  lunches,
  dinners,
  snacks,
})

export function seedBatchNineMenus(database: AppDatabase): MenuSeedResult {
  if (batchNineMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 9 menus, received ${batchNineMenus.length}`,
    )
  }

  return seedMenus(database, batchNineMenus, 9)
}
