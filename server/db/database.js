const fs = require('node:fs');
const path = require('node:path');

// Dynamically select SQLite engine (prefer better-sqlite3, fallback to node:sqlite)
let DatabaseClient;
let engineName = 'better-sqlite3';

try {
  DatabaseClient = require('better-sqlite3');
} catch (err) {
  const { DatabaseSync } = require('node:sqlite');
  DatabaseClient = DatabaseSync;
  engineName = 'node:sqlite';
}

const ROOT_DIR = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
function resolveProjectPath(givenPath, defaultPath) {
  if (!givenPath) return defaultPath;
  return path.isAbsolute(givenPath) ? givenPath : path.resolve(ROOT_DIR, givenPath);
}

const DB_PATH = resolveProjectPath(process.env.DB_PATH, path.join(DATA_DIR, 'periodic_table.db'));
const SCHEMA_VERSION = 3;

// Find seed file candidate
function getSeedFilePath() {
  if (process.env.SEED_PATH) {
    const candidate = resolveProjectPath(process.env.SEED_PATH, '');
    if (fs.existsSync(candidate)) return candidate;
  }
  const primaryJson = path.join(DATA_DIR, 'elements.json');
  if (fs.existsSync(primaryJson)) {
    return primaryJson;
  }
  const fallbackSeed = path.join(DATA_DIR, 'elements.seed.json');
  if (fs.existsSync(fallbackSeed)) {
    return fallbackSeed;
  }
  return primaryJson;
}

const SEED_PATH = getSeedFilePath();

/**
 * Executes a SQLite statement and PRAGMA configurations
 */
function applyPragmas(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA cache_size = -64000;');
  db.exec('PRAGMA temp_store = MEMORY;');
}

/**
 * Creates standard database schema and indices
 */
