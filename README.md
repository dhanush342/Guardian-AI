# Guardian-AI

Real-Time AI Safety & Enterprise Defense Platform.

## 🚀 Overview
Guardian AI provides autonomous AI safety orchestration, continuous runtime policy verification, and zero-latency prompt telemetry for mission-critical enterprise platforms.

## 📁 Project Structure
- [`index.html`] - Core responsive web application homepage with live threat matrix telemetry and contact modal
- [`register.html`] - Enterprise registration page with real-time input sanitization, password strength meter, and dual eye toggles
- [`login.html`] - Identity authentication portal with password eye toggle, remember me, and reset modal
- [`DESIGN.md`] - Design tokens, color palette, typography specifications, and component styles
- `guardianlogo.jpeg` & `bgremove.jpeg` - Brand identity assets
- `screen.png` - Platform UI preview
- [`package.json`] - Node scripts for quick startup

## ⚡ Running the Project

### Option 1: Python
```bash
python -m http.server 3000
```
Then navigate to [http://localhost:3000](http://localhost:3000).

### Option 2: Node / npm
```bash
npm start
```
or
```bash
npx serve .
```

## 🔐 Security & Validation Features
- **Input Sanitization**: Unicode NFKC normalization, control character purging (`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`), XSS entity escaping, and Excel/CSV formula injection protection (neutralizing `=`, `+`, `-`, `@`, `\t`, `\r`, `\n`).
- **Interactive Eye Toggles**: Instant show/hide functionality for password and confirm password inputs across auth pages.
- **Dynamic Password Strength**: Real-time evaluation checking 8+ characters, uppercase, lowercase, numbers, and special symbols.
- **Page Wiring**: Cross-linked navigation connecting Homepage, Sign In (`login.html`), and Registration (`register.html`).

## Email confirmation setup

Registration uses Supabase Auth to send confirmation emails. The app validates email format on both client and server, requires confirmation before login/profile access, and provides `confirm-email.html` for confirmation callbacks and resending links.

In the Supabase dashboard for this project:

1. Under Authentication → Providers → Email, enable **Confirm email** (disable auto-confirmation).
2. Under Authentication → URL Configuration, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/confirm-email.html` to Redirect URLs. Use your deployed HTTPS origin in production and update `APP_URL` in the server environment to match.
3. Under Authentication → Email → SMTP Settings, configure a custom SMTP sender. To send from `guardinaienquiry@gmail.com` using Gmail: use `smtp.gmail.com`, port `465`, username `guardinaienquiry@gmail.com`, and a Google App Password as the SMTP password. Enable Google 2-Step Verification first. Store the app password only in Supabase SMTP settings, never in source code. Set the sender address to the same Gmail address and sender name to `Guardian AI`.
4. Keep the confirmation email template's confirmation link (`{{ .ConfirmationURL }}`), so Supabase validates and consumes the token before redirecting back to the application.

Verify with a new account in an inbox you control: signup → confirmation email from Guardian AI → click link → profile; signing in before confirmation should fail and offer resending. An expired or reused link should offer a fresh confirmation email. Requesting a resend does not disclose whether an account exists.

Supabase's default mail service restricts recipients and is unsuitable for general signup delivery; configure custom SMTP for real users. Email format validation cannot establish mailbox ownership; clicking the confirmation link does that.

## CAPTCHA setup

Sign-in and signup use Cloudflare Turnstile. The server verifies each token with Cloudflare, including its action and hostname. Missing configuration, invalid tokens, expired/reused tokens, and verification service failures block authentication. Signup also requires terms acceptance on the server.

1. Create a Cloudflare account and open Turnstile. You do not need to move your domain DNS to Cloudflare.
2. Add a widget named Guardian AI, choose Managed mode, and allow the exact hostname used by APP_URL (add localhost separately for local development).
3. Set TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in the hosting service environment. Only the site key is sent to the browser. Never commit or share the secret key.
4. Set APP_URL to the deployed HTTPS origin and restart/redeploy the Node server.
5. Test signup/sign-in, a failed CAPTCHA, an expired challenge, and signup without terms acceptance.

The current integration validates tokens on the Node server. Do not separately enable Supabase CAPTCHA using the same tokens: Turnstile tokens are single-use. If protecting direct Supabase Auth calls is required, switch to Supabase-managed CAPTCHA verification rather than validating the same token twice.
