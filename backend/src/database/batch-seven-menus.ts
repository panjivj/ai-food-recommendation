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
  apel: { code: 'ER004', label: 'Apel Segar' },
  arbai: { code: 'ER005', label: 'Arbai' },
  ayamKalasan: {
    allergens: ['soy'],
    code: 'FP024',
    label: 'Ayam Kalasan',
  },
  bebek: { code: 'FP003', label: 'Bebek Goreng' },
  biwah: { code: 'ER007', label: 'Biwah' },
  buahMentega: { code: 'ER011', label: 'Buah Mentega' },
  buahNagaPutih: { code: 'ER013', label: 'Buah Naga Putih' },
  cumi: {
    allergens: ['shellfish'],
    code: 'GP003',
    label: 'Cumi',
  },
  daunKolSawi: { code: 'DR042', label: 'Daun Kol Sawi Segar' },
  daunLabuSiam: {
    code: 'DR046',
    label: 'Daun Labu Siam Segar',
  },
  daunOyong: { code: 'DR058', label: 'Daun Oyong Segar' },
  daunPakis: { code: 'DR059', label: 'Daun Pakis Segar' },
  durian: { code: 'ER023', label: 'Durian' },
  duwet: { code: 'ER024', label: 'Duwet' },
  gambas: { code: 'DR083', label: 'Gambas Segar' },
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
  jerukBanjar: { code: 'ER036', label: 'Jeruk Banjar' },
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
  labuSiam: { code: 'DR123', label: 'Labu Siam Segar' },
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
  rebung: { code: 'DR138', label: 'Rebung Segar' },
  roti: {
    allergens: ['wheat'],
    code: 'AP024',
    label: 'Roti',
  },
  sawi: { code: 'DR141', label: 'Sawi Segar' },
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
  terong: { code: 'DR154', label: 'Terong Segar' },
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
    fruit: foods.durian,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangMerahSegar,
    fruit: foods.duwet,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangTolo,
    fruit: foods.biwah,
  },
  {
    staple: foods.talasBogor,
    protein: foods.tahu,
    fruit: foods.buahMentega,
  },
  {
    staple: foods.ubiKuning,
    protein: foods.kacangGude,
    fruit: foods.buahNagaPutih,
  },
  {
    staple: foods.ubiUngu,
    stapleWeight: 120,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.arbai,
  },
  {
    staple: foods.singkong,
    protein: foods.kacangTolo,
    fruit: foods.jerukBanjar,
  },
  {
    staple: foods.jagungMuda,
    stapleWeight: 120,
    protein: foods.kacangMerah,
    fruit: foods.durian,
  },
  {
    staple: foods.jagungPipil,
    stapleWeight: 120,
    protein: foods.kacangMerahSegar,
    fruit: foods.duwet,
  },
  {
    staple: foods.roti,
    stapleWeight: 60,
    protein: foods.susuSkim,
    proteinRole: 'beverage',
    proteinWeight: 200,
    fruit: foods.biwah,
  },
  {
    staple: foods.ubiKelapa,
    protein: foods.kacangGude,
    fruit: foods.buahMentega,
  },
  {
    staple: foods.ubiRebus,
    stapleWeight: 120,
    protein: foods.tahu,
    fruit: foods.buahNagaPutih,
  },
  {
    staple: foods.talasBelitung,
    protein: foods.yoghurt,
    proteinRole: 'beverage',
    proteinWeight: 150,
    fruit: foods.arbai,
  },
  {
    staple: foods.suweg,
    protein: foods.kacangMerah,
    fruit: foods.jerukBanjar,
  },
  {
    staple: foods.ubiGadung,
    protein: foods.kacangTolo,
    fruit: foods.durian,
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
  foods.daunKolSawi,
  foods.daunLabuSiam,
  foods.daunOyong,
  foods.daunPakis,
  foods.gambas,
  foods.labuSiam,
  foods.rebung,
  foods.sawi,
  foods.terong,
  foods.daunKolSawi,
  foods.daunLabuSiam,
  foods.daunOyong,
  foods.daunPakis,
  foods.gambas,
  foods.labuSiam,
  foods.rebung,
  foods.sawi,
  foods.terong,
] as const

const dinnerVegetables = [
  foods.daunLabuSiam,
  foods.daunOyong,
  foods.daunPakis,
  foods.gambas,
  foods.labuSiam,
  foods.rebung,
  foods.sawi,
  foods.terong,
  foods.daunKolSawi,
  foods.daunLabuSiam,
  foods.daunOyong,
  foods.daunPakis,
  foods.gambas,
  foods.labuSiam,
  foods.rebung,
  foods.sawi,
  foods.terong,
  foods.daunKolSawi,
] as const

const lunches: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasi : foods.nasiMerah,
  protein,
  proteinWeight: proteinWeights[index] ?? 80,
  vegetable: lunchVegetables[index] ?? foods.daunKolSawi,
  fruit: foods.arbai,
}))

const dinners: readonly MainSpec[] = proteins.map((protein, index) => ({
  staple: index % 2 === 0 ? foods.nasiMerah : foods.nasi,
  protein,
  proteinWeight: Math.max((proteinWeights[index] ?? 80) - 5, 55),
  vegetable: dinnerVegetables[index] ?? foods.daunLabuSiam,
  fruit: foods.jerukBanjar,
}))

const snacks: readonly SnackSpec[] = [
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.arbai,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.yoghurt,
    firstWeight: 100,
    firstRole: 'beverage',
    second: foods.jerukBanjar,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiUngu,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.durian,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.talasBogor,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.duwet,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerah,
    firstWeight: 50,
    firstRole: 'protein',
    second: foods.buahNagaPutih,
    secondWeight: 120,
    secondRole: 'fruit',
  },
  {
    first: foods.kacangMerahSegar,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.biwah,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.jagungMuda,
    firstWeight: 100,
    firstRole: 'staple',
    second: foods.buahMentega,
    secondWeight: 100,
    secondRole: 'fruit',
  },
  {
    first: foods.ubiKelapa,
    firstWeight: 80,
    firstRole: 'staple',
    second: foods.arbai,
    secondWeight: 150,
    secondRole: 'fruit',
  },
  {
    first: foods.tahu,
    firstWeight: 60,
    firstRole: 'protein',
    second: foods.jerukBanjar,
    secondWeight: 120,
    secondRole: 'fruit',
  },
]

export const batchSevenMenus: readonly MenuSeed[] = createBatchMenus({
  batchNumber: 7,
  breakfasts,
  lunches,
  dinners,
  snacks,
})

export function seedBatchSevenMenus(database: AppDatabase): MenuSeedResult {
  if (batchSevenMenus.length !== 60) {
    throw new Error(
      `Expected 60 Batch 7 menus, received ${batchSevenMenus.length}`,
    )
  }

  return seedMenus(database, batchSevenMenus, 7)
}
