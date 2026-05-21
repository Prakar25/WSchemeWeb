export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Public auth state (new household/person-based flow)
const LS_ACCOUNT_USER_ID = "accountUserId"; // PublicUser._id (OTP account)
const LS_PUBLIC_USER_ID = "publicUserId"; // same as account — OTP session anchor for APIs
const LS_SESSION_MOBILE = "sessionMobileNumber";
const LS_ACTIVE_APPLICANT_ID = "activeApplicantId"; // BeneficiaryPerson._id (or fallback to account)
const LS_HOUSEHOLD_ID = "householdId";
const LS_ACTIVE_APPLICANT_PROFILE = "activeApplicantProfile"; // cached BeneficiaryPerson profile object

/** Same-tab + cross-hook sync when the active beneficiary (BeneficiaryPerson id) changes */
export const ACTIVE_APPLICANT_CHANGED_EVENT = "wscheme:activeApplicantChanged";

function notifyActiveApplicantChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACTIVE_APPLICANT_CHANGED_EVENT));
}

/** OTP PublicUser._id — session anchor (publicUserId query param) */
/** True when OTP public user session is present (not logged out). */
export const isPublicUserLoggedIn = () => {
  if (localStorage.getItem("role") !== "Public User") return false;
  return Boolean(getStoredPublicUserId());
};

export const getStoredPublicUserId = () => {
  const v = localStorage.getItem(LS_PUBLIC_USER_ID) || localStorage.getItem(LS_ACCOUNT_USER_ID);
  if (v) return v;
  const u = getStoredUser();
  return u?.publicUserId || u?._id || u?.userId || null;
};

export const getStoredAccountUserId = () => getStoredPublicUserId();

/** Mobile used at OTP login — second session anchor */
export const getStoredSessionMobileNumber = () => {
  const v = localStorage.getItem(LS_SESSION_MOBILE);
  if (v) return v;
  const u = getStoredUser();
  return (
    u?.phoneNumber ||
    u?.contact?.mobile?.value ||
    u?.mobileNumber ||
    null
  );
};

