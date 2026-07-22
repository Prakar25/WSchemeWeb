import axios from "../api/axios";
import {
  APPLICATIONS_UPLOAD_DOCUMENT_URL,
  DOCUMENT_TYPES_URL,
  PUBLIC_PROFILE_DOCUMENTS_URL,
  PUBLIC_PROFILE_UPLOAD_DOCUMENT_URL,
  SCHEMES_CONFIG_URL,
  applicationSchemeApplyFormUrl,
} from "../api/api_routing_urls";
import { mergePublicApiParams } from "./user.utils";

let cacheAll = null;
let cacheProfileOnly = null;
let cacheCatalog = null;

function normalizeDocumentType(raw) {
  if (!raw || typeof raw !== "object") return null;
  const key = raw.key || raw.document_type || raw.documentType;
  if (!key) return null;
  const acceptedMimeTypes =
    raw.acceptedMimeTypes ??
    raw.accepted_mime_types ??
    (Array.isArray(raw.mimeTypes) ? raw.mimeTypes : null);
  const maxSizeMb = raw.maxSizeMb ?? raw.max_size_mb ?? raw.maxSizeMB ?? null;
  return {
    key: String(key),
    label: raw.label || String(key),
    aliases: Array.isArray(raw.aliases) ? raw.aliases : [],
    profileReusable: Boolean(raw.profileReusable ?? raw.profile_reusable),
    acceptedMimeTypes: Array.isArray(acceptedMimeTypes) ? acceptedMimeTypes : null,
    maxSizeMb: maxSizeMb != null ? Number(maxSizeMb) : null,
  };
}

function parseDocumentTypesResponse(data) {
  const list =
    data?.document_types ??
    data?.documentTypes ??
    (Array.isArray(data) ? data : []);
  return list.map(normalizeDocumentType).filter(Boolean);
}

export async function fetchDocumentCatalog({ force = false } = {}) {
  if (!force && cacheCatalog) return cacheCatalog;
  const res = await axios.get(DOCUMENT_TYPES_URL);
  const data = res.data || {};
  const document_types = parseDocumentTypesResponse(data);
  const profile_reusable_types = (
    data.profile_reusable_types ??
    data.profileReusableTypes ??
    document_types.filter((d) => d.profileReusable)
  ).map((d) => (typeof d === "string" ? document_types.find((t) => t.key === d) : normalizeDocumentType(d))).filter(Boolean);
  const scheme_only_types = (
    data.scheme_only_types ??
    data.schemeOnlyTypes ??
    document_types.filter((d) => !d.profileReusable)
  ).map((d) => (typeof d === "string" ? document_types.find((t) => t.key === d) : normalizeDocumentType(d))).filter(Boolean);

  cacheCatalog = {
    document_types,
    profile_reusable_types,
    scheme_only_types,
    byKey: documentTypesByKey(document_types),
  };
  cacheAll = document_types;
  return cacheCatalog;
}

export async function fetchDocumentTypes({ profileOnly = false, force = false } = {}) {
  if (!force) {
    if (profileOnly && cacheProfileOnly) return cacheProfileOnly;
    if (!profileOnly && cacheAll) return cacheAll;
  }
  const res = await axios.get(DOCUMENT_TYPES_URL, {
    params: profileOnly ? { profile_only: true } : {},
  });
  const types = parseDocumentTypesResponse(res.data);
  if (profileOnly) cacheProfileOnly = types;
  else {
    cacheAll = types;
    cacheCatalog = null;
  }
  return types;
}

export function documentTypesByKey(types) {
  return Object.fromEntries((types || []).map((d) => [d.key, d]));
}

export function getDocumentTypeLabel(key, byKey = {}) {
  if (!key) return "";
  return byKey[key]?.label || key;
}

