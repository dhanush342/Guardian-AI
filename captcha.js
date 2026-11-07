let guardianCaptchaToken = '';
let guardianCaptchaWidget;
window.getGuardianCaptchaToken = () => {
  if (!guardianCaptchaToken) {
    const widget = document.getElementById('captcha-widget');
    const status = document.getElementById('captcha-status');
    if (widget) {
      widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      widget.classList.add('ring-2', 'ring-signal-blue', 'rounded-lg');
      setTimeout(() => widget.classList.remove('ring-2', 'ring-signal-blue'), 3000);
    }
    if (status) {
      status.classList.remove('text-slate-subtle');
      status.classList.add('text-rose-600', 'font-semibold');
      status.textContent = 'Please complete the security verification checkbox above.';
    }
    throw new Error('Please complete the security verification before continuing.');
  }
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
    const sitekey = config.turnstileSiteKey;
    if (!sitekey) throw new Error('Security verification is unavailable. Please try again later.');
    guardianCaptchaWidget = window.turnstile.render('#captcha-widget', {
      sitekey: sitekey,
      action: document.getElementById('captcha-widget').dataset.action,
      theme: 'light', size: 'flexible',
      callback: token => {
        guardianCaptchaToken = token;
        if (status) {
          status.classList.remove('text-rose-600', 'font-semibold');
          status.classList.add('text-emerald-600', 'font-medium');
          status.textContent = '✓ Security verification complete.';
        }
      },
      'expired-callback': () => {
        guardianCaptchaToken = '';
        if (status) {
          status.classList.remove('text-emerald-600');
          status.classList.add('text-slate-subtle');
          status.textContent = 'Verification expired. Please verify again.';
        }
      },
      'error-callback': () => {
        guardianCaptchaToken = '';
        if (status) {
          status.classList.remove('text-emerald-600');
          status.classList.add('text-rose-600');
          status.textContent = 'Verification failed to load. Please refresh and try again.';
        }
      }
    });
    if (status) status.textContent = 'Complete the security verification.';
  } catch (error) {
    if (status) status.textContent = error.message;
  }
};
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=guardianTurnstileReady&render=explicit';
  script.async = true;
  script.onerror = () => {
    const status = document.getElementById('captcha-status');
    if (status) status.textContent = 'Security verification could not load. Please refresh and try again.';
  };
  document.head.appendChild(script);
});
