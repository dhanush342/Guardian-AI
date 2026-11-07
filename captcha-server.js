'use strict';
module.exports = async function verifyCaptcha(token, action, { secret, siteKey, appUrl, fetcher = fetch }) {
  if (!secret || !siteKey) return { status: 503, error: 'Security verification is unavailable. Please try again later.' };
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
    return { status: 400, error: 'Please complete the security verification.' };
  }
  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }), signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json();
    if (!result.success || result.action !== action || result.hostname !== new URL(appUrl).hostname) {
      return { status: 400, error: 'Security verification failed or expired. Please verify again.' };
    }
    return null;
  } catch (error) { return { status: 503, error: 'Security verification is unavailable. Please try again later.' }; }
};
