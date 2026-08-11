export interface CatalogInquiry {
  name: string;
  phone: string;
  message?: string;
  productFamilyId?: string;
  productSlug?: string;
  variantId?: string;
  source: "catalog";
}
export interface CrmLeadResult { externalId: string; }
export interface CrmClient {
  createLead(inquiry: CatalogInquiry): Promise<CrmLeadResult>;
}
