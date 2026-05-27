# yourArchives

![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)

A vintage-inspired digital photobooth built with Next.js 14, Supabase, and Cloudinary. Capture polaroid-style strips, save them to a personal vault, edit titles & dates, and download print-ready PNGs.

> Replace `OWNER/REPO` in the CI badge URL above with your GitHub `username/repository` after pushing.

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment Variables

All variables live in `.env.local`. See `.env.example` for the full template.

| Variable | Required | What it does |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | yes | Cloudinary account name — photos are stored here. |
| `CLOUDINARY_API_KEY` | yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | yes | Cloudinary API secret (server-side only). |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL — auth + database. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon (public) key. |
| `NEXT_PUBLIC_SITE_URL` | prod | Canonical deployed URL (e.g. `https://yourapp.vercel.app`). Used as the `redirectTo` target for OAuth and email confirmation. In dev this can be blank — the app falls back to `window.location.origin`. |
| `SUPABASE_SERVICE_ROLE_KEY` | for delete-account | Service-role key (Supabase → Settings → API → `service_role`). Bypasses RLS — never expose to the browser. Required only for the **Delete Account** flow. |
| `UPSTASH_REDIS_REST_URL` | recommended | Upstash Redis REST URL. Enables 10 req/min/IP rate limiting on `/api/upload`. Without it the limiter is skipped (OK in dev). |
| `UPSTASH_REDIS_REST_TOKEN` | recommended | Upstash Redis REST token (paired with the URL above). |
| `SENTRY_DSN` | optional | Sentry DSN for server-side error tracking. |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Sentry DSN for client-side error tracking (typically same value). If unset, Sentry is initialized as a no-op. |

## First-Time Setup

### Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com/users/register/free).
2. Copy your **Cloud name**, **API key**, and **API secret** from the Dashboard.
3. Paste them into `.env.local`.

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon public key** from `Project Settings → API` into `.env.local`.
3. Run the SQL in `supabase/schema.sql` (Dashboard → SQL Editor). This creates the `sessions`, `photos`, and `layouts` tables and enables Row Level Security so each user can only see their own data.

## Deployment Checklist

### Vercel

1. Push your repo to GitHub.
2. Import the project on [vercel.com/new](https://vercel.com/new).
3. Add all the env vars from `.env.example` to **Project Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://yourapp.vercel.app`).
4. Deploy.

### Supabase — Production Redirect URLs

After deploying, you **must** authorize your production domain in Supabase, otherwise OAuth and email confirmation links will reject the callback:

1. Open your Supabase project dashboard.
2. Go to **Authentication → URL Configuration**.
3. Under **Site URL**, enter your production URL: `https://yourapp.vercel.app`.
4. Under **Redirect URLs**, add **both** of these (one per line):
   - `https://yourapp.vercel.app/auth/callback`
   - `https://yourapp.vercel.app/**` (wildcard for password reset, etc.)
5. If you keep local development active, also add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3001/auth/callback`
6. Save.

### Google OAuth (optional but recommended)

1. In Supabase → **Authentication → Providers**, enable Google.
2. In Google Cloud Console, create an OAuth 2.0 client and add `https://<your-supabase-project>.supabase.co/auth/v1/callback` as an authorized redirect URI.
3. Paste the Google Client ID / Secret back into Supabase.

## Tech Stack

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS** + Framer Motion
- **Supabase Auth** (email/password, Google OAuth) + Postgres + Row Level Security
- **Cloudinary** for image storage
- **@supabase/ssr** for cookie-based server sessions

## Routes

| Route | Purpose | Auth |
|---|---|---|
| `/` | Photobooth landing + capture flow | public |
| `/about` | Project credits | public |
| `/auth/login` | Sign in / sign up | public |
| `/auth/callback` | OAuth + email confirmation handler | public |
| `/vault` | Personal archive of saved strips | required |
| `/archive/[id]` | Single strip detail view | required |

## PWA

The app is configured as a Progressive Web App:

- **Manifest** at `public/manifest.json` with proper icons, theme color (`#1c1c1c`), and standalone display.
- **Install prompt** banner appears on mobile after the user's second visit (`<InstallPrompt />` in `src/components/InstallPrompt.tsx`). Dismissed state is remembered via `localStorage`.
- **Service worker** is generated by `@ducanh2912/next-pwa` from `next.config.mjs`. It pre-caches static assets, runtime-caches Cloudinary images (CacheFirst, 30-day TTL), and serves the home shell offline (NetworkFirst with 3-second timeout).

**Enable on Vercel:** set `ENABLE_PWA=1` in your project's environment variables. The SW build is gated behind this flag because `next-pwa` cannot run on OneDrive-mounted source trees (it hits a Windows file-handle issue when synchronously hashing `node_modules`).

## Testing

E2E tests live in `e2e/` and run via Playwright. The config starts a Next.js server, grants camera + clipboard permissions, and uses Chromium's `--use-fake-device-for-media-stream` flag so the photobooth's `getUserMedia()` call resolves with a synthetic stream.

```bash
npm run test:e2e
```

Test files:
- `e2e/photobooth.spec.ts` — landing, booth navigation, vault redirect, share routes, privacy/terms pages.
- `e2e/auth.spec.ts` — login form rendering, sign-up toggle, reset-password page.

## Bundle Size Notes

The home page bundle is **161 kB First Load JS**; the largest contributor is `framer-motion` (used in 11 files for 167 distinct interactions including `useMotionValue`/`useSpring` cursor tracking, drag gestures on the toggle lever, `whileHover`/`whileTap` micro-interactions, and `AnimatePresence` for the curtain). The app is already on framer-motion v12, which shares internals with `motion.dev`, so swapping to the `motion` package would yield ~2–5 kB at best while risking subtle animation regressions. Future optimization paths if bundle becomes a bottleneck: replace the custom cursor's spring with raw RAF (saves ~10 kB), or migrate hover/tap effects to CSS-only.

## Known Security Advisories

`npm audit` currently reports 5 vulnerabilities (1 moderate, 4 high) that **cannot be fixed without a major-version bump that risks breaking the app**:

| Package | Severity | Where used | Fix |
|---|---|---|---|
| `next` (14.x) | high | Production runtime | Requires Next 16 + React 19. Held off until the app is verified against the new App Router behavior. |
| `postcss` (<8.5.10) | moderate | Bundled inside Next.js | Ships with Next — picked up when Next is upgraded. |
| `glob` (10.x) | high | `@next/eslint-plugin-next` (dev only — never shipped) | Requires `eslint-config-next@16` + `eslint@9`. |
| `@next/eslint-plugin-next` | high | Dev lint only | Same upgrade chain. |
| `eslint-config-next` | high | Dev lint only | Same upgrade chain. |

The dev-only vulnerabilities (`glob`, eslint plugins) have **zero production exposure** — they would only trigger if a malicious user could control your lint arguments. The Next.js runtime vulnerabilities are mostly tied to features this app doesn't use (Pages Router i18n, CSP nonces, remote `next/image` patterns beyond Cloudinary). Schedule the Next 16 / React 19 migration as a dedicated task.

## Project Structure

```
src/
├── app/                  # Next.js routes
├── components/           # React components
├── context/              # AuthContext provider
└── lib/                  # supabase + cloudinary clients
public/
├── images/               # Static images (about page, etc.)
└── explore/              # Explore-section placeholders
supabase/
└── schema.sql            # Database schema + RLS policies
```
