let guardianCaptchaToken = '';
let guardianCaptchaWidget;
window.getGuardianCaptchaToken = () => {
  if (!guardianCaptchaToken) throw new Error('Please complete the security verification before continuing.');
  return guardianCaptchaToken;
};
window.resetGuardianCaptcha = () => {
  guardianCaptchaToken = '';
  if (guardianCaptchaWidget !== undefined && window.turnstile) window.turnstile.reset(guardianCaptchaWidget);
};
window.guardianTurnstileReady = async () => {
  const status = document.getElementById('captcha-status');
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Security verification could not load. Please refresh the page.');
    const config = await response.json();
    if (!config.turnstileSiteKey) throw new Error('Security verification is unavailable. Please try again later.');
    guardianCaptchaWidget = window.turnstile.render('#captcha-widget', {
      sitekey: config.turnstileSiteKey,
      action: document.getElementById('captcha-widget').dataset.action,
      theme: 'light', size: 'flexible',
      callback: token => { guardianCaptchaToken = token; status.textContent = 'Security verification complete.'; },
      'expired-callback': () => { guardianCaptchaToken = ''; status.textContent = 'Verification expired. Please verify again.'; },
      'error-callback': () => { guardianCaptchaToken = ''; status.textContent = 'Verification failed to load. Please refresh and try again.'; }
    });
    status.textContent = 'Complete the security verification.';
  } catch (error) { status.textContent = error.message; }
};
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=guardianTurnstileReady&render=explicit';
  script.async = true;
  script.onerror = () => { document.getElementById('captcha-status').textContent = 'Security verification could not load. Please refresh and try again.'; };
  document.head.appendChild(script);
});
