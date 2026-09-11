/**
 * Smart Periodic Table - Database Seeding & Schema Provisioning Script
 * 
 * Responsibilities:
 * - Reads canonical scientific datasets from data/elements.json (or fallback data/elements.seed.json).
 * - Applies production SQLite performance PRAGMAs (WAL mode, Foreign Keys, Synchronous NORMAL, 64MB Cache).
 * - Creates standard database schema, tables (elements, metadata), and indices if not already present.
 * - Atomically seeds all 118 IUPAC elements within a transactional block.
 * - Supports CLI execution (`npm run seed`) and programmatic invocation (`ensureDatabaseSeeded()`).
 */

const fs = require('node:fs');
const path = require('node:path');
const {
  DB_PATH,
  SEED_PATH,
  initializeDatabase,
  closeDatabase,
  seedDatabase,
  getDatabase
} = require('../server/db/database');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

/**
 * Ensures the database file exists and is populated with all 118 elements.
 * If the database file is missing or incomplete, it initializes and seeds automatically.
 * @param {object} options
 * @param {boolean} options.forceReset - If true, removes existing DB and rebuilds from scratch.
 * @returns {object} Database instance and element count.
 */
function runSeed(options = {}) {
  const { forceReset = false } = options;

  if (forceReset) {
    console.log('[Seed] Force reset requested. Purging existing database artifacts...');
    closeDatabase();
    for (const suffix of ['', '-shm', '-wal']) {
      const targetFile = DB_PATH + suffix;
      try {
        if (fs.existsSync(targetFile)) {
          fs.rmSync(targetFile, { force: true });
        }
      } catch (err) {
        console.warn(`[Seed] Warning removing ${targetFile}:`, err.message);
      }
    }
  }

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Verify source dataset file exists
  if (!fs.existsSync(SEED_PATH)) {
    throw new Error(`[Seed Error] Seed dataset not found at: ${SEED_PATH}`);
  }

  console.log(`[Seed] Target database: ${DB_PATH}`);
  console.log(`[Seed] Source dataset:  ${SEED_PATH}`);

  // Initialize connection and trigger auto-seed if needed
  const db = initializeDatabase(DB_PATH);

  // If force reset was not run but manual seeding was invoked, ensure tables are seeded
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM elements').get();
  const currentCount = countRow ? Number(countRow.count) : 0;

  if (currentCount < 118) {
    console.log(`[Seed] Incomplete dataset detected (${currentCount}/118). Seeding database...`);
    seedDatabase(db, SEED_PATH);
  }

  const finalCountRow = db.prepare('SELECT COUNT(*) AS count FROM elements').get();
  const totalElements = finalCountRow ? Number(finalCountRow.count) : 0;

  if (totalElements !== 118) {
    throw new Error(`[Seed Error] Verification failed. Expected 118 elements, found: ${totalElements}`);
  }

  console.log(`[Seed] ✓ Database successfully verified: 118/118 elements populated.`);
  return { db, count: totalElements };
}

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes('--reset') || args.includes('--force') || true; // Default npm run seed to clean seed

  try {
    const { count } = runSeed({ forceReset: force });
    console.log(`=======================================================`);
    console.log(`  Smart Periodic Table SQLite Database Ready`);
    console.log(`  Location: ${DB_PATH}`);
    console.log(`  Records:  ${count} Verified Elements`);
    console.log(`=======================================================`);
    closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error.message);
    closeDatabase();
    process.exit(1);
  }
}

module.exports = {
  runSeed,
  ensureDatabaseSeeded: () => runSeed({ forceReset: false })
};
