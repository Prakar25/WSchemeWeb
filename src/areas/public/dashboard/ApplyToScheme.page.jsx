import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaUpload, FaCheckCircle, FaTimes, FaCalendarAlt } from "react-icons/fa";

import axios from "../../../api/axios";
import {
  APPLICATIONS_APPLY_URL,
  APPLICATIONS_PREVIEW_DOCUMENTS_URL,
  DEPARTMENTS_URL,
  CATEGORIES_URL,
  SCHEMES_CONFIG_URL,
} from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import {
  getStoredUser,
  isProfileComplete,
  isCscVerified,
  getProfileCompletionStatus,
  getCscStatusMessage,
  calculateAge,
  formatDobForAge,
  setStoredActiveApplicantProfile,
} from "../../../utils/user.utils";
import {
  fetchSchemeApplyForm,
  formatDocumentSummary,
  uploadApplicationDocument,
} from "../../../utils/documentTypes";
import { useActiveApplicantId } from "../../../hooks/useActiveApplicantId";
import showToast from "../../../utils/notification/NotificationModal";
import { PUBLIC_PROFILE_GET_URL } from "../../../api/api_routing_urls";
import PublicHeader from "../components/PublicHeader.component";
import Footer from "../footer.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import { getCountries, getStatesForCountry, getDistrictsForState, normalizeLocationValue } from "../../../utils/locationOptions";
import { FormSelectInput } from "../../../reusable-components/inputs/FormSelect/FormSelect";

const DOC_FILE_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,application/pdf";

const isPdfDocUrl = (path) => /\.pdf(\?|$)/i.test(path || "");

