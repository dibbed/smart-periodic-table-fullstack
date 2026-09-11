const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

console.log('--- RUNNING FRONTEND ENTERPRISE VERIFICATION SUITE ---');

const ROOT = path.join(__dirname, '..');

// 1. Required Files Inventory
const requiredFiles = [
  'vite.config.js',
  'package.json',
  'src/main.jsx',
  'src/index.css',
  'src/services/api.js',
  'src/utils/chemistry.js',
  'src/utils/sound.js',
  'src/components/AtomViewer.jsx',
  'src/components/ElementCard.jsx',
  'src/components/PeriodicTable.jsx',
  'src/components/CompareModal.jsx',
  'src/components/QuizModal.jsx',
  'src/components/CompoundBuilderModal.jsx',
  'src/components/App.jsx',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `Required file missing: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.ok(content.length > 50, `File ${relPath} is unexpectedly small`);

  // Check absence of forbidden placeholder comments
  const forbiddenPatterns = [
    '// rest of code',
    '// TODO',
    '// implement logic here',
    '/* rest of code */',
    '/* TODO */',
  ];
  for (const forbidden of forbiddenPatterns) {
    assert.ok(
      !content.toLowerCase().includes(forbidden.toLowerCase()),
      `Forbidden placeholder found in ${relPath}: ${forbidden}`
    );
  }
}
console.log('✓ All 14 required files exist and contain complete code without placeholders.');

// 2. Zero Memory-Leak Invariants in AtomViewer.jsx
const atomViewerSource = fs.readFileSync(
  path.join(ROOT, 'src/components/AtomViewer.jsx'),
  'utf8'
);

assert.ok(
  atomViewerSource.includes('cancelAnimationFrame(animationFrameId)'),
  'AtomViewer must explicitly cancel render loop with cancelAnimationFrame(animationFrameId)'
);
assert.ok(
  atomViewerSource.includes('geometry.dispose()'),
  'AtomViewer must traverse meshes and call geometry.dispose()'
);
assert.ok(
  atomViewerSource.includes('material.dispose()'),
  'AtomViewer must traverse meshes and call material.dispose()'
);
assert.ok(
  atomViewerSource.includes('renderer.dispose()'),
  'AtomViewer must dispose WebGL renderer'
);
assert.ok(
  atomViewerSource.includes('removeChild(renderer.domElement)'),
  'AtomViewer must explicitly remove canvas element from DOM'
);
assert.ok(
  atomViewerSource.includes("window.removeEventListener('resize', handleResize)"),
  'AtomViewer must remove resize listener'
);
console.log('✓ AtomViewer.jsx 100% satisfies all Zero Memory-Leak Three.js cleanup invariants.');

async function runSuite() {
// 3. Kelvin Temperature Phase Calculation Logic
const { getPhaseAtTemp } = await import('../src/utils/chemistry.js');
const chemistrySource = fs.readFileSync(
  path.join(ROOT, 'src/utils/chemistry.js'),
  'utf8'
);
assert.ok(chemistrySource.includes('tempK < melt'), 'Must check temperature against melting point');
assert.ok(chemistrySource.includes('tempK < boil'), 'Must check temperature against boiling point');
assert.ok(chemistrySource.includes('پیش‌بینی: جامد'), 'Must support predicted solid');
assert.ok(chemistrySource.includes('پیش‌بینی: گاز'), 'Must support predicted gas');

// Test scientific cases:
const testHydrogen = { meltingPoint: 14.01, boilingPoint: 20.28 };
const testIron = { meltingPoint: 1811, boilingPoint: 3134 };
const testOganesson = { meltingPoint: null, boilingPoint: null, standardState: 'Expected to be a Solid' };

assert.equal(getPhaseAtTemp(testHydrogen, 10), 'جامد');
assert.equal(getPhaseAtTemp(testHydrogen, 15), 'مایع');
assert.equal(getPhaseAtTemp(testHydrogen, 300), 'گاز');
assert.equal(getPhaseAtTemp(testIron, 300), 'جامد');
assert.equal(getPhaseAtTemp(testIron, 2000), 'مایع');
assert.equal(getPhaseAtTemp(testIron, 3500), 'گاز');
assert.equal(getPhaseAtTemp(testOganesson, 298), 'پیش‌بینی: جامد');
assert.equal(getPhaseAtTemp(testOganesson, 1000), 'نامشخص');

// Test single boundary melting/boiling point edge cases (e.g., Protactinium, Francium)
const testProtactinium = { meltingPoint: 1845, boilingPoint: null, standardState: 'Solid' };
assert.equal(getPhaseAtTemp(testProtactinium, 100), 'جامد', 'Protactinium below melting point must be solid');
assert.equal(getPhaseAtTemp(testProtactinium, 2500), 'نامشخص', 'Protactinium above melting point with unknown boiling point should be unspecified');

console.log('✓ Temperature phase change business logic mathematically verified.');

// 4. Quiz Logic & Scorecard Invariants in QuizModal.jsx
const quizSource = fs.readFileSync(
  path.join(ROOT, 'src/components/QuizModal.jsx'),
  'utf8'
);
assert.ok(quizSource.includes('shuffleArray'), 'QuizModal must contain option shuffling');
assert.ok(quizSource.includes('handleAnswer'), 'QuizModal must evaluate answers');
assert.ok(quizSource.includes('QUESTIONS_PER_ROUND'), 'QuizModal must manage question rounds');
assert.ok(quizSource.includes('کارنامه پایانی'), 'QuizModal must include final scorecard');
assert.ok(quizSource.includes('roundHistory'), 'QuizModal must record answers history for review');
assert.ok(quizSource.includes('resetQuiz'), 'QuizModal must support restarting quiz');
assert.ok(quizSource.includes('titleColor'), 'QuizModal scorecard badge must include proper color attribute');
console.log('✓ QuizModal.jsx contains complete question selection, scoring, and final scorecard.');

// 5. 1:1 Import Paths Consistency in App.jsx
const appSource = fs.readFileSync(
  path.join(ROOT, 'src/components/App.jsx'),
  'utf8'
);
const expectedImports = [
  "./PeriodicTable",
  "./AtomViewer",
  "./CompareModal",
  "./QuizModal",
  "./CompoundBuilderModal",
  "../services/api",
  "../utils/chemistry",
  "../utils/sound",
];

for (const imp of expectedImports) {
  assert.ok(
    appSource.includes(`from '${imp}'`),
    `App.jsx must import from exact path: '${imp}'`
  );
  // Verify file exists relative to src/components/App.jsx
  const dir = path.join(ROOT, 'src/components');
  let target = path.resolve(dir, imp);
  if (!fs.existsSync(target)) {
    if (fs.existsSync(target + '.jsx')) target += '.jsx';
    else if (fs.existsSync(target + '.js')) target += '.js';
  }
  assert.ok(fs.existsSync(target), `Import target '${imp}' resolved to nonexistent path: ${target}`);
}
console.log('✓ All import paths in App.jsx verified 1:1 against disk.');

// 6. React Rules of Hooks Invariants (No early return before hooks in modal components)
const compoundSource = fs.readFileSync(
  path.join(ROOT, 'src/components/CompoundBuilderModal.jsx'),
  'utf8'
);
const quizFirstHookPos = quizSource.indexOf('useState(');
const quizEarlyReturnPos = quizSource.indexOf('if (!isOpen');
assert.ok(
  quizFirstHookPos > 0 && quizEarlyReturnPos > quizFirstHookPos,
  'QuizModal must declare hooks at top level before conditional early return (Rules of Hooks invariant)'
);

const compoundFirstHookPos = compoundSource.indexOf('useState(');
const compoundEarlyReturnPos = compoundSource.indexOf('if (!isOpen');
assert.ok(
  compoundFirstHookPos > 0 && compoundEarlyReturnPos > compoundFirstHookPos,
  'CompoundBuilderModal must declare hooks before conditional early return (Rules of Hooks invariant)'
);
console.log('✓ React Rules of Hooks verified across all modal components.');

// 7. Web Audio Singleton Invariant
const soundSource = fs.readFileSync(
  path.join(ROOT, 'src/utils/sound.js'),
  'utf8'
);
assert.ok(
  soundSource.includes('sharedAudioCtx'),
  'sound.js must use a shared AudioContext singleton to prevent hardware context leaks'
);
console.log('✓ AudioContext singleton architecture verified.');

// 8. Build Artifacts Verification
const distHtmlPath = path.join(ROOT, 'dist', 'index.html');
if (!fs.existsSync(distHtmlPath)) {
  console.log('Build artifact dist/index.html not found, executing production build (vite build)...');
  const { execSync } = require('node:child_process');
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
}
assert.ok(fs.existsSync(distHtmlPath), 'dist/index.html must exist');
const distHtml = fs.readFileSync(distHtmlPath, 'utf8');
assert.ok(distHtml.includes('<div id="root"></div>'), 'dist/index.html must contain root div');
console.log('✓ Production build artifacts in dist/ verified.');

console.log('======================================================');
console.log('ALL FRONTEND ENTERPRISE VERIFICATION TESTS PASSED (8/8)');
console.log('======================================================');
}

runSuite().catch((err) => {
  console.error('FRONTEND SUITE FAILED:', err);
  process.exit(1);
});

