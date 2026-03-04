/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdAssignment, MdInfo } from "react-icons/md";
import axios from "../../../api/axios";
import {
  ADMIN_PROFILE_URL,
  CSD_PENDING_APPLICATIONS_URL,
  APPLICATION_DETAIL_URL,
  APPLICATION_VERIFY_URL,
} from "../../../api/api_routing_urls";
import Dashboard from "../../dashboard-components/dashboard.component";
import GenericModal from "../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import showToast from "../../../utils/notification/NotificationModal";
import { formatTSWTZDate } from "../../../utils/dateFunctions/formatdate";

export default function CSDPendingApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");

  const getCredentials = () => ({
    username: sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username"),
    password: sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password"),
  });

  const fetchPendingApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const creds = getCredentials();
      const params = new URLSearchParams();
      if (creds.username) params.append("username", creds.username);
      if (creds.password) params.append("password", creds.password);

      const response = await axios.get(
        `${CSD_PENDING_APPLICATIONS_URL}?${params.toString()}`
      );

      if (response.status === 200 && response.data) {
        let apps = [];
        const data = response.data.applications ?? response.data.data ?? response.data;
        if (Array.isArray(data)) {
          apps = data;
        } else if (response.data.status === "success" && response.data.data) {
          apps = Array.isArray(response.data.data) ? response.data.data : [];
        } else {
          apps = response.data.data || response.data.applications || [];
        }
        setApplications(Array.isArray(apps) ? apps : []);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Error fetching pending applications:", err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError(err.response?.data?.message || "You do not have permission to view applications.");
      } else if (err.response?.status === 404) {
        setError("CSD pending applications endpoint not found.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch pending applications.");
      }
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    try {
      setCheckingAccess(true);
      const creds = getCredentials();
      if (!creds.username || !creds.password) {
        setCanAccess(false);
        return;
      }
      const params = new URLSearchParams();
      params.append("username", creds.username);
      params.append("password", creds.password);
      const response = await axios.get(`${ADMIN_PROFILE_URL}?${params.toString()}`);
      if (response.status === 200 && response.data?.user) {
        const user = response.data.user;
        const role = (user.role || "").trim();
        setCanAccess(role === "CSDAdmin");
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
      const creds = getCredentials();
      const params = new URLSearchParams();
      if (creds.username) params.append("username", creds.username);
      if (creds.password) params.append("password", creds.password);

      const response = await axios.get(
        `${APPLICATION_DETAIL_URL}/${applicationId}?${params.toString()}`
      );
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
      const creds = getCredentials();
      const params = new URLSearchParams();
      if (creds.username) params.append("username", creds.username);
      if (creds.password) params.append("password", creds.password);

      const response = await axios.post(
        `${APPLICATION_VERIFY_URL}/${applicationId}/verify?${params.toString()}`,
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
  }, [canAccess]);

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

  if (checkingAccess) {
    return (
      <Dashboard sidebarType="CSD Admin">
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </Dashboard>
    );
  }

  if (!canAccess) {
    return (
      <Dashboard sidebarType="CSD Admin">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">Only CSDAdmin can access this page.</p>
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard sidebarType="CSD Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdAssignment className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pending Applications</h1>
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          Scheme applications pending review. Click a row to view details.
        </p>

        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <MdAssignment className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">No pending applications</p>
            <p className="text-gray-500 text-sm mt-1">
              {error ? "Access to applications may be restricted." : "New applications will appear here."}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
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
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => {
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
                          {app.createdAt
                            ? formatTSWTZDate(app.createdAt)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200">
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
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      <GenericModal
        open={!!selectedApplication}
        setOpen={(v) => !v && setSelectedApplication(null)}
        title={
          <div className="flex items-center gap-2">
            <MdInfo className="text-blue-600" size={24} />
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
              <span className="inline-flex px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs">
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
                  className="flex-1 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-60"
                >
                  {processingAction ? "Processing..." : "Verify"}
                </button>
                <button
                  onClick={() => handleVerify("Forwarded")}
                  disabled={processingAction}
                  className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-60"
                >
                  Forward
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </GenericModal>
    </Dashboard>
  );
}
