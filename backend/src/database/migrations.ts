import { createHash } from 'node:crypto'

export interface Migration {
  version: number
  name: string
  sql: string
}

export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'initialize_database',
    sql: `
      CREATE TABLE app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO app_metadata (key, value)
      VALUES ('schema_initialized', 'true');
    `,
  },
  {
    version: 2,
    name: 'create_users',
    sql: `
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        )
      );
    `,
  },
  {
    version: 3,
    name: 'create_user_profiles',
    sql: `
      CREATE TABLE user_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        age INTEGER NOT NULL CHECK (age BETWEEN 13 AND 100),
        gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
        height_cm REAL NOT NULL CHECK (height_cm BETWEEN 100 AND 250),
        weight_kg REAL NOT NULL CHECK (weight_kg BETWEEN 30 AND 300),
        activity_level TEXT NOT NULL CHECK (
          activity_level IN ('low', 'moderate', 'high')
        ),
        goal TEXT NOT NULL CHECK (
          goal IN ('maintain', 'weight_loss', 'weight_gain')
        ),
        health_conditions TEXT NOT NULL DEFAULT '[]' CHECK (
          json_valid(health_conditions)
          AND json_type(health_conditions) = 'array'
        ),
        allergies TEXT NOT NULL DEFAULT '[]' CHECK (
          json_valid(allergies)
          AND json_type(allergies) = 'array'
        ),
        disliked_foods TEXT NOT NULL DEFAULT '[]' CHECK (
          json_valid(disliked_foods)
          AND json_type(disliked_foods) = 'array'
        ),
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `,
  },
  {
    version: 4,
    name: 'add_food_preferences_to_user_profiles',
    sql: `
      ALTER TABLE user_profiles
      ADD COLUMN food_preferences TEXT NOT NULL DEFAULT '[]' CHECK (
        json_valid(food_preferences)
        AND json_type(food_preferences) = 'array'
      );
    `,
  },
  {
    version: 5,
    name: 'create_food_catalog_and_menus',
    sql: `
      CREATE TABLE food_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_table_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        source_document TEXT NOT NULL,
        composition_basis TEXT NOT NULL,
        source_file TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        )
      );

      CREATE TABLE food_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        tkpi_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        item_type TEXT NOT NULL CHECK (
          item_type IN ('single', 'processed_composite')
        ),
        source_reference TEXT NOT NULL,
        water_g REAL CHECK (water_g IS NULL OR water_g >= 0),
        energy_kcal REAL CHECK (energy_kcal IS NULL OR energy_kcal >= 0),
        protein_g REAL CHECK (protein_g IS NULL OR protein_g >= 0),
        fat_g REAL CHECK (fat_g IS NULL OR fat_g >= 0),
        carbohydrate_g REAL CHECK (
          carbohydrate_g IS NULL OR carbohydrate_g >= 0
        ),
        fiber_g REAL CHECK (fiber_g IS NULL OR fiber_g >= 0),
        ash_g REAL CHECK (ash_g IS NULL OR ash_g >= 0),
        calcium_mg REAL CHECK (calcium_mg IS NULL OR calcium_mg >= 0),
        phosphorus_mg REAL CHECK (
          phosphorus_mg IS NULL OR phosphorus_mg >= 0
        ),
        iron_mg REAL CHECK (iron_mg IS NULL OR iron_mg >= 0),
        sodium_mg REAL CHECK (sodium_mg IS NULL OR sodium_mg >= 0),
        potassium_mg REAL CHECK (potassium_mg IS NULL OR potassium_mg >= 0),
        copper_mg REAL CHECK (copper_mg IS NULL OR copper_mg >= 0),
        zinc_mg REAL CHECK (zinc_mg IS NULL OR zinc_mg >= 0),
        retinol_mcg REAL CHECK (retinol_mcg IS NULL OR retinol_mcg >= 0),
        beta_carotene_mcg REAL CHECK (
          beta_carotene_mcg IS NULL OR beta_carotene_mcg >= 0
        ),
        total_carotene_mcg REAL CHECK (
          total_carotene_mcg IS NULL OR total_carotene_mcg >= 0
        ),
        thiamin_mg REAL CHECK (thiamin_mg IS NULL OR thiamin_mg >= 0),
        riboflavin_mg REAL CHECK (
          riboflavin_mg IS NULL OR riboflavin_mg >= 0
        ),
        niacin_mg REAL CHECK (niacin_mg IS NULL OR niacin_mg >= 0),
        vitamin_c_mg REAL CHECK (vitamin_c_mg IS NULL OR vitamin_c_mg >= 0),
        edible_portion_percent REAL CHECK (
          edible_portion_percent IS NULL
          OR edible_portion_percent BETWEEN 0 AND 100
        ),
        source_file TEXT NOT NULL,
        source_record_hash TEXT NOT NULL,
        imported_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        FOREIGN KEY (category_id) REFERENCES food_categories(id)
          ON DELETE RESTRICT
      );

      CREATE INDEX food_ingredients_category_idx
      ON food_ingredients(category_id);

      CREATE INDEX food_ingredients_normalized_name_idx
      ON food_ingredients(normalized_name);

      CREATE TABLE menus (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        meal_type TEXT NOT NULL CHECK (
          meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'all_day')
        ),
        serving_size_g REAL NOT NULL CHECK (serving_size_g > 0),
        serving_description TEXT NOT NULL,
        curation_status TEXT NOT NULL DEFAULT 'draft' CHECK (
          curation_status IN (
            'draft',
            'nutrition_validated',
            'approved',
            'archived'
          )
        ),
        is_pilot INTEGER NOT NULL DEFAULT 0 CHECK (is_pilot IN (0, 1)),
        nutrition_source TEXT NOT NULL,
        calculation_version TEXT NOT NULL DEFAULT 'tkpi-weighted-v1',
        curation_notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        )
      );

      CREATE INDEX menus_meal_type_status_idx
      ON menus(meal_type, curation_status);

      CREATE TABLE menu_ingredients (
        menu_id TEXT NOT NULL,
        food_ingredient_id INTEGER NOT NULL,
        amount_g REAL NOT NULL CHECK (amount_g > 0),
        component_role TEXT NOT NULL CHECK (
          component_role IN (
            'staple',
            'protein',
            'vegetable',
            'fruit',
            'beverage',
            'condiment',
            'complete_dish',
            'other'
          )
        ),
        preparation_note TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
        PRIMARY KEY (menu_id, food_ingredient_id),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY (food_ingredient_id) REFERENCES food_ingredients(id)
          ON DELETE RESTRICT
      );

      CREATE INDEX menu_ingredients_food_idx
      ON menu_ingredients(food_ingredient_id);

      CREATE TABLE menu_nutrition (
        menu_id TEXT PRIMARY KEY,
        water_g REAL,
        energy_kcal REAL,
        protein_g REAL,
        fat_g REAL,
        carbohydrate_g REAL,
        fiber_g REAL,
        ash_g REAL,
        calcium_mg REAL,
        phosphorus_mg REAL,
        iron_mg REAL,
        sodium_mg REAL,
        potassium_mg REAL,
        copper_mg REAL,
        zinc_mg REAL,
        retinol_mcg REAL,
        beta_carotene_mcg REAL,
        total_carotene_mcg REAL,
        thiamin_mg REAL,
        riboflavin_mg REAL,
        niacin_mg REAL,
        vitamin_c_mg REAL,
        calculated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );

      CREATE TABLE menu_tags (
        menu_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (menu_id, tag),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );

      CREATE INDEX menu_tags_tag_idx ON menu_tags(tag);

      CREATE TABLE menu_allergens (
        menu_id TEXT NOT NULL,
        allergen TEXT NOT NULL CHECK (
          allergen IN (
            'egg',
            'fish',
            'milk',
            'peanut',
            'shellfish',
            'soy',
            'tree_nut',
            'wheat',
            'other'
          )
        ),
        evidence TEXT NOT NULL,
        PRIMARY KEY (menu_id, allergen),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );

      CREATE TABLE menu_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_id TEXT NOT NULL,
        reviewer TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (
          decision IN ('pending', 'approved', 'changes_requested')
        ),
        notes TEXT NOT NULL DEFAULT '',
        reviewed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );

      CREATE INDEX menu_reviews_menu_idx ON menu_reviews(menu_id);
    `,
  },
  {
    version: 6,
    name: 'enforce_unique_menus_and_curation_batches',
    sql: `
      ALTER TABLE menus
      ADD COLUMN curation_batch INTEGER NOT NULL DEFAULT 0 CHECK (
        curation_batch >= 0
      );

      UPDATE menus
      SET curation_batch = 1
      WHERE is_pilot = 1;

      CREATE UNIQUE INDEX menus_normalized_name_unique_idx
      ON menus(LOWER(TRIM(name)));

      CREATE TABLE menu_component_signatures (
        menu_id TEXT PRIMARY KEY,
        signature TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );
    `,
  },
  {
    version: 7,
    name: 'enforce_unique_menu_ingredient_sets',
    sql: `
      CREATE TABLE menu_component_signatures_new (
        menu_id TEXT PRIMARY KEY,
        signature TEXT NOT NULL UNIQUE,
        ingredient_set_signature TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
      );

      INSERT INTO menu_component_signatures_new (
        menu_id,
        signature,
        ingredient_set_signature,
        created_at,
        updated_at
      )
      SELECT
        existing.menu_id,
        existing.signature,
        (
          SELECT GROUP_CONCAT(ordered.tkpi_code, '|')
          FROM (
            SELECT food.tkpi_code
            FROM menu_ingredients component
            JOIN food_ingredients food
              ON food.id = component.food_ingredient_id
            WHERE component.menu_id = existing.menu_id
            ORDER BY food.tkpi_code
          ) ordered
        ),
        existing.created_at,
        existing.updated_at
      FROM menu_component_signatures existing;

      DROP TABLE menu_component_signatures;

      ALTER TABLE menu_component_signatures_new
      RENAME TO menu_component_signatures;
    `,
  },
  {
    version: 8,
    name: 'create_daily_recommendation_snapshots',
    sql: `
      CREATE TABLE recommendations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        recommendation_date TEXT NOT NULL,
        daily_target_calories REAL NOT NULL CHECK (
          daily_target_calories > 0
        ),
        total_recommended_calories REAL NOT NULL CHECK (
          total_recommended_calories >= 0
        ),
        difference_from_daily_target_calories REAL NOT NULL,
        filter_stats_json TEXT NOT NULL CHECK (
          json_valid(filter_stats_json)
          AND json_type(filter_stats_json) = 'object'
        ),
        applied_profile_rules_json TEXT NOT NULL CHECK (
          json_valid(applied_profile_rules_json)
          AND json_type(applied_profile_rules_json) = 'object'
        ),
        strategy_json TEXT NOT NULL CHECK (
          json_valid(strategy_json)
          AND json_type(strategy_json) = 'object'
        ),
        warnings_json TEXT NOT NULL CHECK (
          json_valid(warnings_json)
          AND json_type(warnings_json) = 'array'
        ),
        generated_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        UNIQUE (user_id, recommendation_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX recommendations_user_date_idx
      ON recommendations(user_id, recommendation_date DESC);

      CREATE TABLE recommendation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recommendation_id TEXT NOT NULL,
        meal_type TEXT NOT NULL CHECK (
          meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')
        ),
        position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 3),
        target_calories REAL NOT NULL CHECK (target_calories > 0),
        menu_id_snapshot TEXT NOT NULL,
        menu_snapshot_json TEXT NOT NULL CHECK (
          json_valid(menu_snapshot_json)
          AND json_type(menu_snapshot_json) = 'object'
        ),
        score_json TEXT NOT NULL CHECK (
          json_valid(score_json)
          AND json_type(score_json) = 'object'
        ),
        reasons_json TEXT NOT NULL CHECK (
          json_valid(reasons_json)
          AND json_type(reasons_json) = 'array'
        ),
        replaced_at TEXT,
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        UNIQUE (recommendation_id, meal_type),
        UNIQUE (recommendation_id, position),
        UNIQUE (recommendation_id, menu_id_snapshot),
        FOREIGN KEY (recommendation_id)
          REFERENCES recommendations(id) ON DELETE CASCADE
      );

      CREATE INDEX recommendation_items_recommendation_idx
      ON recommendation_items(recommendation_id, position);
    `,
  },
  {
    version: 9,
    name: 'create_user_menu_feedback',
    sql: `
      CREATE TABLE user_menu_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        menu_id TEXT NOT NULL,
        liked INTEGER NOT NULL DEFAULT 0 CHECK (liked IN (0, 1)),
        disliked INTEGER NOT NULL DEFAULT 0 CHECK (disliked IN (0, 1)),
        consumed INTEGER NOT NULL DEFAULT 0 CHECK (consumed IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        updated_at TEXT NOT NULL DEFAULT (
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ),
        CHECK (NOT (liked = 1 AND disliked = 1)),
        UNIQUE (user_id, menu_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX user_menu_feedback_disliked_idx
      ON user_menu_feedback(user_id, disliked)
      WHERE disliked = 1;

      CREATE INDEX user_menu_feedback_liked_idx
      ON user_menu_feedback(user_id, liked)
      WHERE liked = 1;

      CREATE INDEX user_menu_feedback_consumed_idx
      ON user_menu_feedback(user_id, consumed)
      WHERE consumed = 1;

      ALTER TABLE recommendations
      ADD COLUMN applied_feedback_rules_json TEXT NOT NULL DEFAULT (
        '{"likedMenuIds":[],"dislikedMenuIds":[],"consumedMenuIds":[]}'
      ) CHECK (
        json_valid(applied_feedback_rules_json)
        AND json_type(applied_feedback_rules_json) = 'object'
      );
    `,
  },
]

export function migrationChecksum(migration: Migration): string {
  return createHash('sha256')
    .update(`${migration.version}:${migration.name}:${migration.sql}`)
    .digest('hex')
}
