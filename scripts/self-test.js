const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeDatabase, rowToElement } = require('../server/db/database');

const db = initializeDatabase();
const count = Number(db.prepare('SELECT COUNT(*) AS count FROM elements').get().count);
assert.equal(count, 118, 'Database must contain 118 elements');

const h = rowToElement(db.prepare('SELECT * FROM elements WHERE number=1').get());
const fe = rowToElement(db.prepare('SELECT * FROM elements WHERE number=26').get());
const la = rowToElement(db.prepare('SELECT * FROM elements WHERE number=57').get());
const au = rowToElement(db.prepare('SELECT * FROM elements WHERE number=79').get());
const u = rowToElement(db.prepare('SELECT * FROM elements WHERE number=92').get());
const og = rowToElement(db.prepare('SELECT * FROM elements WHERE number=118').get());

assert.equal(h.symbol, 'H');
assert.equal(h.nameEn, 'Hydrogen');
assert.deepEqual(h.shells, [1]);
assert.equal(fe.symbol, 'Fe');
assert.deepEqual(fe.shells, [2,8,14,2]);
assert.equal(fe.representativeIsotopeMassNumber, 56);
assert.equal(fe.neutrons, 30);
assert.equal(la.period, 6, 'Lanthanum must have scientific period 6');
assert.equal(la.gridRow, 9, 'Lanthanide visual row is separate from scientific period');
assert.equal(au.representativeIsotopeMassNumber, 197);
assert.equal(u.period, 7);
assert.deepEqual(u.shells, [2,8,18,32,21,9,2]);
assert.equal(og.number, 118);
assert.equal(og.period, 7);
assert.equal(og.gridRow, 7);

assert.ok(Math.abs(h.density - 0.00008988) < 1e-10, 'Hydrogen density must come from the scientific snapshot');
assert.ok(Math.abs(fe.density - 7.874) < 1e-9, 'Iron density mismatch');
assert.ok(Math.abs(au.meltingPoint - 1337.33) < 1e-6, 'Gold melting point mismatch');
assert.equal(og.density, null, 'Unknown Oganesson density must remain null');
assert.equal(og.meltingPoint, null, 'Unknown Oganesson melting point must remain null');
assert.ok(String(og.electronConfig).toLowerCase().includes('predicted'), 'Oganesson config prediction must be labeled');
assert.ok(String(og.standardState).toLowerCase().includes('expected'), 'Oganesson standard state prediction must be labeled');

const seed = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','elements.seed.json'),'utf8'));
assert.equal(seed.length, 118);
assert.ok(seed.every(e => !String(e.electronConfig || '').includes('[Z=')), 'No generated [Z=] fake electron configs allowed');
assert.ok(seed.every(e => e.protons === e.number && e.electrons === e.number), 'Neutral atom p/e counts must match Z');
assert.ok(seed.every(e => e.density == null || Number.isFinite(e.density)), 'Density must be numeric or null');
assert.ok(seed.every(e => e.meltingPoint == null || Number.isFinite(e.meltingPoint)), 'Melting point must be numeric or null');
assert.ok(seed.every(e => e.boilingPoint == null || Number.isFinite(e.boilingPoint)), 'Boiling point must be numeric or null');

const html = fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
const jsFiles = ['constants.js', 'atom3d.js', 'Quiz.js', 'Compare.js', 'CompoundBuilder.js', 'PeriodicTable.js', 'App.js'];
const clientSource = [
  html,
  fs.readFileSync(path.join(__dirname,'..','public','css','style.css'),'utf8'),
  ...jsFiles.map(f => fs.readFileSync(path.join(__dirname,'..','public','js', f),'utf8'))
].join('\n');

assert.ok(clientSource.includes('el.gridColumn ?? el.group'));
assert.ok(!clientSource.includes('جامد (مصنوعی)'));
assert.ok(clientSource.includes('ایزوتوپ مرجع مدل'));
assert.ok(clientSource.includes('پیش‌بینی: گاز'));
assert.ok(clientSource.includes('حالت استاندارد منبع'));
assert.ok(clientSource.includes('requestAnimationFrame(initializeThree)'), '3D model must defer first WebGL init until layout is ready');
assert.ok(clientSource.includes('new ResizeObserver(resizeRenderer)'), '3D model must react to first-tab/container resize');
assert.ok(clientSource.includes('data-atom-3d-mount={element.number}'), '3D mount must expose atom identity for regression checks');
assert.ok(!clientSource.includes('}, [element, speed, isPaused]);'), '3D renderer must not be torn down on pause/speed changes');

// Modularity invariants
assert.ok(!html.includes('<style>'), 'index.html must not contain inline style tags');
assert.ok(html.includes('href="css/style.css"'), 'index.html must link external stylesheet');
assert.ok(html.includes('src="js/atom3d.js"'), 'index.html must import atom3d script');
assert.ok(html.includes('src="js/App.js"'), 'index.html must import App script');

// Enhanced functionality invariants
assert.ok(clientSource.includes('onTouchStart'), '3D atom renderer must support touch events for mobile');
assert.ok(clientSource.includes('shuffleArray'), 'Quiz must employ unbiased option shuffling');
assert.ok(clientSource.includes('inspector-drawer'), 'CSS and App must support responsive mobile drawer overlay');
assert.ok(clientSource.includes('id="searchInput"'), 'Periodic table must contain the search input bar');

// Verify public/js/components/ contains full functional components and no dummy stubs
const componentFiles = ['Quiz.js', 'Compare.js', 'PeriodicTable.js', 'CompoundBuilder.js'];
for (const comp of componentFiles) {
  const compContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'components', comp), 'utf8');
  assert.ok(!compContent.includes('document.createElement(\'script\')'), `components/${comp} must not be a dummy script stub`);
  assert.ok(compContent.length > 3000, `components/${comp} must contain complete component implementation`);
}

console.log('SELF-TEST OK');
console.log({ elements: count, sample: { H: h.atomicMass, Fe: fe.electronConfig, Au: au.atomicMass, U: u.electronConfig, Og: og.atomicMass } });
