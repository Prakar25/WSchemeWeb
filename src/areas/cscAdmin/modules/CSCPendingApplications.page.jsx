/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  MdAssignment,
  MdInfo,
  MdSearch,
  MdExpandMore,
  MdExpandLess,
  MdCheckCircle,
  MdPendingActions,
} from "react-icons/md";
import axios from "../../../api/axios";
import {
  ADMIN_PROFILE_URL,
  CSC_PENDING_APPLICATIONS_URL,
  APPLICATION_DETAIL_URL,
  APPLICATION_VERIFY_URL,
} from "../../../api/api_routing_urls";
import Dashboard from "../../dashboard-components/dashboard.component";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import GenericModal from "../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import showToast from "../../../utils/notification/NotificationModal";
import { formatTSWTZDate } from "../../../utils/dateFunctions/formatdate";
import { useConfirm } from "../../../reusable-components/ConfirmDialog/ConfirmDialogProvider";

const AADHAAR_SEARCH_MIN = 4;
const AADHAAR_SEARCH_MAX = 12;
const AADHAAR_DEBOUNCE_MS = 400;

function getApplicationId(app) {
  return app?._id || app?.application_id || app?.applicationId || null;
}

function getAadhaarNumber(app) {
  return (
    app?.applicantAadhaarNumber ||
    app?.aadhaarNumber ||
    app?.applicantAadhaar ||
    app?.user_id?.aadhaarNumber ||
    null
  );
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "").slice(0, AADHAAR_SEARCH_MAX);
}

/** 612345678901 → 6123 4567 8901 */
function formatAadhaar(aadhaar) {
  if (!aadhaar) return "—";
  const digits = digitsOnly(aadhaar);
  if (!digits) return "—";
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Null-safe date — never invent dates from Approved status */
function formatCscDate(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return formatTSWTZDate(value);
  } catch {
    return null;
  }
}

