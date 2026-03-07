//#region Advertisements (public display + Super Admin management)
export const ADS_PUBLIC_URL = "/ads/public"; // GET – list active ads for display
export const ADS_ADMIN_LIST_URL = "/ads"; // GET – list all ads (Super Admin)
export const ADS_ADMIN_CREATE_URL = "/ads"; // POST – create ad
export const ADS_ADMIN_UPDATE_URL = "/ads"; // PUT /ads/:id – update ad
export const ADS_ADMIN_DELETE_URL = "/ads"; // DELETE /ads/:id – delete ad
export const ADS_ADMIN_REORDER_URL = "/ads/reorder"; // POST – reorder ads
//#endregion

//#region Public User URLs
export const CHECK_AADHAAR_URL = "/public-users";
export const PROFILE_URL = "/profile";
export const APPLICATIONS_APPLY_URL = "/applications/apply";
export const APPLICATIONS_USER_URL = "/applications/user"; // GET /applications/user/:user_id
export const APPLICATIONS_USER_SUMMARY_URL = "/applications/user"; // GET /applications/user/:user_id/summary

// Public Auth URLs - Mobile Number + OTP Authentication
// Note: axios `baseURL` already includes `/api`, so these are relative to that base.
export const PUBLIC_AUTH_REGISTER_SEND_OTP_URL = "/public-auth/register/send-otp";
export const PUBLIC_AUTH_REGISTER_VERIFY_OTP_URL = "/public-auth/register/verify-otp";
export const PUBLIC_AUTH_LOGIN_SEND_OTP_URL = "/public-auth/login/send-otp";
export const PUBLIC_AUTH_LOGIN_VERIFY_OTP_URL = "/public-auth/login/verify-otp";

// Public Profile URLs - Profile Completion & Document Upload
export const PUBLIC_PROFILE_GET_URL = "/public-profile"; // GET /api/public-profile
export const PUBLIC_PROFILE_UPDATE_URL = "/public-profile/update"; // PUT /api/public-profile/update
export const PUBLIC_PROFILE_SUBMIT_COMPLETE_URL = "/public-profile/submit-complete"; // POST - profile + all documents in one request
export const PUBLIC_PROFILE_UPLOAD_DOCUMENT_URL = "/public-profile/upload-document"; // POST /api/public-profile/upload-document
export const PUBLIC_PROFILE_DELETE_DOCUMENT_URL = "/public-profile/delete-document"; // DELETE /api/public-profile/delete-document

//#endregion

//#region System Admin User URLs
export const ADMIN_LOGIN_URL = "/admin-login";
export const ADMIN_REGISTER_URL = "/admin-register"; // POST - register admin (pending until Super Admin/Secretary verifies)

export const SCHEMES_CONFIG_URL = "/schemes";
export const SCHEMES_SIMPLE_URL = "/schemes/simple";

// Department and Category URLs
export const DEPARTMENTS_URL = "/departments";
export const DEPARTMENTS_SIMPLE_URL = "/departments/simple";
export const CATEGORIES_URL = "/categories";
export const CATEGORIES_SIMPLE_URL = "/categories/simple";

// Admin Roles URLs
export const ADMIN_ROLES_URL = "/admin-roles";
export const ADMIN_ROLES_HIERARCHY_URL = "/admin-roles/hierarchy";
export const ADMIN_ROLES_FOR_AUTHORIZATION_URL = "/admin-roles/for-authorization";

export const DASHBOARD_STATISTICS_URL = "/admin/dashboard/statistics";
export const DASHBOARD_SCHEME_BENEFICIARIES_URL = "/admin/dashboard/scheme-beneficiaries";
export const DASHBOARD_FRAUD_ALERTS_URL = "/admin/dashboard/fraud-alerts";
export const ADMIN_PROFILE_URL = "/admin/profile";
export const ADMIN_PENDING_ADMINS_URL = "/admin/pending-admins"; // GET - list pending admins (Super Admin / Secretary only)
export const ADMIN_VERIFY_ADMIN_URL = "/admin/verify-admin"; // POST - approve/reject pending admin
export const APPLICATIONS_ADMIN_URL = "/applications"; // Admin endpoint to get all applications
export const APPLICATIONS_SCHEME_URL = "/applications/scheme"; // GET /applications/scheme/:scheme_id - Get all applicants for a scheme
export const APPLICATION_DETAIL_URL = "/applications"; // GET /applications/:applicationId - Get application details
export const APPLICATION_VERIFY_URL = "/applications"; // POST /applications/:applicationId/verify - Verify application (Verified, Forwarded, Returned, Rejected)
export const APPLICATION_FORWARD_URL = "/applications"; // POST /applications/:applicationId/forward - Forward application to specific admin
export const APPLICATION_ASSIGN_URL = "/applications"; // POST /applications/:applicationId/assign - Assign application to admin
export const APPLICATION_NEXT_STAGE_ADMINS_URL = "/applications"; // GET /applications/:applicationId/next-stage-admins - Get admins for next stage

// Bulk Upload URLs
export const BULK_UPLOAD_PREVIEW_URL = "/bulk-upload/preview"; // POST /bulk-upload/preview - Upload file and get preview
export const BULK_UPLOAD_CONFIRM_URL = "/bulk-upload/confirm"; // POST /bulk-upload/confirm - Confirm and save bulk upload

//#endregion

//#region CSD Admin URLs (CSDAdmin role only)
export const CSD_PENDING_PUBLIC_USERS_URL = "/csd/pending-public-users";
export const CSD_VERIFY_PUBLIC_USER_URL = "/csd/verify-public-user";
export const CSD_PENDING_APPLICATIONS_URL = "/csd/pending-applications"; // Applications with verification_level 9, status !== "Rejected"
//#endregion