/** Human-readable line for apply-form document_summary (string or API object). */
export function formatDocumentSummary(summary) {
  if (summary == null) return null;
  if (typeof summary === "string") {
    const trimmed = summary.trim();
    return trimmed || null;
  }
  if (typeof summary !== "object") return String(summary);

  const total = summary.total_required ?? summary.totalRequired;
  const prefilled = summary.prefilled_count ?? summary.prefilledCount ?? 0;
  const needsUpload = summary.needs_upload_count ?? summary.needsUploadCount ?? 0;
  const allReady = summary.all_documents_ready ?? summary.allDocumentsReady;

  if (allReady) {
    return total != null
      ? `All ${total} required document${total === 1 ? "" : "s"} are ready.`
      : "All required documents are ready.";
  }

  const parts = [];
  if (total != null) {
    const ready = Math.max(0, total - needsUpload);
    parts.push(`${ready} of ${total} document${total === 1 ? "" : "s"} ready`);
  }
  if (prefilled > 0) {
    parts.push(
      `${prefilled} from your profile`
    );
  }
  if (needsUpload > 0) {
    parts.push(
      `${needsUpload} still need${needsUpload === 1 ? "s" : ""} upload`
    );
  }

  return parts.length ? `${parts.join(" · ")}.` : null;
}

/** Validate file against catalog mime/size rules */
export function validateFileForDocumentType(file, docType) {
  if (!file) return { ok: false, message: "No file selected." };
  const defaultMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  const mimes = docType?.acceptedMimeTypes?.length ? docType.acceptedMimeTypes : defaultMimes;
  const maxMb = docType?.maxSizeMb ?? 10;
  if (!mimes.includes(file.type)) {
    return { ok: false, message: "File type not allowed. Use PDF or image (JPEG, PNG, WebP)." };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, message: `File must be under ${maxMb} MB.` };
  }
  return { ok: true };
}

const PROFILE_CATALOG_KEYS = new Set([
  "aadhaarCard",
  "birthCertificate",
  "certificateOfIdentification",
]);

function isCustomDocumentKey(key) {
  const k = String(key || "");
  return k.startsWith("custom_") || k.startsWith("text_");
}

function looksLikeCatalogKey(value) {
  const s = String(value || "").trim();
  return /^[a-z][a-zA-Z0-9]*$/.test(s) && !s.includes(" ");
}

/** Admin text tags — scheme_required_document_types (plain labels) */
export function getSchemeRequiredDocumentLabels(scheme) {
  if (!scheme) return [];

  const textEnriched = scheme.scheme_text_documents_enriched;
  if (Array.isArray(textEnriched) && textEnriched.length) {
    return textEnriched
      .map((d) => (d.label || d.title || "").trim())
      .filter(Boolean);
  }

  const raw = scheme.scheme_required_document_types;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return (item?.label || item?.title || "").trim();
    })
    .filter(Boolean)
    .filter((label) => {
      if (scheme.uses_legacy_document_format) return true;
      return !PROFILE_CATALOG_KEYS.has(label) && !looksLikeCatalogKey(label);
    });
}

/** Admin profile prefill keys — scheme_profile_document_types */
export function getSchemeProfileDocumentKeys(scheme) {
  if (!scheme) return [];

  const keys =
    scheme.scheme_profile_document_types ?? scheme.schemeProfileDocumentTypes;
  if (Array.isArray(keys) && keys.length) {
    return keys.map(String).filter(Boolean);
  }

  const enriched =
    scheme.scheme_profile_documents_enriched ??
    scheme.schemeProfileDocumentsEnriched;
  if (Array.isArray(enriched) && enriched.length) {
    return enriched.map((d) => d.key).filter(Boolean).map(String);
  }

  return [];
}

/** @deprecated Use getSchemeProfileDocumentKeys */
export function getSchemeRequiredDocumentKeys(scheme) {
  return getSchemeProfileDocumentKeys(scheme);
}

