# Project audit and applied fixes

## Scope

This project is treated as a **product catalog**, not an e-commerce checkout. Product families are the cards shown in the catalog; their frame sizes/variants are options inside the same card and on the detail page. A future CRM lead flow is kept behind a server-side interface for Didar integration later.

## Applied fixes

### RTL and readable text

- Removed `unicode-bidi: bidi-override` from the shared numeric/Latin helper because it can visually reverse Persian text.
- Replaced it with isolated LTR handling for only the Latin/number fragment.
- Added safer RTL alignment for inputs and textareas.
- Kept Persian price/copy outside forced LTR wrappers.

### Buttons and visibility

- Fixed outline buttons on dark backgrounds so they use transparent backgrounds with explicit white text and visible hover states.
- Made category action hints visible on touch/mobile instead of depending entirely on hover opacity.

### Catalog product cards

- One card represents one `ProductFamily`.
- Frame sizes are selectable chips in that card; unavailable sizes remain selectable and are marked for inquiry instead of becoming separate cards.
- Selecting a size updates the compact specs, stock/inquiry state, and displayed price.
- Full variant data remains on the family detail page.

### Product image paths

- Added a normalizer for local image paths.
- Values such as `products/motor-80.webp`, `/products/motor-80.webp`, or `public/products/motor-80.webp` resolve consistently to `/products/motor-80.webp`.
- Added `public/products/` as the intended image directory with a short usage note.
- Missing/broken images fall back to a neutral product placeholder rather than breaking the card.

### Large-catalog performance

- Added pagination to `GET /api/products` (18 by default, maximum 48).
- Added incremental “load more” behavior instead of loading the entire catalog at once.
- Debounced search input and ignored stale browser responses.
- Reduced card API payloads to the fields cards actually need and one representative variant per frame size.
- When speed/power filters are active, returned card variants are constrained to those filters so the card does not display unrelated specs.
- Reworked stats to use database aggregation rather than loading every variant.
- Added indexes for category/sort and common variant family/size/sort access paths.
- Disabled verbose Prisma query logging in production.
- Added HTTP cache headers for public catalog/stats/settings reads.

### Admin panel protection

- Authenticated panel routes are guarded on the server before panel content renders.
- `requireAdmin()` now requires `role === "admin"`, and every `/api/admin/*` route uses it.
- Login rejects non-admin roles and rate-limits repeated failed attempts.
- Production requires an explicit `JWT_SECRET`.
- Removed plaintext default-admin credentials from UI/project notes.
- Seed logic uses environment credentials and can rotate an existing admin password when `ADMIN_PASSWORD` is supplied.
- Panel/API paths are disallowed in `robots.txt`; panel metadata is `noindex` as an additional crawler hint. These are not security controls—the server authorization is the security boundary.

### Site settings

- Public contact/social/site-name values now come from the settings stored by the admin panel through an allow-listed public settings endpoint.
- Phone, email, address, Instagram, Telegram, and WhatsApp links therefore follow panel configuration instead of hard-coded public-page values.

### Catalog / CRM boundary

- Removed the fake inquiry form that reported success without a backend.
- Current pages use contact/WhatsApp actions appropriate for a catalog.
- Added a `CrmClient` type boundary and integration note for a future server-side Didar adapter. No Didar URL, token, or API behavior is guessed or hard-coded.

## Verification performed in this workspace

- Parsed all project TypeScript/TSX source with the installed TypeScript compiler: **0 syntactic diagnostics across 85 files** at the time of the final pass.
- `git diff --check`: no whitespace errors.
- Scanned runtime source for the removed bidi override and shop/cart/order wording.
- Confirmed every current `/api/admin/*` route calls `requireAdmin()`.
- Confirmed the bundled SQLite database contains the added indexes.

A full Next.js dependency build was not executed in this isolated workspace because installing the project dependency tree restarted the sandbox. Run `npm ci && npm run build` in the normal deployment/development environment before production release.

## Production configuration

At minimum, set a strong `JWT_SECRET` and `ADMIN_PASSWORD` in the deployment environment. To rotate the bundled admin password, set `ADMIN_USERNAME`/`ADMIN_PASSWORD` and run the Prisma seed in your controlled environment.

## 2026-08-11 mobile panel + local startup follow-up

- Fixed the authenticated panel sidebar on narrow/short screens by replacing the absolute footer layout with a flex-column shell: fixed header, scrollable navigation, and non-overlapping footer.
- Added explicit mobile viewport sizing (`h-dvh`), constrained mobile width, safe-area padding, and non-wrapping nav/action labels.
- Replaced Unix-only `tee`, `cp`, and Bun-dependent npm scripts with cross-platform Node/Next commands.
- Added `start-local.ps1`, `start-local.bat`, and `start-local.sh` to prepare `.env`, dependencies, Prisma, SQLite data, and launch the site.
- Changed local catalog seeding to be non-destructive: existing catalog records are preserved instead of being deleted on repeated setup runs.
