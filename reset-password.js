(async () => {
  const status = document.getElementById('status');
  const form = document.getElementById('reset-form');
  try {
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.has('error') || new URLSearchParams(location.search).has('error')) {
      history.replaceState(null, '', location.pathname);
      throw new Error('This recovery link is invalid or expired. Request another from the sign-in page.');
    }
    if (hash.get('type') !== 'recovery') throw new Error('Open a fresh password-recovery link from your email to continue.');
    const client = await getSupabase();
    const { data: { session }, error } = await client.auth.getSession();
    history.replaceState(null, '', location.pathname);
    if (error) throw error;
    if (!session) throw new Error('Open a valid password-recovery link from your email to continue.');
    status.textContent = 'Enter your new password.';
    form.hidden = false;
    form.onsubmit = async event => {
      event.preventDefault();
      const password = document.getElementById('password').value;
      if (password !== document.getElementById('confirm').value) { status.textContent = 'Passwords do not match.'; return; }
      if (password.length < 8 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) { status.textContent = 'Use 8–128 characters, uppercase, lowercase, a number, and a special character.'; return; }
      const button = document.getElementById('save'); button.disabled = true;
      try {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        form.reset(); form.hidden = true;
        await client.auth.signOut({ scope: 'local' });
        clearLegacyAuth();
        status.textContent = 'Password updated. You can now sign in with your new password.';
      } catch (error) { status.textContent = error.message; }
      finally { button.disabled = false; }
    };
  } catch (error) { status.textContent = error.message; }
})();
