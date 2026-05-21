/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSearch, FaUpload } from "react-icons/fa";

import axios from "../../../../api/axios";
import {
  APPLICATIONS_SCHEME_URL,
  APPLICATION_DETAIL_URL,
  ADMIN_PROFILE_URL,
  APPLICATION_BIOAUTH_REQUEUE_URL,
  APPLICATION_MARK_BENEFIT_TRANSFERRED_URL,
  DEPARTMENTS_URL,
} from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import { formatDateInDDMonYYYY } from "../../../../utils/dateFunctions/formatdate";
import BulkUploadModal from "../../../../reusable-components/modals/BulkUploadModal.component";
import { displayMedia } from "../../../../utils/uploadFiles/uploadFileToServerController";
import { FormSelectInput } from "../../../../reusable-components/inputs/FormSelect/FormSelect";
import { getDistrictsForState, normalizeLocationValue } from "../../../../utils/locationOptions";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import showToast from "../../../../utils/notification/NotificationModal";

export default function SchemeBeneficiaries() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scheme_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheme, setScheme] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [countByStatus, setCountByStatus] = useState({});
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusCardFilter, setStatusCardFilter] = useState("all"); // all | applied | under review | approved | benefit transferred | bioauthentication | rejected
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  const [showRebioModal, setShowRebioModal] = useState(false);
  const [rebioRemarks, setRebioRemarks] = useState("");
  const [rebioSubmitting, setRebioSubmitting] = useState(false);
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [payableRemarks, setPayableRemarks] = useState("");
  const [payableSubmitting, setPayableSubmitting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [canBulkUpload, setCanBulkUpload] = useState(false);
  const [adminRoleLevel, setAdminRoleLevel] = useState(null);
  const [adminDepartment, setAdminDepartment] = useState(null);
  const [adminDepartmentName, setAdminDepartmentName] = useState(null);

  // Application detail modal state (documents)
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [detailedApplication, setDetailedApplication] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Check if admin has bulk upload access
  useEffect(() => {
    // Fetch department name by ID
    const fetchDepartmentName = async (departmentId) => {
      try {
        const response = await axios.get(DEPARTMENTS_URL);
        if (response.status === 200) {
          const deptData = response.data?.departments || response.data || [];
          const department = deptData.find((dept) => dept._id === departmentId);
          if (department) {
            setAdminDepartmentName(department.department_name || department.name || "N/A");
          } else {
            setAdminDepartmentName("N/A");
          }
        }
      } catch (error) {
        console.error("Error fetching department name:", error);
        setAdminDepartmentName("N/A");
      }
    };

    const checkBulkUploadAccess = async () => {
      try {
        const response = await axios.get(ADMIN_PROFILE_URL);
        const userData =
          response.data?.user ??
          response.data?.data?.user ??
          response.data?.data ??
          response.data ??
          null;
        if (response.status === 200 && userData) {
          const roleLevelRaw = userData.roleLevel ?? userData.role_level ?? null;
          const roleLevel = roleLevelRaw != null ? Number(roleLevelRaw) : null;
          const role = userData.role || "";
          setAdminRoleLevel(roleLevel);

          // Allow bulk upload for: Super Admin (1), Admin (2), DistrictHQ Head (3), District Overlookers (4)
          const hasAccess =
            roleLevel === 1 || // Super Admin
            roleLevel === 2 || // Admin
            roleLevel === 3 || // DistrictHQ Head
            roleLevel === 4 || // District Overlookers
            role === "Super Admin" ||
            role === "Admin" ||
            role === "DistrictHQ Head" ||
            role === "District Overlookers";

          setCanBulkUpload(hasAccess);
          console.log("Bulk Upload Access Check:", {
            roleLevel,
            role,
            hasAccess,
            canBulkUpload: hasAccess
          });

          // Extract department ID and name
          let deptId = userData.departmentId || userData.department_id;
          let deptName = userData.departmentName || userData.department_name;
          
          if (!deptId && userData.department) {
            const deptValue = String(userData.department).trim();
            const isObjectIdFormat = /^[0-9a-fA-F]{24}$/.test(deptValue);
            if (isObjectIdFormat) {
              deptId = deptValue;
            } else {
              // If department is a name string, use it
              deptName = deptValue;
            }
          }
          
          setAdminDepartment(deptId);
          
          // If we have department ID but no name, fetch it from departments API
          if (deptId && !deptName) {
            fetchDepartmentName(deptId);
          } else {
            setAdminDepartmentName(deptName || userData.department || "N/A");
          }
        }
      } catch (error) {
        console.error("Error checking bulk upload access:", error);
        setCanBulkUpload(false);
        // Fallback to localStorage user (prevents hiding role-based actions if profile API shape differs)
        try {
          const stored = localStorage.getItem("user");
          const u = stored ? JSON.parse(stored) : null;
          const rlRaw = u?.roleLevel ?? u?.role_level ?? null;
          setAdminRoleLevel(rlRaw != null ? Number(rlRaw) : null);
        } catch (_) {}
      }
    };

    checkBulkUploadAccess();
  }, []);

  const fetchSchemeBeneficiaries = useCallback(async () => {
    if (!scheme_id) {
      setError("Scheme ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${APPLICATIONS_SCHEME_URL}/${scheme_id}`);
      if (response.status === 200 && response.data) {
        const data = response.data;
        setScheme(data.scheme || null);
        setApplicants(data.applicants || []);
        setCountByStatus(data.count_by_status || {});
        setTotalApplicants(data.total_applicants || 0);
      }
    } catch (err) {
      console.error("Error fetching scheme beneficiaries:", err);
      setError(err.response?.data?.message || "Failed to fetch scheme beneficiaries");
      setApplicants([]);
      setCountByStatus({});
      setTotalApplicants(0);
    } finally {
      setLoading(false);
    }
  }, [scheme_id]);

  useEffect(() => {
    fetchSchemeBeneficiaries();
  }, [fetchSchemeBeneficiaries]);

  // Fetch application detail (documents) for modal
  const fetchApplicationDetail = async (applicationId) => {
    if (!applicationId || applicationId === "N/A") return;
    try {
      setLoadingDetail(true);
      setDetailedApplication(null);

      const response = await axios.get(`${APPLICATION_DETAIL_URL}/${applicationId}`);
      if (response.status === 200 && response.data) {
        const appData = response.data.data || response.data.application || response.data;
        setDetailedApplication(appData);
      }
    } catch (err) {
      console.error("Error fetching application detail:", err);
      setDetailedApplication(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenApplicationDetail = (applicationId) => {
    setSelectedApplicationId(applicationId);
    fetchApplicationDetail(applicationId);
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
      // Fallback to normal open
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Filter applicants based on search query
  const getApplicantDistrict = (application) => {
    const applicant = application.applicant || application.user || application.userData || application.applicantData || application;
    const addr = applicant.address || applicant.currentAddress || applicant.permanentAddress || application.address || {};
    const d =
      addr.district ||
      addr.district_name ||
      applicant.district ||
      application.district ||
      "";
    return String(d || "").trim();
  };

  // Same canonical district list used in user registration/profile dropdowns (app scope: Sikkim only)
  const districtOptions = getDistrictsForState("Sikkim");

  const normalizeStatusKey = (s) => String(s || "").trim().toLowerCase();
  const getApplicationStatus = (application) =>
    application.application_status || application.status || application.verification_status || "Unknown";
  const getApplicationStatusKey = (application) => normalizeStatusKey(getApplicationStatus(application));
  const getApplicationId = (application) => application._id || application.application_id || application.id || null;

  const filteredApplicants = applicants.filter((application) => {
    const district = normalizeLocationValue(getApplicantDistrict(application));
    if (districtFilter !== "all") {
      if (!district) return false;
      if (district.toLowerCase() !== String(districtFilter).toLowerCase()) return false;
    }
    if (statusCardFilter !== "all") {
      const statusKey = getApplicationStatusKey(application);
      if (statusKey !== String(statusCardFilter).toLowerCase()) return false;
    }
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    // Check both nested and flattened structures
    const applicant = application.applicant || application.user || application.userData || application;
    const fullName = (
      application.full_name || 
      applicant.full_name || 
      applicant.fullName || 
      applicant.name || 
      ""
    ).toLowerCase();
    const aadhaar = (
      application.aadhaar_number || 
      application.aadhaarNumber || 
      application.aadhaar ||
      applicant.aadhaar_number || 
      applicant.aadhaarNumber || 
      applicant.aadhaar || 
      ""
    ).toLowerCase();
    const applicationId = (application.application_id || application._id || application.id || "").toLowerCase();
    const status = (application.application_status || application.status || "").toLowerCase();
    
    return (
      fullName.includes(query) ||
      aadhaar.includes(query) ||
      applicationId.includes(query) ||
      status.includes(query)
    );
  });

  const eligibleStatuses = useMemo(() => new Set(["approved", "benefit transferred"]), []);

  const computedCountByStatus = useMemo(() => {
    const map = {};
    for (const a of applicants) {
      const key = getApplicationStatusKey(a);
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [applicants]);

  const getCount = (key) => {
    const k = String(key || "").trim();
    return (
      Number(countByStatus?.[k]) ||
      Number(countByStatus?.[k.toLowerCase?.()]) ||
      Number(computedCountByStatus?.[k.toLowerCase?.()]) ||
      0
    );
  };

  const cardBase =
    "group relative overflow-hidden cursor-pointer select-none rounded-2xl border bg-white p-4 shadow-sm " +
    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d85a30]/40";
  const cardActive = "ring-2 ring-[#d85a30]/40 border-[#d85a30]/40";
  const isActive = (key) => (statusCardFilter || "all") === key;

  const eligibleFilteredIds = useMemo(() => {
    const ids = [];
    for (const a of filteredApplicants) {
      const id = getApplicationId(a);
      const statusKey = getApplicationStatusKey(a);
      if (id && eligibleStatuses.has(statusKey)) ids.push(String(id));
    }
    return ids;
  }, [filteredApplicants, eligibleStatuses]);

  const selectedEligibleCount = useMemo(() => {
    const set = new Set(selectedApplicationIds.map(String));
    return eligibleFilteredIds.filter((id) => set.has(id)).length;
  }, [eligibleFilteredIds, selectedApplicationIds]);

  const selectedApps = useMemo(() => {
    const selectedSet = new Set(selectedApplicationIds.map(String));
    return applicants.filter((a) => {
      const id = getApplicationId(a);
      return id && selectedSet.has(String(id));
    });
  }, [applicants, selectedApplicationIds]);

  const selectedCountByStatusKey = useMemo(() => {
    const map = {};
    for (const a of selectedApps) {
      const k = getApplicationStatusKey(a);
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [selectedApps]);

  const allEligibleSelected =
    eligibleFilteredIds.length > 0 && selectedEligibleCount === eligibleFilteredIds.length;

  const toggleSelectAllEligible = (checked) => {
    if (!checked) {
      setSelectedApplicationIds((prev) => prev.filter((id) => !eligibleFilteredIds.includes(String(id))));
      return;
    }
    setSelectedApplicationIds((prev) => {
      const set = new Set(prev.map(String));
      eligibleFilteredIds.forEach((id) => set.add(String(id)));
      return Array.from(set);
    });
  };

  const toggleSelectOne = (id, checked) => {
    const key = String(id);
    setSelectedApplicationIds((prev) => {
      const set = new Set(prev.map(String));
      if (checked) set.add(key);
      else set.delete(key);
      return Array.from(set);
    });
  };

  const handleBulkRebio = async () => {
    const ids = selectedApplicationIds.map(String).filter(Boolean);
    if (ids.length === 0) return;

    const adminUsername = sessionStorage.getItem("admin_username") || "";
    const adminPassword = sessionStorage.getItem("admin_password") || "";

    try {
      setRebioSubmitting(true);
      const res = await axios.post(
        APPLICATION_BIOAUTH_REQUEUE_URL,
        { applicationIds: ids, remarks: rebioRemarks?.trim() || undefined },
        {
          headers: {
            ...(adminUsername ? { "x-admin-username": adminUsername } : {}),
            ...(adminPassword ? { "x-admin-password": adminPassword } : {}),
          },
        }
      );

      const updated = res.data?.data?.updated || [];
      const skipped = res.data?.data?.skipped || [];
      const updatedCount = Array.isArray(updated) ? updated.length : 0;
      const skippedCount = Array.isArray(skipped) ? skipped.length : 0;

      if (updatedCount > 0) {
        showToast(`${updatedCount} application(s) sent for re-bioauthentication.`, "success");
      } else {
        showToast(res.data?.message || "No eligible applications were updated.", "error");
      }
      if (skippedCount > 0) {
        showToast(`${skippedCount} application(s) skipped (not eligible).`, "error");
      }

      setSelectedApplicationIds([]);
      setRebioRemarks("");
      setShowRebioModal(false);
      fetchSchemeBeneficiaries();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to requeue applications for bioauthentication.", "error");
    } finally {
      setRebioSubmitting(false);
    }
  };

  const canMarkPayable = adminRoleLevel === 1 || adminRoleLevel === 2;
  const isBenefitTransferredFilter = statusCardFilter === "benefit transferred";
  const selectedBenefitTransferredCount = selectedCountByStatusKey["benefit transferred"] || 0;
  const selectedApprovedCount = selectedCountByStatusKey["approved"] || 0;

  const handlePrintInvoices = () => {
    const invoices = selectedApps
      .filter((a) => getApplicationStatusKey(a) === "benefit transferred")
      .map((application) => {
        const applicant =
          application.applicant ||
          application.user ||
          application.userData ||
          application.applicantData ||
          application;
        const fullName =
          application.full_name ||
          applicant.full_name ||
          applicant.fullName ||
          applicant.name ||
          "N/A";
        const applicationId = getApplicationId(application) || "N/A";
        const district = normalizeLocationValue(getApplicantDistrict(application)) || "N/A";
        const appliedOn = (application.date_applied || application.dateApplied || application.createdAt)
          ? formatDateInDDMonYYYY(application.date_applied || application.dateApplied || application.createdAt)
          : "N/A";
        return { fullName, applicationId, district, appliedOn };
      });

    if (invoices.length === 0) {
      showToast("Select Benefit Transferred applications to print invoices.", "error");
      return;
    }

    const schemeName = scheme?.scheme_name || "Scheme";
    const now = new Date().toLocaleString();
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoices - ${schemeName}</title>
    <style>
      @page { size: A4; margin: 14mm; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 14px; }
      .title { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
      .meta { font-size: 12px; color: #475569; }
      .badge { display:inline-block; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 999px; background:#eff6ff; color:#1d4ed8; }
      .panel { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
      .row { display:flex; justify-content:space-between; gap: 12px; font-size: 12px; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
      .row:last-child { border-bottom: none; }
      .label { color: #64748b; }
      .value { font-weight: 800; color:#0f172a; text-align:right; word-break: break-word; }
      .name { font-size: 16px; font-weight: 900; margin: 0 0 8px 0; }
    </style>
  </head>
  <body>
    ${invoices
      .map(
        (inv) => `
      <section class="page">
        <div class="header">
          <div>
            <div class="title">Benefit Transfer Invoice</div>
            <div class="meta">${schemeName}</div>
          </div>
          <div class="meta">Printed: ${now}</div>
        </div>
        <div class="panel">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom: 10px;">
            <h2 class="name">${inv.fullName}</h2>
            <span class="badge">Benefit Transferred</span>
          </div>
          <div class="row"><span class="label">Application ID</span><span class="value">${inv.applicationId}</span></div>
          <div class="row"><span class="label">District</span><span class="value">${inv.district}</span></div>
          <div class="row"><span class="label">Applied on</span><span class="value">${inv.appliedOn}</span></div>
        </div>
      </section>`
      )
      .join("")}
  </body>
</html>`;

    // Use hidden iframe to avoid popup blockers and allow multi-page printing.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      showToast("Unable to open print preview. Please try again.", "error");
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const win = iframe.contentWindow;
    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch (_) {}
    };

    // Give browser a tick to layout before printing.
    setTimeout(() => {
      try {
        win?.focus();
        win?.print();
      } finally {
        // Cleanup after print dialog opens.
        setTimeout(cleanup, 500);
      }
    }, 250);
  };

  const handleBulkMarkPayable = async () => {
    const ids = selectedApplicationIds.map(String).filter(Boolean);
    if (ids.length === 0) return;

    const adminUsername = sessionStorage.getItem("admin_username") || "";
    const adminPassword = sessionStorage.getItem("admin_password") || "";

    try {
      setPayableSubmitting(true);

      const results = await Promise.allSettled(
        ids.map((id) =>
          axios.put(
            `${APPLICATION_MARK_BENEFIT_TRANSFERRED_URL}/${id}/mark-benefit-transferred`,
            { remarks: payableRemarks?.trim() || undefined },
            {
              headers: {
                ...(adminUsername ? { "x-admin-username": adminUsername } : {}),
                ...(adminPassword ? { "x-admin-password": adminPassword } : {}),
              },
            }
          )
        )
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        showToast(`${successCount} application(s) marked as Benefit Transferred.`, "success");
      }
      if (failCount > 0) {
        showToast(`${failCount} application(s) failed to update.`, "error");
      }

      setSelectedApplicationIds([]);
      setPayableRemarks("");
      setShowPayableModal(false);
      fetchSchemeBeneficiaries();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to mark Benefit Transferred.", "error");
    } finally {
      setPayableSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      "Applied": "bg-[#68d388]/25 text-black",
      "Under Review": "bg-[#c2edda]/30 text-black",
      "Approved": "bg-[#c2edda]/30 text-black",
      "Benefit Transferred": "bg-blue-100 text-blue-800",
      "Rejected": "bg-red-100 text-red-800",
      "Pending": "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.Pending;
  };

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => {
                // Go back to previous page, or to schemes list if no history
                if (location.state?.from) {
                  navigate(location.state.from);
                } else {
                  navigate(-1); // Go back in browser history
                }
              }}
              className="flex items-center gap-2 text-[#d85a30] hover:text-[#ffb766] font-medium"
            >
              <FaArrowLeft /> Back
            </button>
            {scheme && (
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center gap-2 bg-[#d85a30] text-white px-4 py-2 rounded-md hover:bg-[#ffb766] font-medium transition-colors"
              >
                <FaUpload /> Bulk Upload
              </button>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Scheme Beneficiaries
          </h1>
          {scheme && (
            <p className="text-gray-600 mt-2">
              {scheme.scheme_name || "Scheme Details"}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Statistics Cards (click to filter table) */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setStatusCardFilter("all")}
                onKeyDown={(e) => e.key === "Enter" && setStatusCardFilter("all")}
                className={`${cardBase} ${isActive("all") ? cardActive : ""}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#d85a30]" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Total</p>
                  {isActive("all") && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#d85a30]/10 text-[#d85a30] font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{totalApplicants}</p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setStatusCardFilter("applied")}
                onKeyDown={(e) => e.key === "Enter" && setStatusCardFilter("applied")}
                className={`${cardBase} ${isActive("applied") ? cardActive : ""}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#68d388]" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Applied</p>
                  {isActive("applied") && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#68d388]/15 text-slate-800 font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{getCount("Applied")}</p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setStatusCardFilter("under review")}
                onKeyDown={(e) => e.key === "Enter" && setStatusCardFilter("under review")}
                className={`${cardBase} ${isActive("under review") ? cardActive : ""}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#c2edda]" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Under Review</p>
                  {isActive("under review") && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#c2edda]/40 text-slate-800 font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{getCount("Under Review")}</p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setStatusCardFilter("approved")}
                onKeyDown={(e) => e.key === "Enter" && setStatusCardFilter("approved")}
                className={`${cardBase} ${isActive("approved") ? cardActive : ""}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#d85a30]" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Approved</p>
                  {isActive("approved") && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#d85a30]/10 text-[#d85a30] font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{getCount("Approved")}</p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setStatusCardFilter("benefit transferred")}
                onKeyDown={(e) => e.key === "Enter" && setStatusCardFilter("benefit transferred")}
                className={`${cardBase} ${isActive("benefit transferred") ? cardActive : ""}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Benefit Transferred</p>
                  {isActive("benefit transferred") && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                  {getCount("Benefit Transferred")}
                </p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setStatusCardFilter("bioauthentication")}
                onKeyDown={(e) => e.key === "Enter" && setStatusCardFilter("bioauthentication")}
                className={`${cardBase} ${isActive("bioauthentication") ? cardActive : ""}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-amber-400" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Re-bioauth</p>
                  {isActive("bioauthentication") && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                  {getCount("Bioauthentication")}
                </p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setStatusCardFilter("rejected")}
                onKeyDown={(e) => e.key === "Enter" && setStatusCardFilter("rejected")}
                className={`${cardBase} ${isActive("rejected") ? cardActive : ""} border-red-200`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-red-500" />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Rejected</p>
                  {isActive("rejected") && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{getCount("Rejected")}</p>
              </div>
            </div>

            {/* Search + District Filter */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search by name, Aadhaar, application ID, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
                  <FormSelectInput value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="!rounded-md">
                    <option value="all">All Districts</option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </FormSelectInput>
                </div>
              </div>
              {(searchQuery || districtFilter !== "all" || statusCardFilter !== "all") && (
                <p className="mt-2 text-sm text-gray-600">
                  Found {filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Applicants Table */}
            {filteredApplicants.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">
                  {searchQuery ? "No applicants found matching your search." : "No applicants found for this scheme."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Bulk action bar */}
                <div className="px-4 py-3 border-b border-gray-200 bg-white flex flex-wrap items-center gap-3">
                  <div className="text-sm text-gray-700">
                    {selectedEligibleCount} selected (eligible in current filter: {eligibleFilteredIds.length})
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    {isBenefitTransferredFilter && (
                      <button
                        type="button"
                        onClick={handlePrintInvoices}
                        disabled={selectedBenefitTransferredCount === 0}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Print invoices
                      </button>
                    )}
                    {canMarkPayable && !isBenefitTransferredFilter && (
                      <button
                        type="button"
                        onClick={() => setShowPayableModal(true)}
                        disabled={selectedEligibleCount === 0 || selectedApprovedCount === 0}
                        className="px-4 py-2 rounded-lg bg-[#68d388] text-black text-sm font-semibold hover:bg-[#c2edda] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Mark as Benefit Transferred (Payable)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowRebioModal(true)}
                      disabled={selectedEligibleCount === 0}
                      className="px-4 py-2 rounded-lg bg-[#d85a30] text-white text-sm font-semibold hover:bg-[#ffb766] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send for Re-bioauthentication (CSC)
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-left text-slate-600 border-b border-gray-200">
                        <th className="py-3 px-4 w-12">
                          <input
                            type="checkbox"
                            checked={allEligibleSelected}
                            onChange={(e) => toggleSelectAllEligible(e.target.checked)}
                            disabled={eligibleFilteredIds.length === 0}
                            className="h-4 w-4 rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
                            title="Select all eligible (filtered)"
                          />
                        </th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Full Name</th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Application ID</th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Status</th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Verification Stage</th>
                        <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Date Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredApplicants.map((application, index) => {
                        // The API returns a flattened structure - applicant data is at the top level
                        const applicant = application.applicant || 
                                         application.user || 
                                         application.userData || 
                                         application.applicantData || 
                                         application;
                        
                        const status = getApplicationStatus(application);
                        const statusKey = getApplicationStatusKey(application);
                        
                        // Full name can be at top level (flattened) or nested
                        const fullName = application.full_name || 
                                        applicant.full_name || 
                                        applicant.fullName || 
                                        applicant.name || 
                                        "N/A";
                        
                        const applicationId = getApplicationId(application) || "N/A";
                        const verificationStage = (application.verification_stage || application.verificationStage)?.replace(/_/g, " ") || 
                                                  `Level ${application.verification_level || application.verificationLevel || "N/A"}`;
                        const dateApplied = (application.date_applied || application.dateApplied || application.createdAt) 
                                          ? formatDateInDDMonYYYY(application.date_applied || application.dateApplied || application.createdAt) 
                                          : "N/A";
                        const isEligible = applicationId !== "N/A" && eligibleStatuses.has(statusKey);
                        const isChecked = selectedApplicationIds.map(String).includes(String(applicationId));
                        
                        return (
                          <motion.tr
                            key={applicationId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-[#c2edda]/20 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <input
                                type="checkbox"
                                checked={isEligible ? isChecked : false}
                                disabled={!isEligible}
                                onChange={(e) => toggleSelectOne(applicationId, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30] disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isEligible ? "Select" : "Only Approved / Benefit Transferred are eligible"}
                              />
                            </td>
                            <td className="py-4 px-4 text-gray-900 font-medium">{fullName}</td>
                            <td className="py-4 px-4 text-gray-700 font-mono text-xs">
                              <button
                                type="button"
                                className="text-[#d85a30] hover:text-[#ffb766] hover:underline"
                                onClick={() => handleOpenApplicationDetail(applicationId)}
                                disabled={!applicationId || applicationId === "N/A"}
                              >
                                {applicationId}
                              </button>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(status)}`}>
                                {status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{verificationStage}</td>
                            <td className="py-4 px-4 text-gray-700">{dateApplied}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Application Details Modal (documents) */}
        {selectedApplicationId && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedApplicationId(null);
                setDetailedApplication(null);
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Application Documents</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedApplicationId(null);
                      setDetailedApplication(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="flex justify-center items-center py-12">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const docs =
                        detailedApplication?.documents ||
                        detailedApplication?.documents_submitted ||
                        [];

                      if (!Array.isArray(docs) || docs.length === 0) {
                        return (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">No documents found.</p>
                          </div>
                        );
                      }

                      return (
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
                                    Uploaded: {formatDateInDDMonYYYY(uploadedAt)}
                                  </p>
                                )}

                                {fileUrl && (
                                  isPdfFile(fileUrl) ? (
                                    <button
                                      type="button"
                                      onClick={() => openDocument(fileUrl)}
                                      className="text-[#d85a30] hover:text-[#ffb766] text-sm mt-2 inline-block"
                                    >
                                      View PDF
                                    </button>
                                  ) : (
                                    <a
                                      href={displayMedia(fileUrl)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#d85a30] hover:text-[#ffb766] text-sm mt-2 inline-block"
                                    >
                                      View Document
                                    </a>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Re-bioauthentication Modal */}
        <GenericModal
          open={showRebioModal}
          setOpen={(v) => {
            if (!v) {
              setShowRebioModal(false);
              setRebioRemarks("");
            }
          }}
          title="Send for Re-bioauthentication (CSC)"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              This will move the selected applications back to CSC stage for re-bioauthentication.
              Only <strong>Approved</strong> and <strong>Benefit Transferred</strong> are selectable.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (optional)</label>
              <textarea
                value={rebioRemarks}
                onChange={(e) => setRebioRemarks(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Reason for re-bioauthentication (optional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRebioModal(false);
                  setRebioRemarks("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={rebioSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkRebio}
                disabled={rebioSubmitting || selectedEligibleCount === 0}
                className="px-4 py-2 bg-[#d85a30] text-white rounded-md hover:bg-[#ffb766] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rebioSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Sending...
                  </span>
                ) : (
                  `Send (${selectedEligibleCount})`
                )}
              </button>
            </div>
          </div>
        </GenericModal>

        {/* Bulk Mark Payable Modal */}
        <GenericModal
          open={showPayableModal}
          setOpen={(v) => {
            if (!v) {
              setShowPayableModal(false);
              setPayableRemarks("");
            }
          }}
          title="Mark as Benefit Transferred"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              This will mark the selected applications as <strong>Benefit Transferred</strong>.
              Only Super Admin/Admin can perform this action.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (optional)</label>
              <textarea
                value={payableRemarks}
                onChange={(e) => setPayableRemarks(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Optional note"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPayableModal(false);
                  setPayableRemarks("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={payableSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkMarkPayable}
                disabled={payableSubmitting || selectedEligibleCount === 0}
                className="px-4 py-2 bg-[#68d388] text-black rounded-md hover:bg-[#c2edda] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {payableSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Updating...
                  </span>
                ) : (
                  `Mark (${selectedEligibleCount})`
                )}
              </button>
            </div>
          </div>
        </GenericModal>

        {/* Bulk Upload Modal */}
        {scheme && (
          <BulkUploadModal
            isOpen={showBulkUpload}
            onClose={() => setShowBulkUpload(false)}
            schemeId={scheme._id || scheme_id}
            schemeName={scheme.scheme_name || "N/A"}
            adminDepartment={adminDepartment}
            adminDepartmentName={adminDepartmentName}
          />
        )}
      </div>
    </Dashboard>
  );
}
