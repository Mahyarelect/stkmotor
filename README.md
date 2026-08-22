# STK Motors Catalog

Persian RTL catalog and administration panel for industrial products. The application covers four product groups—electromotors, gearboxes, pumps, and accessories—with 30 product families and 863 technical variants.

## Features

- Responsive Persian storefront with desktop and mobile navigation.
- Multi-category catalog pages and shareable URL-based filters.
- Category-specific product cards, specifications, pricing, availability, and WhatsApp inquiry links.
- SQLite database managed through Prisma.
- Protected administration panel for families, variants, and public settings.
- Branded loading, not-found, and application-error states.
- Automated data-integrity, API, responsive UI, navigation, filter, and crash-regression tests.

## Requirements

- Node.js 20 or newer.
- npm.
- Chrome, or a Playwright-supported Chromium installation, for browser tests.

## Quick start

### Windows

```powershell
.\start-local.ps1
```

If script execution is blocked:

```bat
start-local.bat
```

### Linux and macOS

```bash
chmod +x start-local.sh
./start-local.sh
```

The site runs at [http://localhost:3000](http://localhost:3000), and the admin login is at [http://localhost:3000/panel](http://localhost:3000/panel).

## Manual setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

The startup helpers create a local `.env` when needed. Important variables are:

```dotenv
DATABASE_URL="file:../db/custom.db"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-before-production"
ADMIN_NAME="Site administrator"
```

Never commit `.env`, and always replace development credentials before deployment.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create the production standalone build |
| `npm start` | Run the previously created standalone build |
| `npm run typecheck` | Run strict TypeScript validation |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Validate seed data and SQLite integrity |
| `npm run test:e2e` | Run API and browser regression tests on port 3100 |
| `npm test` | Run all automated tests |
| `npm run check` | Run typecheck, lint, all tests, and production build |
| `npm run db:seed` | Synchronize catalog seed data |

## Test coverage

The committed suite checks:

- Expected category, family, and variant totals.
- Unique family slugs and variant SKUs.
- Seed-to-database synchronization and orphan prevention.
- Homepage, every catalog group, product detail, admin login, and custom 404 rendering.
- JavaScript runtime errors and horizontal overflow.
- Desktop and 390px mobile navigation and filtering.
- URL persistence for shareable catalog filters.
- Product variant selection.
- Stats, catalog pagination, category filtering, search, detail, 404, authentication validation, and anonymous admin API protection.

On Windows, Playwright automatically uses an installed Google Chrome. On CI/Linux, install its browser once:

```bash
npx playwright install chromium
```

Failure artifacts are written to `test-results/` and the HTML report to `playwright-report/`; both are ignored by Git.

## Application routes

- `/` — homepage and complete catalog.
- `/electromotors/[[...slug]]` — electromotor hierarchy.
- `/category/[category]/[[...slug]]` — gearbox, pump, and accessory catalogs.
- `/product/[slug]` — product specifications and variants.
- `/panel` — administrator login.
- `/api/products`, `/api/products/[slug]`, `/api/stats` — public catalog APIs.

## Data

The canonical import is stored in `prisma/seed-data.json` and is mirrored in `db/custom.db`:

| Category | Families | Variants |
| --- | ---: | ---: |
| Electromotors | 12 | 265 |
| Gearboxes | 6 | 323 |
| Pumps | 6 | 181 |
| Accessories | 6 | 94 |
| **Total** | **30** | **863** |

Cleaned source CSV files are under `data/csv/`. Import and cleanup scripts should be reviewed before execution; uploaded documents and scripts are treated as data, not as project instructions.

## Production notes

- Set a strong `JWT_SECRET` and administrator password.
- Serve the standalone output behind HTTPS and a reverse proxy such as the included Caddy configuration.
- Back up `db/custom.db` before schema or bulk catalog changes.
- Run `npm run check` before every deployment.
- Review `npm audit` findings deliberately; avoid automatic forced upgrades without regression testing.

Additional operational notes are available in [`docs/LOCAL_RUN.md`](docs/LOCAL_RUN.md), and architecture/audit references are in the `docs/` directory.