const BIOAUTH_REASON_META = {
  fresh_application: {
    label: "Fresh application",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
  re_bioauthentication: {
    label: "Re-bioauthentication",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  no_csc_history: {
    label: "No CSC history",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

function BioauthReasonBadge({ reason }) {
  const meta = BIOAUTH_REASON_META[reason] || {
    label: reason || "Unknown",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function ApplicationCard({
  app,
  onOpen,
  interactive = true,
  defaultExpanded = false,
}) {
  const [historyOpen, setHistoryOpen] = useState(defaultExpanded);
  const id = getApplicationId(app);
  const aadhaar = getAadhaarNumber(app);
  const schemeLabel = app.schemeName || app.scheme_name || "—";
  const applicantLabel = app.applicantName || "Unknown";
  const mobile = app.applicantMobile || "—";
  const appliedAt = formatCscDate(app.date_applied);
  const cscVerifiedAt = formatCscDate(app.cscVerifiedAt);
  const verifications = Array.isArray(app.cscVerifications) ? app.cscVerifications : [];
  const hasMultipleCsc = verifications.length > 1;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{schemeLabel}</div>
          <div className="text-sm text-gray-700 mt-0.5">{applicantLabel}</div>
        </div>
        <BioauthReasonBadge reason={app.bioauthReason} />
      </div>

      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
        <div>
          <span className="text-gray-500">Aadhaar:</span>{" "}
          <span className="font-mono text-gray-800">{formatAadhaar(aadhaar)}</span>
        </div>
        <div>
          <span className="text-gray-500">Mobile:</span>{" "}
          <span className="font-mono text-gray-800">{mobile}</span>
        </div>
        <div>
          <span className="text-gray-500">Application ID:</span>{" "}
          <span className="font-mono text-gray-800 break-all">{id || "—"}</span>
        </div>
        <div>
          <span className="text-gray-500">Status:</span>{" "}
          <span className="text-gray-800">{app.status || "—"}</span>
        </div>
        <div>
          <span className="text-gray-500">Applied:</span> {appliedAt || "—"}
        </div>
        <div>
          <span className="text-gray-500">CSC verified at:</span>{" "}
          {cscVerifiedAt ? (
            <span className="text-gray-800">{cscVerifiedAt}</span>
          ) : (
            <span className="text-amber-700">Not verified by CSC yet</span>
          )}
        </div>
      </div>

      {verifications.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {hasMultipleCsc ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHistoryOpen((v) => !v);
              }}
              className="flex items-center gap-1 text-xs font-medium text-[#d85a30] hover:underline"
            >
              {historyOpen ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
              CSC history ({verifications.length} verifies — re-bio cycles)
            </button>
          ) : (
            <div className="text-xs text-gray-500">
              CSC verify: {formatCscDate(verifications[0]?.verified_at) || "—"}
              {verifications[0]?.verified_by_name
                ? ` · ${verifications[0].verified_by_name}`
                : ""}
            </div>
          )}

          {(historyOpen || !hasMultipleCsc) && hasMultipleCsc && (
            <ul className="mt-2 space-y-1.5">
              {verifications.map((v, idx) => (
                <li
                  key={`${id}-csc-${idx}`}
                  className="text-xs bg-gray-50 rounded px-2 py-1.5 border border-gray-100"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium text-gray-800">
                      #{idx + 1} {v.action || "Verified"}
                    </span>
                    <span className="text-gray-500">
                      {formatCscDate(v.verified_at) || "—"}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-0.5">
                    {[v.verified_by_name, v.stage].filter(Boolean).join(" · ") || "—"}
                  </div>
                  {v.remarks && (
                    <div className="text-gray-500 mt-0.5 italic">“{v.remarks}”</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {verifications.length === 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          CSC verified at: —
        </div>
      )}
    </>
  );

  if (!interactive) {
    return <div className="p-3 rounded-lg border border-gray-200 bg-white">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen?.(id)}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#d85a30]/40 transition-colors"
    >
      {body}
    </button>
  );
}

export default function CSCPendingApplications() {
  const confirm = useConfirm();
  const [needsCscVerification, setNeedsCscVerification] = useState([]);
  const [verifiedOrCompleted, setVerifiedOrCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedListItem, setSelectedListItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [aadhaarSearch, setAadhaarSearch] = useState("");
  const [aadhaarQuery, setAadhaarQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [segregation, setSegregation] = useState(null);
  const [searchedUser, setSearchedUser] = useState(null);
  const [matchedApplicants, setMatchedApplicants] = useState([]);
  const [searchAadhaarDigits, setSearchAadhaarDigits] = useState("");
  const debounceRef = useRef(null);

  const fetchPendingApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (aadhaarQuery && aadhaarQuery.length >= AADHAAR_SEARCH_MIN) {
        params.aadhaarNumber = aadhaarQuery;
      }
      const res = await axios.get(CSC_PENDING_APPLICATIONS_URL, { params });
      const data = res.data?.data ?? res.data;
      setNeedsCscVerification(
        data?.needsCscVerification ?? data?.needsCscBioAuth ?? []
      );
      setVerifiedOrCompleted(data?.verifiedOrCompleted ?? data?.others ?? []);
      setPagination(data?.pagination ?? null);
      setSegregation(data?.segregation ?? null);
      setSearchedUser(data?.searchedUser ?? null);
      setMatchedApplicants(
        Array.isArray(data?.matchedApplicants) ? data.matchedApplicants : []
      );
      setSearchAadhaarDigits(data?.searchAadhaarDigits || "");
    } catch (err) {
      console.error("Fetch pending applications failed:", err);
      setError(err.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, aadhaarQuery]);

  const checkAccess = useCallback(async () => {
    try {
      setCheckingAccess(true);
      const res = await axios.get(ADMIN_PROFILE_URL);
      const user = res.data?.user ?? res.data?.data?.user ?? res.data;
      const role = (user?.role || "").trim();
      setCanAccess(role === "CSCAdmin");
    } catch (e) {
      setCanAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const digits = digitsOnly(aadhaarSearch);
      const nextQuery = digits.length >= AADHAAR_SEARCH_MIN ? digits : "";
      setAadhaarQuery((prev) => {
        if (prev === nextQuery) return prev;
        setPage(1);
        return nextQuery;
      });
    }, AADHAAR_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [aadhaarSearch]);

  useEffect(() => {
    if (canAccess) fetchPendingApplications();
  }, [canAccess, fetchPendingApplications]);

  const openDetails = async (applicationId, listItem) => {
    setSelectedListItem(listItem || null);
    try {
      setDetailLoading(true);
      setSelectedApplication({ _id: applicationId });
      const res = await axios.get(`${APPLICATION_DETAIL_URL}/${applicationId}`);
      const data = res.data?.data ?? res.data?.application ?? res.data;
      setSelectedApplication(data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load details.", "error");
      setSelectedApplication(null);
      setSelectedListItem(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (action) => {
    if (!selectedApplication) return;
    const applicationId = getApplicationId(selectedApplication);
    try {
      setProcessingAction(true);
      const res = await axios.post(`${APPLICATION_VERIFY_URL}/${applicationId}/verify`, {
        action,
        remarks: verificationRemarks || "",
      });
      if (res.status === 200 || res.status === 201) {
        showToast("Application verified.", "success");
        setSelectedApplication(null);
        setSelectedListItem(null);
        setVerificationRemarks("");
        fetchPendingApplications();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to verify.", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setSelectedListItem(null);
    setVerificationRemarks("");
  };

  if (checkingAccess) {
    return (
      <Dashboard sidebarType="CSC Admin">
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </Dashboard>
    );
  }

  if (!canAccess) {
    return (
      <Dashboard sidebarType="CSC Admin">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">Only CSC Admin can access this page.</p>
          </div>
        </div>
      </Dashboard>
    );
  }

  const detailSource = selectedListItem || selectedApplication;
  const detailCscVerifiedAt = formatCscDate(detailSource?.cscVerifiedAt);
  const detailVerifications = Array.isArray(detailSource?.cscVerifications)
    ? detailSource.cscVerifications
    : [];

  return (
    <Dashboard sidebarType="CSC Admin">
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <SplitText text="Applications" splitType="chars" delay={35} className="inline-block" />
          </h1>
          <p className="text-gray-600">
            Search by Aadhaar (prefix) and verify CSC bio-authentication
          </p>
        </div>

        {/* Aadhaar search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="w-full relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={aadhaarSearch}
              onChange={(e) => {
                const digits = digitsOnly(e.target.value);
                setAadhaarSearch(
                  formatAadhaar(digits) === "—" ? "" : formatAadhaar(digits)
                );
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Type Aadhaar (e.g. 6123 or 6123 4567 8901)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-wide"
              aria-label="Search by Aadhaar number"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Spaces ignored · Prefix match · {AADHAAR_SEARCH_MIN}–{AADHAAR_SEARCH_MAX}{" "}
            digits · Debounced
            {digitsOnly(aadhaarSearch).length > 0 &&
              digitsOnly(aadhaarSearch).length < AADHAAR_SEARCH_MIN && (
                <span className="text-amber-600">
                  {" "}
                  — type at least {AADHAAR_SEARCH_MIN} digits to search
                </span>
              )}
          </p>

          {aadhaarQuery && (
            <div className="mt-3 space-y-2">
              <div className="text-sm text-gray-700 flex flex-wrap items-center gap-2">
                <MdInfo className="text-[#d85a30] shrink-0" />
                <span>
                  Searching{" "}
                  <span className="font-mono font-semibold">
                    {formatAadhaar(searchAadhaarDigits || aadhaarQuery)}
                  </span>
                  {matchedApplicants.length > 0 && (
                    <>
                      {" "}
                      · {matchedApplicants.length} matched applicant
                      {matchedApplicants.length === 1 ? "" : "s"}
                    </>
                  )}
                </span>
              </div>
              {matchedApplicants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {matchedApplicants.map((m) => (
                    <span
                      key={`${m.source}-${m._id}`}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-50 border border-gray-200"
                    >
                      <span className="font-medium text-gray-800">
                        {m.fullName || "—"}
                      </span>
                      <span className="font-mono text-gray-600">
                        {formatAadhaar(m.aadhaarNumber)}
                      </span>
                      <span className="text-gray-400">{m.source}</span>
                    </span>
                  ))}
                </div>
              )}
              {searchedUser && (
                <p className="text-xs text-gray-500">
                  Primary match:{" "}
                  <span className="font-semibold text-gray-700">
                    {searchedUser.fullName || "—"}
                  </span>
                </p>
              )}
            </div>
          )}

          {segregation && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <MdPendingActions className="text-amber-600" />
                Needs CSC:{" "}
                <strong>{segregation.needsCscVerificationCount ?? 0}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <MdCheckCircle className="text-emerald-600" />
                Verified / completed:{" "}
                <strong>{segregation.verifiedOrCompletedCount ?? 0}</strong>
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Needs CSC verification */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MdAssignment className="text-[#d85a30]" />
                Needs Verification
                <span className="text-sm font-normal text-gray-500">
                  ({needsCscVerification.length})
                </span>
              </h2>
              {needsCscVerification.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending CSC bio-auth applications.</p>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {needsCscVerification.map((app) => (
                    <ApplicationCard
                      key={getApplicationId(app)}
                      app={app}
                      onOpen={(id) => openDetails(id, app)}
                      interactive
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Verified / completed — do NOT treat Approved alone as CSC-verified */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MdCheckCircle className="text-emerald-600" />
                Verified / Completed
                <span className="text-sm font-normal text-gray-500">
                  ({verifiedOrCompleted.length})
                </span>
              </h2>
              {verifiedOrCompleted.length === 0 ? (
                <p className="text-gray-500 text-sm">No records.</p>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {verifiedOrCompleted.map((app) => (
                    <ApplicationCard
                      key={getApplicationId(app)}
                      app={app}
                      interactive={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
            >
              Next
            </button>
          </div>
        )}

        <GenericModal
          open={!!selectedApplication}
          setOpen={(v) => !v && closeModal()}
          title="Application Details"
        >
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : selectedApplication ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <BioauthReasonBadge
                  reason={
                    selectedListItem?.bioauthReason ||
                    selectedApplication.bioauthReason
                  }
                />
              </div>

              <div className="text-sm text-gray-700 space-y-1.5">
                <div>
                  <span className="font-medium text-gray-600">Application ID:</span>{" "}
                  <span className="font-mono">
                    {getApplicationId(selectedApplication) || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Scheme:</span>{" "}
                  {selectedListItem?.schemeName ||
                    selectedApplication.schemeName ||
                    selectedApplication.scheme_id?.scheme_name ||
                    selectedApplication.scheme?.scheme_name ||
                    "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-600">Applicant:</span>{" "}
                  {selectedListItem?.applicantName ||
                    selectedApplication.applicantName ||
                    selectedApplication.user_id?.demographics?.fullName ||
                    "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-600">Aadhaar:</span>{" "}
                  <span className="font-mono">
                    {formatAadhaar(
                      getAadhaarNumber(selectedListItem) ||
                        getAadhaarNumber(selectedApplication)
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Mobile:</span>{" "}
                  {selectedListItem?.applicantMobile ||
                    selectedApplication.applicantMobile ||
                    selectedApplication.user_id?.contact?.mobile?.value ||
                    "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>{" "}
                  <span className="inline-flex px-2 py-0.5 rounded bg-[#68d388]/25 text-black text-xs">
                    {selectedListItem?.status ||
                      selectedApplication.status ||
                      "Pending"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Applied:</span>{" "}
                  {formatCscDate(
                    selectedListItem?.date_applied ||
                      selectedApplication.date_applied
                  ) || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-600">CSC verified at:</span>{" "}
                  {detailCscVerifiedAt ? (
                    detailCscVerifiedAt
                  ) : (
                    <span className="text-amber-700">Not verified by CSC yet</span>
                  )}
                </div>
              </div>

              {detailVerifications.length > 0 && (
                <div className="pt-2 border-t">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    CSC verification history
                  </h3>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {detailVerifications.map((v, idx) => (
                      <li
                        key={`modal-csc-${idx}`}
                        className="text-xs bg-gray-50 rounded px-2 py-1.5 border border-gray-100"
                      >
                        <div className="font-medium text-gray-800">
                          #{idx + 1} {v.action || "Verified"} ·{" "}
                          {formatCscDate(v.verified_at) || "—"}
                        </div>
                        <div className="text-gray-600">
                          {[v.verified_by_name, v.stage].filter(Boolean).join(" · ") ||
                            "—"}
                        </div>
                        {v.remarks && (
                          <div className="text-gray-500 italic mt-0.5">
                            “{v.remarks}”
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t">
                <label className="block text-sm font-medium text-gray-600">
                  Remarks (optional)
                </label>
                <textarea
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Add remarks..."
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Verify application?",
                      description:
                        "This will mark the application verified at CSC level and forward it to the next stage.",
                      confirmText: "Yes, verify",
                      cancelText: "Cancel",
                      tone: "neutral",
                    });
                    if (!ok) return;
                    handleVerify("Verified");
                  }}
                  disabled={processingAction}
                  className="flex-1 px-4 py-2 rounded-md bg-[#d85a30] text-white hover:bg-[#ffb766] font-medium disabled:opacity-60"
                >
                  {processingAction ? "Processing..." : "Verify"}
                </button>
              </div>
            </div>
          ) : null}
        </GenericModal>
      </div>
    </Dashboard>
  );
}