export default function ApplyToScheme() {
  const navigate = useNavigate();
  const location = useLocation();

  const goBackFromApply = () => {
    const from = location.state?.from;
    if (typeof from === "string" && from.startsWith("/user")) {
      navigate(from);
      return;
    }
    navigate("/user/schemes");
  };
  const activeApplicantId = useActiveApplicantId();
  const [scheme, setScheme] = useState(location.state?.scheme ?? null);
  const [loadingScheme, setLoadingScheme] = useState(false);

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [applyForm, setApplyForm] = useState(null);
  const [docRequirements, setDocRequirements] = useState([]);
  const [loadingApplyForm, setLoadingApplyForm] = useState(false);
  /** New/changed uploads only — keys are catalog keys → file_url */
  const [overrideUploads, setOverrideUploads] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>

  const customFormFields =
    Array.isArray(applyForm?.custom_form_fields) && applyForm.custom_form_fields.length
      ? applyForm.custom_form_fields
      : Array.isArray(scheme?.custom_form_fields)
        ? scheme.custom_form_fields
        : [];

  /** Derive field_key from title (backend does this if field_key not sent) */
  const getFieldKey = (field) =>
    field.field_key || (field.title || field.label || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  /** Check if a field with depends_on should be visible based on formData */
  const isFieldVisible = (field, formData) => {
    const dep = field.depends_on;
    if (!dep?.field_key) return true;
    const parentVal = formData[dep.field_key];
    const target = dep.value;
    const parentField = customFormFields.find((f) => getFieldKey(f) === dep.field_key);
    const parentFieldType = parentField?.type || parentField?.field_type;
    if (parentFieldType === "checkbox" || field.type === "checkbox") {
      const checked = [true, 1, "true", "yes", "1"].includes(parentVal);
      return [true, 1, "true", "yes", "1"].includes(target) === checked;
    }
    return String(parentVal) === String(target);
  };

  const visibleCustomFields = customFormFields.filter((f) => isFieldVisible(f, formData));

  // Common beneficiary fields - always shown, pre-filled from profile
  const getProfileValue = (profile, keys) => {
    if (!profile) return "";
    for (const k of keys) {
      const parts = k.split(".");
      let val = profile;
      for (const p of parts) val = val?.[p];
      if (val != null && val !== "") return String(val).trim();
    }
    return "";
  };
  const getAgeFromProfile = (profile) => {
    const dobRaw = profile?.dob ?? profile?.demographics?.dob ?? profile?.dateOfBirth;
    if (!dobRaw) return "";
    const dateStr = typeof dobRaw === "string"
      ? (dobRaw.includes("-") && dobRaw.length >= 10 ? formatDobForAge(dobRaw) : dobRaw)
      : dobRaw?.date ? formatDobForAge(dobRaw.date) : "";
    if (!dateStr || !/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return "";
    try {
      return String(calculateAge(dateStr));
    } catch {
      return "";
    }
  };
  const getGenderDisplay = (profile) => {
    const g = getProfileValue(profile, ["gender", "demographics.gender"]);
    if (!g) return "";
    if (g === "M" || g === "Male") return "Male";
    if (g === "F" || g === "Female") return "Female";
    if (g === "O" || g === "Other") return "Other";
    return g;
  };
  const getDobForInput = (profile) => {
    const dobRaw = profile?.dob ?? profile?.demographics?.dob?.date ?? profile?.dateOfBirth;
    if (!dobRaw) return "";
    try {
      const d = typeof dobRaw === "string" ? new Date(dobRaw) : new Date(dobRaw?.date || dobRaw);
      return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };
  const getAddr = (profile, key) => {
    const addr = profile?.address ?? profile?.demographics?.address ?? profile?.profile?.address;
    if (!addr || typeof addr !== "object") return "";
    const val = addr[key] ?? addr[`${key}_no`] ?? addr[`${key}Number`] ?? "";
    return val != null && val !== "" ? String(val) : "";
  };

  const COMMON_FIELDS = [
    { key: "beneficiary_name", label: "Beneficiary Name", type: "text", profileKeys: ["fullName", "full_name", "name", "demographics.fullName"] },
    { key: "father_husband_name", label: "Father/Husband Name", type: "text", profileKeys: ["fatherName", "father_name", "husbandName", "husband_name", "demographics.fatherName", "demographics.father_name"] },
    { key: "age", label: "Age", type: "number", profileKeys: ["age"], getFromProfile: getAgeFromProfile },
    { key: "dob", label: "D.O.B", type: "date", profileKeys: ["dob"], getFromProfile: getDobForInput },
    { key: "gender", label: "Gender", type: "text", profileKeys: ["gender"], getFromProfile: getGenderDisplay },
    { key: "caste", label: "Caste", type: "text", profileKeys: ["caste", "cast", "demographics.caste", "demographics.cast"] },
    { key: "house", label: "House No.", type: "text", profileKeys: ["address.house"], getFromProfile: (p) => getAddr(p, "house") },
    { key: "street", label: "Street", type: "text", profileKeys: ["address.street"], getFromProfile: (p) => getAddr(p, "street") },
    { key: "locality", label: "Locality", type: "text", profileKeys: ["address.locality"], getFromProfile: (p) => getAddr(p, "locality") },
    { key: "district", label: "City / District", type: "district", profileKeys: ["address.district"], getFromProfile: (p) => getAddr(p, "district") },
    { key: "state", label: "State", type: "state", profileKeys: ["address.state"], getFromProfile: (p) => getAddr(p, "state") },
    { key: "pincode", label: "Pincode", type: "text", profileKeys: ["address.pincode"], getFromProfile: (p) => getAddr(p, "pincode") },
    { key: "country", label: "Country", type: "country", profileKeys: ["address.country"], getFromProfile: (p) => getAddr(p, "country") || "India" },
    { key: "constituency", label: "Constituency", type: "text", profileKeys: ["constituency", "demographics.constituency", "address.constituency"] },
    { key: "gpu", label: "GPU", type: "text", profileKeys: ["gpu", "demographics.gpu", "address.gpu"] },
    { key: "ward", label: "Ward", type: "text", profileKeys: ["ward", "demographics.ward", "address.ward"] },
    { key: "bac", label: "BAC", type: "text", profileKeys: ["bac", "demographics.bac"] },
    { key: "uid_no", label: "UID No.", type: "text", profileKeys: ["aadhaarNumber", "aadhaar_number", "uid", "uid_no", "demographics.aadhaarNumber"] },
  ];

  // Fetch full scheme by ID to ensure we have custom_form_fields (list may omit them)
  useEffect(() => {
    const schemeFromState = location.state?.scheme;
    const schemeId = schemeFromState?._id || schemeFromState?.scheme_id;
    const hasCustomFields = Array.isArray(schemeFromState?.custom_form_fields);
    if (!schemeId || hasCustomFields) return;

    const fetchFullScheme = async () => {
      try {
        setLoadingScheme(true);
        const res = await axios.get(`${SCHEMES_CONFIG_URL}/${schemeId}`);
        if (res.status === 200 && res.data) {
          const fullScheme = res.data?.scheme ?? res.data;
          if (fullScheme) setScheme(fullScheme);
        }
      } catch (err) {
        console.warn("Could not fetch full scheme, using cached:", err);
      } finally {
        setLoadingScheme(false);
      }
    };

    fetchFullScheme();
  }, [location.state?.scheme]);

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
    if (!scheme) {
      showToast("Scheme not found. Please select a scheme first.", "error");
      navigate("/user/schemes");
      return;
    }

    const storedUser = getStoredUser();
    if (!activeApplicantId) {
      showToast("Please login first.", "error");
      navigate("/login");
      return;
    }

    // Check profile completion
    const checkProfileCompletion = async () => {
      try {
        const userId = activeApplicantId;
        const response = await axios.get(PUBLIC_PROFILE_GET_URL, {
          params: { userId },
          withCredentials: true,
        });

        if (response.data.status === "success" && response.data.user) {
          const userData = response.data.user;
          const profile = response.data.profile ?? response.data.userProfile;
          const merged = profile
            ? { ...userData, ...profile, address: userData?.address ?? profile?.address }
            : userData;
          setUser(merged);
          setStoredActiveApplicantProfile(merged);

          if (!isProfileComplete(merged)) {
            showToast(getProfileCompletionStatus(merged).message, "error");
            navigate("/user/complete-profile");
            return;
          }
          if (!isCscVerified(merged)) {
            showToast(
              getCscStatusMessage(merged) ||
                "CSC verification is pending. Visit your nearest CSC to complete bio-auth before applying.",
              "error"
            );
            navigate("/user/dashboard");
            return;
          }
        } else {
          if (!isProfileComplete(storedUser)) {
            showToast(getProfileCompletionStatus(storedUser).message, "error");
            navigate("/user/complete-profile");
            return;
          }
          if (!isCscVerified(storedUser)) {
            showToast(
              getCscStatusMessage(storedUser) ||
                "CSC verification is pending. You cannot apply until CSC verification is complete.",
              "error"
            );
            navigate("/user/dashboard");
            return;
          }
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        if (!isProfileComplete(storedUser)) {
          showToast(getProfileCompletionStatus(storedUser).message, "error");
          navigate("/user/complete-profile");
          return;
        }
        if (!isCscVerified(storedUser)) {
          showToast(
            getCscStatusMessage(storedUser) ||
              "CSC verification is pending. You cannot apply until CSC verification is complete.",
            "error"
          );
          navigate("/user/dashboard");
          return;
        }
        setUser(storedUser);
      }
    };

    checkProfileCompletion();
  }, [scheme, navigate, activeApplicantId]);

  useEffect(() => {
    const schemeId = scheme?._id || scheme?.scheme_id;
    if (!schemeId || !activeApplicantId) {
      setApplyForm(null);
      setDocRequirements([]);
      return;
    }

    const loadApplyForm = async () => {
      setLoadingApplyForm(true);
      try {
        const form = await fetchSchemeApplyForm(schemeId, activeApplicantId);
        setApplyForm(form);
        if (form.scheme) {
          setScheme((prev) => ({ ...(prev || {}), ...form.scheme }));
        }
        const normalized = form.required_documents || [];
        setDocRequirements(normalized);
        setOverrideUploads({});
      } catch (err) {
        console.error("apply-form", err);
        setApplyForm(null);
        setDocRequirements([]);
        showToast(
          err.response?.data?.message ||
            "Could not load the application form for this scheme.",
          "error"
        );
      } finally {
        setLoadingApplyForm(false);
      }
    };

    loadApplyForm();
  }, [scheme?._id, scheme?.scheme_id, activeApplicantId]);

  // Pre-fill common fields from profile when user loads (only for empty fields)
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };
      COMMON_FIELDS.forEach((f) => {
        if (prev[f.key] == null || prev[f.key] === "") {
          const val = f.getFromProfile ? f.getFromProfile(user) : getProfileValue(user, f.profileKeys);
          if (val != null && val !== "") {
            next[f.key] = val;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [user]);

  // Handle form field changes
  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const isDocumentSatisfied = (req) => {
    const key = req.key;
    if (overrideUploads[key]) return true;
    if (req.isCustom) return false;
    if (
      req.will_prefill &&
      (req.profile_document?.filePath || req.profile_document?.file_path)
    ) {
      return true;
    }
    return false;
  };

  const getProfileDocPath = (req) =>
    req.profile_document?.filePath || req.profile_document?.file_path || null;

  const handleDocumentUpload = async (docKey, files, label) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const req = docRequirements.find((d) => d.key === docKey);

    setUploadingDocs((prev) => ({ ...prev, [docKey]: true }));
    try {
      const schemeId = scheme?._id || scheme?.scheme_id;
      const { file_url } = await uploadApplicationDocument(
        file,
        docKey,
        activeApplicantId,
        req,
        schemeId
      );
      setOverrideUploads((prev) => ({ ...prev, [docKey]: file_url }));
      showToast(`${label || docKey} uploaded`, "success");
    } catch (error) {
      console.error("Error uploading document:", error);
      showToast(
        error.message ||
          error.response?.data?.message ||
          `Error uploading ${label || docKey}`,
        "error"
      );
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  const handleRemoveOverride = (docKey) => {
    setOverrideUploads((prev) => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  // Validate form (documents are optional)
  const validateForm = () => {
    // Basic validation - documents are optional
    return true;
  };

  // Submit application
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeApplicantId) {
      showToast("User information not found. Please login again.", "error");
      return;
    }

    const beneficiaryName = formData.beneficiary_name || getProfileValue(user, ["fullName", "full_name", "name"]);
    if (!beneficiaryName?.trim()) {
      setErrors((prev) => ({ ...prev, beneficiary_name: "Beneficiary name is required" }));
      showToast("Please enter beneficiary name.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      const missingDocs = docRequirements.filter((req) => !isDocumentSatisfied(req));
      if (missingDocs.length > 0) {
        const names = missingDocs
          .map((d) => d.label || d.key)
          .join(", ");
        showToast(`Please provide required documents: ${names}`, "error");
        setIsSubmitting(false);
        return;
      }

      const documentsSubmitted = Object.entries(overrideUploads)
        .filter(([, url]) => url)
        .map(([docKey, url]) => ({
          document_type: docKey,
          file_url: url,
        }));

      const schemeId = scheme._id || scheme.scheme_id;

      try {
        const previewRes = await axios.post(APPLICATIONS_PREVIEW_DOCUMENTS_URL, {
          user_id: activeApplicantId,
          scheme_id: schemeId,
          documents_submitted: documentsSubmitted,
        });
        const preview = previewRes.data?.data ?? previewRes.data ?? {};
        if (preview.ready_to_apply === false) {
          const labels = preview.missing_document_labels;
          const keys = preview.missing_document_keys;
          const msg = Array.isArray(labels) && labels.length
            ? `Missing documents: ${labels.join(", ")}`
            : Array.isArray(keys) && keys.length
              ? `Missing documents: ${keys.join(", ")}`
              : preview.message || "Some required documents are still missing.";
          showToast(msg, "error");
          setIsSubmitting(false);
          return;
        }
      } catch (previewErr) {
        if (previewErr.response?.status === 422) {
          const pdata = previewErr.response.data || {};
          const labels = pdata.missing_document_labels;
          const keys = pdata.missing_document_keys;
          const msg = Array.isArray(labels) && labels.length
            ? `Missing documents: ${labels.join(", ")}`
            : Array.isArray(keys) && keys.length
              ? `Missing documents: ${keys.join(", ")}`
              : pdata.message || "Some required documents are still missing.";
          showToast(msg, "error");
          setIsSubmitting(false);
          return;
        }
      }

      // Build form_data: common fields + custom form fields (backend ignores unknown keys)
      const commonKeys = COMMON_FIELDS.map((f) => f.key);
      const customKeys = visibleCustomFields.map((f) => getFieldKey(f));
      const filteredFormData = {};
      [...commonKeys, ...customKeys].forEach((key) => {
        const val = formData[key];
        if (val !== undefined && val !== "" && val !== null) {
          filteredFormData[key] = val;
        }
      });
      // Fallback beneficiary_name from profile if empty
      if (!filteredFormData.beneficiary_name) {
        const bn = getProfileValue(user, ["fullName", "full_name", "name"]);
        if (bn) filteredFormData.beneficiary_name = bn;
      }

      const payload = {
        // New: send applicant person id when available
        user_id: activeApplicantId,
        scheme_id: schemeId,
        form_data: Object.keys(filteredFormData).length > 0 ? filteredFormData : {},
        documents_submitted: documentsSubmitted.length > 0 ? documentsSubmitted : [],
      };

      console.log("Submitting application:", payload);
      console.log("Payload structure:", JSON.stringify(payload, null, 2));

      const response = await axios.post(APPLICATIONS_APPLY_URL, payload);

      if (response.status === 200 || response.status === 201) {
        const prefilled = response.data?.documents_prefilled_from_profile;
        if (Array.isArray(prefilled) && prefilled.length > 0) {
          showToast(
            `Application submitted. ${prefilled.length} document(s) loaded from your profile.`,
            "success"
          );
        } else {
          showToast("Application submitted successfully!", "success");
        }
        // Navigate to applications page after a short delay
        setTimeout(() => {
          navigate("/user/applications");
        }, 1500);
      } else {
        showToast("Failed to submit application. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error submitting application:", error);

      let errorMessage = "Failed to submit application. Please try again.";
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403) {
        errorMessage =
          data?.message ||
          getCscStatusMessage(user) ||
          getProfileCompletionStatus(user).message ||
          "You must complete profile KYC and CSC verification before applying.";
      } else if (status === 422) {
        const labels = data?.missing_document_labels;
        const keys = data?.missing_document_keys;
        if (Array.isArray(labels) && labels.length) {
          errorMessage = `Missing documents: ${labels.join(", ")}`;
        } else if (Array.isArray(keys) && keys.length) {
          errorMessage = `Missing documents: ${keys.join(", ")}`;
        }
        const errList = data?.errors;
        if (Array.isArray(errList) && errList.length > 0) {
          const fieldErrors = {};
          errList.forEach((err) => {
            if (err?.field) fieldErrors[err.field] = err.message || "Invalid value";
          });
          setErrors(fieldErrors);
          errorMessage =
            errList.map((e) => e.message).join(". ") || data?.message || errorMessage;
        } else if (data?.message) {
          errorMessage = data.message;
        }
      } else if (data) {
        if (data.message && data.reason) {
          errorMessage = `${data.message}: ${data.reason}`;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (status === 400) {
        errorMessage = "Invalid request. Please check your input and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!scheme) {
    return null;
  }

  const documentSummaryText = formatDocumentSummary(applyForm?.document_summary);

  return (
    <div className="min-h-screen relative">
      <PublicHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={goBackFromApply}
            className="flex items-center gap-2 text-[#d85a30] hover:text-[#ffb766] font-medium mb-4"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Apply to Scheme</h1>
          <p className="text-gray-600 mt-2">{scheme.scheme_name}</p>
        </div>

        {/* Scheme Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheme Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Department:</span>{" "}
              <span className="text-gray-900">
                {(() => {
                  const dept = departments.get(scheme.department);
                  return dept 
                    ? (dept.department_display_name || dept.department_name)
                    : (scheme.department || "N/A");
                })()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Category:</span>{" "}
              <span className="text-gray-900">
                {(() => {
                  const cat = categories.get(scheme.category);
                  return cat 
                    ? (cat.category_display_name || cat.category_name)
                    : (scheme.category || "N/A");
                })()}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Gender:</span>{" "}
              <span className="text-gray-900">
                {scheme.gender || scheme.gender_name || "All"}
              </span>
            </div>
            {scheme.scheme_eligibility && (
              <div>
                <span className="font-medium text-gray-700">Age Range:</span>{" "}
                <span className="text-gray-900">
                  {scheme.scheme_eligibility.lower_age_limit || 0} -{" "}
                  {scheme.scheme_eligibility.upper_age_limit || "N/A"} years
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {loadingApplyForm && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 flex items-center justify-center gap-3 text-gray-600">
            <Spinner />
            <span>Loading application form…</span>
          </div>
        )}

        {applyForm && !applyForm.isEligible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-red-800 mb-2">Not eligible</h2>
            <p className="text-red-700">
              {applyForm.eligibilityReason ||
                "You do not meet the eligibility criteria for this scheme."}
            </p>
            <button
              type="button"
              onClick={goBackFromApply}
              className="mt-4 px-4 py-2 border border-red-300 text-red-800 rounded-md hover:bg-red-100"
            >
              Back to schemes
            </button>
          </motion.div>
        )}

        {applyForm?.already_applied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-amber-900 mb-2">
              Application already submitted
            </h2>
            <p className="text-amber-800 mb-4">
              You have already applied to this scheme. You cannot submit another application.
            </p>
            <button
              type="button"
              onClick={() => navigate("/user/applications")}
              className="px-4 py-2 bg-[#d85a30] text-white rounded-md hover:bg-[#ffb766]"
            >
              View my applications
            </button>
          </motion.div>
        )}

        {/* Application Form */}
        <form
          onSubmit={handleSubmit}
          className={
            (applyForm && !applyForm.isEligible) || applyForm?.already_applied
              ? "hidden"
              : ""
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Application Information
            </h2>

            {/* Common Beneficiary Fields - always shown; pre-populated from profile are read-only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {COMMON_FIELDS.map((f) => {
                const fromProfile = f.getFromProfile ? f.getFromProfile(user) : getProfileValue(user, f.profileKeys);
                const isPrePopulated = !!fromProfile;
                const val = formData[f.key] ?? fromProfile ?? "";
                const isRequired = f.key === "beneficiary_name";
                const inputClass = `w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[f.key] ? "border-red-500" : "border-gray-300"
                } ${isPrePopulated ? "bg-gray-50 cursor-not-allowed" : ""}`;

                return (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {f.label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {f.type === "country" && (
                      <FormSelectInput
                        value={normalizeLocationValue(val) || "India"}
                        disabled={isPrePopulated}
                        onChange={!isPrePopulated ? (e) => {
                          handleFieldChange("country", e.target.value);
                          handleFieldChange("state", "");
                          handleFieldChange("district", "");
                        } : undefined}
                        invalid={!!errors[f.key]}
                        className={isPrePopulated ? "!bg-gray-50 !cursor-not-allowed" : ""}
                      >
                        {getCountries().map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </FormSelectInput>
                    )}
                    {f.type === "state" && (
                      <FormSelectInput
                        value={normalizeLocationValue(val)}
                        disabled={isPrePopulated}
                        onChange={!isPrePopulated ? (e) => {
                          handleFieldChange("state", e.target.value);
                          handleFieldChange("district", "");
                        } : undefined}
                        invalid={!!errors[f.key]}
                        className={isPrePopulated ? "!bg-gray-50 !cursor-not-allowed" : ""}
                      >
                        <option value="">Select State</option>
                        {normalizeLocationValue(val) &&
                          !getStatesForCountry(formData.country || "India").includes(normalizeLocationValue(val)) && (
                            <option value={normalizeLocationValue(val)}>{normalizeLocationValue(val)}</option>
                          )}
                        {getStatesForCountry(formData.country || "India").map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </FormSelectInput>
                    )}
                    {f.type === "district" && (
                      <FormSelectInput
                        value={normalizeLocationValue(val)}
                        disabled={isPrePopulated || !(formData.state || fromProfile && f.key === "district" ? (formData.state || getAddr(user, "state")) : formData.state)}
                        onChange={!isPrePopulated ? (e) => handleFieldChange("district", e.target.value) : undefined}
                        invalid={!!errors[f.key]}
                        className={isPrePopulated ? "!bg-gray-50 !cursor-not-allowed" : ""}
                      >
                        <option value="">
                          {(formData.state || getAddr(user, "state")) ? "Select District" : "Select State first"}
                        </option>
                        {normalizeLocationValue(val) &&
                          !getDistrictsForState(formData.state || getAddr(user, "state")).includes(normalizeLocationValue(val)) && (
                            <option value={normalizeLocationValue(val)}>{normalizeLocationValue(val)}</option>
                          )}
                        {getDistrictsForState(formData.state || getAddr(user, "state")).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </FormSelectInput>
                    )}
                    {f.type === "text" && (
                      <input
                        type="text"
                        value={val ?? ""}
                        readOnly={isPrePopulated}
                        onChange={!isPrePopulated ? (e) => handleFieldChange(f.key, e.target.value) : undefined}
                        placeholder={`Enter ${f.label}`}
                        className={inputClass}
                      />
                    )}
                    {f.type === "number" && (
                      <input
                        type="number"
                        value={val ?? ""}
                        readOnly={isPrePopulated}
                        onChange={!isPrePopulated ? (e) => handleFieldChange(f.key, e.target.value) : undefined}
                        placeholder={`Enter ${f.label}`}
                        className={inputClass}
                      />
                    )}
                    {f.type === "date" && (
                      <div className="relative">
                        <input
                          type="date"
                          value={val ?? ""}
                          readOnly={isPrePopulated}
                          onChange={!isPrePopulated ? (e) => handleFieldChange(f.key, e.target.value) : undefined}
                          onClick={!isPrePopulated ? (e) => e.target.showPicker?.() : undefined}
                          className={`${inputClass} ${!isPrePopulated ? "pr-10 cursor-pointer" : ""}`}
                          style={{ colorScheme: "light" }}
                        />
                        {!isPrePopulated && (
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.target.closest(".relative")?.querySelector('input[type="date"]');
                              input?.showPicker?.();
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none cursor-pointer"
                            aria-label="Open date picker"
                          >
                            <FaCalendarAlt className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                    {f.type === "textarea" && (
                      <textarea
                        value={val ?? ""}
                        readOnly={isPrePopulated}
                        onChange={!isPrePopulated ? (e) => handleFieldChange(f.key, e.target.value) : undefined}
                        placeholder={`Enter ${f.label}`}
                        rows={3}
                        className={inputClass}
                      />
                    )}
                    {errors[f.key] && (
                      <p className="mt-1 text-sm text-red-600">{errors[f.key]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Form Fields - from scheme.custom_form_fields (defined by admin) */}
            {customFormFields.length > 0 ? (
              <div className="space-y-4">
                {visibleCustomFields.map((field) => {
                  const key = getFieldKey(field);
                  const label = field.title || field.label || key;
                  const isRequired = !!field.required;
                  const fieldType = field.type || field.field_type || "text";
                  const inputClass = `w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors[key] ? "border-red-500" : "border-gray-300"
                  }`;

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label} {isRequired && <span className="text-red-500">*</span>}
                      </label>

                      {fieldType === "text" && (
                        <input
                          type="text"
                          value={formData[key] ?? ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          placeholder={`Enter ${label}`}
                          className={inputClass}
                        />
                      )}

                      {fieldType === "number" && (
                        <input
                          type="number"
                          value={formData[key] ?? ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          placeholder={`Enter ${label}`}
                          className={inputClass}
                        />
                      )}

                      {fieldType === "select" && (
                        <FormSelectInput
                          value={formData[key] ?? ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          invalid={!!errors[key]}
                        >
                          <option value="">Select {label}</option>
                          {(Array.isArray(field.options)
                            ? field.options
                            : (field.options || "").split(",").map((o) => o.trim()).filter(Boolean)
                          ).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </FormSelectInput>
                      )}

                      {fieldType === "date" && (
                        <div className="relative">
                          <input
                            type="date"
                            value={formData[key] ?? ""}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            onClick={(e) => e.target.showPicker?.()}
                            className={`${inputClass} pr-10 cursor-pointer`}
                            style={{ colorScheme: "light" }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.target.closest(".relative")?.querySelector('input[type="date"]');
                              input?.showPicker?.();
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none cursor-pointer"
                            aria-label="Open date picker"
                          >
                            <FaCalendarAlt className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {fieldType === "textarea" && (
                        <textarea
                          value={formData[key] ?? ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          placeholder={`Enter ${label}`}
                          rows={4}
                          className={inputClass}
                        />
                      )}

                      {fieldType === "checkbox" && (
                        <input
                          type="checkbox"
                          checked={!!formData[key]}
                          onChange={(e) => handleFieldChange(key, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      )}

                      {errors[key] && (
                        <p className="mt-1 text-sm text-red-600">{errors[key]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No additional information required for this scheme.</p>
            )}
          </motion.div>

          {/* Required documents — profile prefill + overrides */}
          {docRequirements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Required documents
              </h2>
              {documentSummaryText && (
                <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 mb-4">
                  {documentSummaryText}
                </p>
              )}
              <p className="text-sm text-gray-500 mb-6">
                Documents already on your profile are loaded automatically. Upload only
                when asked or if you want to replace a file.
              </p>

              {loadingApplyForm ? (
                <div className="flex items-center gap-3 text-gray-600">
                  <Spinner />
                  <span className="text-sm">Checking document requirements…</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {docRequirements.map((req) => {
                    const key = req.key;
                    const label = req.label || key;
                    const isCustom = Boolean(req.isCustom);
                    const profilePath = getProfileDocPath(req);
                    const hasOverride = Boolean(overrideUploads[key]);
                    const prefilled =
                      !isCustom && req.will_prefill && profilePath && !hasOverride;
                    const isUploading = Boolean(uploadingDocs[key]);
                    const filePath = hasOverride
                      ? overrideUploads[key]
                      : prefilled
                        ? profilePath
                        : null;
                    const fileUrl = filePath ? displayMedia(filePath) : null;
                    const needsUpload =
                      !hasOverride && (isCustom || req.needs_upload) && !prefilled;

                    let statusLabel = "Upload required";
                    let statusClass = "text-amber-800 bg-amber-50 border-amber-200";
                    if (isUploading) {
                      statusLabel = "Uploading…";
                      statusClass = "text-gray-600 bg-gray-100 border-gray-200";
                    } else if (hasOverride) {
                      statusLabel = "Uploaded";
                      statusClass = "text-emerald-800 bg-emerald-50 border-emerald-200";
                    } else if (prefilled) {
                      statusLabel = "From profile";
                      statusClass = "text-emerald-800 bg-emerald-50 border-emerald-200";
                    }

                    return (
                      <div
                        key={key}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {fileUrl && !isPdfDocUrl(filePath) && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 h-12 w-12 rounded border border-gray-200 overflow-hidden bg-gray-50"
                              >
                                <img
                                  src={fileUrl}
                                  alt={label}
                                  className="h-full w-full object-cover"
                                />
                              </a>
                            )}
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {label}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded border ${statusClass}`}
                              >
                                {!isUploading && (hasOverride || prefilled) && (
                                  <FaCheckCircle className="flex-shrink-0" />
                                )}
                                {isUploading ? (
                                  <>
                                    <Spinner />
                                    {statusLabel}
                                  </>
                                ) : (
                                  statusLabel
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <input
                              id={`apply-doc-${key}`}
                              type="file"
                              accept={DOC_FILE_ACCEPT}
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files?.length) {
                                  handleDocumentUpload(key, files, label);
                                }
                                e.target.value = "";
                              }}
                            />
                            {fileUrl && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[#d85a30] hover:underline px-2"
                              >
                                View
                              </a>
                            )}
                            {hasOverride && !isUploading && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOverride(key)}
                                className="text-sm font-medium text-red-600 hover:text-red-700 px-2"
                              >
                                Remove
                              </button>
                            )}
                            {(needsUpload || prefilled) && !isUploading && (
                              <button
                                type="button"
                                onClick={() =>
                                  document.getElementById(`apply-doc-${key}`)?.click()
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d85a30] text-white rounded-md hover:bg-[#ffb766] text-sm"
                              >
                                <FaUpload />
                                {prefilled ? "Replace" : "Upload"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={goBackFromApply}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}

