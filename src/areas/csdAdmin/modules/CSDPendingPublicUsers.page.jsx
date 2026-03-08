/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdPersonAdd, MdCheckCircle, MdCancel } from "react-icons/md";
import { FaCheck, FaTimes } from "react-icons/fa";
import axios from "../../../api/axios";
import {
  ADMIN_PROFILE_URL,
  CSD_PENDING_PUBLIC_USERS_URL,
  CSD_VERIFY_PUBLIC_USER_URL,
} from "../../../api/api_routing_urls";
import Dashboard from "../../dashboard-components/dashboard.component";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import GenericModal from "../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import showToast from "../../../utils/notification/NotificationModal";
import { formatTSWTZDate } from "../../../utils/dateFunctions/formatdate";

export default function CSDPendingPublicUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(CSD_PENDING_PUBLIC_USERS_URL);

      if (response.status === 200) {
        const data =
          response.data?.pendingPublicUsers ??
          response.data?.users ??
          response.data?.data ??
          response.data;
        const list = Array.isArray(data) ? data : [];
        setPendingUsers(list);
      } else {
        setPendingUsers([]);
      }
    } catch (err) {
      console.error("Error fetching pending public users:", err);
      showToast(
        err.response?.data?.message || "Failed to fetch pending public users.",
        "error"
      );
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
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
        const allowed = role === "CSDAdmin";
        setCanAccess(!!allowed);
      } else {
        setCanAccess(false);
      }
    } catch (err) {
      setCanAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (canAccess) fetchPendingUsers();
  }, [canAccess]);

  const handleApprove = async (userId) => {
    try {
      setProcessingId(userId);
      const response = await axios.post(CSD_VERIFY_PUBLIC_USER_URL, {
        userId,
        action: "approve",
      });
      if (response.data?.status === "success" || response.status === 200) {
        showToast("Public user verified successfully.", "success");
        fetchPendingUsers();
      } else {
        throw new Error(response.data?.message || "Failed to approve.");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to verify public user.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedUser) return;
    const userId = selectedUser._id || selectedUser.id;
    try {
      setProcessingId(userId);
      const response = await axios.post(CSD_VERIFY_PUBLIC_USER_URL, {
        userId,
        action: "reject",
        rejectionReason: rejectionReason?.trim() || undefined,
      });
      if (response.data?.status === "success" || response.status === 200) {
        showToast("Public user rejected.", "success");
        setShowRejectModal(false);
        setSelectedUser(null);
        setRejectionReason("");
        fetchPendingUsers();
      } else {
        throw new Error(response.data?.message || "Failed to reject.");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to reject public user.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (user) => {
    setSelectedUser(user);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const getKycDisplay = (level) => {
    const k = (level || "").toUpperCase();
    return k === "BASIC" || k === "PARTIAL" || k === "FULL" ? k : level || "—";
  };

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
            <p className="text-red-600">
              Only CSDAdmin can verify pending public user registrations.
            </p>
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
            <MdPersonAdd className="text-2xl text-[#d85a30]" />
            <h1 className="text-2xl font-bold text-gray-900">
              <SplitText text="Pending Registrations" splitType="chars" delay={30} className="inline-block" />
            </h1>
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          Public users who have registered and are awaiting verification. Approve or reject to complete verification.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <MdPersonAdd className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">No pending registrations</p>
            <p className="text-gray-500 text-sm mt-1">New registrations will appear here.</p>
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
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Mobile
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      KYC Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Registered
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingUsers.map((user) => {
                    const id = user._id || user.id;
                    const isProcessing = processingId === id;
                    return (
                      <tr
                        key={id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {user.fullName || user.full_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {user.mobile || user.mobileNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {user.email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#c2edda]/30 text-black text-xs font-medium">
                            {getKycDisplay(user.kycLevel || user.kyc_level)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-sm">
                          {user.createdAt
                            ? formatTSWTZDate(user.createdAt)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(id)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#d85a30] text-white text-sm font-medium hover:bg-[#ffb766] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? (
                                <Spinner />
                              ) : (
                                <>
                                  <FaCheck size={14} />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openRejectModal(user)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <FaTimes size={14} />
                              Reject
                            </button>
                          </div>
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

      {/* Reject Modal */}
      <GenericModal
        open={showRejectModal}
        setOpen={(v) => {
          setShowRejectModal(v);
          if (!v) setSelectedUser(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <MdCancel className="text-red-600" size={24} />
            <span>Reject Public User</span>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedUser && (
            <p className="text-gray-600">
              Reject <strong>{selectedUser.fullName || selectedUser.full_name}</strong>? 
              Optional rejection reason:
            </p>
          )}
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Rejection reason (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={processingId}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-60"
            >
              {processingId ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      </GenericModal>
    </Dashboard>
  );
}
