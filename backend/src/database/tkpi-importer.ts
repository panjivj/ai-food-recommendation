import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { z } from 'zod'

import type { AppDatabase } from './database.js'

const nullableNutrient = z.number().nonnegative().nullable()

const tkpiFoodSchema = z.object({
  kode: z.string().trim().min(1),
  jenis: z.enum(['TUNGGAL/SINGLE', 'OLAHAN/PRODUK/KOMPOSIT']),
  nama_bahan: z.string().trim().min(1),
  sumber: z.string().trim().min(1),
  air_g: nullableNutrient,
  energi_kal: nullableNutrient,
  protein_g: nullableNutrient,
  lemak_g: nullableNutrient,
  karbohidrat_g: nullableNutrient,
  serat_g: nullableNutrient,
  abu_g: nullableNutrient,
  kalsium_mg: nullableNutrient,
  fosfor_mg: nullableNutrient,
  besi_mg: nullableNutrient,
  natrium_mg: nullableNutrient,
  kalium_mg: nullableNutrient,
  tembaga_mg: nullableNutrient,
  seng_mg: nullableNutrient,
  retinol_mcg: nullableNutrient,
  beta_karoten_mcg: nullableNutrient,
  karoten_total_mcg: nullableNutrient,
  thiamin_mg: nullableNutrient,
  riboflavin_mg: nullableNutrient,
  niasin_mg: nullableNutrient,
  vitamin_c_mg: nullableNutrient,
  bdd_persen: z.number().min(0).max(100).nullable(),
})

const tkpiFileSchema = z
  .object({
    nomor_tabel: z.string().trim().min(1),
    nama_tabel: z.string().trim().min(1),
    sumber_dokumen: z.string().trim().min(1),
    basis_komposisi: z.string().trim().min(1),
    jumlah_data: z.number().int().nonnegative(),
    keterangan_nilai_kosong: z.string().trim().min(1),
    satuan: z.record(z.string(), z.string()),
    data: z.array(tkpiFoodSchema),
  })
  .refine((document) => document.jumlah_data === document.data.length, {
    message: 'jumlah_data does not match the data array length',
  })

type TkpiFood = z.infer<typeof tkpiFoodSchema>
type TkpiFile = z.infer<typeof tkpiFileSchema>

export interface TkpiImportResult {
  categoryCount: number
  foodCount: number
  importedFiles: string[]
}

function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function slugify(value: string): string {
  return normalizeName(value).replace(/\s+/g, '-')
}

function recordHash(food: TkpiFood): string {
  return createHash('sha256').update(JSON.stringify(food)).digest('hex')
}