export function normalizeEnrichedDocument(d, byKey = {}) {
  if (!d || typeof d !== "object") return null;
  const key = d.key || d.document_type || d.documentType;
  const label = (d.label || d.title || "").trim();
  if (!key && !label) return null;
  const k = key ? String(key) : label;
  const profileReusable = Boolean(
    d.profileReusable ?? d.profile_reusable ?? PROFILE_CATALOG_KEYS.has(k)
  );
  const isCustom = Boolean(
    d.isCustom ??
      d.is_custom ??
      d.isTextDocument ??
      d.is_text_document ??
      (!profileReusable && (isCustomDocumentKey(k) || Boolean(label && !PROFILE_CATALOG_KEYS.has(k))))
  );
  return {
    key: k,
    label: label || byKey[k]?.label || k,
    profileReusable,
    isCustom,
    isTextDocument: isCustom && !profileReusable,
  };
}

export function getSchemeRequiredDocumentsDisplay(scheme, byKey = {}) {
  const combined = scheme?.scheme_required_documents_enriched;
  if (Array.isArray(combined) && combined.length) {
    return combined.map((d) => normalizeEnrichedDocument(d, byKey)).filter(Boolean);
  }

  const textDocs = getSchemeRequiredDocumentLabels(scheme).map((label, i) => ({
    key: `text_${i}`,
    label,
    profileReusable: false,
    isCustom: true,
    isTextDocument: true,
  }));
  const profileDocs = getSchemeProfileDocumentKeys(scheme).map((key) => ({
    key,
    label: byKey[key]?.label || key,
    profileReusable: true,
    isCustom: false,
    isTextDocument: false,
  }));
  return [...textDocs, ...profileDocs];
}

/** Client-side guard: profile KYC labels should not appear in the text list */
export function findProfileDocumentOverlap(textLabels, profileKeys, profileTypes = []) {
  const profileLabels = new Set(
    profileKeys.map((k) => {
      const match = profileTypes.find((t) => t.key === k);
      return (match?.label || k).trim().toLowerCase();
    })
  );
  PROFILE_CATALOG_KEYS.forEach((k) => profileLabels.add(k.toLowerCase()));

  return textLabels.filter((label) => {
    const lower = label.trim().toLowerCase();
    return profileLabels.has(lower) || PROFILE_CATALOG_KEYS.has(label);
  });
}

/** GET /schemes/:id — full scheme with enriched document fields */
export async function fetchSchemeById(schemeId) {
  const res = await axios.get(`${SCHEMES_CONFIG_URL}/${encodeURIComponent(String(schemeId))}`);
  return res.data?.scheme ?? res.data ?? null;
}

/** Normalize required_documents item from apply-form */
export function normalizeRequiredDocument(item, byKey = {}) {
  if (!item || typeof item !== "object") return null;
  const key = item.key || item.document_type || item.documentType;
  if (!key) return null;
  const k = String(key);
  const isCustom = Boolean(
    item.isCustom ?? item.is_custom ?? isCustomDocumentKey(k)
  );
  const willPrefill = Boolean(item.will_prefill ?? item.willPrefill);
  const needsUpload = Boolean(
    item.needs_upload ?? item.needsUpload ?? (isCustom ? true : undefined)
  );
  return {
    key: k,
    label: item.label || byKey[k]?.label || k,
    isCustom,
    will_prefill: isCustom ? false : willPrefill,
    needs_upload: isCustom ? true : needsUpload,
    profile_document: item.profile_document ?? item.profileDocument ?? null,
    profileReusable: item.profileReusable ?? item.profile_reusable ?? byKey[k]?.profileReusable,
    acceptedMimeTypes: item.acceptedMimeTypes ?? item.accepted_mime_types ?? byKey[k]?.acceptedMimeTypes,
    maxSizeMb: item.maxSizeMb ?? item.max_size_mb ?? byKey[k]?.maxSizeMb,
  };
}

