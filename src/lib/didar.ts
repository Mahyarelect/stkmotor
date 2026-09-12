/**
 * Didar CRM Integration Service
 * Handles lead creation, contact syncing, deal generation, and activity logging.
 */

export interface LeadPayload {
  fullName: string;
  phone: string;
  company?: string;
  message?: string;
  productTitle?: string;
  productSku?: string;
  productUrl?: string;
  variantDetails?: string;
}

export interface DidarContact {
  Id: string;
  FirstName?: string;
  LastName?: string;
  DisplayName?: string;
  MobilePhone?: string;
  Code?: number;
}

export interface DidarDeal {
  Id: string;
  Title: string;
  PersonId: string;
  PipelineId: string;
  PipelineStageId: string;
  OwnerId: string;
}

export interface LeadSubmissionResult {
  success: boolean;
  contactId?: string;
  dealId?: string;
  message: string;
  isExistingContact?: boolean;
}

// Default constants configured for STK Motor Didar CRM Account
export const DIDAR_DEFAULT_API_KEY = "96n9yze8bh44j8xpghr5pbs4gs6s5rv3";
export const DIDAR_DEFAULT_PIPELINE_ID = "5e5b295e-155c-4f79-a3b6-c23e39ab9ec9"; // کاریز استیکو
export const DIDAR_DEFAULT_STAGE_ID = "9548e842-86f2-4db3-aa51-b41b16b4767d"; // سرنخ جدید
export const DIDAR_DEFAULT_OWNER_ID = "6b60f98f-7594-40e4-ba9c-2d3e53876d7b"; // مهدی امینی
export const DIDAR_BASE_URL = "https://app.didar.me";

/**
 * Normalizes Persian and Arabic numerals into standard ASCII digits.
 */
export function normalizeDigits(str: string): string {
  if (!str) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], "g"), String(i));
    result = result.replace(new RegExp(arabicDigits[i], "g"), String(i));
  }
  return result;
}

/**
 * Normalizes Iranian phone numbers into 11-digit `09xxxxxxxxx` format.
 * Returns null if format is not an Iranian mobile number.
 */
export function normalizeIranianMobile(rawPhone: string): string | null {
  if (!rawPhone) return null;

  const converted = normalizeDigits(rawPhone).trim();
  // Reject if contains Latin letters or Persian/Arabic letters
  if (/[a-zA-Z\u0600-\u06FF]/.test(converted)) return null;

  // Strip all non-digit characters except leading +
  const hasLeadingPlus = converted.startsWith("+");
  let digits = converted.replace(/\D/g, "");

  // Handle +98 (0) 9... where user writes international prefix with optional leading 0
  if (digits.startsWith("980") && digits.length === 13) {
    digits = "98" + digits.slice(3);
  }

  let clean = digits;
  if (hasLeadingPlus || digits.startsWith("0098") || digits.startsWith("98")) {
    if (digits.startsWith("0098")) {
      clean = "0" + digits.slice(4);
    } else if (digits.startsWith("98") && digits.length === 12) {
      clean = "0" + digits.slice(2);
    }
  } else if (digits.startsWith("9") && digits.length === 10) {
    clean = "0" + digits;
  }

  // Final check: must be 11 digits and start with 09
  if (/^09\d{9}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Splits a full name into First Name and Last Name.
 * Didar CRM requires `Contact.LastName`.
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = (fullName || "").trim();
  if (!trimmed) {
    return { firstName: "", lastName: "کاربر وب‌سایت" };
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: "", lastName: parts[0] };
  }

  const lastName = parts.pop() || "";
  const firstName = parts.join(" ");
  return { firstName, lastName };
}

export interface ResolvedPipelineContext {
  pipelineId: string;
  stageId: string;
  ownerId: string;
}

let cachedContext: { context: ResolvedPipelineContext; expiresAt: number } | null = null;

/**
 * Resolves Didar CRM pipeline, stage, and owner IDs.
 * Uses environment overrides first, then queries Didar API dynamically, with fallback to defaults.
 */
