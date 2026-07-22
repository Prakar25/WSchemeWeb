import axios from "../api/axios";
import { DOCUMENT_TYPES_URL } from "../api/api_routing_urls";

let cacheAll = null;
let cacheProfileOnly = null;

function normalizeDocumentType(raw) {
  if (!raw || typeof raw !== "object") return null;
  const key = raw.key || raw.document_type || raw.documentType;
  if (!key) return null;
  return {
    key: String(key),
    label: raw.label || String(key),
    aliases: Array.isArray(raw.aliases) ? raw.aliases : [],
    profileReusable: Boolean(raw.profileReusable ?? raw.profile_reusable),
  };
}

function parseDocumentTypesResponse(data) {
  const list =
    data?.document_types ??
    data?.documentTypes ??
    (Array.isArray(data) ? data : []);
  return list.map(normalizeDocumentType).filter(Boolean);
}

/**
 * @param {{ profileOnly?: boolean, force?: boolean }} options
 * @returns {Promise<Array<{ key, label, aliases, profileReusable }>>}
 */
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
  else cacheAll = types;
  return types;
}

export function documentTypesByKey(types) {
  return Object.fromEntries((types || []).map((d) => [d.key, d]));
}

export function getDocumentTypeLabel(key, byKey = {}) {
  if (!key) return "";
  return byKey[key]?.label || key;
}

/** Keys required on a scheme (canonical catalog keys). */
export function getSchemeRequiredDocumentKeys(scheme) {
  if (!scheme) return [];
  const keys = scheme.scheme_required_document_type_keys;
  if (Array.isArray(keys) && keys.length) {
    return keys.map(String).filter(Boolean);
  }
  const types = scheme.scheme_required_document_types;
  if (Array.isArray(types) && types.length) {
    return types
      .map((t) => (typeof t === "string" ? t : t?.key || t?.document_type))
      .filter(Boolean)
      .map(String);
  }
  const enriched = scheme.scheme_required_documents_enriched;
  if (Array.isArray(enriched) && enriched.length) {
    return enriched.map((d) => d.key).filter(Boolean).map(String);
  }
  const legacy = scheme.scheme_required_documents;
  if (Array.isArray(legacy) && legacy.length) {
    return legacy
      .map((d) => (typeof d === "object" ? d.document_type || d.key : d))
      .filter(Boolean)
      .map(String);
  }
  return [];
}

/** Display list for scheme detail UI */
export function getSchemeRequiredDocumentsDisplay(scheme, byKey = {}) {
  const enriched = scheme?.scheme_required_documents_enriched;
  if (Array.isArray(enriched) && enriched.length) {
    return enriched.map((d) => ({
      key: d.key,
      label: d.label || byKey[d.key]?.label || d.key,
      profileReusable: d.profileReusable ?? d.profile_reusable,
    }));
  }
  return getSchemeRequiredDocumentKeys(scheme).map((key) => ({
    key,
    label: byKey[key]?.label || key,
    profileReusable: byKey[key]?.profileReusable,
  }));
}

export function clearDocumentTypesCache() {
  cacheAll = null;
  cacheProfileOnly = null;
}
