/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MdAssignment, MdInfo, MdSearch, MdChevronLeft, MdChevronRight } from "react-icons/md";
import axios from "../../../api/axios";
import {
  ADMIN_PROFILE_URL,
  CSD_PENDING_APPLICATIONS_URL,
  APPLICATION_DETAIL_URL,
  APPLICATION_VERIFY_URL,
} from "../../../api/api_routing_urls";
import Dashboard from "../../dashboard-components/dashboard.component";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import GenericModal from "../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import showToast from "../../../utils/notification/NotificationModal";
import { formatTSWTZDate } from "../../../utils/dateFunctions/formatdate";

export default function CSDPendingApplications() {
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
  const [aadhaarQuery, setAadhaarQuery] = useState(""); // Actual value sent to API (12 digits)
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState(null);
  const [segregation, setSegregation] = useState(null);
  const [searchedUser, setSearchedUser] = useState(null);

  const fetchPendingApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (aadhaarQuery && /^\d{12}$/.test(aadhaarQuery)) {
        params.set("aadhaarNumber", aadhaarQuery);
      }
      const response = await axios.get(`${CSD_PENDING_APPLICATIONS_URL}?${params.toString()}`);

      if (response.status === 200 && response.data) {
        const data = response.data;
        const needsVerify = Array.isArray(data.needsCscVerification)
          ? data.needsCscVerification
          : Array.isArray(data.needsCscBioAuth)
            ? data.needsCscBioAuth
            : [];
        const verified = Array.isArray(data.verifiedOrCompleted)
          ? data.verifiedOrCompleted
          : Array.isArray(data.others)
            ? data.others
            : [];
        setNeedsCscVerification(needsVerify);
        setVerifiedOrCompleted(verified);
        setPagination(data.pagination || null);
        setSegregation(data.segregation || null);
        setSearchedUser(data.searchedUser || null);
      } else {
        setNeedsCscVerification([]);
        setVerifiedOrCompleted([]);
        setPagination(null);
        setSegregation(null);
        setSearchedUser(null);
      }
    } catch (err) {
      console.error("Error fetching pending applications:", err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError(err.response?.data?.message || "You do not have permission to view applications.");
      } else if (err.response?.status === 404) {
        setError("CSC pending applications endpoint not found.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch pending applications.");
      }
      setNeedsCscVerification([]);
      setVerifiedOrCompleted([]);
      setPagination(null);
      setSegregation(null);
      setSearchedUser(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, aadhaarQuery]);

  const handleAadhaarSearch = () => {
    const digits = (aadhaarSearch || "").replace(/\D/g, "");
    if (digits.length === 12) {
      setAadhaarQuery(digits);
      setPage(1);
    } else {
      setAadhaarQuery("");
      setPage(1);
    }
  };

  const clearAadhaarSearch = () => {
    setAadhaarSearch("");
    setAadhaarQuery("");
    setPage(1);
  };

  const checkAccess = async () => {
    try {
      setCheckingAccess(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setCanAccess(false);
        return;
      }
      const response = await axios.get(ADMIN_PROFILE_URL);
      if (response.status === 200 && response.data?.user) {
        const user = response.data.user;
        const role = (user.role || "").trim();
        setCanAccess(role === "CSCAdmin");
      } else {
        setCanAccess(false);
      }
    } catch (err) {
      setCanAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchApplicationDetail = async (applicationId) => {
    try {
      setDetailLoading(true);
      const response = await axios.get(`${APPLICATION_DETAIL_URL}/${applicationId}`);
      if (response.status === 200 && response.data) {
        const appData =
          response.data?.data ??
          response.data?.application ??
          response.data;
        setSelectedApplication(appData);
      }
    } catch (err) {
      console.error("Error fetching application detail:", err);
      setSelectedApplication(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (action) => {
    if (!selectedApplication || !action) return;
    const applicationId = selectedApplication._id || selectedApplication.id || selectedApplication.application_id;
    if (!applicationId) return;

    try {
      setProcessingAction(true);
      const response = await axios.post(
        `${APPLICATION_VERIFY_URL}/${applicationId}/verify`,
        { action, remarks: verificationRemarks || "" }
      );

      if (response.status === 200 || response.status === 201) {
        showToast(
          action === "Verified" ? "Application verified successfully!" : "Application forwarded!",
          "success"
        );
        setSelectedApplication(null);
        setVerificationRemarks("");
        fetchPendingApplications();
      } else {
        throw new Error(response.data?.message || "Failed to verify");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to verify application.", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (canAccess) fetchPendingApplications();
  }, [canAccess, fetchPendingApplications]);

  const getApplicantName = (app) =>
    app?.applicantName ??
    app?.applicant?.fullName ??
    app?.applicant?.full_name ??
    app?.beneficiaryName ??
    app?.user?.fullName ??
    "—";

  const getSchemeName = (app) =>
    app?.schemeName ??
    app?.scheme?.scheme_name ??
    app?.scheme?.name ??
    "—";

  const getStatusText = (app) =>
    String(app?.status || app?.application_status || app?.verification_status || "pending");

  const needsVerification = (app) => {
    if (!app) return false;
    const id = app._id || app.id || app.application_id;
    return needsCscVerification.some((a) => (a._id || a.id || a.application_id) === id);
  };

  const renderApplicationsTable = (rows, isVerifiedSlot = false) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Applicant
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Scheme
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Applied
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((app) => {
            const id = app._id || app.id;
            return (
              <tr
                key={id}
                onClick={() => fetchApplicationDetail(id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-gray-900 font-medium">
                  {getApplicantName(app)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {getSchemeName(app)}
                </td>
                <td className="px-4 py-3 text-gray-700 text-sm">
                  {app.createdAt ? formatTSWTZDate(app.createdAt) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-700 text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${isVerifiedSlot ? "bg-[#c2edda]/40 text-black" : "bg-amber-100 text-amber-800"}`}>
                    {getStatusText(app)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#c2edda]/30 text-black text-sm font-medium hover:bg-[#c2edda]/40">
                    <MdInfo size={16} />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (checkingAccess) {
    return (
      <Dashboard sidebarType="CSC Admin">
        <div className="flex justify-center py-24">
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
            <p className="text-red-600">Only CSCAdmin can access this page.</p>
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard sidebarType="CSC Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdAssignment className="text-2xl text-[#d85a30]" />
            <h1 className="text-2xl font-bold text-gray-900">
              <SplitText text="Applications" splitType="chars" delay={30} className="inline-block" />
            </h1>
          </div>
          <div className="flex-1 max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={aadhaarSearch}
                onChange={(e) => setAadhaarSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAadhaarSearch()}
                placeholder="Search via Aadhaar (12 digits)"
                maxLength={14}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAadhaarSearch}
              className="px-4 py-2 bg-[#d85a30] text-white rounded-lg text-sm font-medium hover:bg-[#ffb766] whitespace-nowrap"
            >
              Search
            </button>
            {aadhaarQuery && (
              <button
                type="button"
                onClick={clearAadhaarSearch}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {searchedUser && (
          <div className="p-4 bg-[#c2edda]/20 border border-[#68d388]/40 rounded-lg">
            <p className="text-sm font-medium text-gray-800">
              User: {searchedUser.fullName || searchedUser.full_name || "—"} • Aadhaar: {aadhaarQuery}
            </p>
            {segregation && (
              <p className="text-xs text-gray-600 mt-1">
                Needs Verification: {segregation.needsCscVerificationCount ?? segregation.needsCscBioAuthCount ?? 0} • Verified/Completed: {segregation.verifiedOrCompletedCount ?? segregation.othersCount ?? 0}
              </p>
            )}
          </div>
        )}

        <p className="text-gray-600 text-sm">
          {aadhaarQuery
            ? "Applications for this Aadhaar. Click a row to view details."
            : "CSC queue: applications needing bio-auth. Click a row to view details."}
        </p>

        {error && (
          <div className="p-4 bg-[#68d388]/20 border border-[#68d388]/40 rounded-lg text-black text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : needsCscVerification.length === 0 && verifiedOrCompleted.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <MdAssignment className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">
              {aadhaarQuery ? "No applications found for this Aadhaar" : "No applications available"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {error ? "Access to applications may be restricted." : "New applications will appear here."}
            </p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-200 bg-amber-50/50">
                <p className="text-sm font-semibold text-amber-800">
                  Needs Verification ({needsCscVerification.length})
                </p>
              </div>
              {needsCscVerification.length > 0 ? (
                renderApplicationsTable(needsCscVerification, false)
              ) : (
                <div className="p-6 text-sm text-gray-500">No applications are pending verification.</div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-200 bg-[#c2edda]/20">
                <p className="text-sm font-semibold text-green-800">
                  Verified / Completed ({verifiedOrCompleted.length})
                </p>
              </div>
              {verifiedOrCompleted.length > 0 ? (
                renderApplicationsTable(verifiedOrCompleted, true)
              ) : (
                <div className="p-6 text-sm text-gray-500">No approved applications in this page.</div>
              )}
            </motion.div>

            {pagination && (pagination.totalPages > 1 || pagination.total > limit) && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total ?? needsCscVerification.length + verifiedOrCompleted.length} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <MdChevronLeft size={18} />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                    <MdChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <GenericModal
        open={!!selectedApplication}
        setOpen={(v) => !v && setSelectedApplication(null)}
        title={
          <div className="flex items-center gap-2">
            <MdInfo className="text-[#d85a30]" size={24} />
            <span>Application Details</span>
          </div>
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : selectedApplication ? (
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Applicant:</span>{" "}
              {getApplicantName(selectedApplication)}
            </div>
            <div>
              <span className="font-medium text-gray-600">Scheme:</span>{" "}
              {getSchemeName(selectedApplication)}
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>{" "}
              <span className="inline-flex px-2 py-0.5 rounded bg-[#68d388]/25 text-black text-xs">
                {selectedApplication.status || "Pending"}
              </span>
            </div>
            {selectedApplication.createdAt && (
              <div>
                <span className="font-medium text-gray-600">Applied:</span>{" "}
                {formatTSWTZDate(selectedApplication.createdAt)}
              </div>
            )}
            {selectedApplication.form_data && (
              <div className="mt-4 pt-4 border-t">
                <span className="font-medium text-gray-600 block mb-2">Form Data:</span>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(selectedApplication.form_data, null, 2)}
                </pre>
              </div>
            )}
            {needsVerification(selectedApplication) && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <label className="block text-sm font-medium text-gray-600">Remarks (optional)</label>
                <textarea
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Add remarks for verification..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={2}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify("Verified")}
                    disabled={processingAction}
                    className="flex-1 px-4 py-2 rounded-md bg-[#d85a30] text-white hover:bg-[#ffb766] font-medium disabled:opacity-60"
                  >
                    {processingAction ? "Processing..." : "Verify"}
                  </button>
                  <button
                    onClick={() => handleVerify("Forwarded")}
                    disabled={processingAction}
                    className="flex-1 px-4 py-2 rounded-md bg-[#d85a30] text-white hover:bg-[#ffb766] font-medium disabled:opacity-60"
                  >
                    Forward
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </GenericModal>
    </Dashboard>
  );
}
