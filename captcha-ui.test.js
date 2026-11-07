const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function page(config) {
  const status = { textContent: 'Loading security verification…', classList: { add() {}, remove() {} } };
  const button = { disabled: false };
  let widget;
  const context = {
    window: {}, document: { readyState: 'complete', head: { appendChild() {} }, createElement: () => ({}), getElementById: id => id === 'captcha-status' ? status : id === 'captcha-widget' ? { dataset: { action: 'signup' } } : id === 'reg-submit-btn' ? button : null },
    fetch: async () => ({ ok: true, json: async () => config })
  };
  context.window.turnstile = { render(selector, options) { widget = options; return 'id'; }, reset() {} };
  vm.runInNewContext(fs.readFileSync('captcha.js', 'utf8'), context);
  return { context, status, button, widget: () => widget };
}
test('missing deployment configuration stays unavailable instead of requesting an absent checkbox', async () => {
  const p = page({});
  await p.context.window.guardianTurnstileReady();
  assert.equal(p.button.disabled, true);
  assert.match(p.status.textContent, /temporarily unavailable/);
  assert.throws(() => p.context.window.getGuardianCaptchaToken(), /temporarily unavailable/);
  assert.match(p.status.textContent, /temporarily unavailable/);
});
test('submit is enabled only after verification and disabled again on expiry', async () => {
  const p = page({ turnstileSiteKey: 'public', supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'public' });
  assert.equal(p.button.disabled, true);
  await p.context.window.guardianTurnstileReady();
  p.widget().callback('verified-token');
  assert.equal(p.button.disabled, false);
  assert.equal(p.context.window.getGuardianCaptchaToken(), 'verified-token');
  p.widget()['expired-callback']();
  assert.equal(p.button.disabled, true);
});