/** GET /public-profile/documents — profile KYC slot status */
export async function fetchProfileDocumentSlots(userId) {
  const res = await axios.get(PUBLIC_PROFILE_DOCUMENTS_URL, {
    params: mergePublicApiParams(userId ? { userId } : {}),
    withCredentials: true,
  });
  const data = res.data || {};
  const slots = (data.document_slots ?? data.documentSlots ?? []).map((slot) => ({
    key: slot.key,
    label: slot.label || slot.key,
    uploaded: Boolean(slot.uploaded),
    document: slot.document ?? null,
  }));
  return {
    slots,
    profileComplete: Boolean(data.profile_complete ?? data.profileComplete),
    uploadedCount: data.uploaded_count ?? data.uploadedCount ?? 0,
  };
}

/** POST /public-profile/upload-document */
export async function uploadProfileDocument(file, documentType, userId, docTypeMeta) {
  const validation = validateFileForDocumentType(file, docTypeMeta);
  if (!validation.ok) throw new Error(validation.message);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  const res = await axios.post(PUBLIC_PROFILE_UPLOAD_DOCUMENT_URL, formData, {
    params: mergePublicApiParams(userId ? { userId } : {}),
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return res.data;
}

/** POST /applications/upload-document — catalog, custom, or replacement on apply */
export async function uploadApplicationDocument(
  file,
  documentType,
  userId,
  docTypeMeta,
  schemeId
) {
  const validation = validateFileForDocumentType(file, docTypeMeta);
  if (!validation.ok) throw new Error(validation.message);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);
  if (userId) formData.append("userId", String(userId));
  if (schemeId) formData.append("scheme_id", String(schemeId));

  const res = await axios.post(APPLICATIONS_UPLOAD_DOCUMENT_URL, formData, {
    params: mergePublicApiParams({
      ...(userId ? { userId } : {}),
      ...(schemeId ? { scheme_id: String(schemeId) } : {}),
      documentType: String(documentType),
    }),
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  const doc = res.data?.document ?? res.data;
  const fileUrl = doc?.file_url ?? doc?.fileUrl ?? doc?.filePath;
  if (!fileUrl) throw new Error(res.data?.message || "Upload failed");
  return { document: doc, file_url: fileUrl };
}

/** GET /applications/scheme/:id/apply-form */
export async function fetchSchemeApplyForm(schemeId, userId) {
  const res = await axios.get(applicationSchemeApplyFormUrl(schemeId), {
    params: mergePublicApiParams(userId ? { userId } : {}),
    withCredentials: true,
  });
  const data = res.data?.data ?? res.data ?? {};
  const byKey = cacheCatalog?.byKey ?? {};

  const requiredRaw = data.required_documents ?? data.requiredDocuments ?? [];
  const required_documents = (Array.isArray(requiredRaw) ? requiredRaw : [])
    .map((item) => normalizeRequiredDocument(item, byKey))
    .filter(Boolean);

  return {
    scheme: data.scheme ?? null,
    custom_form_fields: data.custom_form_fields ?? data.customFormFields ?? [],
    required_documents,
    isEligible: data.isEligible ?? data.is_eligible ?? true,
    eligibilityReason: data.eligibilityReason ?? data.eligibility_reason ?? null,
    already_applied: Boolean(data.already_applied ?? data.alreadyApplied),
    existing_application: data.existing_application ?? data.existingApplication ?? null,
    document_summary: data.document_summary ?? data.documentSummary ?? null,
    suggested_documents_submitted:
      data.suggested_documents_submitted ?? data.suggestedDocumentsSubmitted ?? [],
    documents_prefill_preview:
      data.documents_prefill_preview ?? data.documentsPrefillPreview ?? [],
    applicant: data.applicant ?? data.user ?? null,
  };
}

export function clearDocumentTypesCache() {
  cacheAll = null;
  cacheProfileOnly = null;
  cacheCatalog = null;
}
