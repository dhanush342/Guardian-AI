module.exports = function installProfileRoutes(app, { url, key, rateLimiter, fetcher = fetch }) {
  async function currentUser(req) {
    if (!url || !key) throw new Error('Authentication is unavailable.');
    const authorization = req.headers.authorization;
    if (!/^Bearer \S+$/.test(authorization || '')) return null;
    const response = await fetcher(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: authorization } });
    if (!response.ok) return null;
    const user = await response.json();
    return user.email_confirmed_at ? { user, authorization } : null;
  }
  app.post('/api/profile', rateLimiter, async (req, res) => {
    try {
      const current = await currentUser(req);
      if (!current) return res.status(401).json({ error: 'Please sign in again.' });
      const { fullName, organization = '', phone = '' } = req.body || {};
      if (typeof fullName !== 'string' || !/^[\p{L}\s.'-]{2,70}$/u.test(fullName.trim())) return res.status(400).json({ error: 'Enter a valid full name (2–70 characters).' });
      if (typeof organization !== 'string' || organization.trim().length > 100 || /[\x00-\x1f]/.test(organization)) return res.status(400).json({ error: 'Organization must be at most 100 characters without control characters.' });
      if (typeof phone !== 'string' || (phone.trim() && (!/^\+?[0-9\s().-]{7,25}$/.test(phone.trim()) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15))) return res.status(400).json({ error: 'Enter a phone number with 7–15 digits, including country code.' });
      // Only allow these metadata fields; email and authentication phone are never updated.
      const response = await fetcher(`${url}/auth/v1/user`, {
        method: 'PUT', headers: { apikey: key, Authorization: current.authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { full_name: fullName.trim(), organization: organization.trim(), contact_phone: phone.trim() } })
      });
      if (!response.ok) return res.status(502).json({ error: 'Unable to save your profile. Please try again.' });
      res.set('Cache-Control', 'no-store');
      return res.json({ user: await response.json() });
    } catch (error) { return res.status(503).json({ error: 'Unable to save your profile. Please try again.' }); }
  });
  app.post('/api/change-password', rateLimiter, async (req, res) => {
    try {
      const current = await currentUser(req);
      if (!current) return res.status(401).json({ error: 'Please sign in again.' });
      const { currentPassword, newPassword } = req.body || {};
      if (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > 128) return res.status(400).json({ error: 'Enter your current password.' });
      if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) return res.status(400).json({ error: 'New password must be 8–128 characters with uppercase, lowercase, a number, and a special character.' });
      if (currentPassword === newPassword) return res.status(400).json({ error: 'Choose a password different from your current password.' });
      const verified = await fetcher(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: current.user.email, password: currentPassword })
      });
      if (!verified.ok) return res.status(400).json({ error: 'Current password could not be verified. Check it and try again.' });
      const session = await verified.json();
      if (session.user?.id !== current.user.id || !session.access_token) return res.status(403).json({ error: 'Password verification failed.' });
      const response = await fetcher(`${url}/auth/v1/user`, {
        method: 'PUT', headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (!response.ok) return res.status(400).json({ error: 'Unable to change password. Your account may require additional verification; please try again or use password recovery.' });
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, session: { access_token: session.access_token, refresh_token: session.refresh_token } });
    } catch (error) { return res.status(503).json({ error: 'Unable to change password. Please try again.' }); }
  });
};
