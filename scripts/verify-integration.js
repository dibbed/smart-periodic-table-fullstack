const http = require('node:http');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const server = spawn('node', [path.join(ROOT_DIR, 'server.js')], {
  cwd: ROOT_DIR,
  env: { ...process.env, PORT: '3456', HOST: '127.0.0.1' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverLog = '';
server.stdout.on('data', d => serverLog += d.toString());
server.stderr.on('data', d => serverLog += d.toString());

function request(urlPath) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:3456' + urlPath, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body
      }));
    }).on('error', reject);
  });
}

async function waitForServer(maxAttempts = 40, intervalMs = 150) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await request('/api/health');
      if (res.status === 200) return;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Server failed to respond within ${maxAttempts * intervalMs}ms.\nLogs:\n${serverLog}`);
}

(async () => {
  try {
    await waitForServer();
    console.log('Testing server health...');
    const health = await request('/api/health');
    assert.equal(health.status, 200);
    const healthData = JSON.parse(health.body);
    assert.equal(healthData.ok, true);
    assert.equal(healthData.elements, 118);

    console.log('Testing /api/elements...');
    const elements = await request('/api/elements');
    assert.equal(elements.status, 200);
    const elList = JSON.parse(elements.body);
    assert.equal(elList.length, 118);
    assert.equal(elList[0].symbol, 'H');
    assert.equal(elList[25].symbol, 'Fe');
    assert.equal(elList[117].symbol, 'Og');

    console.log('Testing /api/elements/26...');
    const fe = await request('/api/elements/26');
    assert.equal(fe.status, 200);
    const feData = JSON.parse(fe.body);
    assert.equal(feData.symbol, 'Fe');

    console.log('Testing /api/search?q=Gold...');
    const search = await request('/api/search?q=Gold');
    assert.equal(search.status, 200);
    const searchData = JSON.parse(search.body);
    assert.ok(searchData.some(e => e.symbol === 'Au'));

    console.log('Testing / (index.html)...');
    const indexHtml = await request('/');
    assert.equal(indexHtml.status, 200);
    assert.ok(indexHtml.headers['content-type'].includes('text/html'));
    assert.ok(indexHtml.body.includes('<div id="root"></div>'));
    assert.ok(indexHtml.body.includes('href="css/style.css"'));
    assert.ok(indexHtml.body.includes('src="js/atom3d.js"'));
    assert.ok(indexHtml.body.includes('src="js/App.js"'));
    assert.ok(!indexHtml.body.includes('<style>'));

    console.log('Testing /css/style.css...');
    const css = await request('/css/style.css');
    assert.equal(css.status, 200);
    assert.ok(css.headers['content-type'].includes('text/css'));
    assert.ok(css.body.includes('.grid-periodic'));
    assert.ok(css.body.includes('.cyber-glass'));

    console.log('Testing modular JS files...');
    const jsFiles = [
      'constants.js',
      'atom3d.js',
      'Quiz.js',
      'Compare.js',
      'CompoundBuilder.js',
      'PeriodicTable.js',
      'App.js'
    ];

    for (const file of jsFiles) {
      const res = await request('/js/' + file);
      assert.equal(res.status, 200, `File /js/${file} returned status ${res.status}`);
      assert.ok(res.headers['content-type'].includes('application/javascript'), `File /js/${file} had wrong content-type: ${res.headers['content-type']}`);
      assert.ok(res.body.length > 500, `File /js/${file} was unexpectedly small (${res.body.length} bytes)`);
    }

    console.log('INTEGRATION TEST VERIFIED: All routes, static files, APIs, and data contracts operate correctly.');
    process.exitCode = 0;
  } catch (err) {
    console.error('INTEGRATION TEST FAILED:', err);
    console.error('Server log:', serverLog);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
})();
