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
  bayamMerah: { code: 'DR009', label: 'Bayam Merah Segar' },
  bebek: { code: 'FP003', label: 'Bebek Goreng' },
  bit: { code: 'DR010', label: 'Bit Segar' },
  buncis: { code: 'DR013', label: 'Buncis Segar' },
  bungaPepaya: { code: 'DR014', label: 'Bunga Pepaya Segar' },
  bungaTuri: { code: 'DR015', label: 'Bunga Turi Segar' },
  caisin: { code: 'DR016', label: 'Caisin Segar' },
  cumi: {
    allergens: ['shellfish'],
    code: 'GP003',
    label: 'Cumi',
  },
  daunGelang: { code: 'DR025', label: 'Daun Gelang Segar' },
  daunKatuk: { code: 'DR035', label: 'Daun Katuk Segar' },
  daunKelor: { code: 'DR038', label: 'Daun Kelor Segar' },
  embacang: { code: 'ER025', label: 'Embacang' },
  erbis: { code: 'ER027', label: 'Erbis' },
  gandaria: { code: 'ER028', label: 'Gandaria' },
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
  jambuMonyet: { code: 'ER034', label: 'Jambu Monyet' },
  jambuPutih: {
    code: 'ER032',
    label: 'Jambu Biji Putih Tanpa Biji',
  },
  jerukKeprok: { code: 'ER037', label: 'Jeruk Keprok' },
  kacangBelimbing: { code: 'CP001', label: 'Kacang Belimbing' },
  kacangGude: { code: 'CP004', label: 'Kacang Gude' },
  kacangMerah: { code: 'CP008', label: 'Kacang Merah' },
  kacangMerahSegar: {
    code: 'CP009',
    label: 'Kacang Merah Segar',
  },
  kacangTolo: { code: 'CP014', label: 'Kacang Tolo' },
  kawista: { code: 'ER042', label: 'Kawista' },
  kedelai: {
    allergens: ['soy'],
    code: 'CP007',
    label: 'Kedelai Rebus',
  },
  kelapaMuda: {
    code: 'ER046',
    label: 'Daging Kelapa Muda',
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
    fruit: foods.kawista,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.gandaria,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.erbis,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.jambuPutih,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.jambuMonyet,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.embacang,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.jerukKeprok,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.kawista,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.gandaria,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.erbis,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.jambuPutih,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.jambuMonyet,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.embacang,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.jerukKeprok,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.kawista,
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
  foods.bayamMerah,
  foods.bit,
  foods.buncis,
  foods.bungaPepaya,
  foods.bungaTuri,
  foods.caisin,
  foods.daunGelang,
  foods.daunKatuk,
  foods.caisin,
  foods.daunKelor,
  foods.bayamMerah,
  foods.bit,
  foods.buncis,
  foods.bungaPepaya,
  foods.bungaTuri,
  foods.daunGelang,
  foods.daunKatuk,
  foods.daunKelor,
] as const

const dinnerVegetables = [
  foods.bit,
  foods.buncis,
  foods.bungaPepaya,
  foods.bungaTuri,
  foods.caisin,
  foods.daunGelang,
  foods.daunKatuk,
  foods.bayamMerah,
  foods.caisin,
  foods.daunKelor,
  foods.bit,
  foods.buncis,
  foods.bungaPepaya,
  foods.bungaTuri,
  foods.daunGelang,
  foods.daunKatuk,
  foods.daunKelor,
  foods.bayamMerah,
] as const

const lunches: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.bayamMerah,
  fruit: foods.embacang,
}))

const dinners: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight: Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.bit,
  fruit: foods.jerukKeprok,
}))

const snacks: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.embacang,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.jerukKeprok,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.kawista,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.gandaria,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.jambuPutih,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.jambuMonyet,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.jagungMuda,
    firstWeight: 100,
    firstRole: 'staple',
    second: foods.kelapaMuda,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiKelapa,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.embacang,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.jerukKeprok,
    secondWeight: 120,
    secondRole: 'fruit',
  },
]

export const batchEightMenus: readonly MenuSeed[] = createBatchMenus({
  batchNumber: 8,
  breakfasts,
  lunches,
  dinners,
  snacks,
})

export function seedBatchEightMenus(database: AppDatabase): MenuSeedResult {
  if (batchEightMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 8 menus, received ${batchEightMenus.length}`,
    )
  }

  return seedMenus(database, batchEightMenus, 8)
}