/** Resolve mobile from login response + OTP flow */
export function resolveSessionMobileFromUser(user, otpMobile) {
  const fromUser =
    user?.phoneNumber ||
    user?.contact?.mobile?.value ||
    user?.mobileNumber ||
    null;
  const raw = fromUser || otpMobile || null;
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

/**
 * Session anchor params required on public dashboard APIs.
 * Does not include userId — pass that per request (active applicant vs account).
 */
export const getPublicSessionAnchorParams = () => {
  const publicUserId = getStoredPublicUserId();
  const mobileNumber = getStoredSessionMobileNumber();
  const anchor = {};
  if (publicUserId) anchor.publicUserId = String(publicUserId);
  if (mobileNumber) anchor.mobileNumber = String(mobileNumber);
  return anchor;
};

/**
 * Merge session anchor with caller params (caller userId wins).
 */
export const mergePublicApiParams = (params = {}) => {
  const anchor = getPublicSessionAnchorParams();
  const merged = { ...anchor, ...params };
  Object.keys(merged).forEach((k) => {
    if (merged[k] == null || merged[k] === "") delete merged[k];
  });
  return merged;
};

/** Append session anchor to URLSearchParams (e.g. manual scheme list URLs) */
export const appendPublicSessionToSearchParams = (searchParams) => {
  const anchor = getPublicSessionAnchorParams();
  Object.entries(anchor).forEach(([k, v]) => {
    if (v != null && v !== "") searchParams.set(k, v);
  });
  return searchParams;
};

export const getStoredHouseholdId = () => localStorage.getItem(LS_HOUSEHOLD_ID) || null;

export const getStoredActiveApplicantId = () => {
  const v = localStorage.getItem(LS_ACTIVE_APPLICANT_ID);
  // Treat only missing key as absent — empty string must not fall through to OTP user id
  if (v !== null && v !== "") return v;
  // Fallbacks for backwards compatibility
  const u = getStoredUser();
  return (
    u?.primaryBeneficiaryPersonId ||
    u?.primary_beneficiary_person_id ||
    u?.primaryBeneficiaryPerson?._id ||
    u?._id ||
    u?.userId ||
    null
  );
};

/** Resolve BeneficiaryPerson id from household list / dashboard member objects */
export function resolveBeneficiaryPersonId(member) {
  if (!member || typeof member !== "object") return null;
  const raw =
    member._id ??
    member.personId ??
    member.beneficiaryPersonId ??
    member.id ??
    member.userId;
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

/**
 * Persist active applicant + cached profile and notify listeners (single notification).
 * Always use this when switching household member so profile cache updates before id listeners run.
 */
export function setActiveApplicantSelection(member) {
  const idStr = resolveBeneficiaryPersonId(member);
  if (!idStr) return false;
  try {
    localStorage.setItem(LS_ACTIVE_APPLICANT_PROFILE, JSON.stringify(member));
    localStorage.setItem(LS_ACTIVE_APPLICANT_ID, idStr);
  } catch {
    return false;
  }
  notifyActiveApplicantChanged();
  return true;
}

export const setStoredApplicantContext = ({
  accountUserId,
  publicUserId,
  activeApplicantId,
  householdId,
  mobileNumber,
} = {}) => {
  const pubId = publicUserId || accountUserId;
  if (pubId) {
    const idStr = String(pubId);
    localStorage.setItem(LS_PUBLIC_USER_ID, idStr);
    localStorage.setItem(LS_ACCOUNT_USER_ID, idStr);
  }
  if (mobileNumber) localStorage.setItem(LS_SESSION_MOBILE, String(mobileNumber));
  if (activeApplicantId) localStorage.setItem(LS_ACTIVE_APPLICANT_ID, String(activeApplicantId));
  if (householdId) localStorage.setItem(LS_HOUSEHOLD_ID, String(householdId));
  if (activeApplicantId) notifyActiveApplicantChanged();
};

export const setStoredActiveApplicantId = (activeApplicantId) => {
  if (!activeApplicantId) return;
  localStorage.setItem(LS_ACTIVE_APPLICANT_ID, String(activeApplicantId));
  notifyActiveApplicantChanged();
};

export const getStoredActiveApplicantProfile = () => {
  const raw = localStorage.getItem(LS_ACTIVE_APPLICANT_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredActiveApplicantProfile = (profile) => {
  if (!profile || typeof profile !== "object") return;
  localStorage.setItem(LS_ACTIVE_APPLICANT_PROFILE, JSON.stringify(profile));
};

export const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return "****-XXXX-****";
  const str = String(aadhaar).replace(/\s/g, "");
  if (str.length < 4) return "****-XXXX-****";
  return `****-XXXX-${str.slice(-4)}`;
};

export const clearPublicAuthState = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem(LS_ACCOUNT_USER_ID);
  localStorage.removeItem(LS_PUBLIC_USER_ID);
  localStorage.removeItem(LS_SESSION_MOBILE);
  localStorage.removeItem(LS_ACTIVE_APPLICANT_ID);
  localStorage.removeItem(LS_HOUSEHOLD_ID);
  localStorage.removeItem(LS_ACTIVE_APPLICANT_PROFILE);
};

export const calculateAge = (dob) => {
  // dob format: DD-MM-YYYY
  const [day, month, year] = dob.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const formatDobForAge = (isoDate) => {
  if (!isoDate) return null;
  const dateObj = new Date(isoDate);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

/** Profile KYC level for a BeneficiaryPerson (BASIC | PARTIAL | FULL). */
export const getKycLevel = (user) =>
  user?.kycLevel ?? user?.kyc_level ?? null;

/**
 * Profile KYC complete for this member (required fields filled).
 * Prefer API isKycFull; fallback kycLevel === "FULL".
 */
export const isProfileKycFull = (user) => {
  if (!user) return false;
  if (typeof user.isKycFull === "boolean") return user.isKycFull;
  return getKycLevel(user) === "FULL";
};

/** @alias isProfileKycFull — profile data KYC, not CSC */
export const isProfileComplete = isProfileKycFull;

/** Fields still required for FULL profile KYC on this member */
export const getKycMissingFields = (user) => {
  const raw = user?.kycMissingFields ?? user?.kyc_missing_fields;
  return Array.isArray(raw) ? raw.filter(Boolean) : [];
};

const KYC_FIELD_LABELS = {
  aadhaar: "Aadhaar",
  aadhaarNumber: "Aadhaar",
  fullName: "Full name",
  dob: "Date of birth",
  gender: "Gender",
  locality: "Locality",
  district: "District",
  state: "State",
  pincode: "Pincode",
};

export const formatKycMissingFieldsList = (fields) => {
  if (!fields?.length) return "";
  return fields
    .map((f) => KYC_FIELD_LABELS[f] || String(f).replace(/_/g, " "))
    .join(", ");
};

/** Profile KYC messaging only (not CSC) */
export const getKycStatusMessage = (user) =>
  user?.kycStatusMessage ?? user?.kyc_status_message ?? null;

/**
 * CSC / bio-auth verification (household account).
 * pending | verified | rejected
 */
export const getCscVerificationStatus = (user) => {
  if (!user) return null;
  return (
    user.cscVerificationStatus ??
    user.csc_verification_status ??
    user.verificationStatus ??
    user.status?.verificationStatus ??
    user.householdVerificationStatus ??
    null
  );
};

/** @deprecated Use getCscVerificationStatus — this is CSC, not profile KYC */
export const getVerificationStatus = getCscVerificationStatus;

export const isCscVerified = (user) => getCscVerificationStatus(user) === "verified";
export const isCscPending = (user) => getCscVerificationStatus(user) === "pending";

/** CSC-only banner text from API (null when verified) */
export const getCscStatusMessage = (user) => user?.accountStatusMessage ?? null;

/** @alias getCscStatusMessage */
export const getAccountStatusMessage = getCscStatusMessage;

/**
 * Profile KYC completion status for UI prompts
 * @returns {{ isComplete: boolean, message: string }}
 */
export const getProfileCompletionStatus = (user) => {
  if (!user) {
    return {
      isComplete: false,
      message: "Please complete your profile to apply for schemes.",
    };
  }

  if (isProfileKycFull(user)) {
    return {
      isComplete: true,
      message: getKycStatusMessage(user) || "Your profile KYC is complete.",
    };
  }

  const missing = formatKycMissingFieldsList(getKycMissingFields(user));
  const base =
    getKycStatusMessage(user) ||
    "Please complete profile KYC before applying for schemes.";
  return {
    isComplete: false,
    message: missing ? `${base} Still needed: ${missing}.` : base,
  };
};

/** Apply when profile KYC is FULL and CSC verification is verified */
export const canApplyToSchemes = (user) => {
  if (!user) return false;
  return isProfileKycFull(user) && isCscVerified(user);
};

/** Human label for profile KYC badge */
export const getProfileKycBadgeLabel = (user) => {
  if (!user) return "—";
  if (isProfileKycFull(user)) return "FULL";
  const level = getKycLevel(user);
  return level || "Incomplete";
};

/** Human label for CSC badge */
export const getCscBadgeLabel = (user) => {
  const status = getCscVerificationStatus(user);
  if (!status) return null;
  if (status === "verified") return "CSC verified";
  if (status === "pending") return "CSC pending";
  if (status === "rejected") return "CSC rejected";
  return `CSC: ${status}`;
};
