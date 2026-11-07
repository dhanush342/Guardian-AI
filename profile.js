(async () => {
  const el = id => document.getElementById(id);
  const status = el('status');
  try {
    const client = await getSupabase();
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) { clearLegacyAuth(); location.replace('login.html'); return; }
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    let user = data.user;
    if (!user?.email_confirmed_at) { location.replace('confirm-email.html'); return; }
    function render() {
      const meta = user.user_metadata || {};
      const name = meta.full_name || user.email?.split('@')[0] || 'Guardian member';
      for (const [id, value] of Object.entries({ name, 'full-name': name, initial: name.charAt(0).toUpperCase(), email: user.email, 'email-detail': user.email, 'organization-detail': meta.organization || 'Not provided', 'phone-detail': meta.contact_phone || 'Not provided', verified: 'Verified', joined: new Date(user.created_at).toLocaleDateString(undefined, {year:'numeric',month:'long',day:'numeric'}) })) el(id).textContent = value;
      el('edit-name').value = name;
      el('edit-email').value = user.email;
      el('edit-organization').value = meta.organization || '';
      el('edit-phone').value = meta.contact_phone || '';
    }
    async function request(path, body) {
      const { data: { session }, error } = await client.auth.getSession();
      if (error || !session) throw new Error('Your session expired. Please sign in again.');
      const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save changes.');
      return result;
    }
    render(); status.hidden = true; el('profile').hidden = false; el('signout').hidden = false;
    el('edit-profile').onclick = () => { render(); el('edit-form').hidden = false; el('edit-status').textContent = ''; el('edit-name').focus(); };
    el('cancel-edit').onclick = () => { el('edit-form').hidden = true; render(); };
    el('change-password').onclick = () => { el('password-form').hidden = false; el('password-status').textContent = ''; el('current-password').focus(); };
    el('cancel-password').onclick = () => { el('password-form').reset(); el('password-form').hidden = true; };
    el('edit-form').onsubmit = async event => {
      event.preventDefault();
      const button = event.submitter; button.disabled = true;
      try {
        const result = await request('/api/profile', { fullName: el('edit-name').value, organization: el('edit-organization').value, phone: el('edit-phone').value });
        user = result.user; render(); el('edit-status').textContent = 'Profile saved.';
      } catch (error) { el('edit-status').textContent = error.message; }
      finally { button.disabled = false; }
    };
    el('password-form').onsubmit = async event => {
      event.preventDefault();
      if (el('new-password').value !== el('confirm-password').value) { el('password-status').textContent = 'New passwords do not match.'; return; }
      const button = event.submitter; button.disabled = true;
      try {
        const result = await request('/api/change-password', { currentPassword: el('current-password').value, newPassword: el('new-password').value });
        el('password-form').reset();
        const { error } = await client.auth.setSession(result.session);
        el('password-status').textContent = error ? 'Password changed. Please sign in again with your new password.' : 'Password changed successfully.';
      } catch (error) { el('password-status').textContent = error.message; }
      finally { el('current-password').value = ''; button.disabled = false; }
    };
    el('signout').onclick = async () => {
      el('signout').disabled = true;
      const { error } = await client.auth.signOut();
      if (error) { status.hidden = false; status.textContent = error.message; el('signout').disabled = false; return; }
      clearLegacyAuth(); location.replace('login.html');
    };
    client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') location.replace('login.html'); });
  } catch (error) { status.textContent = error.message || 'Unable to load your profile.'; el('retry').hidden = false; }
})();
