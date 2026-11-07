let guardianClient;
window.getSupabase = function () {
  if (!guardianClient) guardianClient = (async () => {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Unable to load authentication configuration.');
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
      throw new Error('Authentication is unavailable. Please try again later.');
    }
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  })();
  return guardianClient;
};

window.clearLegacyAuth = function () {
  localStorage.removeItem('guardian_access_token');
  localStorage.removeItem('guardian_user');
};
