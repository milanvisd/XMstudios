# SM Studios

The official SM Studios site: game showcase, dev news, and a small CMS for the team.

## Stack

- **Next.js 16** (App Router, Turbopack, ISR)
- **React 19** + **Tailwind CSS 4**
- **Supabase** (Postgres, Auth, Storage)
- **Vercel** for hosting

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon/publishable key |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URL used by sitemap/Open Graph |

`NEXT_PUBLIC_*` values are visible to browsers — that is expected for the anon key.
Never put a `service_role` key in a `NEXT_PUBLIC_` variable or commit `.env.local`.

## Database setup (one time)

1. Open **Supabase → SQL Editor**.
2. Run [`schema.sql`](./schema.sql). It is idempotent, so it is safe to re-run.
   - Creates tables, indexes, constraints, triggers
   - Stamps `published_at` once (and backfills old rows)
   - Creates the public `uploads` storage bucket + policies
3. Optional hardening: [`harden-rls.sql`](./harden-rls.sql) restricts writes to an
   explicit admins list. **Add your user first** — see the comments at the top.

### Admin account

Create the editor account in **Supabase → Authentication → Users**, then sign in at
`/editor`. If you do not need public accounts, disable signups in
**Authentication → Providers → Email** (otherwise any account can edit content
until you run `harden-rls.sql`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript checks |

## Deploying

**Recommended:** push this repo to GitHub and connect it in Vercel. You get preview
deployments per branch, rollbacks, and automatic builds.

Manual fallback:

```bash
npx vercel --prod
```

Add the environment variables in **Vercel → Project → Settings → Environment
Variables** (all environments).

## How it works

- Public pages are statically generated / revalidated every 60 seconds
  (`revalidate = 60`). Editing content calls `/api/revalidate` so changes appear
  immediately.
- `/editor` and `/editor/dashboard` are guarded by `proxy.ts` (Next 16's
  middleware) using Supabase session cookies.
- Article HTML and Markdown output is sanitized on the server before rendering.
- Images are uploaded to Supabase Storage through `/api/upload`, which requires a
  signed-in session. Allowed types: JPG, PNG, WebP, GIF, AVIF (max 8 MB).
- Public API routes (`/api/games`, `/api/news`) are read-only and only expose
  published articles.

## Maintenance checklist

- [ ] Run `schema.sql` after pulling database changes.
- [ ] Keep dependencies updated (`npm outdated`, `npm audit`).
- [ ] Enable Supabase database backups.
- [ ] Run `harden-rls.sql` if public signups must stay enabled.
