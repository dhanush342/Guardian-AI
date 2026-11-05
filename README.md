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
