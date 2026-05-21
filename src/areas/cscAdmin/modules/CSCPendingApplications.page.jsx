/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MdAssignment, MdInfo, MdSearch, MdChevronLeft, MdChevronRight } from "react-icons/md";
import axios from "../../../api/axios";
import { ADMIN_PROFILE_URL, CSC_PENDING_APPLICATIONS_URL, APPLICATION_DETAIL_URL, APPLICATION_VERIFY_URL } from "../../../api/api_routing_urls";
import Dashboard from "../../dashboard-components/dashboard.component";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import GenericModal from "../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import showToast from "../../../utils/notification/NotificationModal";
import { formatTSWTZDate } from "../../../utils/dateFunctions/formatdate";
import { useConfirm } from "../../../reusable-components/ConfirmDialog/ConfirmDialogProvider";

export default function CSCPendingApplications() {
  const confirm = useConfirm();
  const [needsCscVerification, setNeedsCscVerification] = useState([]);
  const [verifiedOrCompleted, setVerifiedOrCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
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

  const fetchPendingApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (aadhaarQuery) params.aadhaar = aadhaarQuery;
      const res = await axios.get(CSC_PENDING_APPLICATIONS_URL, { params });
      const data = res.data?.data ?? res.data;
      setNeedsCscVerification(data?.needsCscVerification ?? data?.needsCSDVerification ?? []);
      setVerifiedOrCompleted(data?.verifiedOrCompleted ?? []);
      setPagination(data?.pagination ?? null);
      setSegregation(data?.segregation ?? null);
      setSearchedUser(data?.searchedUser ?? null);
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
    if (canAccess) fetchPendingApplications();
  }, [canAccess, fetchPendingApplications]);

  const fetchDetails = async (applicationId) => {
    try {
      setDetailLoading(true);
      const res = await axios.get(`${APPLICATION_DETAIL_URL}/${applicationId}`);
      const data = res.data?.data ?? res.data?.application ?? res.data;
      setSelectedApplication(data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load details.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (action) => {
    if (!selectedApplication) return;
    const applicationId = selectedApplication._id || selectedApplication.application_id;
    try {
      setProcessingAction(true);
      const res = await axios.post(`${APPLICATION_VERIFY_URL}/${applicationId}/verify`, {
        action,
        remarks: verificationRemarks || "",
      });
      if (res.status === 200 || res.status === 201) {
        showToast("Application verified.", "success");
        setSelectedApplication(null);
        setVerificationRemarks("");
        fetchPendingApplications();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to verify.", "error");
    } finally {
      setProcessingAction(false);
    }
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

  return (
    <Dashboard sidebarType="CSC Admin">
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <SplitText text="Applications" splitType="chars" delay={35} className="inline-block" />
          </h1>
          <p className="text-gray-600">Search by Aadhaar and verify applications</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={aadhaarSearch}
                onChange={(e) => setAadhaarSearch(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="Enter 12-digit Aadhaar to search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const v = (aadhaarSearch || "").trim();
                if (v && v.length !== 12) {
                  showToast("Enter a valid 12-digit Aadhaar.", "error");
                  return;
                }
                setPage(1);
                setAadhaarQuery(v);
              }}
              className="px-4 py-2 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] font-semibold"
            >
              Search
            </button>
          </div>
          {searchedUser && (
            <div className="mt-4 text-sm text-gray-700 flex items-center gap-2">
              <MdInfo className="text-[#d85a30]" />
              <span>
                User: <span className="font-semibold">{searchedUser.fullName || searchedUser.name || "—"}</span>
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MdAssignment /> Needs Verification
              </h2>
              {needsCscVerification.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending applications.</p>
              ) : (
                <div className="space-y-3">
                  {needsCscVerification.map((app) => {
                    const id = app._id || app.application_id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => fetchDetails(id)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <div className="font-semibold text-gray-900">{app.scheme_name || app.scheme?.scheme_name || "Scheme"}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Applied: {app.createdAt ? formatTSWTZDate(app.createdAt) : "—"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Verified / Completed</h2>
              {verifiedOrCompleted.length === 0 ? (
                <p className="text-gray-500 text-sm">No records.</p>
              ) : (
                <div className="space-y-3">
                  {verifiedOrCompleted.map((app) => {
                    const id = app._id || app.application_id;
                    return (
                      <div key={id} className="p-3 rounded-lg border border-gray-200">
                        <div className="font-semibold text-gray-900">{app.scheme_name || app.scheme?.scheme_name || "Scheme"}</div>
                        <div className="text-xs text-gray-500 mt-1">Status: {app.status || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <GenericModal open={!!selectedApplication} setOpen={(v) => !v && setSelectedApplication(null)} title="Application Details">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : selectedApplication ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-700">
                <div>
                  <span className="font-medium text-gray-600">Scheme:</span>{" "}
                  {selectedApplication.scheme_name || selectedApplication.scheme?.scheme_name || "—"}
                </div>
                <div className="mt-1">
                  <span className="font-medium text-gray-600">Status:</span>{" "}
                  <span className="inline-flex px-2 py-0.5 rounded bg-[#68d388]/25 text-black text-xs">
                    {selectedApplication.status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <label className="block text-sm font-medium text-gray-600">Remarks (optional)</label>
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
                      description: "This will mark the application verified at your level and forward it to the next stage.",
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

