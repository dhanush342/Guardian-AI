const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const validate = require('./email-validation');

function server(upstream) {
  const routes = {};
  const app = { use() {}, get() {}, post(path, ...handlers) { routes[path] = handlers.at(-1); }, listen() {} };
  const express = Object.assign(() => app, { json() {}, static() {} });
  vm.runInNewContext(fs.readFileSync('server.js', 'utf8'), {
    require: name => name === './captcha-server' ? async () => null : name === 'express' ? express : name === 'dotenv' ? { config() {} } : require(name),
    __dirname, process: { env: { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'public', APP_URL: 'http://localhost:3000' } },
    console, URL, fetch: upstream, Map, Date
  });
  return async (path, body) => {
    const res = { statusCode: 200, status(n) { this.statusCode = n; return this; }, set() {}, json(data) { this.body = data; return this; } };
    await routes[path]({ body: { acceptedTerms: true, ...body } }, res, () => {});
    return res;
  };
}

test('email validation rejects malformed, oversized, and control-character addresses', () => {
  for (const email of ['a..b@example.com', '.a@example.com', 'a.@example.com', 'a@-example.com', 'a@exam_ple.com', 'a@example', 'a\n@example.com', 'a'.repeat(65) + '@example.com', null, {}]) assert.equal(validate(email).valid, false, String(email));
  assert.equal(validate(' Member+tag@Example.com ').sanitized, 'member+tag@example.com');
});

test('invalid email is rejected before sending to Supabase', async () => {
  const request = server(() => { throw Error('must not call upstream'); });
  for (const route of ['/api/register', '/api/login', '/api/resend-confirmation']) {
    const res = await request(route, { fullName: 'Test Member', email: 'a..b@example.com', password: 'StrongPass1!' });
    assert.equal(res.statusCode, 400);
  }
});

test('signup uses confirmation callback and correctly detects user-only responses', async () => {
  const request = server(async (url, options) => {
    assert.equal(new URL(url).searchParams.get('redirect_to'), 'http://localhost:3000/confirm-email.html');
    assert.equal(JSON.parse(options.body).email, 'member@example.com');
    return { ok: true, json: async () => ({ id: 'user-id', email: 'member@example.com' }) };
  });
  const res = await request('/api/register', { fullName: 'Test Member', email: 'Member@Example.com', password: 'StrongPass1!' });
  assert.equal(res.body.requiresEmailConfirmation, true);
});

test('auto-confirmed signup is not reported as requiring an email', async () => {
  const request = server(async () => ({ ok: true, json: async () => ({ user: { id: 'id', email_confirmed_at: '2026-11-07' }, access_token: 'token' }) }));
  const res = await request('/api/register', { fullName: 'Test Member', email: 'member@example.com', password: 'StrongPass1!' });
  assert.equal(res.body.requiresEmailConfirmation, false);
});

test('unverified login never returns tokens; verified login returns session', async () => {
  for (const confirmed of [false, true]) {
    const request = server(async () => ({ ok: true, json: async () => ({ access_token: 'access', refresh_token: 'refresh', user: { email_confirmed_at: confirmed ? '2026-11-07' : null } }) }));
    const res = await request('/api/login', { email: 'member@example.com', password: 'StrongPass1!' });
    assert.equal(res.statusCode, confirmed ? 200 : 403);
    assert.equal(!!res.body.session, confirmed);
  }
});

test('resend uses signup type and surfaces delivery failures', async () => {
  for (const status of [200, 429, 500]) {
    const request = server(async (url, options) => {
      assert.equal(JSON.parse(options.body).type, 'signup');
      assert.equal(new URL(url).searchParams.get('redirect_to'), 'http://localhost:3000/confirm-email.html');
      return { ok: status === 200, status };
    });
    const res = await request('/api/resend-confirmation', { email: 'member@example.com' });
    assert.equal(res.statusCode, status === 500 ? 502 : status);
  }
});
