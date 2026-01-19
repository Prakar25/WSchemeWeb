//#region Public User URLs
export const CHECK_AADHAAR_URL = "/public-users";
export const PROFILE_URL = "/profile";
export const APPLICATIONS_APPLY_URL = "/applications/apply";
export const APPLICATIONS_USER_URL = "/applications/user"; // GET /applications/user/:user_id
export const APPLICATIONS_USER_SUMMARY_URL = "/applications/user"; // GET /applications/user/:user_id/summary

//#endregion

//#region System Admin User URLs
export const ADMIN_LOGIN_URL = "/admin-login";

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
export const APPLICATIONS_ADMIN_URL = "/applications"; // Admin endpoint to get all applications
export const APPLICATIONS_SCHEME_URL = "/applications/scheme"; // GET /applications/scheme/:scheme_id - Get all applicants for a scheme
export const APPLICATION_DETAIL_URL = "/applications"; // GET /applications/:applicationId - Get application details
export const APPLICATION_VERIFY_URL = "/applications"; // POST /applications/:applicationId/verify - Verify application (Verified, Forwarded, Returned, Rejected)
export const APPLICATION_FORWARD_URL = "/applications"; // POST /applications/:applicationId/forward - Forward application to specific admin
export const APPLICATION_ASSIGN_URL = "/applications"; // POST /applications/:applicationId/assign - Assign application to admin
export const APPLICATION_NEXT_STAGE_ADMINS_URL = "/applications"; // GET /applications/:applicationId/next-stage-admins - Get admins for next stage

//#endregion
