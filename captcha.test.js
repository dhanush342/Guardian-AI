const test = require('node:test');
const assert = require('node:assert/strict');
const verify = require('./captcha-server');
const config = { secret: 'secret', siteKey: 'public', appUrl: 'https://app.example.com' };
test('missing configuration and missing tokens fail closed', async () => {
  assert.equal((await verify('token', 'signup', {})).status, 503);
  for (const token of ['', null, {}, 'x'.repeat(2049)]) {
    assert.equal((await verify(token, 'signup', config)).status, 400);
  }
});
test('only a successful verification with the expected action and hostname passes', async () => {
  for (const result of [
    { success: false },
    { success: true, action: 'signin', hostname: 'app.example.com' },
    { success: true, action: 'signup', hostname: 'attacker.example.com' },
    { success: true, action: 'signup', hostname: 'app.example.com' }
  ]) {
    const error = await verify('token', 'signup', { ...config, fetcher: async (url, options) => {
      assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
      assert.equal(JSON.parse(options.body).secret, 'secret');
      return { ok: true, json: async () => result };
    } });
    assert.equal(error === null, result.success && result.action === 'signup' && result.hostname === 'app.example.com');
  }
});
test('verification service failures block authentication', async () => {
  const error = await verify('token', 'signup', { ...config, fetcher: async () => { throw new Error('offline'); } });
  assert.equal(error.status, 503);
});