export async function resolveDidarContext(
  apiKey: string = getApiKey(),
  forceRefresh = false
): Promise<ResolvedPipelineContext> {
  const now = Date.now();
  if (!forceRefresh && cachedContext && cachedContext.expiresAt > now) {
    return cachedContext.context;
  }

  let pipelineId = process.env.DIDAR_PIPELINE_ID || "";
  let stageId = process.env.DIDAR_STAGE_ID || "";
  let ownerId = process.env.DIDAR_OWNER_ID || "";

  if (!pipelineId || !stageId || !ownerId || forceRefresh) {
    try {
      if (!pipelineId || !stageId || forceRefresh) {
        const pUrl = `${DIDAR_BASE_URL}/api/pipeline/list/0?apikey=${encodeURIComponent(apiKey)}`;
        const pRes = await fetch(pUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(8000),
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData?.Response && Array.isArray(pData.Response) && pData.Response.length > 0) {
            const activePipeline = pData.Response[0];
            pipelineId = activePipeline.Id;
            if (activePipeline.Stages && activePipeline.Stages.length > 0) {
              stageId = activePipeline.Stages[0].Id;
            }
          }
        }
      }

      if (!ownerId || forceRefresh) {
        const uUrl = `${DIDAR_BASE_URL}/api/User/List?apikey=${encodeURIComponent(apiKey)}`;
        const uRes = await fetch(uUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(8000),
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData?.Response && Array.isArray(uData.Response) && uData.Response.length > 0) {
            const owner =
              uData.Response.find((u: { IsOwner?: boolean; IsDisabled?: boolean }) => u.IsOwner && !u.IsDisabled) ||
              uData.Response[0];
            ownerId = owner.UserId || owner.Id;
          }
        }
      }
    } catch (err) {
      console.warn("[didar] Dynamic context discovery warning:", err);
    }
  }

  const context: ResolvedPipelineContext = {
    pipelineId: pipelineId || DIDAR_DEFAULT_PIPELINE_ID,
    stageId: stageId || DIDAR_DEFAULT_STAGE_ID,
    ownerId: ownerId || DIDAR_DEFAULT_OWNER_ID,
  };

  cachedContext = { context, expiresAt: now + 60 * 60 * 1000 };
  return context;
}

/**
 * Finds an existing contact by mobile phone number.
 */
export async function getPersonByPhone(
  phone: string,
  apiKey: string = getApiKey()
): Promise<DidarContact | null> {
  const url = `${DIDAR_BASE_URL}/api/contact/getbyphonenumber?apikey=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ MobilePhone: phone }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[didar] getbyphonenumber failed with status ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data?.Response && Array.isArray(data.Response) && data.Response.length > 0) {
      return data.Response[0];
    }
    return null;
  } catch (error) {
    console.error("[didar] Error querying contact by phone:", error);
    return null;
  }
}

/**
 * Creates a new contact in Didar CRM.
 * If a duplicate contact exists, safely retrieves and returns the existing contact.
 */
export async function createPerson(
  params: {
    firstName: string;
    lastName: string;
    phone: string;
    company?: string;
    ownerId?: string;
    backgroundInfo?: string;
  },
  apiKey: string = getApiKey()
): Promise<DidarContact> {
  const url = `${DIDAR_BASE_URL}/api/contact/save?apikey=${encodeURIComponent(apiKey)}`;
  const ownerId = params.ownerId || (await resolveDidarContext(apiKey)).ownerId;

  const body = {
    Contact: {
      Type: "Person",
      FirstName: params.firstName,
      LastName: params.lastName,
      MobilePhone: params.phone,
      CompanyName: params.company || "",
      OwnerId: ownerId,
      BackgroundInfo: params.backgroundInfo || "ثبت شده از فرم پاپ‌آپ وب‌سایت",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Self-healing duplicate contact detection
    if (res.status === 400 && errText.includes("Duplicate contacts")) {
      const existing = await getPersonByPhone(params.phone, apiKey);
      if (existing?.Id) {
        return existing;
      }
    }
    throw new Error(`Didar contact creation failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data?.Response?.Id) {
    throw new Error("Invalid Didar contact creation response: missing ID");
  }

  return data.Response;
}

/**
 * Creates a new Deal in Didar CRM pipeline.
 * If stage/pipeline is stale, auto-refreshes pipeline context and retries once.
 */
export async function createDeal(
  params: {
    title: string;
    description: string;
    personId: string;
    pipelineId?: string;
    stageId?: string;
    ownerId?: string;
  },
  apiKey: string = getApiKey()
): Promise<DidarDeal> {
  const context = await resolveDidarContext(apiKey);
  let pipelineId = params.pipelineId || context.pipelineId;
  let stageId = params.stageId || context.stageId;
  let ownerId = params.ownerId || context.ownerId;

  const makeDealRequest = async (pId: string, sId: string, oId: string) => {
    const url = `${DIDAR_BASE_URL}/api/deal/save_v2?apikey=${encodeURIComponent(apiKey)}`;
    const body = {
      Deal: {
        Title: params.title,
        Description: params.description,
        PersonId: params.personId,
        PipelineId: pId,
        PipelineStageId: sId,
        OwnerId: oId,
        Status: "Pending",
      },
    };

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  };

  let res = await makeDealRequest(pipelineId, stageId, ownerId);

  // If failed with 400, retry once with freshly refreshed context
  if (!res.ok && res.status === 400 && (!params.pipelineId || !params.stageId)) {
    const freshContext = await resolveDidarContext(apiKey, true);
    pipelineId = freshContext.pipelineId;
    stageId = freshContext.stageId;
    ownerId = freshContext.ownerId;
    res = await makeDealRequest(pipelineId, stageId, ownerId);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Didar deal creation failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data?.Response?.Id) {
    throw new Error("Invalid Didar deal creation response: missing ID");
  }

  return data.Response;
}

