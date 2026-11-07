let guardianClient;
window.getSupabase = function (options = {}) {
  if (typeof options.rememberMe === 'boolean') {
    sessionStorage.setItem('guardian_auth_storage', options.rememberMe ? 'local' : 'session');
    guardianClient = undefined;
  }
  if (!guardianClient) guardianClient = (async () => {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Unable to load authentication configuration.');
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
      throw new Error('Authentication is unavailable. Please try again later.');
    }
    const storage = sessionStorage.getItem('guardian_auth_storage') === 'session' ? sessionStorage : localStorage;
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { storage } });
  })();
  return guardianClient;
};

window.clearLegacyAuth = function () {
  localStorage.removeItem('guardian_access_token');
  localStorage.removeItem('guardian_user');
};
