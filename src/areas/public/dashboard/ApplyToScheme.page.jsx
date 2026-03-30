import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaUpload, FaCheckCircle, FaTimes, FaCalendarAlt } from "react-icons/fa";

import axios from "../../../api/axios";
import { APPLICATIONS_APPLY_URL, DEPARTMENTS_URL, CATEGORIES_URL, SCHEMES_CONFIG_URL } from "../../../api/api_routing_urls";
import { uploadFileToServer } from "../../../utils/uploadFiles/uploadFileToServerController";
import { getStoredUser, isProfileComplete, getVerificationStatus, getAccountStatusMessage, calculateAge, formatDobForAge } from "../../../utils/user.utils";
import showToast from "../../../utils/notification/NotificationModal";
import { PUBLIC_PROFILE_GET_URL } from "../../../api/api_routing_urls";
import PublicHeader from "../components/PublicHeader.component";
import Footer from "../footer.component";
import DocDropzone from "../../../reusable-components/FileUploader/PDFImageDropZoneUploader/PDFImageDropZoneUploader.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import { getCountries, getStatesForCountry, getDistrictsForState, normalizeLocationValue } from "../../../utils/locationOptions";

export default function ApplyToScheme() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scheme, setScheme] = useState(location.state?.scheme ?? null);
  const [loadingScheme, setLoadingScheme] = useState(false);

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [documents, setDocuments] = useState({}); // { "Aadhaar Card": [files], "Birth Certificate": [files] }
  const [uploadedDocuments, setUploadedDocuments] = useState({}); // { "Aadhaar Card": "file_url", ... }
  const [showDocUploader, setShowDocUploader] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>

  // Get required documents from scheme
  const requiredDocuments = scheme?.scheme_required_document_types || 
    (Array.isArray(scheme?.scheme_required_documents)
      ? scheme.scheme_required_documents.map((doc) => doc.document_type || doc)
      : []);

  // Get custom form fields from scheme (defined by admin when creating/editing scheme)
  const customFormFields = Array.isArray(scheme?.custom_form_fields) ? scheme.custom_form_fields : [];

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

    // Get user from localStorage
    const storedUser = getStoredUser();
    if (!storedUser?._id && !storedUser?.userId) {
      showToast("Please login first.", "error");
      navigate("/login");
      return;
    }

    // Check profile completion
    const checkProfileCompletion = async () => {
      try {
        const userId = storedUser._id || storedUser.userId;
        const response = await axios.get(PUBLIC_PROFILE_GET_URL, {
          params: { userId },
        });

        if (response.data.status === "success" && response.data.user) {
          const userData = response.data.user;
          const profile = response.data.profile ?? response.data.userProfile;
          const merged = profile
            ? { ...userData, ...profile, address: userData?.address ?? profile?.address }
            : userData;
          setUser(merged);
          localStorage.setItem("user", JSON.stringify(merged));

          if (!isProfileComplete(userData)) {
            showToast(
              "Please complete your profile before applying for schemes.",
              "error"
            );
            navigate("/user/complete-profile");
            return;
          }
          if (getVerificationStatus(userData) !== "verified") {
            showToast(
              getAccountStatusMessage(userData) || "Please verify your account at the nearest CSD Center before applying.",
              "error"
            );
            navigate("/user/dashboard");
            return;
          }
        } else {
          if (!isProfileComplete(storedUser)) {
            showToast(
              "Please complete your profile before applying for schemes.",
              "error"
            );
            navigate("/user/complete-profile");
            return;
          }
          if (getVerificationStatus(storedUser) !== "verified") {
            showToast(
              getAccountStatusMessage(storedUser) || "Please verify your account before applying.",
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
          showToast(
            "Please complete your profile before applying for schemes.",
            "error"
          );
          navigate("/user/complete-profile");
          return;
        }
        if (getVerificationStatus(storedUser) !== "verified") {
          showToast(
            getAccountStatusMessage(storedUser) || "Please verify your account before applying.",
            "error"
          );
          navigate("/user/dashboard");
          return;
        }
        setUser(storedUser);
      }
    };

    checkProfileCompletion();

    // Initialize document state for each required document
    const initialDocs = {};
    requiredDocuments.forEach((docType) => {
      initialDocs[docType] = [];
      setShowDocUploader((prev) => ({ ...prev, [docType]: false }));
    });
    setDocuments(initialDocs);
  }, [scheme, navigate, requiredDocuments]);

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

  // Handle document upload
  const handleDocumentUpload = async (documentType, files) => {
    if (!files || files.length === 0) return;

    try {
      const uploadedUrls = [];

      // Upload each file
      for (const file of files) {
        const folderName = "user-docs";
        const fileUrl = await uploadFileToServer(file, folderName);
        
        if (fileUrl) {
          const fullPath = `public${fileUrl}`;
          uploadedUrls.push(fullPath);
        }
      }

      if (uploadedUrls.length > 0) {
        setUploadedDocuments((prev) => ({
          ...prev,
          [documentType]: uploadedUrls,
        }));
        setDocuments((prev) => ({
          ...prev,
          [documentType]: files,
        }));
        setShowDocUploader((prev) => ({
          ...prev,
          [documentType]: false,
        }));
        showToast(`${documentType} uploaded successfully`, "success");
      } else {
        showToast(`Failed to upload ${documentType}`, "error");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      showToast(`Error uploading ${documentType}`, "error");
    }
  };

  // Remove document
  const handleRemoveDocument = (documentType) => {
    setUploadedDocuments((prev) => {
      const newDocs = { ...prev };
      delete newDocs[documentType];
      return newDocs;
    });
    setDocuments((prev) => {
      const newDocs = { ...prev };
      delete newDocs[documentType];
      return newDocs;
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

    if (!user?._id && !user?.userId) {
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

      // Prepare documents_submitted array
      const documentsSubmitted = [];
      Object.keys(uploadedDocuments).forEach((docType) => {
        if (uploadedDocuments[docType]) {
          const urls = Array.isArray(uploadedDocuments[docType])
            ? uploadedDocuments[docType]
            : [uploadedDocuments[docType]];
          
          urls.forEach((url) => {
            if (url) {
              documentsSubmitted.push({
                document_type: docType,
                file_url: url,
              });
            }
          });
        }
      });

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
        user_id: user._id || user.userId,
        scheme_id: scheme._id || scheme.scheme_id,
        form_data: Object.keys(filteredFormData).length > 0 ? filteredFormData : {},
        documents_submitted: documentsSubmitted.length > 0 ? documentsSubmitted : [],
      };

      console.log("Submitting application:", payload);
      console.log("Payload structure:", JSON.stringify(payload, null, 2));

      const response = await axios.post(APPLICATIONS_APPLY_URL, payload);

      if (response.status === 200 || response.status === 201) {
        showToast("Application submitted successfully!", "success");
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
        errorMessage = data?.message || getAccountStatusMessage(user) || "You must complete verification before applying to schemes.";
      } else if (data) {
        if (data.message && data.reason) {
          errorMessage = `${data.message}: ${data.reason}`;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (status === 422) {
        // Field-level validation errors from backend
        const errList = data?.errors;
        if (Array.isArray(errList) && errList.length > 0) {
          const fieldErrors = {};
          errList.forEach((err) => {
            if (err?.field) fieldErrors[err.field] = err.message || "Invalid value";
          });
          setErrors(fieldErrors);
          errorMessage = errList.map((e) => e.message).join(". ") || data?.message || errorMessage;
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

  return (
    <div className="min-h-screen relative">
      <PublicHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
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

        {/* Application Form */}
        <form onSubmit={handleSubmit}>
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
                const inputClass = `w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[f.key] ? "border-red-500" : "border-gray-300"
                } ${isPrePopulated ? "bg-gray-50 cursor-not-allowed" : ""}`;

                return (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {f.label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {f.type === "country" && (
                      <select
                        value={normalizeLocationValue(val) || "India"}
                        disabled={isPrePopulated}
                        onChange={!isPrePopulated ? (e) => {
                          handleFieldChange("country", e.target.value);
                          // Reset dependent fields
                          handleFieldChange("state", "");
                          handleFieldChange("district", "");
                        } : undefined}
                        className={inputClass}
                      >
                        {getCountries().map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                    {f.type === "state" && (
                      <select
                        value={normalizeLocationValue(val)}
                        disabled={isPrePopulated}
                        onChange={!isPrePopulated ? (e) => {
                          handleFieldChange("state", e.target.value);
                          handleFieldChange("district", "");
                        } : undefined}
                        className={inputClass}
                      >
                        <option value="">Select State</option>
                        {normalizeLocationValue(val) &&
                          !getStatesForCountry(formData.country || "India").includes(normalizeLocationValue(val)) && (
                            <option value={normalizeLocationValue(val)}>{normalizeLocationValue(val)}</option>
                          )}
                        {getStatesForCountry(formData.country || "India").map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                    {f.type === "district" && (
                      <select
                        value={normalizeLocationValue(val)}
                        disabled={isPrePopulated || !(formData.state || fromProfile && f.key === "district" ? (formData.state || getAddr(user, "state")) : formData.state)}
                        onChange={!isPrePopulated ? (e) => handleFieldChange("district", e.target.value) : undefined}
                        className={inputClass}
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
                      </select>
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
                        <select
                          value={formData[key] ?? ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className={inputClass}
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
                        </select>
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

          {/* Documents Section (Optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Documents (Optional)
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload supporting documents if available
            </p>

            <div className="space-y-6">
              {requiredDocuments.map((docType, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {docType}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Upload {docType} (PDF or Image) - Optional
                      </p>
                    </div>
                    {uploadedDocuments[docType] && uploadedDocuments[docType].length > 0 ? (
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-[#d85a30]" />
                        <span className="text-sm text-[#d85a30] font-medium">
                          Uploaded
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(docType)}
                          className="ml-2 text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setShowDocUploader((prev) => ({
                            ...prev,
                            [docType]: !prev[docType],
                          }))
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-[#d85a30] text-white rounded-md hover:bg-[#ffb766] transition-colors"
                      >
                        <FaUpload /> Upload
                      </button>
                    )}
                  </div>


                  {showDocUploader[docType] && (
                    <div className="mt-4 border border-gray-300 rounded-lg p-4">
                      <DocDropzone
                        fieldTitle={`Upload ${docType}`}
                        onChange={(files) => {
                          if (files && files.length > 0) {
                            handleDocumentUpload(docType, files);
                          }
                        }}
                        multiple={true}
                        setShowDropzone={(show) => {
                          setShowDocUploader((prev) => ({
                            ...prev,
                            [docType]: show,
                          }));
                        }}
                      />
                    </div>
                  )}

                  {uploadedDocuments[docType] && uploadedDocuments[docType].length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Uploaded files ({uploadedDocuments[docType].length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(uploadedDocuments[docType])
                          ? uploadedDocuments[docType].map((url, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-[#c2edda]/30 text-black rounded text-sm"
                              >
                                File {idx + 1}
                              </span>
                            ))
                          : null}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
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

