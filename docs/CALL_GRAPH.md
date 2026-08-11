# STK Motors runtime call graph

```mermaid
flowchart LR
  Browser[Public browser]
  Home[Home catalog /]
  Detail[Product detail /product/:slug]
  ProductsAPI[GET /api/products]
  ProductAPI[GET /api/products/:slug]
  StatsAPI[GET /api/stats]
  SettingsAPI[GET /api/settings]
  DB[(Prisma + SQLite)]

  AdminBrowser[Admin browser]
  Login[/panel login]
  AuthAPI[POST/DELETE /api/auth]
  LoginLimit[Login rate limiter]
  ProtectedLayout[Server protected panel layout]
  SessionAPI[GET /api/auth/session]
  AdminPages[/panel/dashboard + families + settings]
  AdminAPI[/api/admin/*]
  Auth[JWT cookie + requireAdmin]

  FutureForm[Future catalog inquiry]
  FutureAPI[Future /api/inquiries]
  CrmBoundary[CrmClient interface]
  Didar[Didar CRM]

  Browser --> Home
  Home --> ProductsAPI
  Home --> StatsAPI
  Home --> SettingsAPI
  Browser --> Detail
  Detail --> ProductAPI
  Detail --> SettingsAPI
  ProductsAPI --> DB
  ProductAPI --> DB
  StatsAPI --> DB
  SettingsAPI --> DB

  AdminBrowser --> Login
  Login --> AuthAPI
  AuthAPI --> LoginLimit
  AuthAPI --> DB
  AuthAPI --> Auth
  AdminBrowser --> ProtectedLayout
  ProtectedLayout --> Auth
  AdminPages --> SessionAPI
  SessionAPI --> Auth
  AdminPages --> AdminAPI
  AdminAPI --> Auth
  AdminAPI --> DB

  FutureForm -. later .-> FutureAPI
  FutureAPI -. later .-> CrmBoundary
  CrmBoundary -. later .-> Didar
```

## Performance-sensitive path

`GET /api/products` is paginated and returns lightweight card fields. Variants are reduced to one representative row per frame size for catalog cards. The full variant list is reserved for `GET /api/products/:slug`. Search input is debounced, stale browser requests are ignored, and additional families are loaded incrementally. Database indexes cover common family/category and family/size/sort paths, and Prisma query logging is disabled in production except for errors.

`GET /api/stats` uses database aggregation instead of loading every variant row. Public site settings are fetched through a small allow-listed endpoint and cached independently.

## Authorization path

Authenticated panel pages are gated in a server layout before panel UI is rendered. Admin APIs also call `requireAdmin()`, which only accepts a JWT session with `role === "admin"`. Login failures are rate-limited, and production requires an explicit `JWT_SECRET`.

## CRM boundary

The current site is a catalog, not a checkout/store. The future inquiry path is deliberately separated behind `CrmClient`; a Didar adapter can be added server-side later without coupling public UI code to CRM credentials or endpoints.
