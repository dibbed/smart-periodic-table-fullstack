const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { initializeDatabase, closeDatabase, rowToElement, getAllElements, getElementById } = require('../server/db/database');
const { app, startServer } = require('../server/index');

console.log('--- RUNNING BACKEND ENTERPRISE VERIFICATION SUITE ---');

const ROOT = path.join(__dirname, '..');
const TEST_PORT = 3991;
const TEST_HOST = '127.0.0.1';

function request(urlPath, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const isPost = method === 'POST';
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: TEST_HOST,
      port: TEST_PORT,
      path: urlPath,
      method,
      headers: {
        'Accept': 'application/json',
        ...(isPost && payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (isPost && payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runBackendVerification() {
  // =========================================================================
  // 1. Database Auto-Seed Verification
  // =========================================================================
  console.log('1. Testing Auto-Seed & PRAGMA Settings...');
  const testDbFile = path.join(ROOT, 'data', 'temp_verify_autoseed.db');
  for (const suffix of ['', '-shm', '-wal']) {
    try { fs.rmSync(testDbFile + suffix, { force: true }); } catch {}
  }
  assert.ok(!fs.existsSync(testDbFile), 'Test database file must not exist prior to test');

  const testDb = initializeDatabase(testDbFile);
  assert.ok(fs.existsSync(testDbFile), 'Auto-seed must create physical database file');

  const walCheck = testDb.prepare('PRAGMA journal_mode;').get();
  assert.equal(walCheck.journal_mode.toLowerCase(), 'wal', 'Database must operate in WAL journal mode');

  const fkCheck = testDb.prepare('PRAGMA foreign_keys;').get();
  assert.equal(fkCheck.foreign_keys, 1, 'Database must have foreign keys enabled');

  const countRow = testDb.prepare('SELECT COUNT(*) AS c FROM elements').get();
  assert.equal(Number(countRow.c), 118, 'Auto-seed must populate exactly 118 elements');

  testDb.close();
  for (const suffix of ['', '-shm', '-wal']) {
    try { fs.rmSync(testDbFile + suffix, { force: true }); } catch {}
  }
  console.log('✓ Auto-Seed created database, set WAL mode, enabled foreign keys, and seeded 118 elements.');

  // =========================================================================
  // 2. Scientific Data Integrity Verification
  // =========================================================================
  console.log('2. Testing Scientific Data Integrity...');
  const db = initializeDatabase();
  const elements = getAllElements();

  assert.equal(elements.length, 118, 'Must retrieve exactly 118 elements');

  // Verify neutral atom physics: p == e == number
  assert.ok(
    elements.every(el => el.protons === el.number && el.electrons === el.number),
    'Every neutral atom must have protons == electrons == atomic number'
  );

  // Verify heavy element null safety (no fake estimates replacing unknown data)
  const oganesson = getElementById(118);
  assert.equal(oganesson.symbol, 'Og');
  assert.equal(oganesson.density, null, 'Oganesson density must be strictly null');
  assert.equal(oganesson.meltingPoint, null, 'Oganesson melting point must be strictly null');
  assert.equal(oganesson.boilingPoint, null, 'Oganesson boiling point must be strictly null');
  assert.ok(oganesson.isPredicted, 'Oganesson must have isPredicted flag set to true');

  const tennessine = getElementById(117);
  assert.equal(tennessine.density, null, 'Tennessine density must be strictly null');
  assert.ok(tennessine.isPredicted, 'Tennessine must be flagged as predicted');

  // Verify no synthetic fake electron configuration placeholders
  assert.ok(
    elements.every(el => !String(el.electronConfig || '').includes('[Z=')),
    'No generated [Z=] placeholders allowed'
  );
  console.log('✓ Scientific data integrity verified across all 118 elements.');

  // =========================================================================
  // 3. Start Test HTTP Server
  // =========================================================================
  const server = startServer(TEST_PORT, TEST_HOST);
  await new Promise(r => setTimeout(r, 200));

  try {
    // 3.1 Health Endpoint
    console.log('3. Testing GET /api/health...');
    const health = await request('/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, true);
    assert.equal(health.body.database, 'sqlite');
    assert.equal(health.body.elements, 118);
    console.log('✓ Health endpoint verified.');

    // 3.2 GET /api/elements with Category and Phase Filters
    console.log('4. Testing GET /api/elements filtering...');
    const allElRes = await request('/api/elements');
    assert.equal(allElRes.status, 200);
    assert.equal(allElRes.body.length, 118);

    // Filter by category: noble gases (He, Ne, Ar, Kr, Xe, Rn, Og = 7 elements)
    const nobleRes = await request('/api/elements?category=noble-gas');
    assert.equal(nobleRes.status, 200);
    assert.equal(nobleRes.body.length, 7);
    assert.ok(nobleRes.body.every(e => e.category === 'noble-gas'));

    // Filter by Persian category: گاز نجیب
    const faNobleRes = await request('/api/elements?category=%DA%AF%D8%A7%D8%B2%20%D9%86%D8%AC%DB%8C%D8%A8');
    assert.equal(faNobleRes.status, 200);
    assert.equal(faNobleRes.body.length, 7, 'Persian category گاز نجیب must return 7 elements');

    // Filter by Persian category: هالوژن
    const faHalogenRes = await request('/api/elements?category=%D9%87%D8%A7%D9%84%D9%88%DA%98%D9%86');
    assert.equal(faHalogenRes.status, 200);
    assert.equal(faHalogenRes.body.length, 6, 'Persian category هالوژن must return 6 elements');

    // Filter by category alias: post-transition vs post-transition-metal
    const ptAliasRes = await request('/api/elements?category=post-transition');
    assert.equal(ptAliasRes.status, 200);
    assert.equal(ptAliasRes.body.length, 12, 'Category alias post-transition must match all 12 post-transition metals');

    // Filter by phase: gas (H, He, N, O, F, Ne, Cl, Ar, Kr, Xe, Rn, Og = 12 elements)
    const gasRes = await request('/api/elements?phase=gas');
    assert.equal(gasRes.status, 200);
    assert.ok(gasRes.body.length >= 11, 'Must find gaseous elements');
    assert.ok(gasRes.body.some(e => e.symbol === 'He'));

    // Filter by Persian phase: گاز
    const faGasRes = await request('/api/elements?phase=%DA%AF%D8%A7%D8%B2');
    assert.equal(faGasRes.status, 200);
    assert.equal(faGasRes.body.length, gasRes.body.length, 'Persian phase query must match English query');

    // Filter by phase: liquid (Hg, Br = 2 elements)
    const liquidRes = await request('/api/elements?phase=liquid');
    assert.equal(liquidRes.status, 200);
    assert.ok(liquidRes.body.some(e => e.symbol === 'Hg'));
    assert.ok(liquidRes.body.some(e => e.symbol === 'Br'));
    console.log('✓ Category and phase filters verified (English, Persian, and aliases).');

    // 3.3 GET /api/elements/:id with Three.js electron configuration
    console.log('5. Testing GET /api/elements/:id and Three.js electron configuration...');
    const feRes = await request('/api/elements/26');
    assert.equal(feRes.status, 200);
    assert.equal(feRes.body.symbol, 'Fe');
    assert.equal(feRes.body.nameEn, 'Iron');
    assert.ok(feRes.body.threeJsConfig, 'Response must include threeJsConfig payload');
    assert.deepEqual(feRes.body.threeJsConfig.shells, [2, 8, 14, 2]);
    assert.equal(feRes.body.threeJsConfig.orbitals.length, 4);
    assert.equal(feRes.body.threeJsConfig.orbitals[0].shellLetter, 'K');
    assert.equal(feRes.body.threeJsConfig.orbitals[0].electronCount, 2);
    assert.ok(feRes.body.threeJsConfig.orbitals[0].radius > 0);
    assert.ok(feRes.body.threeJsConfig.orbitals[0].rotationSpeed > 0);

    // Query by symbol case-insensitive
    const auRes = await request('/api/elements/au');
    assert.equal(auRes.status, 200);
    assert.equal(auRes.body.symbol, 'Au');
    assert.equal(auRes.body.number, 79);

    // Query by English name
    const ironRes = await request('/api/elements/iron');
    assert.equal(ironRes.status, 200);
    assert.equal(ironRes.body.symbol, 'Fe');

    // Query by Persian name
    const ahanRes = await request('/api/elements/%D8%A2%D9%87%D9%86');
    assert.equal(ahanRes.status, 200);
    assert.equal(ahanRes.body.symbol, 'Fe');

    // 404 on nonexistent element
    const notFoundRes = await request('/api/elements/999');
    assert.equal(notFoundRes.status, 404);
    assert.ok(notFoundRes.body.error);
    console.log('✓ Single element details, name resolution, and Three.js orbital payload verified.');

    // 3.4 GET /api/quiz (Dynamic random question generation)
    console.log('6. Testing GET /api/quiz random question generation...');
    const quizRes = await request('/api/quiz?count=5');
    assert.equal(quizRes.status, 200);
    assert.equal(quizRes.body.length, 5);

    for (const q of quizRes.body) {
      assert.ok(q.id, 'Question must have id');
      assert.ok(q.question, 'Question must have question text');
      assert.ok(q.element, 'Question must have target element');
      assert.equal(q.options.length, 4, 'Question must have exactly 4 shuffled options');
      assert.ok(q.options.includes(q.correctAnswer), 'Options must include the correct answer');
      assert.ok(q.explanation, 'Question must have educational explanation');
    }

    // Specific mode quiz (symbol)
    const symbolQuizRes = await request('/api/quiz?count=3&type=symbol');
    assert.equal(symbolQuizRes.status, 200);
    assert.ok(symbolQuizRes.body.every(q => q.type === 'symbol'));

    // Specific mode quiz (name)
    const nameQuizRes = await request('/api/quiz?count=3&type=name');
    assert.equal(nameQuizRes.status, 200);
    assert.ok(nameQuizRes.body.every(q => q.type === 'name'));

    // Category quiz: verify Halogen and Post-transition translations are pure Persian
    const catQuizRes = await request('/api/quiz?count=50&type=category');
    assert.equal(catQuizRes.status, 200);
    for (const q of catQuizRes.body) {
      assert.ok(!q.options.includes('halogen'), 'Quiz options must not leak raw English category "halogen"');
      assert.ok(!q.options.includes('post-transition-metal'), 'Quiz options must not leak raw English category "post-transition-metal"');
      if (q.element.symbol === 'F' || q.element.symbol === 'Cl') {
        assert.equal(q.correctAnswer, 'هالوژن', 'Halogen correct answer must be translated to Persian "هالوژن"');
      }
      if (q.element.symbol === 'Al' || q.element.symbol === 'Pb') {
        assert.equal(q.correctAnswer, 'فلز پس‌واسطه', 'Post-transition correct answer must be translated to Persian "فلز پس‌واسطه"');
      }
    }
    console.log('✓ Dynamic quiz generation verified with Persian categories and name mode.');

    // 3.5 POST /api/compare (Multi-element comparison)
    console.log('7. Testing POST /api/compare...');
    const compRes = await request('/api/compare', 'POST', { ids: [1, 6, 26, 79] });
    assert.equal(compRes.status, 200);
    assert.equal(compRes.body.success, true);
    assert.equal(compRes.body.count, 4);
    assert.equal(compRes.body.elements.length, 4);
    assert.ok(compRes.body.comparison.atomicMass.available);
    assert.equal(compRes.body.comparison.atomicMass.max.symbol, 'Au');
    assert.equal(compRes.body.comparison.atomicMass.min.symbol, 'H');
    assert.ok(compRes.body.comparison.electronegativity.available);
    assert.ok(compRes.body.comparison.density.available);
    assert.ok(compRes.body.summary.length > 0);

    // Test comparison with symbols array
    const symbolCompRes = await request('/api/compare', 'POST', { symbols: ['H', 'He'] });
    assert.equal(symbolCompRes.status, 200);
    assert.equal(symbolCompRes.body.count, 2);

    // Test deduplication of requested elements
    const dedupCompRes = await request('/api/compare', 'POST', { ids: [26, 'fe', 'Iron', 26] });
    assert.equal(dedupCompRes.status, 200);
    assert.equal(dedupCompRes.body.count, 1, 'Duplicate element identifiers must be cleanly deduplicated');

    // Test partial unrecognized elements (should report in notFound without failing valid ones)
    const partialCompRes = await request('/api/compare', 'POST', { ids: [1, 'nonexistentElement'] });
    assert.equal(partialCompRes.status, 200);
    assert.equal(partialCompRes.body.count, 1);
    assert.deepEqual(partialCompRes.body.notFound, ['nonexistentElement']);

    // Test extreme boundary: 21 elements (>20 limit)
    const overflowCompRes = await request('/api/compare', 'POST', { ids: Array.from({ length: 21 }, (_, i) => i + 1) });
    assert.equal(overflowCompRes.status, 400);
    assert.ok(overflowCompRes.body.error.includes('maximum of 20'));

    // Bad request validation on empty body
    const emptyCompRes = await request('/api/compare', 'POST', {});
    assert.equal(emptyCompRes.status, 400);
    assert.ok(emptyCompRes.body.error);
    console.log('✓ Element comparison matrix, boundaries, deduplication, and metrics verified.');


    // 3.6 Security Headers and Centralized Error Handling
    console.log('8. Testing Security Headers & Error Handling...');
    const secHeaders = health.headers;
    assert.equal(secHeaders['x-content-type-options'], 'nosniff');
    assert.equal(secHeaders['x-frame-options'], 'SAMEORIGIN');
    assert.ok(secHeaders['access-control-allow-origin']);

    const errRes = await request('/api/nonexistent-route');
    assert.equal(errRes.status, 404);
    assert.ok(errRes.body.error.includes('not found'));
    console.log('✓ Security headers and centralized error handling verified.');

    console.log('======================================================');
    console.log('ALL BACKEND ENTERPRISE VERIFICATION TESTS PASSED (8/8)');
    console.log('======================================================');
  } finally {
    server.close();
  }
}

runBackendVerification().catch((err) => {
  console.error('BACKEND VERIFICATION FAILED:', err);
  process.exit(1);
});
