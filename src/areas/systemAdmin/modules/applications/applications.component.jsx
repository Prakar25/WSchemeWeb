/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaArrowRight, FaArrowLeft, FaUserCheck } from "react-icons/fa";
import axios from "../../../../api/axios";
import { APPLICATIONS_ADMIN_URL, APPLICATION_DETAIL_URL, APPLICATION_VERIFY_URL, APPLICATION_FORWARD_URL, APPLICATION_NEXT_STAGE_ADMINS_URL, ADMIN_PROFILE_URL } from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import showToast from "../../../../utils/notification/NotificationModal";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [stageFilter, setStageFilter] = useState("all"); // all, Level_7_8_Review, District_Head_Review, etc.
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailedApplication, setDetailedApplication] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminRoleLevel, setAdminRoleLevel] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [selectedAction, setSelectedAction] = useState(""); // "Verified" | "Forwarded" | "Rejected" | "Returned"
  const [stageRequirements, setStageRequirements] = useState(null); // Current and next stage requirements
  const [nextStageAdmins, setNextStageAdmins] = useState([]); // Available admins for next stage
  const [selectedForwardAdmin, setSelectedForwardAdmin] = useState(""); // Selected admin ID to forward to
  const [loadingNextStageAdmins, setLoadingNextStageAdmins] = useState(false);

  // Get admin credentials
  const getAdminCredentials = () => {
    const username = sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username");
    const password = sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password");
    return { username, password };
  };

  // Fetch admin profile to check role level
  const fetchAdminProfile = async () => {
    try {
      const { username, password } = getAdminCredentials();
      if (!username || !password) return;

      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const response = await axios.get(`${ADMIN_PROFILE_URL}?${params.toString()}`);
      if (response.status === 200 && response.data?.user) {
        const roleLevel = response.data.user.roleLevel || response.data.user.role_level;
        setAdminRoleLevel(roleLevel);
      }
    } catch (error) {
      console.error("Error fetching admin profile:", error);
    }
  };

  // Fetch detailed application data
  const fetchApplicationDetail = async (applicationId) => {
    try {
      setLoadingDetail(true);
      const { username, password } = getAdminCredentials();
      
      if (!username || !password) {
        console.error("Admin credentials not found");
        showToast("Admin credentials not found. Please login again.", "error");
        setLoadingDetail(false);
        return;
      }
      
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const response = await axios.get(`${APPLICATION_DETAIL_URL}/${applicationId}?${params.toString()}`);
      
      if (response.status === 200 && response.data) {
        const appData = response.data.data || response.data.application || response.data;
        setDetailedApplication(appData);
        
        // Extract stage requirements if available
        if (response.data.data?.currentStageRequirements || response.data.data?.nextStageRequirements) {
          setStageRequirements({
            current: response.data.data.currentStageRequirements || response.data.currentStageRequirements,
            next: response.data.data.nextStageRequirements || response.data.nextStageRequirements
          });
        } else {
          setStageRequirements(null);
        }
        
        // Fetch next stage admins if there's a next stage
        if (appData.verification_stage && appData.verification_stage !== "Completed") {
          fetchNextStageAdmins(applicationId);
        }
      }
    } catch (error) {
      console.error("Error fetching application detail:", error);
      showToast("Failed to fetch application details", "error");
      const currentSelected = selectedApplication;
      if (currentSelected) {
        setDetailedApplication(currentSelected);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  // Fetch available admins for next verification stage
  const fetchNextStageAdmins = async (applicationId) => {
    try {
      setLoadingNextStageAdmins(true);
      const { username, password } = getAdminCredentials();
      
      if (!username || !password) return;

      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      console.log("Fetching higher authority admins for application:", applicationId);
      const response = await axios.get(`${APPLICATION_NEXT_STAGE_ADMINS_URL}/${applicationId}/next-stage-admins?${params.toString()}`);
      
      console.log("Higher authority admins response:", response.data);
      if (response.status === 200 && response.data) {
        const admins = response.data.data || [];
        console.log("Available admins (higher authority):", admins);
        console.log("Current admin level:", response.data.currentAdminLevel);
        console.log("Higher authority levels:", response.data.higherAuthorityLevels);
        console.log("Next stage:", response.data.nextStage);
        setNextStageAdmins(admins);
        
        // Update stage requirements from response if available
        if (response.data.nextStageRequirements) {
          console.log("Next stage requirements:", response.data.nextStageRequirements);
          setStageRequirements(prev => ({
            ...prev,
            next: response.data.nextStageRequirements
          }));
        } else if (response.data.nextStage) {
          // Store next stage info even if requirements aren't provided
          setStageRequirements(prev => ({
            ...prev,
            next: {
              stage: response.data.nextStage,
              currentAdminLevel: response.data.currentAdminLevel,
              higherAuthorityLevels: response.data.higherAuthorityLevels
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching next stage admins:", error);
      console.error("Error response:", error.response?.data);
      setNextStageAdmins([]);
    } finally {
      setLoadingNextStageAdmins(false);
    }
  };

  // Forward application to specific admin
  const handleForward = async () => {
    if (!selectedApplication || !selectedForwardAdmin) {
      showToast("Please select an admin to forward to", "error");
      return;
    }
    
    try {
      setProcessingAction(true);
      const { username, password } = getAdminCredentials();
      const applicationId = selectedApplication._id || selectedApplication.application_id;

      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (password) params.append("password", password);

      const response = await axios.post(
        `${APPLICATION_FORWARD_URL}/${applicationId}/forward?${params.toString()}`,
        {
          forward_to_admin_id: selectedForwardAdmin,
          remarks: verificationRemarks || ""
        }
      );

      if (response.status === 200 || response.status === 201) {
        const selectedAdmin = nextStageAdmins.find(a => a._id === selectedForwardAdmin);
        showToast(
          `Application forwarded to ${selectedAdmin?.fullName || "selected admin"} successfully!`,
          "success"
        );
        
        // Update local state
        const updatedApp = response.data.data || response.data.application || response.data;
        setApplications(prev => prev.map(app => 
          (app._id || app.application_id) === applicationId 
            ? updatedApp
            : app
        ));
        setDetailedApplication(updatedApp);
        setSelectedApplication(updatedApp);
        
        // Clear form fields
        setVerificationRemarks("");
        setSelectedAction("");
        setSelectedForwardAdmin("");
        setNextStageAdmins([]);
        setStageRequirements(null);
        
        // Refresh applications list
        fetchApplications();
      }
    } catch (error) {
      console.error("Error forwarding application:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to forward application";
      showToast(errorMessage, "error");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle view application
  const handleViewApplication = (app) => {
    if (!app) {
      console.error("No application provided");
      return;
    }
    setSelectedApplication(app);
    setDetailedApplication(null); // Clear previous detail
    setVerificationRemarks(""); // Clear remarks
    setSelectedAction(""); // Clear selected action
    setSelectedForwardAdmin(""); // Clear selected admin
    setNextStageAdmins([]); // Clear next stage admins
    setStageRequirements(null); // Clear stage requirements
    const applicationId = app._id || app.application_id;
    if (applicationId) {
      fetchApplicationDetail(applicationId);
    } else {
      console.error("No application ID found");
      showToast("Application ID not found", "error");
    }
  };

  // Check if admin can verify at the current application stage
  const canVerifyAtStage = (app) => {
    if (!app || !adminRoleLevel) return false;
    
    const status = app.status?.toLowerCase() || "";
    const verificationLevel = app.verification_level;
    
    // Can't verify if already completed/rejected/approved
    if (status === "approved" || status === "rejected" || verificationLevel === 99) {
      return false;
    }
    
    // Use required_role_levels from the application if available
    if (app.required_role_levels && Array.isArray(app.required_role_levels)) {
      return app.required_role_levels.includes(adminRoleLevel);
    }
    
    // Fallback: Level-based permissions using verification_level
    switch (verificationLevel) {
      case 0: // Applied
      case 7: // Post Operator Review
      case 8:
        return adminRoleLevel === 7 || adminRoleLevel === 8;
      case 1: // Admin Review
      case 2:
        return adminRoleLevel === 1 || adminRoleLevel === 2;
      case 6: // District Head Review
        return adminRoleLevel === 6;
      case 4: // Department Review
      case 5:
        return adminRoleLevel === 4 || adminRoleLevel === 5;
      case 3: // Secretary Review
        return adminRoleLevel === 3;
      case 99: // Completed
        return false;
      default:
        return false;
    }
  };

  // Get stage name for display (using new verification_level)
  const getStageDisplayName = (app) => {
    // Prefer verification_stage if available (backend provides this)
    if (app.verification_stage) {
      return app.verification_stage.replace(/_/g, " ");
    }
    
    // Fallback to verification_level
    const level = app.verification_level;
    const levelMap = {
      0: "Applied",
      7: "Post Operator Review",
      8: "Post Operator Review",
      1: "Admin Review",
      2: "Admin Review",
      6: "District Head Review",
      4: "Department Review",
      5: "Department Review",
      3: "Secretary Review",
      99: "Completed"
    };
    return levelMap[level] || `Level ${level}`;
  };

  // Verify application with action
  const handleVerify = async (action) => {
    if (!selectedApplication || !action) return;
    
    try {
      setProcessingAction(true);
      setSelectedAction(action);
      const { username, password } = getAdminCredentials();
      const applicationId = selectedApplication._id || selectedApplication.application_id;

      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (password) params.append("password", password);

      // Build request body
      const requestBody = {
        action: action, // "Verified" | "Forwarded" | "Rejected" | "Returned"
        remarks: verificationRemarks || ""
      };

      // Add forward_to_admin_id if provided and action is Verified/Forwarded
      if ((action === "Verified" || action === "Forwarded") && selectedForwardAdmin) {
        requestBody.forward_to_admin_id = selectedForwardAdmin;
      }

      console.log("Verification request:", {
        action,
        applicationId,
        currentStage: selectedApplication.verification_stage,
        currentLevel: selectedApplication.verification_level,
        requiredRoleLevels: selectedApplication.required_role_levels,
        adminRoleLevel,
        username,
        requestBody
      });

      const response = await axios.post(
        `${APPLICATION_VERIFY_URL}/${applicationId}/verify?${params.toString()}`,
        requestBody
      );

      if (response.status === 200 || response.status === 201) {
        const actionMessages = {
          "Verified": selectedForwardAdmin 
            ? "Application verified and forwarded to selected admin!" 
            : "Application verified and forwarded successfully!",
          "Forwarded": selectedForwardAdmin
            ? "Application forwarded to selected admin!"
            : "Application forwarded to next stage!",
          "Rejected": "Application rejected!",
          "Returned": "Application returned to previous stage!"
        };
        showToast(actionMessages[action] || "Action completed successfully!", "success");
        
        // Update local state
        const updatedApp = response.data.data || response.data.application || response.data;
        setApplications(prev => prev.map(app => 
          (app._id || app.application_id) === applicationId 
            ? updatedApp
            : app
        ));
        // Update detailed application with fresh data from API
        setDetailedApplication(updatedApp);
        // Also update selectedApplication
        setSelectedApplication(updatedApp);
        
        // Clear form fields
        setVerificationRemarks("");
        setSelectedAction("");
        setSelectedForwardAdmin("");
        setNextStageAdmins([]);
        setStageRequirements(null);
        
        // Refresh applications list
        fetchApplications();
      }
    } catch (error) {
      console.error("Error verifying application:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to verify application";
      showToast(errorMessage, "error");
      setSelectedAction("");
    } finally {
      setProcessingAction(false);
    }
  };

  // Fetch all applications (auto-filtered by role level and stage)
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { username, password } = getAdminCredentials();
      
      // Build query parameters
      // Note: Backend auto-filters by role level, but we can add explicit filters
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (password) params.append("password", password);
      if (searchText) params.append("search", searchText);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (stageFilter !== "all") params.append("verification_stage", stageFilter);
      // Optional: assigned_to_me filter
      // params.append("assigned_to_me", "true");
      
      const response = await axios.get(`${APPLICATIONS_ADMIN_URL}?${params.toString()}`);
      
      if (response.status === 200 && response.data) {
        // Handle both array and object with data property
        const apps = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || response.data.applications || []);
        setApplications(apps);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError(error.response?.data?.message || "Failed to fetch applications");
      showToast("Failed to fetch applications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
    fetchApplications();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, stageFilter]);

  // Debug: Log when selectedApplication changes
  useEffect(() => {
    console.log("selectedApplication changed:", selectedApplication);
  }, [selectedApplication]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== "") {
        fetchApplications();
      } else {
        fetchApplications();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    
    if (statusLower === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="text-green-600" />
          Approved
        </span>
      );
    } else if (statusLower === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaTimesCircle className="text-red-600" />
          Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="text-yellow-600" />
          Pending
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      
      // Helper to safely get string from user field
      const getUserString = (app) => {
        if (app.user_name) return app.user_name.toLowerCase();
        if (app.userName) return app.userName.toLowerCase();
        if (app.user_id) {
          if (typeof app.user_id === 'object') {
            return (app.user_id.fullName || app.user_id.name || app.user_id._id || "").toLowerCase();
          }
          return app.user_id.toLowerCase();
        }
        if (app.user) {
          if (typeof app.user === 'object') {
            return (app.user.fullName || app.user.name || app.user._id || "").toLowerCase();
          }
          return app.user.toLowerCase();
        }
        return "";
      };
      
      return (
        app.scheme_name?.toLowerCase().includes(searchLower) ||
        getUserString(app).includes(searchLower) ||
        app.application_id?.toLowerCase().includes(searchLower) ||
        (app._id && app._id.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
          <p className="text-gray-600">View and manage all scheme applications</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by scheme name, user name, or application ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Verification Stage Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
              >
                <option value="all">All Stages</option>
                <option value="Applied">Applied</option>
                <option value="Level_7_8_Review">Admin Review</option>
                <option value="District_Head_Review">District Head Review</option>
                <option value="Department_Review">Department Review</option>
                <option value="Secretary_Review">Secretary Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Applications Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No applications found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app, index) => (
                    <motion.tr
                      key={app._id || app.application_id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // Don't trigger if clicking on the button
                        if (e.target.closest('button')) {
                          return;
                        }
                        console.log("Row clicked for app:", app);
                        handleViewApplication(app);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app._id || app.application_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.scheme_name || app.schemeName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          // Handle user_name/userName as string
                          if (app.user_name) return app.user_name;
                          if (app.userName) return app.userName;
                          // Handle user_id as object (extract fullName or _id)
                          if (app.user_id) {
                            if (typeof app.user_id === 'object') {
                              return app.user_id.fullName || app.user_id.name || app.user_id._id || "N/A";
                            }
                            return app.user_id;
                          }
                          // Handle user as object
                          if (app.user) {
                            if (typeof app.user === 'object') {
                              return app.user.fullName || app.user.name || app.user._id || "N/A";
                            }
                            return app.user;
                          }
                          return "N/A";
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getStageDisplayName(app)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.submitted_at || app.createdAt || app.submittedAt)}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("View button clicked for app:", app);
                            handleViewApplication(app);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <FaEye /> View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              // Close modal when clicking backdrop
              if (e.target === e.currentTarget) {
                setSelectedApplication(null);
                setDetailedApplication(null);
                setVerificationRemarks("");
                setSelectedAction("");
                setSelectedForwardAdmin("");
                setNextStageAdmins([]);
                setStageRequirements(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => {
                      setSelectedApplication(null);
                      setDetailedApplication(null);
                      setVerificationRemarks("");
                      setSelectedAction("");
                      setSelectedForwardAdmin("");
                      setNextStageAdmins([]);
                      setStageRequirements(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="flex justify-center items-center py-12">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Use detailed application if available, otherwise use selectedApplication */}
                    {(() => {
                      const app = detailedApplication || selectedApplication;
                      const status = app.status?.toLowerCase() || "";
                      const canVerify = canVerifyAtStage(app);
                      
                      return (
                        <>
                          {/* Basic Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Application ID</label>
                              <p className="text-gray-900">{app._id || app.application_id}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Status</label>
                              <div className="mt-1">{getStatusBadge(app.status)}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Scheme Name</label>
                              <p className="text-gray-900">{app.scheme_name || app.schemeName}</p>
                            </div>
                            {app.scheme_id?.department && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Department</label>
                                <p className="text-gray-900">{app.scheme_id.department}</p>
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-medium text-gray-500">Verification Stage</label>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  {getStageDisplayName(app)}
                                </span>
                                {app.verification_level !== undefined && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Level {app.verification_level})
                                  </span>
                                )}
                              </div>
                            </div>
                            {app.required_role_levels && app.required_role_levels.length > 0 && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Required Role Levels</label>
                                <p className="text-sm text-gray-900">
                                  Level {app.required_role_levels.join(", ")}
                                </p>
                              </div>
                            )}
                            
                            {/* Stage Requirements Display */}
                            {stageRequirements && (
                              <>
                                {stageRequirements.current && (
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Current Stage Requirements</label>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-sm text-gray-700">
                                        Required Role Levels: <strong>{stageRequirements.current.roleLevels?.join(", ") || "N/A"}</strong>
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ({stageRequirements.current.roleNames?.join(", ") || "N/A"})
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {stageRequirements.next && (
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Next Stage Requirements</label>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-sm text-gray-700">
                                        Next Role Levels: <strong>{stageRequirements.next.roleLevels?.join(", ") || "N/A"}</strong>
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ({stageRequirements.next.roleNames?.join(", ") || "N/A"})
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            <div>
                              <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                              <p className="text-gray-900">{formatDate(app.submitted_at || app.createdAt || app.date_applied)}</p>
                            </div>
                            {app.current_verifier && app.current_verifier.verified_by_name && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Current Verifier</label>
                                <p className="text-gray-900">
                                  {app.current_verifier.verified_by_name}
                                  {app.current_verifier.verified_by_role && (
                                    <span className="text-gray-500 text-xs ml-2">({app.current_verifier.verified_by_role})</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Applicant Info */}
                          {app.user_id && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">Applicant Information</h3>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-gray-900">
                                      {typeof app.user_id === 'object' 
                                        ? (app.user_id.fullName || app.user_id.name || "N/A")
                                        : (app.user_name || app.userName || app.user_id || "N/A")}
                                    </p>
                                  </div>
                                  {typeof app.user_id === 'object' && app.user_id.contactEmail && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">Email</label>
                                      <p className="text-gray-900">{app.user_id.contactEmail}</p>
                                    </div>
                                  )}
                                  {typeof app.user_id === 'object' && app.user_id.phoneNumber && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">Phone</label>
                                      <p className="text-gray-900">{app.user_id.phoneNumber}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Form Data */}
                          {app.form_data && Object.keys(app.form_data).length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">Form Data</h3>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  {Object.entries(app.form_data).map(([key, value]) => (
                                    <div key={key}>
                                      <label className="text-sm font-medium text-gray-500 capitalize">
                                        {key.replace(/_/g, " ")}
                                      </label>
                                      <p className="text-gray-900">
                                        {(() => {
                                          if (value === null || value === undefined) return "N/A";
                                          if (typeof value === 'object') {
                                            if (Array.isArray(value)) {
                                              return value.join(", ");
                                            }
                                            return value.fullName || value.name || value._id || JSON.stringify(value);
                                          }
                                          return String(value);
                                        })()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Documents */}
                          {app.documents_submitted && app.documents_submitted.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">Submitted Documents</h3>
                              <div className="space-y-2">
                                {app.documents_submitted.map((doc, index) => (
                                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                                    <p className="font-medium text-gray-900">{doc.document_type || doc.documentType}</p>
                                    {doc.file_url && (
                                      <a
                                        href={`${import.meta.env.VITE_ENDPOINT_URL || "http://localhost:3000"}/${doc.file_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                                      >
                                        View Document
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Verification History */}
                          {app.verification_history && app.verification_history.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification History</h3>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                {app.verification_history.map((history, index) => (
                                  <div key={index} className="border-l-4 border-blue-500 pl-4 pb-4 last:pb-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-gray-900">{history.verified_by_name || "Unknown"}</span>
                                          <span className="text-xs text-gray-500">
                                            ({history.verified_by_role || "N/A"} - Level {history.verified_by_role_level || "N/A"})
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            history.action === "Verified" || history.action === "Forwarded" 
                                              ? "bg-green-100 text-green-800"
                                              : history.action === "Rejected"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-yellow-100 text-yellow-800"
                                          }`}>
                                            {history.action}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            Stage: {history.stage ? history.stage.replace(/_/g, " ") : "N/A"}
                                          </span>
                                        </div>
                                        {history.remarks && (
                                          <p className="text-sm text-gray-700 mt-1 italic">"{history.remarks}"</p>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {formatDate(history.verified_at)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Verification Actions Section */}
                          <div className="pt-6 border-t-2 border-gray-300 mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Verification</h3>
                            
                            {canVerify ? (
                              <div className="space-y-4">
                                {/* Stage Requirements Info */}
                                {stageRequirements && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="space-y-2">
                                      {stageRequirements.current && (
                                        <div>
                                          <p className="text-sm font-semibold text-blue-900">Current Stage:</p>
                                          <p className="text-sm text-blue-700">
                                            Level {stageRequirements.current.roleLevels?.join(" or ")} 
                                            ({stageRequirements.current.roleNames?.join(" or ")})
                                          </p>
                                        </div>
                                      )}
                                      {stageRequirements.next && (
                                        <div>
                                          <p className="text-sm font-semibold text-blue-900">Next Stage:</p>
                                          <p className="text-sm text-blue-700">
                                            Level {stageRequirements.next.roleLevels?.join(" or ")} 
                                            ({stageRequirements.next.roleNames?.join(" or ")})
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Remarks Input */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Remarks / Notes <span className="text-gray-500">(Optional)</span>
                                  </label>
                                  <textarea
                                    value={verificationRemarks}
                                    onChange={(e) => setVerificationRemarks(e.target.value)}
                                    placeholder="Enter your remarks about this application..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                </div>

                                {/* Admin Selection for Forwarding - Always show */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Forward to Higher Authority <span className="text-gray-500">(Optional)</span>
                                  </label>
                                  {loadingNextStageAdmins ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                      <Spinner /> Loading admins with higher authority...
                                    </div>
                                  ) : nextStageAdmins.length > 0 ? (
                                    <>
                                      <select
                                        value={selectedForwardAdmin}
                                        onChange={(e) => setSelectedForwardAdmin(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                      >
                                        <option value="">Auto-assign (system will assign automatically)</option>
                                        {nextStageAdmins.map((admin) => (
                                          <option key={admin._id} value={admin._id}>
                                            {admin.fullName} 
                                            {admin.role && ` (${admin.role}`}
                                            {admin.roleLevel && ` - Level ${admin.roleLevel}`}
                                            {admin.role && `)`}
                                            {admin.department && ` - ${admin.department}`}
                                          </option>
                                        ))}
                                      </select>
                                      <p className="text-xs text-blue-600 mt-2">
                                        {nextStageAdmins.length} admin(s) with higher authority available (Level {nextStageAdmins.map(a => a.roleLevel).filter((v, i, a) => a.indexOf(v) === i).sort().join(", ")})
                                      </p>
                                    </>
                                  ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                      <p className="text-sm text-gray-600">
                                        {adminRoleLevel === 1 
                                          ? "You have the highest authority. No higher-level admins available."
                                          : "No admins with higher authority available. Application will be auto-assigned."}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Accept Button */}
                                  <button
                                    onClick={() => handleVerify("Verified")}
                                    disabled={processingAction}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-base shadow-lg hover:shadow-xl"
                                  >
                                    {processingAction && selectedAction === "Verified" ? (
                                      <>
                                        <Spinner /> Processing...
                                      </>
                                    ) : (
                                      <>
                                        <FaCheckCircle className="text-xl" /> Accept & Forward
                                      </>
                                    )}
                                  </button>

                                  {/* Reject Button */}
                                  <button
                                    onClick={() => handleVerify("Rejected")}
                                    disabled={processingAction}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-base shadow-lg hover:shadow-xl"
                                  >
                                    {processingAction && selectedAction === "Rejected" ? (
                                      <>
                                        <Spinner /> Processing...
                                      </>
                                    ) : (
                                      <>
                                        <FaTimesCircle className="text-xl" /> Reject Application
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Info about actions */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <p className="text-xs text-gray-600">
                                    <strong>Accept & Forward:</strong> Approves the application and forwards it to the next verification stage. You can assign to a specific higher-level admin above, or leave blank for auto-assignment.
                                    <br />
                                    <strong>Reject:</strong> Rejects the application and completes the workflow. Application will not proceed to next stage.
                                    <br />
                                    <span className="text-blue-600 font-medium">Note:</span> The dropdown shows admins with higher authority (lower level number) than you. For example, if you're Level 6, you'll see Level 1-5 admins.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                {!adminRoleLevel ? (
                                  <p className="text-sm text-gray-600">
                                    Loading admin permissions...
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Permission Required:</span> You don't have permission to verify applications at the <strong>{getStageDisplayName(app)}</strong> stage.
                                    <br />
                                    <span className="text-gray-500">Your role level: {adminRoleLevel}</span>
                                    <br />
                                    {app.required_role_levels && app.required_role_levels.length > 0 && (
                                      <span className="text-gray-500 text-xs">
                                        Required: Level {app.required_role_levels.join(" or ")}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Dashboard>
  );
};

export default Applications;

