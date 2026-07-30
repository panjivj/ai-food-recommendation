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
  daunTalas: { code: 'DR076', label: 'Daun Talas Segar' },
  daunTespong: { code: 'DR077', label: 'Daun Tespong Segar' },
  daunUbiKuning: {
    code: 'DR078',
    label: 'Daun Ubi Kuning Segar',
  },
  daunUbiMerah: {
    code: 'DR079',
    label: 'Daun Ubi Merah Segar',
  },
  daunUbiPutih: {
    code: 'DR080',
    label: 'Daun Ubi Putih Segar',
  },
  daunUbiTinta: {
    code: 'DR081',
    label: 'Daun Ubi Tinta Segar',
  },
  eceng: { code: 'DR082', label: 'Eceng Segar' },
  genjer: { code: 'DR084', label: 'Genjer Segar' },
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
  jamurKuping: { code: 'DR088', label: 'Jamur Kuping Segar' },
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
  pisangMasBali: {
    code: 'ER086',
    label: 'Pisang Mas Bali Kopang',
  },
  pisangRajaSereh: {
    code: 'ER088',
    label: 'Pisang Raja Sereh',
  },
  rambutan: { code: 'ER097', label: 'Rambutan' },
  rambutanBinjai: {
    code: 'ER096',
    label: 'Rambutan Binjai',
  },
  roti: {
    allergens: ['wheat'],
    code: 'AP024',
    label: 'Roti',
  },
  salak: { code: 'ER099', label: 'Salak Medan' },
  sawoDuren: { code: 'ER102', label: 'Sawo Duren' },
  sawoManila: { code: 'ER104', label: 'Sawo Manila' },
  singkong: { code: 'BP008', label: 'Singkong Kukus' },
  sirsak: { code: 'ER106', label: 'Sirsak' },
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
    fruit: foods.pisangMasBali,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.pisangRajaSereh,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.rambutanBinjai,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.salak,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.sawoDuren,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.rambutan,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.sirsak,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.pisangMasBali,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.pisangRajaSereh,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.rambutanBinjai,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.salak,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.sawoDuren,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.rambutan,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.sirsak,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.pisangMasBali,
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
  foods.daunTalas,
  foods.daunTespong,
  foods.daunUbiKuning,
  foods.daunUbiMerah,
  foods.daunUbiPutih,
  foods.daunUbiTinta,
  foods.eceng,
  foods.genjer,
  foods.jamurKuping,
  foods.daunTalas,
  foods.daunTespong,
  foods.daunUbiKuning,
  foods.daunUbiMerah,
  foods.daunUbiPutih,
  foods.daunUbiTinta,
  foods.eceng,
  foods.genjer,
  foods.jamurKuping,
] as const

const dinnerVegetables = [
  foods.daunTespong,
  foods.daunUbiKuning,
  foods.daunUbiMerah,
  foods.daunUbiPutih,
  foods.daunUbiTinta,
  foods.eceng,
  foods.genjer,
  foods.jamurKuping,
  foods.daunTalas,
  foods.daunTespong,
  foods.daunUbiKuning,
  foods.daunUbiMerah,
  foods.daunUbiPutih,
  foods.daunUbiTinta,
  foods.eceng,
  foods.genjer,
  foods.jamurKuping,
  foods.daunTalas,
] as const

const lunches: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.daunTalas,
  fruit: foods.rambutan,
}))

const dinners: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight:
    index === 13
      ? 50
      : Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.daunTespong,
  fruit: foods.sirsak,
}))

const snacks: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.rambutan,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.sirsak,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.pisangMasBali,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.pisangRajaSereh,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.rambutanBinjai,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.salak,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.jagungMuda,
    firstWeight: 100,
    firstRole: 'staple',
    second: foods.sawoManila,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiKelapa,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.rambutan,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.sirsak,
    secondWeight: 120,
    secondRole: 'fruit',
  },
]

export const batchElevenMenus: readonly MenuSeed[] = createBatchMenus({
  batchNumber: 11,
  breakfasts,
  lunches,
  dinners,
  snacks,
})

export function seedBatchElevenMenus(database: AppDatabase): MenuSeedResult {
  if (batchElevenMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 11 menus, received ${batchElevenMenus.length}`,
    )
  }

  return seedMenus(database, batchElevenMenus, 11)
}
