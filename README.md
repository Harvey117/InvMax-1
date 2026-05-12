# InvMax Web Clean

This is a cleaned and separated version of `InvMaxWeb.jsx`.

## Folder Structure

```text
src/
├── App.jsx
├── main.jsx
├── components/
│   ├── Modal.jsx
│   └── ToastContainer.jsx
├── config/
│   ├── email.js
│   └── supabase.js
├── hooks/
│   └── useToast.js
├── pages/
│   ├── AuthPage.jsx
│   ├── Dashboard.jsx
│   ├── HelpPage.jsx
│   ├── OptimizePage.jsx
│   ├── ProductsPage.jsx
│   ├── ProfilePage.jsx
│   └── ReportsPage.jsx
├── services/
│   └── supabaseClient.js
├── styles/
│   └── global.css
└── utils/
    └── inventory.js
```

## Setup

1. Open `src/config/supabase.js`.
2. Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. Run `supabase_schema.sql` in your Supabase SQL Editor.
4. Install and run:

```bash
npm install
npm run dev
```

## Features

- Email/password authentication through Supabase REST endpoints.
- Forgot-password reset links through Supabase Auth email.
- Terms and Conditions gate before signup agreement.
- Strong password validation: 8+ characters, uppercase, lowercase, number, and special character.
- User profile fields: name, phone, date of birth, and auto-calculated age.
- Dark/light mode toggle with an inventory-tech teal identity.
- Product CRUD with Cost Price and Selling Price fields.
- EOQ inventory optimization and profit-based budget planner.
- Budget Planner uses a knapsack-based integer allocation to recommend quantities within budget using profit per unit.
- Weekly/monthly report preview, copy, download, email draft, and optional direct email sending.
- Help and FAQ page.

## Optional direct email setup

To send reports straight to email, fill `src/config/email.js` with your EmailJS service ID, template ID, and public key. If these values are blank, InvMax safely opens an email draft instead of pretending the report was sent.

## QR login note

The UI includes a secure QR Login placeholder for existing users. Real QR login needs a backend endpoint that creates short-lived QR login tokens and verifies them before creating a session.

## What changed

- Supabase setup moved to `services/supabaseClient.js`.
- App constants moved to `config/supabase.js`.
- EOQ, stock status, peso formatting, and password validation moved to `utils/inventory.js`.
- Reusable UI moved to `components/`.
- Each screen moved to `pages/`.
- CSS moved to `styles/global.css`.
- `App.jsx` now focuses on app state, layout, navigation, and data loading.
