const test = require('node:test');
const assert = require('node:assert/strict');
const install = require('./profile-routes');
function setup(fetcher) {
  const routes = {};
  install({ post(path, ...handlers) { routes[path] = handlers.at(-1); } }, { url: 'https://test.supabase.co', key: 'public', rateLimiter() {}, fetcher });
  return async (path, body, authorization = 'Bearer token') => {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, set() {} };
    await routes[path]({ headers: { authorization }, body }, res);
    return res;
  };
}
const user = { id: 'member', email: 'member@example.com', email_confirmed_at: '2026-11-07' };
const reply = data => ({ ok: true, json: async () => data });
test('profile edits allow only display metadata, excluding email and auth phone', async () => {
  const request = setup(async (url, options) => {
    if (!options.method) return reply(user);
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload, { data: { full_name: 'Test Member', organization: 'Example', contact_phone: '+91 9876543210' } });
    return reply({ ...user, user_metadata: payload.data });
  });
  const res = await request('/api/profile', { fullName: 'Test Member', organization: 'Example', phone: '+91 9876543210', email: 'attacker@example.com' });
  assert.equal(res.code, 200);
});
test('profile writes require authentication and reject invalid phone numbers', async () => {
  const request = setup(async () => reply(user));
  assert.equal((await request('/api/profile', {}, '')).code, 401);
  assert.equal((await request('/api/profile', { fullName: 'Test Member', phone: 'abc' })).code, 400);
});
test('incorrect previous password prevents password update', async () => {
  let updates = 0;
  const request = setup(async (url, options) => {
    if (!options.method) return reply(user);
    if (url.includes('/token')) return { ok: false };
    updates++; return reply({});
  });
  const res = await request('/api/change-password', { currentPassword: 'Wrong1!', newPassword: 'NewStrongPass1!' });
  assert.equal(res.code, 400); assert.equal(updates, 0);
});
test('password update follows successful same-user password verification', async () => {
  const calls = [];
  const request = setup(async (url, options) => {
    calls.push(url);
    if (!options.method) return reply(user);
    if (url.includes('/token')) {
      assert.equal(JSON.parse(options.body).email, user.email);
      return reply({ user, access_token: 'verified', refresh_token: 'refresh' });
    }
    assert.equal(options.headers.Authorization, 'Bearer verified');
    assert.deepEqual(JSON.parse(options.body), { password: 'NewStrongPass1!' });
    return reply(user);
  });
  const res = await request('/api/change-password', { currentPassword: 'OldPass1!', newPassword: 'NewStrongPass1!' });
  assert.equal(res.code, 200); assert.equal(calls.length, 3);
});