function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS elements (
      number INTEGER PRIMARY KEY,
      symbol TEXT NOT NULL UNIQUE,
      name_fa TEXT NOT NULL,
      name_en TEXT NOT NULL,
      group_number INTEGER,
      period INTEGER NOT NULL,
      grid_column INTEGER NOT NULL,
      grid_row INTEGER NOT NULL,
      category TEXT NOT NULL,
      block TEXT NOT NULL,
      color TEXT,
      atomic_mass REAL,
      density REAL,
      melting_point REAL,
      boiling_point REAL,
      standard_state TEXT,
      electron_config TEXT,
      electron_config_full TEXT,
      shells_json TEXT NOT NULL,
      protons INTEGER NOT NULL,
      electrons INTEGER NOT NULL,
      representative_isotope_mass_number INTEGER,
      neutrons INTEGER,
      neutron_note TEXT,
      electronegativity REAL,
      ionization_energy REAL,
      electron_affinity REAL,
      atomic_radius REAL,
      covalent_radius REAL,
      van_der_waals_radius REAL,
      oxidation_states TEXT,
      discovered_by TEXT,
      year_discovered TEXT,
      is_radioactive INTEGER,
      is_synthetic INTEGER,
      is_predicted INTEGER DEFAULT 0,
      data_quality TEXT,
      data_source TEXT,
      source_url TEXT,
      trivia TEXT,
      uses_text TEXT,
      applications_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_elements_symbol ON elements(symbol);
    CREATE INDEX IF NOT EXISTS idx_elements_name_fa ON elements(name_fa);
    CREATE INDEX IF NOT EXISTS idx_elements_name_en ON elements(name_en);
    CREATE INDEX IF NOT EXISTS idx_elements_category ON elements(category);
    CREATE INDEX IF NOT EXISTS idx_elements_group ON elements(group_number);
    CREATE INDEX IF NOT EXISTS idx_elements_period ON elements(period);
    CREATE INDEX IF NOT EXISTS idx_elements_block ON elements(block);
    CREATE INDEX IF NOT EXISTS idx_elements_standard_state ON elements(standard_state);
  `);
}

/**
 * Prepares the element insertion statement
 */
function prepareInsertStatement(db) {
  const placeholders = Array(42).fill('?').join(',');
  return db.prepare(`
    INSERT INTO elements (
      number, symbol, name_fa, name_en, group_number, period, grid_column, grid_row,
      category, block, color, atomic_mass, density, melting_point, boiling_point,
      standard_state, electron_config, electron_config_full, shells_json,
      protons, electrons, representative_isotope_mass_number, neutrons, neutron_note,
      electronegativity, ionization_energy, electron_affinity, atomic_radius,
      covalent_radius, van_der_waals_radius, oxidation_states, discovered_by,
      year_discovered, is_radioactive, is_synthetic, is_predicted, data_quality,
      data_source, source_url, trivia, uses_text, applications_json
    ) VALUES (${placeholders})
  `);
}

/**
 * Validates scientific data integrity and runs single element insertion
 */
function insertElementRow(stmt, el) {
  // Check if properties indicate predicted or theoretical values
  const isPredictedFlag = Boolean(
    el.isPredicted ||
    el.predicted ||
    (el.number >= 100 && (el.meltingPoint === null || el.density === null)) ||
    (typeof el.electronConfig === 'string' && el.electronConfig.toLowerCase().includes('predicted')) ||
    (typeof el.standardState === 'string' && el.standardState.toLowerCase().includes('expected'))
  );

  stmt.run(
    el.number,
    el.symbol,
    el.nameFa,
    el.nameEn,
    el.group ?? null,
    el.period,
    el.gridColumn,
    el.gridRow,
    el.category,
    el.block,
    el.color ?? null,
    el.atomicMass ?? null,
    el.density ?? null,
    el.meltingPoint ?? null,
    el.boilingPoint ?? null,
    el.standardState ?? null,
    el.electronConfig ?? null,
    el.electronConfigFull ?? null,
    JSON.stringify(el.shells ?? []),
    el.protons ?? el.number,
    el.electrons ?? el.number,
    el.representativeIsotopeMassNumber ?? null,
    el.neutrons ?? null,
    el.neutronNote ?? null,
    el.electronegativity ?? null,
    el.ionizationEnergy ?? null,
    el.electronAffinity ?? null,
    el.atomicRadius ?? null,
    el.covalentRadius ?? null,
    el.vanDerWaalsRadius ?? null,
    el.oxidationStates ?? null,
    el.discoveredBy ?? null,
    el.yearDiscovered == null ? null : String(el.yearDiscovered),
    el.isRadioactive == null ? null : Number(Boolean(el.isRadioactive)),
    el.isSynthetic == null ? null : Number(Boolean(el.isSynthetic)),
    isPredictedFlag ? 1 : 0,
    el.dataQuality ?? null,
    el.dataSource ?? null,
    el.sourceUrl ?? null,
    el.trivia ?? null,
    el.usesText ?? null,
    JSON.stringify(el.applications ?? {})
  );
}

/**
 * Reads reference JSON and seeds all 118 elements into database
 */
function seedDatabase(db, seedFilePath = getSeedFilePath()) {
  if (!fs.existsSync(seedFilePath)) {
    throw new Error(`Reference seed file not found: ${seedFilePath}`);
  }

  const raw = fs.readFileSync(seedFilePath, 'utf8');
  const elements = JSON.parse(raw);

  if (!Array.isArray(elements) || elements.length !== 118) {
    throw new Error(`Seed data must contain exactly 118 elements. Found: ${elements?.length}`);
  }

  const insertStmt = prepareInsertStatement(db);

  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec('DELETE FROM elements;');
    for (const el of elements) {
      insertElementRow(insertStmt, el);
    }
    db.prepare(`
      INSERT INTO metadata(key, value) VALUES('schema_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `).run(String(SCHEMA_VERSION));

    db.prepare(`
      INSERT INTO metadata(key, value) VALUES('seeded_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `).run(new Date().toISOString());

    db.prepare(`
      INSERT INTO metadata(key, value) VALUES('elements_count', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `).run(String(elements.length));

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Parses numeric or textual year discovered
 */
function parseYear(value) {
  if (value == null || value === '') return null;
  return /^-?\d+$/.test(String(value)) ? Number(value) : value;
}

/**
 * Converts a database row to standard domain element object
 */
function rowToElement(row) {
  if (!row) return null;

  const isPredicted = Boolean(
    row.is_predicted ||
    (row.number >= 100 && (row.melting_point === null || row.density === null)) ||
    (row.electron_config && row.electron_config.toLowerCase().includes('predicted')) ||
    (row.standard_state && row.standard_state.toLowerCase().includes('expected'))
  );

  return {
    number: row.number,
    symbol: row.symbol,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    group: row.group_number,
    period: row.period,
    gridColumn: row.grid_column,
    gridRow: row.grid_row,
    category: row.category,
    block: row.block,
    color: row.color,
    atomicMass: row.atomic_mass,
    density: row.density,
    meltingPoint: row.melting_point,
    boilingPoint: row.boiling_point,
    standardState: row.standard_state,
    electronConfig: row.electron_config,
    electronConfigFull: row.electron_config_full,
    shells: JSON.parse(row.shells_json || '[]'),
    protons: row.protons,
    electrons: row.electrons,
    representativeIsotopeMassNumber: row.representative_isotope_mass_number,
    neutrons: row.neutrons,
    neutronNote: row.neutron_note,
    electronegativity: row.electronegativity,
    ionizationEnergy: row.ionization_energy,
    electronAffinity: row.electron_affinity,
    atomicRadius: row.atomic_radius,
    covalentRadius: row.covalent_radius,
    vanDerWaalsRadius: row.van_der_waals_radius,
    oxidationStates: row.oxidation_states,
    discoveredBy: row.discovered_by,
    yearDiscovered: parseYear(row.year_discovered),
    isRadioactive: row.is_radioactive == null ? null : Boolean(row.is_radioactive),
    isSynthetic: row.is_synthetic == null ? null : Boolean(row.is_synthetic),
    isPredicted,
    predicted: isPredicted,
    dataQuality: row.data_quality,
    dataSource: row.data_source,
    sourceUrl: row.source_url,
    trivia: row.trivia,
    usesText: row.uses_text,
    applications: JSON.parse(row.applications_json || '{}')
  };
}

let activeDatabaseInstance = null;

/**
 * Initializes SQLite database connection, applies PRAGMAs,
 * creates schema, and automatically seeds if the database file or tables are absent.
 */
function initializeDatabase(customPath = DB_PATH) {
  const targetPath = customPath || DB_PATH;
  const isInMemory = targetPath === ':memory:';

  if (!isInMemory) {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  }

  const fileExistedBefore = !isInMemory && fs.existsSync(targetPath);
  const db = new DatabaseClient(targetPath);

  applyPragmas(db);
  createSchema(db);

  let needsSeed = !fileExistedBefore;
  if (!needsSeed) {
    try {
      const row = db.prepare('SELECT COUNT(*) AS count FROM elements').get();
      needsSeed = !row || Number(row.count) < 118;
    } catch {
      needsSeed = true;
    }
  }

  if (needsSeed) {
    seedDatabase(db);
  }

  activeDatabaseInstance = db;
  return db;
}

const CATEGORY_MAP = {
  // alkali-metal
  'alkali-metal': 'alkali-metal',
  'alkali': 'alkali-metal',
  'فلز قلیایی': 'alkali-metal',
  'فلزات قلیایی': 'alkali-metal',
  'قلیایی': 'alkali-metal',

  // alkaline-earth
  'alkaline-earth': 'alkaline-earth',
  'alkaline-earth-metal': 'alkaline-earth',
  'alkaline': 'alkaline-earth',
  'فلز قلیایی خاکی': 'alkaline-earth',
  'فلزات قلیایی خاکی': 'alkaline-earth',
  'قلیایی خاکی': 'alkaline-earth',

  // transition-metal
  'transition-metal': 'transition-metal',
  'transition': 'transition-metal',
  'فلز واسطه': 'transition-metal',
  'فلزات واسطه': 'transition-metal',
  'واسطه': 'transition-metal',

  // post-transition-metal
  'post-transition-metal': 'post-transition-metal',
  'post-transition': 'post-transition-metal',
  'فلز پس‌واسطه': 'post-transition-metal',
  'فلزات پس‌واسطه': 'post-transition-metal',
  'پس‌واسطه': 'post-transition-metal',
  'پس واسطه': 'post-transition-metal',

  // metalloid
  'metalloid': 'metalloid',
  'شبه‌فلز': 'metalloid',
  'شبه‌فلزات': 'metalloid',
  'شبه فلز': 'metalloid',
  'شبه فلزات': 'metalloid',

  // reactive-nonmetal
  'reactive-nonmetal': 'reactive-nonmetal',
  'nonmetal': 'reactive-nonmetal',
  'نافلز': 'reactive-nonmetal',
  'نافلزات': 'reactive-nonmetal',
  'نافلز فعال': 'reactive-nonmetal',
  'نافلزهای فعال': 'reactive-nonmetal',
  'نافلزهای واکنش‌پذیر': 'reactive-nonmetal',

  // halogen
  'halogen': 'halogen',
  'halogens': 'halogen',
  'هالوژن': 'halogen',
  'هالوژن‌ها': 'halogen',
  'هالوژن ها': 'halogen',

  // noble-gas
  'noble-gas': 'noble-gas',
  'noble-gases': 'noble-gas',
  'noble': 'noble-gas',
  'گاز نجیب': 'noble-gas',
  'گازهای نجیب': 'noble-gas',

  // lanthanide
  'lanthanide': 'lanthanide',
  'lanthanides': 'lanthanide',
  'lanthanoid': 'lanthanide',
  'لانتانید': 'lanthanide',
  'لانتانیدها': 'lanthanide',
  'لانتانید ها': 'lanthanide',

  // actinide
  'actinide': 'actinide',
  'actinides': 'actinide',
  'actinoid': 'actinide',
  'اکتینید': 'actinide',
  'اکتینیدها': 'actinide',
  'اکتینید ها': 'actinide',
};

/**
 * Checks if a SQLite database instance is open
 */
function isDbOpen(db) {
  if (!db) return false;
  if (typeof db.open === 'boolean') return db.open;
  if (typeof db.isOpen === 'boolean') return db.isOpen;
  return true;
}

/**
 * Retrieves the current active database singleton, initializing if needed
 */
function getDatabase() {
  if (!activeDatabaseInstance || !isDbOpen(activeDatabaseInstance)) {
    activeDatabaseInstance = initializeDatabase();
  }
  return activeDatabaseInstance;
}

/**
 * Gracefully closes the database instance
 */
function closeDatabase() {
  if (activeDatabaseInstance) {
    try {
      activeDatabaseInstance.close();
    } catch (err) {
      // Ignore if already closed
    }
    activeDatabaseInstance = null;
  }
}

/**
 * Calculates thermodynamic phase ('solid', 'liquid', 'gas', or 'unknown') of an element at a specified Kelvin temperature.
 */
function getElementPhaseAtKelvin(el, tempK) {
  if (!el || !Number.isFinite(tempK) || tempK < 0) return 'unknown';
  const melt = Number.isFinite(el.meltingPoint) ? el.meltingPoint : null;
  const boil = Number.isFinite(el.boilingPoint) ? el.boilingPoint : null;

  if (melt !== null && boil !== null) {
    if (tempK < melt) return 'solid';
    if (tempK < boil) return 'liquid';
    return 'gas';
  }

  if (melt !== null && tempK < melt) return 'solid';
  if (boil !== null && tempK >= boil) return 'gas';

  if (Math.abs(tempK - 298.15) <= 5 && el.standardState) {
    const state = String(el.standardState).toLowerCase();
    if (state.includes('solid')) return 'solid';
    if (state.includes('liquid')) return 'liquid';
    if (state.includes('gas')) return 'gas';
  }

  return 'unknown';
}

/**
 * Queries all elements with optional category, phase, block, period, and temperature filters
 */
function getAllElements(filters = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM elements WHERE 1=1';
  const params = [];

  if (filters.category) {
    const rawCat = filters.category.trim().toLowerCase();
    const normalizedCat = CATEGORY_MAP[rawCat] || rawCat;
    sql += ' AND LOWER(category) = LOWER(?)';
    params.push(normalizedCat);
  }

  if (filters.block) {
    const rawBlock = filters.block.trim().toLowerCase().replace(/^بلوک\s*/, '');
    sql += ' AND LOWER(block) = LOWER(?)';
    params.push(rawBlock);
  }

  if (filters.period) {
    sql += ' AND period = ?';
    params.push(Number(filters.period));
  }

  if (filters.group) {
    sql += ' AND group_number = ?';
    params.push(Number(filters.group));
  }

  const hasTempFilter = filters.temperature !== undefined && filters.temperature !== null && filters.temperature !== '';
  const tempK = hasTempFilter ? parseFloat(filters.temperature) : null;
  const isDynamicTemp = Number.isFinite(tempK);

  // If no temperature is specified, use static standard_state phase filter in SQL
  if (filters.phase && !isDynamicTemp) {
    const p = filters.phase.trim().toLowerCase();
    if (p === 'gas' || p === 'گاز') {
      sql += " AND (LOWER(standard_state) LIKE '%gas%' OR standard_state LIKE '%گاز%')";
    } else if (p === 'liquid' || p === 'مایع') {
      sql += " AND (LOWER(standard_state) LIKE '%liquid%' OR standard_state LIKE '%مایع%')";
    } else if (p === 'solid' || p === 'جامد') {
      sql += " AND (LOWER(standard_state) LIKE '%solid%' OR standard_state LIKE '%جامد%')";
    } else {
      sql += ' AND LOWER(standard_state) LIKE ?';
      params.push(`%${p}%`);
    }
  }

  if (filters.search || filters.q) {
    const q = (filters.search || filters.q).trim();
    if (q) {
      sql += ` AND (
        name_fa LIKE ? COLLATE NOCASE
        OR name_en LIKE ? COLLATE NOCASE
        OR symbol LIKE ? COLLATE NOCASE
        OR CAST(number AS TEXT) = ?
      )`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, q);
    }
  }

  sql += ' ORDER BY number ASC';
  const rows = db.prepare(sql).all(...params);
  let elements = rows.map(rowToElement);

  // Dynamic Kelvin temperature phase simulation
  if (isDynamicTemp) {
    elements = elements.map(el => {
      const phaseAtTemp = getElementPhaseAtKelvin(el, tempK);
      return { ...el, phaseAtTemp };
    });

    if (filters.phase) {
      const p = filters.phase.trim().toLowerCase();
      let targetPhase = p;
      if (p === 'گاز' || p === 'gas') targetPhase = 'gas';
      else if (p === 'مایع' || p === 'liquid') targetPhase = 'liquid';
      else if (p === 'جامد' || p === 'solid') targetPhase = 'solid';

      elements = elements.filter(el => el.phaseAtTemp === targetPhase);
    }
  }

  return elements;
}

/**
 * Queries single element by atomic number, symbol, or name
 */
function getElementById(idOrSymbol) {
  const db = getDatabase();
  if (idOrSymbol == null) return null;

  const raw = String(idOrSymbol).trim();
  if (!raw) return null;

  const num = Number(raw);

  let row = null;
  if (Number.isInteger(num) && num >= 1 && num <= 118) {
    row = db.prepare('SELECT * FROM elements WHERE number = ?').get(num);
  }

  if (!row) {
    row = db.prepare('SELECT * FROM elements WHERE LOWER(symbol) = LOWER(?)').get(raw);
  }

  if (!row) {
    row = db.prepare('SELECT * FROM elements WHERE LOWER(name_en) = LOWER(?)').get(raw);
  }

  if (!row) {
    row = db.prepare('SELECT * FROM elements WHERE name_fa = ?').get(raw);
  }

  return rowToElement(row);
}

/**
 * Queries multiple elements by an array of numbers, symbols, or names (deduplicated)
 */
function getElementsByIds(identifiers = []) {
  if (!Array.isArray(identifiers) || identifiers.length === 0) return [];
  const results = [];
  const seenNumbers = new Set();
  for (const id of identifiers) {
    if (id == null || String(id).trim() === '') continue;
    const el = getElementById(id);
    if (el && !seenNumbers.has(el.number)) {
      seenNumbers.add(el.number);
      results.push(el);
    }
  }
  return results;
}

/**
 * Searches elements by query keyword
 */
function searchElements(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const db = getDatabase();
  const pattern = `%${q}%`;
  const rows = db.prepare(`
    SELECT * FROM elements
    WHERE name_fa LIKE ? COLLATE NOCASE
       OR name_en LIKE ? COLLATE NOCASE
       OR symbol LIKE ? COLLATE NOCASE
       OR CAST(number AS TEXT) = ?
    ORDER BY number ASC
    LIMIT 20
  `).all(pattern, pattern, pattern, q);
  return rows.map(rowToElement);
}

module.exports = {
  DB_PATH,
  SEED_PATH,
  SCHEMA_VERSION,
  engineName,
  applyPragmas,
  createSchema,
  seedDatabase,
  initializeDatabase,
  getDatabase,
  closeDatabase,
  rowToElement,
  getAllElements,
  getElementById,
  getElementsByIds,
  searchElements,
  getElementPhaseAtKelvin,
  // Backward-compatibility aliases for legacy scripts
  replaceAllElements: (db, elements) => {
    const insert = prepareInsertStatement(db);
    db.exec('BEGIN TRANSACTION;');
    try {
      db.exec('DELETE FROM elements;');
      for (const el of elements) insertElementRow(insert, el);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },
  CATEGORY_MAP
};

if (require.main === module) {
  console.log('--- Smart Periodic Table Database Initializer ---');
  console.log(`Engine: ${engineName}`);
  console.log(`Target database: ${DB_PATH}`);
  const db = initializeDatabase();
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM elements').get();
  console.log(`Elements verified: ${countRow ? countRow.count : 0}/118`);
  closeDatabase();
}