function readTkpiFile(filePath: string): TkpiFile {
  let source: unknown

  try {
    source = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read TKPI JSON ${filePath}`, { cause: error })
  }

  const parsed = tkpiFileSchema.safeParse(source)

  if (!parsed.success) {
    throw new Error(
      `Invalid TKPI JSON ${filePath}:\n${z.prettifyError(parsed.error)}`,
    )
  }

  return parsed.data
}

export function importTkpiDirectory(
  database: AppDatabase,
  directoryPath: string,
): TkpiImportResult {
  const resolvedDirectory = path.resolve(directoryPath)
  const files = fs
    .readdirSync(resolvedDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

  if (files.length === 0) {
    throw new Error(`No TKPI JSON files found in ${resolvedDirectory}`)
  }

  const documents = files.map((fileName) => ({
    document: readTkpiFile(path.join(resolvedDirectory, fileName)),
    fileName,
  }))
  const seenCodes = new Set<string>()

  for (const { document, fileName } of documents) {
    for (const food of document.data) {
      if (seenCodes.has(food.kode)) {
        throw new Error(
          `Duplicate TKPI code ${food.kode} found while reading ${fileName}`,
        )
      }

      seenCodes.add(food.kode)
    }
  }

  const upsertCategory = database.prepare(`
    INSERT INTO food_categories (
      source_table_number,
      name,
      slug,
      source_document,
      composition_basis,
      source_file
    )
    VALUES (
      @sourceTableNumber,
      @name,
      @slug,
      @sourceDocument,
      @compositionBasis,
      @sourceFile
    )
    ON CONFLICT(source_table_number) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      source_document = excluded.source_document,
      composition_basis = excluded.composition_basis,
      source_file = excluded.source_file,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    RETURNING id
  `)

  const upsertFood = database.prepare(`
    INSERT INTO food_ingredients (
      category_id,
      tkpi_code,
      name,
      normalized_name,
      item_type,
      source_reference,
      water_g,
      energy_kcal,
      protein_g,
      fat_g,
      carbohydrate_g,
      fiber_g,
      ash_g,
      calcium_mg,
      phosphorus_mg,
      iron_mg,
      sodium_mg,
      potassium_mg,
      copper_mg,
      zinc_mg,
      retinol_mcg,
      beta_carotene_mcg,
      total_carotene_mcg,
      thiamin_mg,
      riboflavin_mg,
      niacin_mg,
      vitamin_c_mg,
      edible_portion_percent,
      source_file,
      source_record_hash
    )
    VALUES (
      @categoryId,
      @code,
      @name,
      @normalizedName,
      @itemType,
      @sourceReference,
      @waterG,
      @energyKcal,
      @proteinG,
      @fatG,
      @carbohydrateG,
      @fiberG,
      @ashG,
      @calciumMg,
      @phosphorusMg,
      @ironMg,
      @sodiumMg,
      @potassiumMg,
      @copperMg,
      @zincMg,
      @retinolMcg,
      @betaCaroteneMcg,
      @totalCaroteneMcg,
      @thiaminMg,
      @riboflavinMg,
      @niacinMg,
      @vitaminCMg,
      @ediblePortionPercent,
      @sourceFile,
      @sourceRecordHash
    )
    ON CONFLICT(tkpi_code) DO UPDATE SET
      category_id = excluded.category_id,
      name = excluded.name,
      normalized_name = excluded.normalized_name,
      item_type = excluded.item_type,
      source_reference = excluded.source_reference,
      water_g = excluded.water_g,
      energy_kcal = excluded.energy_kcal,
      protein_g = excluded.protein_g,
      fat_g = excluded.fat_g,
      carbohydrate_g = excluded.carbohydrate_g,
      fiber_g = excluded.fiber_g,
      ash_g = excluded.ash_g,
      calcium_mg = excluded.calcium_mg,
      phosphorus_mg = excluded.phosphorus_mg,
      iron_mg = excluded.iron_mg,
      sodium_mg = excluded.sodium_mg,
      potassium_mg = excluded.potassium_mg,
      copper_mg = excluded.copper_mg,
      zinc_mg = excluded.zinc_mg,
      retinol_mcg = excluded.retinol_mcg,
      beta_carotene_mcg = excluded.beta_carotene_mcg,
      total_carotene_mcg = excluded.total_carotene_mcg,
      thiamin_mg = excluded.thiamin_mg,
      riboflavin_mg = excluded.riboflavin_mg,
      niacin_mg = excluded.niacin_mg,
      vitamin_c_mg = excluded.vitamin_c_mg,
      edible_portion_percent = excluded.edible_portion_percent,
      source_file = excluded.source_file,
      source_record_hash = excluded.source_record_hash,
      imported_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE food_ingredients.source_record_hash <> excluded.source_record_hash
      OR food_ingredients.category_id <> excluded.category_id
  `)

  const importDocuments = database.transaction(() => {
    for (const { document, fileName } of documents) {
      const category = upsertCategory.get({
        sourceTableNumber: document.nomor_tabel,
        name: document.nama_tabel,
        slug: slugify(document.nama_tabel),
        sourceDocument: document.sumber_dokumen,
        compositionBasis: document.basis_komposisi,
        sourceFile: fileName,
      }) as { id: number } | undefined

      if (!category) {
        throw new Error(`Unable to upsert category ${document.nomor_tabel}`)
      }

      for (const food of document.data) {
        upsertFood.run({
          categoryId: category.id,
          code: food.kode,
          name: food.nama_bahan,
          normalizedName: normalizeName(food.nama_bahan),
          itemType:
            food.jenis === 'TUNGGAL/SINGLE'
              ? 'single'
              : 'processed_composite',
          sourceReference: food.sumber,
          waterG: food.air_g,
          energyKcal: food.energi_kal,
          proteinG: food.protein_g,
          fatG: food.lemak_g,
          carbohydrateG: food.karbohidrat_g,
          fiberG: food.serat_g,
          ashG: food.abu_g,
          calciumMg: food.kalsium_mg,
          phosphorusMg: food.fosfor_mg,
          ironMg: food.besi_mg,
          sodiumMg: food.natrium_mg,
          potassiumMg: food.kalium_mg,
          copperMg: food.tembaga_mg,
          zincMg: food.seng_mg,
          retinolMcg: food.retinol_mcg,
          betaCaroteneMcg: food.beta_karoten_mcg,
          totalCaroteneMcg: food.karoten_total_mcg,
          thiaminMg: food.thiamin_mg,
          riboflavinMg: food.riboflavin_mg,
          niacinMg: food.niasin_mg,
          vitaminCMg: food.vitamin_c_mg,
          ediblePortionPercent: food.bdd_persen,
          sourceFile: fileName,
          sourceRecordHash: recordHash(food),
        })
      }
    }
  })

  importDocuments()

  return {
    categoryCount: documents.length,
    foodCount: seenCodes.size,
    importedFiles: files,
  }
}

