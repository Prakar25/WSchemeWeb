/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdCheckCircle, MdCancel, MdPersonAdd } from "react-icons/md";
import { FaCheck, FaTimes } from "react-icons/fa";
import axios from "../../../../api/axios";
import {
  ADMIN_PROFILE_URL,
  ADMIN_PENDING_ADMINS_URL,
  ADMIN_VERIFY_ADMIN_URL,
  DEPARTMENTS_URL,
} from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";
import SplitText from "../../../../reusable-components/SplitText/SplitText";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import showToast from "../../../../utils/notification/NotificationModal";
import { formatDateInDDMonYYYY } from "../../../../utils/dateFunctions/formatdate";

const ROLE_LEVEL_NAMES = {
  1: "Super Admin",
  2: "Admin",
  3: "Department Secretary",
  4: "Department Head",
  5: "DistrictHQ Head",
  6: "Department User",
  7: "District Overlookers",
  8: "Post Operator",
};

export default function PendingAdminsVerification() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [departments, setDepartments] = useState(new Map());
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ADMIN_PENDING_ADMINS_URL);

      if (response.status === 200) {
        const data = response.data?.pendingAdmins ?? response.data?.data ?? response.data;
        const list = Array.isArray(data) ? data : [];
        setPendingAdmins(list);
      } else {
        setPendingAdmins([]);
      }
    } catch (err) {
      console.error("Error fetching pending admins:", err);
      showToast(err.response?.data?.message || "Failed to fetch pending admins.", "error");
      setPendingAdmins([]);
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
        const roleLevel = user.roleLevel ?? user.role_level;
        const role = (user.role || "").toLowerCase();
        // Only Super Admin (1) or Department Secretary (3) can verify
        const allowed =
          roleLevel === 1 ||
          roleLevel === 3 ||
          role === "super admin" ||
          role === "department secretary";
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
    const fetchDepts = async () => {
      try {
        const res = await axios.get(DEPARTMENTS_URL);
        const deptData = res.data?.departments ?? res.data ?? [];
        const arr = Array.isArray(deptData) ? deptData : [];
        const map = new Map();
        arr.forEach((d) => map.set(d._id, d.department_display_name || d.department_name || "N/A"));
        setDepartments(map);
      } catch (_) {}
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (canAccess) fetchPendingAdmins();
  }, [canAccess]);

  const handleApprove = async (adminId) => {
    try {
      setProcessingId(adminId);
      const response = await axios.post(ADMIN_VERIFY_ADMIN_URL, {
        adminId,
        action: "approve",
      });
      if (response.data?.status === "success" || response.status === 200) {
        showToast("Admin approved successfully.", "success");
        fetchPendingAdmins();
      } else {
        throw new Error(response.data?.message || "Failed to approve.");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve admin.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedAdmin) return;
    const adminId = selectedAdmin._id || selectedAdmin.id;
    try {
      setProcessingId(adminId);
      const response = await axios.post(ADMIN_VERIFY_ADMIN_URL, {
        adminId,
        action: "reject",
        rejectionReason: rejectionReason?.trim() || undefined,
      });
      if (response.data?.status === "success" || response.status === 200) {
        showToast("Admin rejected.", "success");
        setShowRejectModal(false);
        setSelectedAdmin(null);
        setRejectionReason("");
        fetchPendingAdmins();
      } else {
        throw new Error(response.data?.message || "Failed to reject.");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject admin.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (admin) => {
    setSelectedAdmin(admin);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const getDeptName = (deptId) => departments.get(deptId) || deptId || "—";
  const getRoleName = (level) => ROLE_LEVEL_NAMES[level] ?? `Level ${level}`;

  if (checkingAccess) {
    return (
      <Dashboard sidebarType="System Admin">
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </Dashboard>
    );
  }

  if (!canAccess) {
    return (
      <Dashboard sidebarType="System Admin">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              Only Super Admin or Department Secretary can verify pending admin registrations.
            </p>
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard sidebarType="System Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdPersonAdd className="text-2xl text-[#d85a30]" />
            <h1 className="text-2xl font-bold text-gray-900">
              <SplitText text="Pending Admin Verifications" splitType="chars" delay={30} className="inline-block" />
            </h1>
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          Admins who have registered are listed below. Approve or reject their access.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : pendingAdmins.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <MdPersonAdd className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">No pending admins</p>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Registered</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingAdmins.map((admin) => {
                    const id = admin._id || admin.id;
                    const isProcessing = processingId === id;
                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {admin.fullName || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{admin.username || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{admin.email || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getRoleName(admin.roleLevel ?? admin.role_level)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getDeptName(admin.departmentId ?? admin.department_id)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {admin.createdAt ? formatDateInDDMonYYYY(admin.createdAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(id)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#d85a30] text-white rounded-md hover:bg-[#ffb766] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {isProcessing ? <Spinner /> : <FaCheck />}
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(admin)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <FaTimes />
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

      <GenericModal
        open={showRejectModal}
        setOpen={(value) => {
          if (!value) {
            setSelectedAdmin(null);
            setRejectionReason("");
          }
          setShowRejectModal(value);
        }}
        title="Reject Admin Registration"
      >
        {selectedAdmin && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Reject <strong>{selectedAdmin.fullName || selectedAdmin.username}</strong>? They will not be able to log in.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rejection reason (optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Reason for rejection (optional)"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedAdmin(null);
                  setRejectionReason("");
                  setShowRejectModal(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={!!processingId}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {processingId ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        )}
      </GenericModal>
    </Dashboard>
  );
}
