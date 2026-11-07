(function (root) {
  function validateEmail(value) {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) {
      return { valid: false, message: 'Please enter a valid email address.' };
    }
    const email = value.trim().toLowerCase();
    if (!email) return { valid: false, message: 'Email address is required.' };
    if (email.length > 100) return { valid: false, message: 'Email address cannot exceed 100 characters.' };
    const parts = email.split('@');
    if (parts.length !== 2) return { valid: false, message: 'Please enter a valid email address (e.g., name@company.com).' };
    const [local, domain] = parts;
    const labels = domain.split('.');
    const valid = local.length > 0 && local.length <= 64 &&
      /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) &&
      !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') &&
      labels.length >= 2 && /^[a-z]{2,}$/i.test(labels.at(-1)) &&
      labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
    return valid ? { valid: true, sanitized: email } :
      { valid: false, message: 'Please enter a valid email address (e.g., name@company.com).' };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = validateEmail;
  else root.validateGuardianEmail = validateEmail;
})(typeof window !== 'undefined' ? window : globalThis);
