# Didar CRM integration boundary

The current application is a product catalog, not an online shop. It does not fake a successful lead submission and it does not contain a checkout/cart flow.

For the later Didar CRM phase, keep CRM access server-side and implement the `CrmClient` interface in `src/lib/crm/types.ts`.

Intended flow:
1. Product UI identifies the selected family and size/variant.
2. A future inquiry form posts to a server endpoint such as `/api/inquiries`.
3. The endpoint validates and rate-limits the payload.
4. The endpoint calls a Didar adapter implementing `CrmClient`.
5. CRM credentials remain in server environment variables only.
6. The browser receives only success/failure; CRM credentials are never exposed client-side.
