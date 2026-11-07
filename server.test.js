const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('./server');
test('public routing exposes only public assets and preserves API status codes', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ['/server.js', '/static-assets.js', '/profile-routes.js', '/package.json', '/.env', '/README.md', '/not-a-page']) {
      assert.equal((await fetch(base + path)).status, 404, path);
    }
    for (const path of ['/', '/login', '/register.html', '/reset-password', '/auth.js', '/guardianlogo.jpeg']) {
      assert.equal((await fetch(base + path)).status, 200, path);
    }
    const config = await fetch(base + '/api/config');
    assert.equal(config.headers.get('cache-control'), 'no-store');
    assert.deepEqual(Object.keys(await config.json()).sort(), ['supabaseAnonKey', 'supabaseUrl', 'turnstileSiteKey']);
    const missing = await fetch(base + '/api/unknown');
    assert.equal(missing.status, 404); assert((missing.headers.get('content-type') || '').includes('application/json'));
    const malformed = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(malformed.status, 400);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
