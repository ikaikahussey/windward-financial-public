# Windward Financial — Public Website

The public-facing marketing site for **Windward Financial**, a Hawai‘i-based insurance and retirement planning brokerage serving public employees.

Built with **Astro** and **Tailwind CSS**, deployed on **Netlify**.

Form submissions (contact, schedule, enroll) POST to the separate CRM API at `https://api.windward.financial`. The admin CRM and API live in the [windward-financial-crm](https://github.com/ikaikahussey/windward-financial-crm) repository.

---

## Local development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
cp .env.example .env
# Edit .env if you want to point to a local API instance
npm run dev
```

The site runs at `http://localhost:5174`.

### Build

```bash
npm run build      # outputs static site to dist/
npm run preview    # serves the built site locally
```

---

## Project structure

```
src/
├── components/        # Astro + React components
│   └── islands/       # React components hydrated client-side
├── content/           # Markdown content (team bios, testimonials, page copy)
├── layouts/           # Shared layouts
├── lib/               # Utilities (API client, etc.)
├── pages/             # Routes — one .astro file per URL
└── styles/            # Global CSS

public/                # Static assets served as-is
netlify.toml           # Netlify build + redirect config
astro.config.mjs       # Astro config
tailwind.config.ts     # Tailwind config
```

---

## Deployment

The site auto-deploys to Netlify on every push to `main`.

- **Production:** `https://windward.financial` (deploys from `main`)
- **Deploy previews:** automatic for every PR against `main`
- **Branch deploys:** automatic for non-main branches

Build settings are declared in `netlify.toml` — no manual configuration needed in the Netlify UI beyond connecting the repo.

### Environment variables

Set these in the Netlify UI under **Site settings → Environment variables** (most are also pinned in `netlify.toml`):

| Variable          | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `PUBLIC_API_URL`  | Base URL for form submissions to the CRM API    |
| `PUBLIC_SITE_URL` | Canonical site URL, used for sitemap generation |

---

## Editing content

Most page copy is in `.astro` files under `src/pages/`. Team bios, testimonials, and other reusable content live as Markdown in `src/content/`.

For non-developer edits, a CMS will be wired up in a future iteration.
