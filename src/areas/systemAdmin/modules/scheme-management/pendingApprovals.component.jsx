/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { FaCheck, FaTimes } from "react-icons/fa";

import axios from "../../../../api/axios";
import { SCHEMES_CONFIG_URL, DEPARTMENTS_URL, CATEGORIES_URL } from "../../../../api/api_routing_urls";

import HeadingAndButton from "../../../../reusable-components/HeadingAndButton";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";

import showToast from "../../../../utils/notification/NotificationModal";
import { formatDateInDDMonYYYY } from "../../../../utils/dateFunctions/formatdate";
import { displayMedia } from "../../../../utils/uploadFiles/uploadFileToServerController";
import Dashboard from "../../../dashboard-components/dashboard.component";

const PendingApprovals = () => {
  const [pendingSchemes, setPendingSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>

  // Role level mapping for display
  const roleLevelNames = {
    8: "Super Admin",
    7: "Admin",
    6: "Department Secretary",
    5: "Department Head",
    4: "Department User",
    3: "DistrictHQ Head",
    2: "District Overlookers",
    1: "Post Operator",
  };

  // Format authorization levels for display
  const formatAuthorizationLevels = (authLevels) => {
    if (!authLevels || !Array.isArray(authLevels)) return "N/A";
    const levels = authLevels.map((level) => roleLevelNames[level] || `Level ${level}`);
    return levels.join(" → ");
  };

  // Check if user can approve/reject
  const canApproveReject = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return false;
    
    try {
      const user = JSON.parse(storedUser);
      const role = user.role || "";
      const roleLevel = user.roleLevel || user.role_level;
      
      // Department Head (roleLevel 5), Admin (roleLevel 7), Super Admin (roleLevel 8 or roleLevel 1)
      return (
        role === "Department Head" ||
        role === "Admin" ||
        role === "Super Admin" ||
        roleLevel === 5 ||
        roleLevel === 7 ||
        roleLevel === 8 ||
        roleLevel === 1
      );
    } catch (e) {
      return false;
    }
  };

  const fetchPendingSchemes = async () => {
    try {
      setLoading(true);
      // Use new API filter: pending_approval=true returns pending + approved schemes
      // But for "Pending Approvals" page, we only want schemes that are actually pending
      const response = await axios.get(`${SCHEMES_CONFIG_URL}?pending_approval=true&filter_type=scheme`);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        // Filter to only show schemes that are actually pending approval
        const pendingOnly = response.data.filter(
          (scheme) => scheme.approval_status === "pending_department_head_approval"
        );
        setPendingSchemes(pendingOnly);
      }
    } catch (error) {
      console.error("Error fetching pending schemes:", error);
      showToast("Failed to fetch pending schemes.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments and categories for lookup maps
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        // Fetch departments
        const deptResponse = await axios.get(DEPARTMENTS_URL);
        if (deptResponse.status === 200) {
          const deptData = deptResponse.data?.departments || deptResponse.data || [];
          const deptMap = new Map();
          deptData.forEach((dept) => {
            deptMap.set(dept._id, dept);
          });
          setDepartments(deptMap);
        }

        // Fetch categories
        const catResponse = await axios.get(CATEGORIES_URL);
        if (catResponse.status === 200) {
          const catData = catResponse.data?.categories || catResponse.data || [];
          const catMap = new Map();
          catData.forEach((cat) => {
            catMap.set(cat._id, cat);
          });
          setCategories(catMap);
        }
      } catch (error) {
        console.error("Error fetching departments/categories:", error);
      }
    };

    fetchLookups();
  }, []);

  useEffect(() => {
    fetchPendingSchemes();
  }, []);

  const handleApprove = async (schemeId) => {
    try {
      setProcessingId(schemeId);
      
      // Use query parameters for authentication (same as all other admin endpoints)
      const username = sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username");
      const password = sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password");
      
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (password) params.append("password", password);
      
      const url = `${SCHEMES_CONFIG_URL}/${schemeId}/approve?${params.toString()}`;
      const response = await axios.put(url);
      
      if (response.status === 200) {
        showToast("Scheme approved successfully.", "success");
        fetchPendingSchemes(); // Refresh list
      }
    } catch (error) {
      console.error("Error approving scheme:", error);
      const errorMessage = error.response?.data?.message || "Failed to approve scheme.";
      showToast(errorMessage, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedScheme) return;
    
    try {
      setProcessingId(selectedScheme._id || selectedScheme.scheme_id);
      
      // Use query parameters for authentication (same as all other admin endpoints)
      const username = sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username");
      const password = sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password");
      
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (password) params.append("password", password);
      
      const schemeId = selectedScheme._id || selectedScheme.scheme_id;
      const url = `${SCHEMES_CONFIG_URL}/${schemeId}/reject?${params.toString()}`;
      
      const response = await axios.put(url, {
        rejection_reason: rejectionReason || undefined,
      });
      
      if (response.status === 200) {
        showToast("Scheme rejected successfully.", "success");
        setShowRejectModal(false);
        setRejectionReason("");
        setSelectedScheme(null);
        fetchPendingSchemes(); // Refresh list
      }
    } catch (error) {
      console.error("Error rejecting scheme:", error);
      const errorMessage = error.response?.data?.message || "Failed to reject scheme.";
      showToast(errorMessage, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (scheme) => {
    setSelectedScheme(scheme);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const truncateDescription = (html, maxLength = 150) => {
    if (!html) return "";
    const text = html.replace(/<[^>]*>/g, "");
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!canApproveReject()) {
    return (
      <Dashboard sidebarType="System Admin">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You do not have permission to approve or reject schemes. Only Department Head, Admin, or Super Admin can perform this action.
            </p>
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6">
        <HeadingAndButton
          title="Pending Scheme Approvals"
          buttonText="Refresh"
          onButtonClick={(e) => {
            if (e) e.preventDefault();
            fetchPendingSchemes();
          }}
        />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
            <span className="ml-3 text-gray-600">Loading pending schemes...</span>
          </div>
        ) : pendingSchemes.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center mt-6">
            <MdCheckCircle className="mx-auto text-green-500 text-5xl mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">All Clear!</h3>
            <p className="text-green-600">There are no pending scheme approvals at the moment.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {pendingSchemes.map((scheme, index) => {
              const schemeId = scheme._id || scheme.scheme_id;
              const isProcessing = processingId === schemeId;

              return (
                <motion.div
                  key={schemeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Scheme Image */}
                      {scheme.scheme_image_file_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={displayMedia(scheme.scheme_image_file_url)}
                            alt={scheme.scheme_name}
                            className="w-full lg:w-48 h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Scheme Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {scheme.scheme_name}
                            </h3>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                              Pending Approval
                            </span>
                          </div>
                        </div>

                        {/* Creator Information */}
                        {scheme.created_by && (
                          <div className="mb-3 text-sm text-gray-600">
                            <span className="font-medium">Created by: </span>
                            <span>{scheme.created_by.admin_username || "N/A"}</span>
                            {scheme.created_by.created_at && (
                              <span className="ml-2">
                                on {formatDateInDDMonYYYY(scheme.created_by.created_at)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Authorization Levels */}
                        {scheme.authorization_levels && (
                          <div className="mb-3 text-sm text-gray-600">
                            <span className="font-medium">Authorization Levels: </span>
                            <span className="text-gray-700">
                              {formatAuthorizationLevels(scheme.authorization_levels)}
                            </span>
                          </div>
                        )}

                        {/* Scheme Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Department:</span>
                            <p className="text-sm text-gray-700">
                              {(() => {
                                const dept = departments.get(scheme.department);
                                return dept 
                                  ? (dept.department_display_name || dept.department_name)
                                  : (scheme.department || "N/A");
                              })()}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Category:</span>
                            <p className="text-sm text-gray-700">
                              {(() => {
                                const cat = categories.get(scheme.category);
                                return cat 
                                  ? (cat.category_display_name || cat.category_name)
                                  : (scheme.category || "N/A");
                              })()}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Gender:</span>
                            <p className="text-sm text-gray-700">
                              {scheme.gender || scheme.gender_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Scheme Date:</span>
                            <p className="text-sm text-gray-700">
                              {scheme.scheme_date
                                ? formatDateInDDMonYYYY(scheme.scheme_date)
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        {scheme.scheme_description && (
                          <div className="mb-4">
                            <span className="text-xs font-medium text-gray-500">Description:</span>
                            <p className="text-sm text-gray-700 mt-1">
                              {truncateDescription(scheme.scheme_description)}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleApprove(schemeId)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {isProcessing ? (
                              <>
                                <Spinner />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <FaCheck />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openRejectModal(scheme)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            <FaTimes />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedScheme && (
          <GenericModal
            open={showRejectModal}
            setOpen={setShowRejectModal}
            title="Reject Scheme"
            isAdd={false}
          >
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to reject the scheme <strong>{selectedScheme.scheme_name}</strong>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-3 py-2 text-sm border border-gray-400 rounded-md focus:outline-none focus:border-secondary focus:ring-0 resize-none h-24"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                    setSelectedScheme(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingId === (selectedScheme._id || selectedScheme.scheme_id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === (selectedScheme._id || selectedScheme.scheme_id) ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Rejecting...
                    </span>
                  ) : (
                    "Reject Scheme"
                  )}
                </button>
              </div>
            </div>
          </GenericModal>
        )}
      </div>
    </Dashboard>
  );
};

export default PendingApprovals;
