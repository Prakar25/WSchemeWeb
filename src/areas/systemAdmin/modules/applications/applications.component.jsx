/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaArrowRight, FaArrowLeft, FaUserCheck } from "react-icons/fa";
import axios from "../../../../api/axios";
import { APPLICATIONS_ADMIN_URL, APPLICATION_DETAIL_URL, APPLICATION_VERIFY_URL, APPLICATION_FORWARD_URL, APPLICATION_NEXT_STAGE_ADMINS_URL, APPLICATION_SEND_COMPLETION_OTP_URL, ADMIN_PROFILE_URL, DEPARTMENTS_URL, CATEGORIES_URL, APPLICATION_BIOAUTH_QUEUE_URL } from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";
import SplitText from "../../../../reusable-components/SplitText/SplitText";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import showToast from "../../../../utils/notification/NotificationModal";
import { displayMedia } from "../../../../utils/uploadFiles/uploadFileToServerController";

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
  const [adminDepartmentId, setAdminDepartmentId] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [selectedAction, setSelectedAction] = useState(""); // "Verified" | "Forwarded" | "Rejected" | "Returned"
  const [stageRequirements, setStageRequirements] = useState(null); // Current and next stage requirements
  const [nextStageAdmins, setNextStageAdmins] = useState([]); // Available admins for next stage
  const [selectedForwardAdmin, setSelectedForwardAdmin] = useState(""); // Selected admin ID to forward to
  const [loadingNextStageAdmins, setLoadingNextStageAdmins] = useState(false);
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>
  const [adminContactNumber, setAdminContactNumber] = useState(null); // For OTP at Admin_Review
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);

  // Super-admin only: bulk queue applications for Bioauthentication restart
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  const [bioAuthQueueLoading, setBioAuthQueueLoading] = useState(false);
  const headerCheckboxRef = useRef(null);

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

  // Fetch admin profile to check role level (JWT sent via axios interceptor)
  const fetchAdminProfile = async () => {
    try {
      const response = await axios.get(ADMIN_PROFILE_URL);
      if (response.status === 200 && response.data?.user) {
        const userData = response.data.user;
        const roleLevel = userData.roleLevel || userData.role_level;
        setAdminRoleLevel(roleLevel);
        
        // Extract departmentId for frontend filtering
        // Backend API now returns both 'department' (name) and 'departmentId' (ObjectId string)
        // Priority: 1. departmentId field (from API), 2. department as ObjectId string (fallback), 3. lookup department name (fallback)
        let deptId = userData.departmentId || userData.department_id;
        
        // Fallback: If departmentId not found in response, check if department is an ObjectId string
        if (!deptId && userData.department) {
          const deptValue = String(userData.department).trim();
          // Check if department is an ObjectId string format (24 hex characters)
          const isObjectIdFormat = /^[0-9a-fA-F]{24}$/.test(deptValue);
          if (isObjectIdFormat) {
            deptId = deptValue;
            console.log("⚠ Using department field as ObjectId (fallback):", deptId);
          } else if (departments.size > 0) {
            // Department is a name string, look it up in departments map (fallback)
            for (const [id, dept] of departments.entries()) {
              if (dept.department_display_name === deptValue || 
                  dept.department_name === deptValue) {
                deptId = id;
                console.log("⚠ Found departmentId from name lookup (fallback):", deptId);
                break;
              }
            }
          }
        }
        
        console.log("Admin profile - departmentId for filtering:", deptId);
        console.log("Admin profile - department name:", userData.department);
        if (deptId) {
          setAdminDepartmentId(deptId.trim());
          console.log("✓ departmentId stored successfully:", deptId.trim());
        } else {
          console.warn("⚠ Admin profile missing departmentId - department filtering may not work correctly");
        }
        setAdminContactNumber(userData.contactNumber || userData.contact_number || null);
      }
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      // Fallback: use localStorage user so Super Admin bulk actions still show
      try {
        const storedUserRaw = localStorage.getItem("user");
        if (storedUserRaw) {
          const storedUser = JSON.parse(storedUserRaw);
          const roleLevel = storedUser.roleLevel || storedUser.role_level || storedUser.role_level;
          if (roleLevel !== undefined) setAdminRoleLevel(roleLevel);

          let deptId = storedUser.departmentId || storedUser.department_id;
          if (!deptId && storedUser.department) {
            const deptValue = String(storedUser.department).trim();
            const isObjectIdFormat = /^[0-9a-fA-F]{24}$/.test(deptValue);
            if (isObjectIdFormat) {
              deptId = deptValue;
            }
          }
          if (deptId) setAdminDepartmentId(String(deptId).trim());

          setAdminContactNumber(storedUser.contactNumber || storedUser.contact_number || null);
        }
      } catch (e) {
        console.error("Error parsing localStorage user fallback:", e);
      }
    }
  };

  // Fetch detailed application data (JWT sent via axios interceptor)
  const fetchApplicationDetail = async (applicationId) => {
    try {
      setLoadingDetail(true);
      const response = await axios.get(`${APPLICATION_DETAIL_URL}/${applicationId}`);
      
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
      const response = await axios.get(`${APPLICATION_NEXT_STAGE_ADMINS_URL}/${applicationId}/next-stage-admins`);
      
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
      const applicationId = selectedApplication._id || selectedApplication.application_id;

      const response = await axios.post(
        `${APPLICATION_FORWARD_URL}/${applicationId}/forward`,
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
    
    // Backend-provided required_role_levels is authoritative for "who can verify now"
    // (backend knows the actual stage; authorization_level_index can be stale/mismatched)
    if (app.required_role_levels && Array.isArray(app.required_role_levels) && app.required_role_levels.length > 0) {
      return app.required_role_levels.includes(adminRoleLevel);
    }
    
    // Check if application uses scheme-specific authorization_levels workflow
    if (app.authorization_levels && Array.isArray(app.authorization_levels) && app.authorization_levels.length > 0) {
      const currentIndex = app.authorization_level_index !== undefined ? app.authorization_level_index : 0;
      
      // Check if we're still within the workflow array
      if (currentIndex < app.authorization_levels.length) {
        const expectedLevel = app.authorization_levels[currentIndex];
        // Admin's role level must match the expected level at current index
        return adminRoleLevel === expectedLevel;
      }
      
      // If index is beyond array, application is completed
      return false;
    }
    
    // Fallback: Level-based permissions (sequential roles 1–5; legacy 6,7,8,9 normalized by backend)
    const normalizedAdmin = { 6: 3, 7: 4, 8: 5, 9: 5 }[adminRoleLevel] ?? adminRoleLevel;
    switch (verificationLevel) {
      case 0: // Applied - first stage, depends on scheme auth levels
        return [1, 2, 3, 4].includes(normalizedAdmin);
      case 1: case 2: return normalizedAdmin === 1 || normalizedAdmin === 2;
      case 3: return normalizedAdmin === 3;
      case 4: return normalizedAdmin === 4;
      case 5: case 9: return normalizedAdmin === 5; // CSCAdmin (9 legacy)
      case 6: return normalizedAdmin === 3; // Legacy
      case 7: return normalizedAdmin === 4; // Legacy
      case 99: return false;
      default: return false;
    }
  };

  // Get role level name for display
  const getRoleLevelName = (level) => {
    const roleLevelNames = {
      1: "Super Admin",
      2: "Admin",
      3: "DistrictHQ Head",
      4: "District Overlookers",
      5: "CSCAdmin",
      // Legacy display (backend migration maps 6→3, 7/8→4, 9→5)
      6: "DistrictHQ Head",
      7: "District Overlookers",
      8: "CSCAdmin",
      9: "CSCAdmin",
    };
    return roleLevelNames[level] || `Level ${level}`;
  };

  // Get stage name for display (using new verification_level)
  const getStageDisplayName = (app) => {
    // Prefer verification_stage if available (backend provides this)
    // Support both CSC_Admin_Review (new) and legacy CSD_Admin_Review for backward compatibility
    if (app.verification_stage) {
      const stage = app.verification_stage === "CSD_Admin_Review" ? "CSC Admin Review" : app.verification_stage.replace(/_/g, " ");
      return stage;
    }
    
    // NEW: If application uses scheme-specific authorization_levels workflow
    if (app.authorization_levels && Array.isArray(app.authorization_levels) && app.authorization_levels.length > 0) {
      const currentIndex = app.authorization_level_index !== undefined ? app.authorization_level_index : 0;
      
      // If completed (index beyond array)
      if (currentIndex >= app.authorization_levels.length) {
        return "Completed";
      }
      
      // Get current level in workflow
      const currentLevel = app.authorization_levels[currentIndex];
      const levelName = getRoleLevelName(currentLevel);
      
      // Show progress: "Step X of Y: Role Name"
      return `Step ${currentIndex + 1} of ${app.authorization_levels.length}: ${levelName}`;
    }
    
    // Fallback to verification_level (legacy) - sequential levels 1–5
    const level = app.verification_level;
    const levelMap = {
      0: "Applied",
      1: "Admin Review",
      2: "Admin Review",
      3: "District Head Review",
      4: "District Overlookers Review",
      5: "CSC Admin Review",
      6: "District Head Review",
      7: "District Overlookers Review",
      9: "CSC Admin Review",
      99: "Completed"
    };
    return levelMap[level] || `Level ${level}`;
  };

  // Check if completing at Admin_Review requires OTP (Verified action that completes the application)
  const needsCompletionOtp = (app, action) => {
    if (!app || action !== "Verified") return false;
    const stage = app.verification_stage || app.verificationStage;
    return stage === "Admin_Review";
  };

  // Send OTP for completing application at Admin_Review
  const handleSendCompletionOtp = async () => {
    if (!selectedApplication) return;
    const applicationId = selectedApplication._id || selectedApplication.application_id;
    if (!applicationId) return;

    if (!adminContactNumber || !adminContactNumber.trim()) {
      setOtpError("no_phone");
      showToast("Add a phone number in your profile settings to complete applications at Admin Review stage.", "error");
      return;
    }

    try {
      setSendOtpLoading(true);
      setOtpError(null);
      const response = await axios.post(
        `${APPLICATION_SEND_COMPLETION_OTP_URL}/${applicationId}/send-completion-otp`
      );
      if (response.data?.status === "success" || response.status === 200) {
        setOtpSent(true);
        showToast(
          response.data?.message || "OTP sent to your registered mobile number. Enter it to complete the application.",
          "success"
        );
        if (response.data?.otp) {
          setOtpValue(response.data.otp); // Development: pre-fill OTP for testing
        }
      } else {
        throw new Error(response.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      const data = err.response?.data;
      const reason = data?.reason;
      if (reason === "no_phone") {
        setOtpError("no_phone");
        showToast("Add a phone number in your profile settings to complete applications.", "error");
      } else {
        setOtpError("send_failed");
        showToast(data?.message || "Failed to send OTP. Please try again.", "error");
      }
    } finally {
      setSendOtpLoading(false);
    }
  };

  // Verify application with action
  const handleVerify = async (action) => {
    if (!selectedApplication || !action) return;
    const app = detailedApplication || selectedApplication;

    const requiresOtp = needsCompletionOtp(app, action);
    if (requiresOtp) {
      if (!adminContactNumber || !adminContactNumber.trim()) {
        setOtpError("no_phone");
        showToast("Add a phone number in your profile settings to complete applications at Admin Review stage.", "error");
        return;
      }
      if (!otpSent) {
        setOtpError("otp_required");
        showToast("Please send OTP first, then enter it to complete the application.", "error");
        return;
      }
      if (!otpValue || !otpValue.trim()) {
        setOtpError("otp_required");
        showToast("Please enter the OTP sent to your mobile number.", "error");
        return;
      }
    }

    try {
      setProcessingAction(true);
      setSelectedAction(action);
      setOtpError(null);
      const applicationId = selectedApplication._id || selectedApplication.application_id;

      const requestBody = {
        action: action,
        remarks: verificationRemarks || ""
      };
      if ((action === "Verified" || action === "Forwarded") && selectedForwardAdmin) {
        requestBody.forward_to_admin_id = selectedForwardAdmin;
      }
      if (requiresOtp && otpValue) {
        requestBody.otp = otpValue.trim();
      }

      const response = await axios.post(
        `${APPLICATION_VERIFY_URL}/${applicationId}/verify`,
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
        setOtpSent(false);
        setOtpValue("");
        
        // Refresh applications list
        fetchApplications();
      }
    } catch (error) {
      console.error("Error verifying application:", error);
      const data = error.response?.data;
      const reason = data?.reason;
      if (reason === "otp_required") {
        setOtpError("otp_required");
        showToast("Please send OTP first, then enter it to complete the application.", "error");
      } else if (reason === "otp_invalid") {
        setOtpError("otp_invalid");
        showToast(data?.message || "Invalid OTP. Please try again.", "error");
      } else if (reason === "no_phone") {
        setOtpError("no_phone");
        showToast("Add a phone number in your profile settings to complete applications.", "error");
      } else {
        const errorMessage = data?.message || data?.error || "Failed to verify application";
        showToast(errorMessage, "error");
      }
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
      
      // Build query parameters (JWT sent via axios interceptor)
      // - Secretary (level 3) and above: can view all departments
      // - Below Secretary (level > 3): can only view applications from their own department
      // All admins can view applications (verification level filtering removed)
      // Department comparison uses ObjectId strings (direct string match)
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (stageFilter !== "all") params.append("verification_stage", stageFilter);
      // Optional query parameters (as per API documentation):
      // - user_id: Filter by user ID (ObjectId)
      // - scheme_id: Filter by scheme ID (ObjectId)
      // - assigned_to_me: If true, only returns applications assigned to current admin
      // params.append("assigned_to_me", "true");
      
      const response = await axios.get(`${APPLICATIONS_ADMIN_URL}?${params.toString()}`);
      
      if (response.status === 200 && response.data) {
        // Handle API response format: { status: "success", data: [...], count: number }
        // or legacy format: array or { data: [...] } or { applications: [...] }
        let apps = [];
        if (response.data.status === "success" && response.data.data) {
          // New API format with status and data properties
          apps = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          // Direct array response
          apps = response.data;
        } else {
          // Legacy object format
          apps = response.data.data || response.data.applications || [];
        }
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

  // Fetch admin profile - will retry after departments are loaded if departmentId lookup is needed
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  // Re-fetch admin profile after departments are loaded (to resolve department name to ID if needed)
  useEffect(() => {
    if (departments.size > 0 && adminDepartmentId === null) {
      // Retry fetching admin profile to resolve department name to ID
      console.log("Departments loaded, retrying admin profile to resolve departmentId");
      fetchAdminProfile();
    }
  }, [departments]);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, stageFilter]);

  // Debug: Log when selectedApplication changes
  useEffect(() => {
    console.log("selectedApplication changed:", selectedApplication);
  }, [selectedApplication]);

  // Reset OTP state when selected application changes
  useEffect(() => {
    setOtpSent(false);
    setOtpValue("");
    setOtpError(null);
  }, [selectedApplication?._id, selectedApplication?.application_id]);

  // Auto-open application modal if navigated from alert card
  useEffect(() => {
    if (location.state?.applicationId && location.state?.autoOpen && applications.length > 0 && !selectedApplication) {
      const applicationId = location.state.applicationId;
      const app = applications.find(
        (a) => 
          a._id === applicationId || 
          a.application_id === applicationId ||
          a.id === applicationId
      );
      
      if (app) {
        setSelectedApplication(app);
        setDetailedApplication(null);
        setVerificationRemarks("");
        setSelectedAction("");
        setSelectedForwardAdmin("");
        setNextStageAdmins([]);
        setStageRequirements(null);
        fetchApplicationDetail(applicationId);
        // Clear the state to prevent re-opening on re-render
        window.history.replaceState({}, document.title);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, applications]);

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
    const statusLower = (status || "").toLowerCase();
    const displayStatus = status || "Pending";

    if (statusLower === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c2edda]/30 text-black">
          <FaCheckCircle className="text-[#d85a30]" />
          Approved
        </span>
      );
    }
    if (statusLower === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaTimesCircle className="text-red-600" />
          Rejected
        </span>
      );
    }

    if (statusLower === "bioauthentication") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
          <FaClock className="text-amber-700" />
          Bioauthentication
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#68d388]/25 text-black">
        <FaClock className="text-[#68d388]" />
        {displayStatus}
      </span>
    );
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

  const isPdfFile = (fileUrl) => {
    return /\.pdf(\?.*)?$/i.test(String(fileUrl || ""));
  };

  const openDocument = async (fileUrl) => {
    const fullUrl = displayMedia(fileUrl);
    if (!fullUrl) return;

    // Workaround: some servers send PDFs as "attachment" which makes browsers download instead of view.
    // Fetching as a blob and opening the blob URL typically allows inline rendering.
    if (!isPdfFile(fileUrl)) {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(fullUrl, {
        method: "GET",
        credentials: "include",
        headers,
      });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (e) {
      // Fallback: try normal open if blob fetching fails (e.g. CORS restrictions)
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Server-side search/filter already happens in `GET /api/applications`.
  // Keeping client-side filtering here can hide backend-matched results (field mismatch),
  // so we render exactly what the server returns.
  const filteredApplications = applications;

  const canQueueBioauthentication = Number(adminRoleLevel) === 1; // Super Admin only
  const getApplicationId = (app) => app?._id || app?.application_id || null;
  const displayedApplicationIds = filteredApplications.map(getApplicationId).filter(Boolean);
  const isAllSelected =
    displayedApplicationIds.length > 0 && displayedApplicationIds.every((id) => selectedApplicationIds.includes(id));
  const isIndeterminate = selectedApplicationIds.length > 0 && !isAllSelected;

  // Keep header checkbox state in sync
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Reset selection when the admin changes filters/search
  useEffect(() => {
    setSelectedApplicationIds([]);
  }, [statusFilter, stageFilter, searchText]);

  const handleToggleApplication = (applicationId) => {
    if (!applicationId) return;
    setSelectedApplicationIds((prev) => {
      if (prev.includes(applicationId)) return prev.filter((id) => id !== applicationId);
      return [...prev, applicationId];
    });
  };

  const handleQueueForBioauthentication = async () => {
    if (!canQueueBioauthentication) return;
    if (!selectedApplicationIds.length) {
      showToast("Select applications first.", "error");
      return;
    }

    try {
      setBioAuthQueueLoading(true);

      const res = await axios.post(APPLICATION_BIOAUTH_QUEUE_URL, {
        applicationIds: selectedApplicationIds,
      });

      if (res.status === 200 || res.status === 201) {
        showToast("Queued successfully for Bioauthentication.", "success");
        setSelectedApplicationIds([]);
        fetchApplications();
      } else {
        showToast("Failed to queue applications for Bioauthentication.", "error");
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.response?.data?.error || "Failed to queue applications.";
      showToast(errorMessage, "error");
    } finally {
      setBioAuthQueueLoading(false);
    }
  };

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <SplitText text="Applications" splitType="chars" delay={35} className="inline-block" />
          </h1>
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
                <option value="Bioauthentication">Bioauthentication</option>
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
                <option value="Applied">Application Submitted</option>
                <option value="CSC_Admin_Review">CSC Admin Review</option>
                <option value="Admin_Review">Admin Review</option>
                <option value="District_Head_Review">District Head Review</option>
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
            {canQueueBioauthentication && selectedApplicationIds.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {selectedApplicationIds.length} selected (current filter)
                </div>
                <button
                  type="button"
                  onClick={handleQueueForBioauthentication}
                  disabled={bioAuthQueueLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
                >
                  {bioAuthQueueLoading ? (
                    <>
                      <Spinner /> Processing...
                    </>
                  ) : (
                    <>
                      <FaUserCheck /> Send for Bioauthentication
                    </>
                  )}
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {canQueueBioauthentication && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          ref={headerCheckboxRef}
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) setSelectedApplicationIds(displayedApplicationIds);
                            else setSelectedApplicationIds([]);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#d85a30] focus:ring-primary"
                        />
                      </th>
                    )}
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
                        if (e.target.closest("button") || e.target.closest('input[type="checkbox"]')) {
                          return;
                        }
                        console.log("Row clicked for app:", app);
                        handleViewApplication(app);
                      }}
                    >
                      {canQueueBioauthentication && (
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedApplicationIds.includes(getApplicationId(app))}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleApplication(getApplicationId(app));
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-[#d85a30] focus:ring-primary"
                          />
                        </td>
                      )}
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c2edda]/30 text-black">
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
                          className="text-[#d85a30] hover:text-[#ffb766] font-medium flex items-center gap-1 cursor-pointer hover:underline"
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
                                <p className="text-gray-900">
                                  {(() => {
                                    const deptId = app.scheme_id?.department;
                                    const dept = departments.get(deptId);
                                    return dept 
                                      ? (dept.department_display_name || dept.department_name)
                                      : (deptId || "N/A");
                                  })()}
                                </p>
                              </div>
                            )}
                            {app.scheme_id?.category && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Category</label>
                                <p className="text-gray-900">
                                  {(() => {
                                    const catId = app.scheme_id?.category;
                                    const cat = categories.get(catId);
                                    return cat 
                                      ? (cat.category_display_name || cat.category_name)
                                      : (catId || "N/A");
                                  })()}
                                </p>
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-medium text-gray-500">Verification Stage</label>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#c2edda]/30 text-black">
                                  {getStageDisplayName(app)}
                                </span>
                                {app.verification_level !== undefined && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Level {app.verification_level})
                                  </span>
                                )}
                              </div>
                              {/* NEW: Show workflow progress if authorization_levels exists */}
                              {app.authorization_levels && Array.isArray(app.authorization_levels) && app.authorization_levels.length > 0 && (() => {
                                // authorization_levels = [1, 2, 3, 4]. Use index directly.
                                const levels = app.authorization_levels;
                                const currentDisplayIndex = app.authorization_level_index !== undefined
                                  ? Math.min(app.authorization_level_index, levels.length - 1)
                                  : 0;
                                return (
                                <div className="mt-3">
                                  <label className="text-xs font-medium text-gray-500 mb-2 block">Workflow Progress</label>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {levels.map((level, displayIndex) => {
                                      const isCompleted = displayIndex < currentDisplayIndex;
                                      const isCurrent = displayIndex === currentDisplayIndex;
                                      const isPending = displayIndex > currentDisplayIndex;
                                      
                                      return (
                                        <div key={displayIndex} className="flex items-center gap-1">
                                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                                            isCompleted 
                                              ? "bg-[#c2edda]/200 text-white" 
                                              : isCurrent 
                                              ? "bg-[#c2edda]/200 text-white ring-2 ring-blue-300" 
                                              : "bg-gray-200 text-gray-600"
                                          }`}>
                                            {isCompleted ? "✓" : displayIndex + 1}
                                          </div>
                                          <span className={`text-xs ${isCurrent ? "font-semibold text-[#d85a30]" : isCompleted ? "text-[#d85a30]" : "text-gray-500"}`}>
                                            {getRoleLevelName(level)}
                                          </span>
                                          {displayIndex < levels.length - 1 && (
                                            <span className="text-gray-300 mx-1">→</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Step {currentDisplayIndex + 1} of {app.authorization_levels.length}
                                  </p>
                                </div>
                                );
                              })()}
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
                          {(app.user_id || app.user || app.applicant) && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">Applicant Information</h3>
                              <div className="bg-gray-50 rounded-lg p-4">
                                {(() => {
                                  // Get user data from various possible locations
                                  const userData = app.user_id || app.user || app.applicant || {};
                                  const isUserObject = typeof userData === 'object' && userData !== null;
                                  
                                  // Get name from various field variations (including nested structures)
                                  const getName = () => {
                                    if (!isUserObject) {
                                      return app.user_name || app.userName || app.applicant_name || app.applicantName || String(userData) || "N/A";
                                    }
                                    // Check nested demographics structure first
                                    if (userData.demographics?.fullName) {
                                      return userData.demographics.fullName;
                                    }
                                    // Check top-level fields
                                    return userData.fullName || 
                                           userData.full_name || 
                                           userData.name || 
                                           userData.userName ||
                                           userData.username ||
                                           app.user_name || 
                                           app.userName || 
                                           "N/A";
                                  };
                                  
                                  // Get email from various field variations (including nested structures)
                                  const getEmail = () => {
                                    if (!isUserObject) return null;
                                    // Check nested contact structure first
                                    if (userData.contact?.email?.value) {
                                      return userData.contact.email.value;
                                    }
                                    // Check top-level fields
                                    return userData.contactEmail || 
                                           userData.contact_email || 
                                           userData.email?.value ||
                                           userData.email || 
                                           userData.emailAddress ||
                                           app.contactEmail ||
                                           app.email ||
                                           null;
                                  };
                                  
                                  // Get phone from various field variations (including nested structures)
                                  const getPhone = () => {
                                    if (!isUserObject) return null;
                                    // Check nested contact structure first
                                    if (userData.contact?.mobile?.value) {
                                      return userData.contact.mobile.value;
                                    }
                                    // Check top-level fields
                                    return userData.phoneNumber || 
                                           userData.phone_number || 
                                           userData.contactNumber || 
                                           userData.contact_number ||
                                           userData.mobile?.value ||
                                           userData.mobile ||
                                           userData.phone ||
                                           app.phoneNumber ||
                                           app.contactNumber ||
                                           null;
                                  };
                                  
                                  // Get Aadhaar from various field variations
                                  const getAadhaar = () => {
                                    if (!isUserObject) return null;
                                    return userData.aadhaarNumber || 
                                           userData.aadhaar_number || 
                                           userData.aadhaar ||
                                           app.aadhaarNumber ||
                                           app.aadhaar_number ||
                                           app.aadhaar ||
                                           null;
                                  };
                                  
                                  // Get Date of Birth from nested structure
                                  const getDOB = () => {
                                    if (!isUserObject) return null;
                                    if (userData.demographics?.dob?.date) {
                                      return new Date(userData.demographics.dob.date).toLocaleDateString();
                                    }
                                    return userData.dob || userData.dateOfBirth || null;
                                  };
                                  
                                  // Get Gender from nested structure
                                  const getGender = () => {
                                    if (!isUserObject) return null;
                                    if (userData.demographics?.gender) {
                                      return userData.demographics.gender === 'M' ? 'Male' : 
                                             userData.demographics.gender === 'F' ? 'Female' : 
                                             userData.demographics.gender === 'O' ? 'Other' :
                                             userData.demographics.gender;
                                    }
                                    return userData.gender || null;
                                  };
                                  
                                  // Get Address from nested structure
                                  const getAddress = () => {
                                    if (!isUserObject) return null;
                                    if (userData.address) {
                                      const addr = userData.address;
                                      const parts = [
                                        addr.street,
                                        addr.locality,
                                        addr.district,
                                        addr.state,
                                        addr.pincode
                                      ].filter(Boolean);
                                      return parts.length > 0 ? parts.join(", ") : null;
                                    }
                                    return null;
                                  };
                                  
                                  return (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-gray-900">{getName()}</p>
                                      </div>
                                      {getAadhaar() && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Aadhaar</label>
                                          <p className="text-gray-900">{getAadhaar()}</p>
                                        </div>
                                      )}
                                      {getEmail() && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Email</label>
                                          <p className="text-gray-900">{getEmail()}</p>
                                        </div>
                                      )}
                                      {getPhone() && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Phone</label>
                                          <p className="text-gray-900">{getPhone()}</p>
                                        </div>
                                      )}
                                      {getDOB() && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                                          <p className="text-gray-900">{getDOB()}</p>
                                        </div>
                                      )}
                                      {getGender() && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-500">Gender</label>
                                          <p className="text-gray-900">{getGender()}</p>
                                        </div>
                                      )}
                                      {getAddress() && (
                                        <div className="col-span-2">
                                          <label className="text-sm font-medium text-gray-500">Address</label>
                                          <p className="text-gray-900">{getAddress()}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
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
                          {(() => {
                            // Backend may return either `documents` (preferred) or `documents_submitted` (legacy).
                            const docs = app.documents || app.documents_submitted || [];
                            if (!Array.isArray(docs) || docs.length === 0) return null;

                            return (
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Submitted Documents</h3>
                                <div className="space-y-2">
                                  {docs.map((doc, index) => {
                                    const documentType = doc.document_type || doc.documentType;
                                    const fileUrl = doc.file_url || doc.fileUrl;
                                    const uploadedAt = doc.uploaded_at || doc.uploadedAt;

                                    return (
                                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                                        {documentType && (
                                          <p className="font-medium text-gray-900">{documentType}</p>
                                        )}

                                        {uploadedAt && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Uploaded: {formatDate(uploadedAt)}
                                          </p>
                                        )}

                                        {fileUrl && (
                                          isPdfFile(fileUrl) ? (
                                            <button
                                              type="button"
                                              onClick={() => openDocument(fileUrl)}
                                              className="text-[#d85a30] hover:text-[#ffb766] text-sm mt-1 inline-block"
                                            >
                                              View PDF
                                            </button>
                                          ) : (
                                            <a
                                              href={displayMedia(fileUrl)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[#d85a30] hover:text-[#ffb766] text-sm mt-1 inline-block"
                                            >
                                              View Document
                                            </a>
                                          )
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Verification History */}
                          {app.verification_history && app.verification_history.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification History</h3>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                {app.verification_history.map((history, index) => (
                                  <div key={index} className="border-l-4 border-[#d85a30] pl-4 pb-4 last:pb-0">
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
                                              ? "bg-[#c2edda]/30 text-black"
                                              : history.action === "Rejected"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-[#68d388]/25 text-black"
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
                                  <div className="bg-[#c2edda]/20 border border-[#d85a30]/30 rounded-lg p-4">
                                    <div className="space-y-2">
                                      {stageRequirements.current && (
                                        <div>
                                          <p className="text-sm font-semibold text-black">Current Stage:</p>
                                          <p className="text-sm text-black">
                                            Level {stageRequirements.current.roleLevels?.join(" or ")} 
                                            ({stageRequirements.current.roleNames?.join(" or ")})
                                          </p>
                                        </div>
                                      )}
                                      {stageRequirements.next && (
                                        <div>
                                          <p className="text-sm font-semibold text-black">Next Stage:</p>
                                          <p className="text-sm text-black">
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
                                        {nextStageAdmins
                                          .filter((admin) => {
                                            // Frontend filtering by departmentId if admin is below Secretary level
                                            // Secretary (level 3) and above can see all departments
                                            if (adminRoleLevel && adminRoleLevel > 3 && adminDepartmentId) {
                                              // Only show admins from the same department
                                              const adminDeptId = admin.departmentId || admin.department_id;
                                              return adminDeptId && adminDeptId.trim() === adminDepartmentId.trim();
                                            }
                                            // Secretary level and above see all admins
                                            return true;
                                          })
                                          .map((admin) => {
                                            // Get department name from departments map using departmentId
                                            const adminDeptId = admin.departmentId || admin.department_id;
                                            const departmentObj = adminDeptId ? departments.get(adminDeptId) : null;
                                            const departmentName = departmentObj?.department_display_name || departmentObj?.department_name || admin.department || "";
                                            
                                            return (
                                          <option key={admin._id} value={admin._id}>
                                            {admin.fullName} 
                                            {admin.role && ` (${admin.role}`}
                                            {admin.roleLevel && ` - Level ${admin.roleLevel}`}
                                            {admin.role && `)`}
                                                {departmentName && ` - ${departmentName}`}
                                          </option>
                                            );
                                          })}
                                      </select>
                                      <p className="text-xs text-[#d85a30] mt-2">
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

                                {/* OTP step for completing at Admin_Review */}
                                {needsCompletionOtp(app, "Verified") && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                                    <h4 className="text-sm font-semibold text-amber-900">OTP verification required</h4>
                                    {(!adminContactNumber || !adminContactNumber.trim()) ? (
                                      <p className="text-sm text-amber-800">
                                        Add a phone number in your{" "}
                                        <Link to="/system-admin/profile" className="underline font-medium hover:text-amber-900">
                                          profile settings
                                        </Link>{" "}
                                        to complete applications at Admin Review stage.
                                      </p>
                                    ) : !otpSent ? (
                                      <div>
                                        <button
                                          type="button"
                                          onClick={handleSendCompletionOtp}
                                          disabled={sendOtpLoading}
                                          className="flex items-center gap-2 px-4 py-2 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                          {sendOtpLoading ? (
                                            <>
                                              <Spinner /> Sending OTP...
                                            </>
                                          ) : (
                                            <>Send OTP to my mobile</>
                                          )}
                                        </button>
                                        {otpError === "otp_required" && (
                                          <p className="text-sm text-amber-700 mt-2">Please send OTP first, then enter it below.</p>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP (6 digits)</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          maxLength={6}
                                          value={otpValue}
                                          onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, "");
                                            setOtpValue(v);
                                            setOtpError(null);
                                          }}
                                          placeholder="123456"
                                          className="w-full max-w-[160px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d85a30] text-sm"
                                        />
                                        {otpError === "otp_invalid" && (
                                          <p className="text-sm text-red-600 mt-1">Invalid OTP. Please try again.</p>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleSendCompletionOtp}
                                          disabled={sendOtpLoading}
                                          className="text-xs text-[#d85a30] hover:underline mt-2 block"
                                        >
                                          Resend OTP
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Accept Button */}
                                  <button
                                    onClick={() => handleVerify("Verified")}
                                    disabled={processingAction}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-base shadow-lg hover:shadow-xl"
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
                                    <span className="text-[#d85a30] font-medium">Note:</span> The dropdown shows admins with higher authority (lower level number) than you. For example, if you're Level 6, you'll see Level 1-5 admins.
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