/**
 * Adds an Activity / Note in Didar CRM.
 */
export async function createNote(
  params: {
    note: string;
    dealId?: string;
    contactIds?: string[];
    ownerId?: string;
  },
  apiKey: string = getApiKey()
): Promise<void> {
  const url = `${DIDAR_BASE_URL}/api/activity/save?apikey=${encodeURIComponent(apiKey)}`;
  const ownerId = params.ownerId || (await resolveDidarContext(apiKey)).ownerId;

  const body = {
    Activity: {
      ActivityTypeId: "00000000-0000-0000-0000-000000000000", // Standard Note type in Didar
      OwnerId: ownerId,
      ResultNote: params.note,
      IsDone: true,
      IsPinned: true,
      DealId: params.dealId || "00000000-0000-0000-0000-000000000000",
      ContactIds: params.contactIds || [],
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`[didar] Note creation returned status ${res.status}`);
    }
  } catch (error) {
    console.warn("[didar] Failed to create note:", error);
  }
}

/**
 * High-level function to process and submit a website lead to Didar CRM.
 */
export async function submitLeadToDidar(payload: LeadPayload): Promise<LeadSubmissionResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Didar API Key is not configured.");
  }

  // 1. Validate and normalize phone
  const normalizedPhone = normalizeIranianMobile(payload.phone);
  if (!normalizedPhone) {
    return {
      success: false,
      message: "لطفاً یک شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.",
    };
  }

  // 2. Validate full name
  const trimmedName = (payload.fullName || "").trim();
  if (trimmedName.length < 2) {
    return {
      success: false,
      message: "لطفاً نام و نام خانوادگی خود را کامل وارد فرمایید.",
    };
  }

  const { firstName, lastName } = splitFullName(trimmedName);
  const company = (payload.company || "").trim();
  const message = (payload.message || "").trim();
  const productTitle = (payload.productTitle || "").trim() || "محصول صنعتی";
  const productSku = (payload.productSku || "").trim();
  const productUrl = (payload.productUrl || "").trim();
  const variantDetails = (payload.variantDetails || "").trim();

  // 3. Check for existing contact
  let contactId: string;
  let isExistingContact = false;
  const existing = await getPersonByPhone(normalizedPhone, apiKey);

  if (existing?.Id) {
    contactId = existing.Id;
    isExistingContact = true;
  } else {
    // Create new contact
    const newPerson = await createPerson(
      {
        firstName,
        lastName,
        phone: normalizedPhone,
        company,
        backgroundInfo: `ثبت نام از پاپ‌آپ استعلام محصول: ${productTitle}${productSku ? ` (کد: ${productSku})` : ""}`,
      },
      apiKey
    );
    contactId = newPerson.Id;
  }

  // 4. Build Deal description
  const dealTitle = `استعلام: ${productTitle}${productSku ? ` [${productSku}]` : ""}`;
  const dealDescription = [
    `📌 درخواست استعلام از پاپ‌آپ وب‌سایت`,
    `----------------------------------------`,
    `👤 نام مشتری: ${trimmedName}`,
    `📱 شماره تماس: ${normalizedPhone}`,
    company ? `🏢 نام شرکت / کارگاه: ${company}` : null,
    `⚙️ محصول مورد تقاضا: ${productTitle}`,
    productSku ? `🔖 کد SKU: ${productSku}` : null,
    variantDetails ? `📐 مشخصات فنی: ${variantDetails}` : null,
    productUrl ? `🔗 لینک صفحه محصول: ${productUrl}` : null,
    message ? `💬 پیام / نیاز مشتری: ${message}` : null,
    `⏰ زمان ثبت: ${new Date().toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  // 5. Create Deal
  let dealId: string | undefined;
  try {
    const deal = await createDeal(
      {
        title: dealTitle,
        description: dealDescription,
        personId: contactId,
      },
      apiKey
    );
    dealId = deal.Id;
  } catch (error) {
    console.error("[didar] Failed to create deal:", error);
  }

  // 6. Create note / activity
  try {
    await createNote(
      {
        note: dealDescription,
        dealId,
        contactIds: [contactId],
      },
      apiKey
    );
  } catch (error) {
    console.warn("[didar] Failed to attach note:", error);
  }

  return {
    success: true,
    contactId,
    dealId,
    isExistingContact,
    message: "درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.",
  };
}

function getApiKey(): string {
  return process.env.DIDAR_API_KEY || DIDAR_DEFAULT_API_KEY;
}

function getPipelineId(): string {
  return process.env.DIDAR_PIPELINE_ID || DIDAR_DEFAULT_PIPELINE_ID;
}

function getStageId(): string {
  return process.env.DIDAR_STAGE_ID || DIDAR_DEFAULT_STAGE_ID;
}

function getOwnerId(): string {
  return process.env.DIDAR_OWNER_ID || DIDAR_DEFAULT_OWNER_ID;
}
