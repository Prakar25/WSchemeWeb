/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Stepper, { Step } from "../../../reusable-components/Stepper/Stepper";
import axios from "../../../api/axios";
import {
  PUBLIC_PROFILE_GET_URL,
  PUBLIC_PROFILE_SUBMIT_COMPLETE_URL,
  PUBLIC_PROFILE_DELETE_DOCUMENT_URL,
} from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import {
  getStoredUser,
  getKycLevel,
  isProfileKycFull,
  isCscVerified,
  getKycMissingFields,
  formatKycMissingFieldsList,
  getKycStatusMessage,
  getCscStatusMessage,
} from "../../../utils/user.utils";
import { useActiveApplicantId } from "../../../hooks/useActiveApplicantId";
import showToast from "../../../utils/notification/NotificationModal";
import Input from "../../../reusable-components/inputs/InputTextBox/Input";
import DatePicker from "../../../reusable-components/inputs/DatePicker/DatePicker";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";
import { FiUpload, FiX, FiCheck, FiTrash2 } from "react-icons/fi";
import { getCountries, getStatesForCountry, getDistrictsForState, normalizeLocationValue } from "../../../utils/locationOptions";
import FormSelect from "../../../reusable-components/inputs/FormSelect/FormSelect";
import { useConfirm } from "../../../reusable-components/ConfirmDialog/ConfirmDialogProvider";
import { fetchDocumentTypes } from "../../../utils/documentTypes";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const activeApplicantId = useActiveApplicantId();
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileDocTypes, setProfileDocTypes] = useState([]);
  const [deletingDocs, setDeletingDocs] = useState({});

  const formRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    setValue,
    control,
  } = useForm({
    mode: "onChange",
  });

  const [documents, setDocuments] = useState({});

  const [locationUi, setLocationUi] = useState({ country: "India", state: "", district: "" });

  useEffect(() => {
    (async () => {
      try {
        const types = await fetchDocumentTypes({ profileOnly: true });
        setProfileDocTypes(types);
        setDocuments((prev) => {
          const next = { ...prev };
          types.forEach((t) => {
            if (next[t.key] === undefined) next[t.key] = null;
          });
          return next;
        });
        setDeletingDocs((prev) => {
          const next = { ...prev };
          types.forEach((t) => {
            if (next[t.key] === undefined) next[t.key] = false;
          });
          return next;
        });
      } catch {
        showToast("Could not load document types.", "error");
      }
    })();
  }, []);

  // Load user profile on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const storedUserId =
      activeApplicantId || storedUser._id || storedUser.userId;
    if (!storedUserId) {
      showToast("User ID not found. Please login again.", "error");
      navigate("/login");
      return;
    }

    setUserId(storedUserId);
    loadProfile(storedUserId);
  }, [navigate, activeApplicantId]);

  // Load profile from API
  const loadProfile = async (userIdToLoad) => {
    setLoadingProfile(true);
    try {
      const response = await axios.get(PUBLIC_PROFILE_GET_URL, {
        params: { userId: userIdToLoad },
        withCredentials: true, // Send cookies for session-based authentication
      });

      if (response.data.status === "success" && response.data.user) {
        const userData = response.data.user;
        setUser(userData);

        // Pre-fill form with existing user data (support flat and nested API shapes)
        const fullName = userData.demographics?.fullName || userData.fullName || "";
        const dobRaw = userData.dob ?? userData.demographics?.dob;
        const dobStr = dobRaw
          ? (typeof dobRaw === "string" ? dobRaw : dobRaw?.date || "")
          : "";
        const dobFormatted = dobStr ? new Date(dobStr).toISOString().split("T")[0] : "";
        const gender = userData.demographics?.gender || userData.gender || "";
        const email = userData.contact?.email?.value ?? userData.contactEmail ?? "";

        setValue("fullName", fullName);
        setValue("dob", dobFormatted);
        setValue("gender", gender);
        setValue("email", email);
        setValue("aadhaarNumber", userData.aadhaarNumber || userData.aadhaar_number || "");
        
        // Address fields
        setValue("careOf", userData.address?.careOf || "");
        setValue("house", userData.address?.house || "");
        setValue("street", userData.address?.street || "");
        setValue("locality", userData.address?.locality || "");
        setValue("district", userData.address?.district || "");
        setValue("state", userData.address?.state || "");
        setValue("pincode", userData.address?.pincode || "");
        setValue("country", userData.address?.country || "India");
        setLocationUi({
          country: normalizeLocationValue(userData.address?.country || "India") || "India",
          state: normalizeLocationValue(userData.address?.state || ""),
          district: normalizeLocationValue(userData.address?.district || ""),
        });

      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (error.response?.status === 404) {
        showToast("Profile not found. Please complete your profile.", "info");
      } else {
        showToast("Failed to load profile. Please try again.", "error");
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle document file selection (for submit-complete: files sent on form submit)
  const handleDocumentChange = (docType, file) => {
    if (!file) {
      setDocuments((prev) => ({ ...prev, [docType]: null }));
      return;
    }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image (JPEG, PNG, WebP) or PDF file.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size must be less than 10MB.", "error");
      return;
    }
    setDocuments((prev) => ({ ...prev, [docType]: file }));
  };

  // Delete document (existing server document only)
  const deleteDocument = async (docType) => {
    if (!userId) return;

    const docLabel =
      profileDocTypes.find((t) => t.key === docType)?.label || docType;
    const ok = await confirm({
      title: `Delete ${docLabel}?`,
      description: "This document will be removed from your profile.",
      confirmText: "Yes, delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!ok) return;

    setDeletingDocs((prev) => ({ ...prev, [docType]: true }));

    try {
      const response = await axios.delete(PUBLIC_PROFILE_DELETE_DOCUMENT_URL, {
        params: { userId },
        data: { 
          documentType: docType,
          userId, // Include userId in body as well
        },
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // Send cookies for session-based authentication
      });

      if (response.data.status === "success") {
        showToast("Document deleted successfully!", "success");
        // Reload profile
        await loadProfile(userId);
      } else {
        throw new Error(response.data.message || "Failed to delete document");
      }
    } catch (error) {
      console.error(`Error deleting ${docType}:`, error);
      showToast(
        error.response?.data?.message || "Failed to delete document. Please try again.",
        "error"
      );
    } finally {
      setDeletingDocs((prev) => ({ ...prev, [docType]: false }));
    }
  };

  // Single submit: profile + all selected documents via POST /api/public-profile/submit-complete
  const onSubmit = async (data) => {
    if (!userId) {
      showToast("User ID not found. Please login again.", "error");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      // Profile fields (API expects these names)
      if (data.fullName?.trim()) formData.append("fullName", data.fullName.trim());
      if (data.dob) formData.append("dob", data.dob);
      if (data.gender) formData.append("gender", data.gender);
      if (data.email?.trim()) formData.append("email", data.email.trim());
      if (data.aadhaarNumber?.trim()) formData.append("aadhaarNumber", data.aadhaarNumber.trim());
      if (data.careOf?.trim()) formData.append("careOf", data.careOf.trim());
      if (data.house?.trim()) formData.append("house", data.house.trim());
      if (data.street?.trim()) formData.append("street", data.street.trim());
      if (data.locality?.trim()) formData.append("locality", data.locality.trim());
      if (data.district?.trim()) formData.append("district", data.district.trim());
      if (data.state?.trim()) formData.append("state", data.state.trim());
      if (data.pincode?.trim()) formData.append("pincode", data.pincode.trim());
      formData.append("country", data.country?.trim() || "India");

      profileDocTypes.forEach((dt) => {
        const file = documents[dt.key];
        if (file) formData.append(dt.key, file);
      });

      const response = await axios.post(PUBLIC_PROFILE_SUBMIT_COMPLETE_URL, formData, {
        params: { userId },
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.data.status === "success") {
        const updatedUser = response.data.user;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setDocuments((prev) => {
          const cleared = { ...prev };
          profileDocTypes.forEach((dt) => {
            cleared[dt.key] = null;
          });
          return cleared;
        });
        showToast("Profile and documents saved successfully!", "success");
        await loadProfile(userId);
      } else {
        throw new Error(response.data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast(
        error.response?.data?.message || error.message || "Failed to save profile. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <PublicHeader />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  const getKycLevelColor = (level) => {
    switch (level) {
      case "FULL":
        return "bg-[#c2edda]/50 text-black";
      case "PARTIAL":
        return "bg-[#68d388]/50 text-black";
      case "BASIC":
        return "bg-gray-100 text-black";
      default:
        return "bg-gray-100 text-black";
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-black">Complete Your Profile</h1>
          <div className="flex items-center gap-3">
            {(getKycLevel(user) || isProfileKycFull(user)) && (
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getKycLevelColor(
                  isProfileKycFull(user) ? "FULL" : getKycLevel(user)
                )}`}
              >
                Profile KYC: {isProfileKycFull(user) ? "FULL" : getKycLevel(user)}
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate("/user/profile")}
              className="bg-gray-200 text-black py-2 px-4 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {!isProfileKycFull(user) && getKycMissingFields(user).length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-black text-sm font-medium">Profile KYC — still needed:</p>
            <p className="text-black text-sm mt-1">
              {formatKycMissingFieldsList(getKycMissingFields(user))}
            </p>
            {getKycStatusMessage(user) && (
              <p className="text-black/80 text-sm mt-2">{getKycStatusMessage(user)}</p>
            )}
          </div>
        )}

        {isProfileKycFull(user) && (
          <div className="mb-6 p-4 bg-[#c2edda]/50 border border-[#c2edda] rounded-lg space-y-2">
            <p className="text-black text-sm font-medium">
              ✓ Profile KYC is complete for this member.
            </p>
            {!isCscVerified(user) && (
              <p className="text-black text-sm">
                CSC verification is still required before you can apply for schemes.
                {getCscStatusMessage(user) ? ` ${getCscStatusMessage(user)}` : ""}
              </p>
            )}
            {isCscVerified(user) && (
              <p className="text-black text-sm">CSC verification is complete. You can apply for schemes.</p>
            )}
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-white/70 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-black font-medium">Saving profile & documents...</p>
            </div>
          </div>
        )}
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <Stepper
            onFinalStepCompleted={() => formRef.current?.requestSubmit()}
            nextButtonText="Next"
            backButtonText="Previous"
            completeButtonText={loading || isSubmitting ? "Saving..." : "Save Profile"}
            nextButtonProps={{ disabled: loading || isSubmitting }}
          >
            <Step>
              <h2 className="text-xl font-semibold text-black mb-6">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                defaultName="fullName"
                register={register}
                name="Full Name"
                required={false}
                pattern={null}
                errors={errors}
                placeholder="Enter your full name"
                setError={setError}
                clearError={clearErrors}
                autoComplete="name"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              <DatePicker
                defaultName="dob"
                register={register}
                name="Date of Birth"
                required={false}
                pattern={null}
                errors={errors}
                setError={setError}
                clearError={clearErrors}
                control={control}
                setValue={setValue}
                classes="rounded-md px-3 py-2 text-sm w-full"
                max={new Date().toISOString().split("T")[0]}
                defaultValue={(() => {
                  const d = user?.dob ?? user?.demographics?.dob;
                  const str = typeof d === "string" ? d : d?.date;
                  return str ? new Date(str).toISOString().split("T")[0] : "";
                })()}
              />

              <FormSelect
                label="Gender"
                labelClassName="text-sm font-medium text-black"
                {...register("gender")}
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </FormSelect>

              <Input
                defaultName="email"
                register={register}
                name="Email Address"
                required={false}
                pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                errors={errors}
                placeholder="Email address"
                setError={setError}
                clearError={clearErrors}
                autoComplete="email"
                type="email"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              <Input
                defaultName="aadhaarNumber"
                register={register}
                name="Aadhaar Number"
                required={false}
                pattern={/^[0-9]{12}$/}
                errors={errors}
                placeholder="Enter 12-digit Aadhaar number"
                setError={setError}
                clearError={clearErrors}
                autoComplete="off"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />
            </div>
            </Step>

            <Step>
              <h2 className="text-xl font-semibold text-black mb-6">Address</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                defaultName="careOf"
                register={register}
                name="Care Of (C/O)"
                required={false}
                pattern={null}
                errors={errors}
                placeholder="Care of"
                setError={setError}
                clearError={clearErrors}
                autoComplete="off"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              <Input
                defaultName="house"
                register={register}
                name="House/Flat No."
                required={false}
                pattern={null}
                errors={errors}
                placeholder="House/Flat number"
                setError={setError}
                clearError={clearErrors}
                autoComplete="address-line1"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              <Input
                defaultName="street"
                register={register}
                name="Street"
                required={false}
                pattern={null}
                errors={errors}
                placeholder="Street name"
                setError={setError}
                clearError={clearErrors}
                autoComplete="address-line2"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              <Input
                defaultName="locality"
                register={register}
                name="Locality"
                required={false}
                pattern={null}
                errors={errors}
                placeholder="Locality/Village"
                setError={setError}
                clearError={clearErrors}
                autoComplete="address-level2"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              {/* Country / State / District as dropdowns (consistent everywhere) */}
              <FormSelect
                label="Country"
                value={locationUi.country}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  setLocationUi((p) => ({ ...p, country: nextCountry, state: "", district: "" }));
                  setValue("country", nextCountry);
                  setValue("state", "");
                  setValue("district", "");
                }}
                invalid={!!errors.country}
              >
                {getCountries().map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="State"
                value={locationUi.state}
                onChange={(e) => {
                  const nextState = e.target.value;
                  setLocationUi((p) => ({ ...p, state: nextState, district: "" }));
                  setValue("state", nextState);
                  setValue("district", "");
                }}
                invalid={!!errors.state}
              >
                <option value="">Select State</option>
                {locationUi.state &&
                  !getStatesForCountry(locationUi.country).includes(locationUi.state) && (
                    <option value={locationUi.state}>{locationUi.state}</option>
                  )}
                {getStatesForCountry(locationUi.country).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="District"
                value={locationUi.district}
                onChange={(e) => {
                  const nextDistrict = e.target.value;
                  setLocationUi((p) => ({ ...p, district: nextDistrict }));
                  setValue("district", nextDistrict);
                }}
                disabled={!locationUi.state}
                invalid={!!errors.district}
              >
                <option value="">{locationUi.state ? "Select District" : "Select State first"}</option>
                {locationUi.district &&
                  !getDistrictsForState(locationUi.state).includes(locationUi.district) && (
                    <option value={locationUi.district}>{locationUi.district}</option>
                  )}
                {getDistrictsForState(locationUi.state).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </FormSelect>

              <Input
                defaultName="pincode"
                register={register}
                name="Pincode"
                required={false}
                pattern={/^[0-9]{6}$/}
                errors={errors}
                placeholder="6-digit pincode"
                setError={setError}
                clearError={clearErrors}
                autoComplete="postal-code"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              {/* Keep country as dropdown only (no free-text input) */}
              <input type="hidden" {...register("country")} value={locationUi.country} />
            </div>
            </Step>

            <Step>
              <h2 className="text-xl font-semibold text-black mb-6">Documents</h2>
              <p className="text-sm text-black mb-4">
              Select documents below. They will be saved when you press Submit at the bottom.
            </p>
            <div className="space-y-4">
              {profileDocTypes.length === 0 ? (
                <p className="text-sm text-gray-500">Loading document types…</p>
              ) : (
                profileDocTypes.map((dt) => (
                  <DocumentUpload
                    key={dt.key}
                    label={dt.label}
                    docType={dt.key}
                    file={documents[dt.key]}
                    existingDocument={user?.documents?.[dt.key]}
                    deleting={!!deletingDocs[dt.key]}
                    onFileChange={(file) => handleDocumentChange(dt.key, file)}
                    onDelete={() => deleteDocument(dt.key)}
                  />
                ))
              )}
            </div>
            </Step>
          </Stepper>
        </form>
      </main>

      <Footer />
    </div>
  );
}

// Infer if file path is PDF from extension
const isPdfPath = (path) => /\.pdf$/i.test(path || "");

// Document row: select file (saved on Submit); show existing doc with View/Delete; preview for selected file and for existing upload
function DocumentUpload({
  label,
  file,
  existingDocument,
  deleting,
  onFileChange,
  onDelete,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingPreviewError, setExistingPreviewError] = useState(false);

  const hasExistingDoc = existingDocument?.filePath != null && existingDocument?.filePath !== "";
  const existingDocUrl = hasExistingDoc ? displayMedia(existingDocument.filePath) : "";
  const existingIsPdf = hasExistingDoc && isPdfPath(existingDocument.filePath);
  const existingIsImage = hasExistingDoc && !existingIsPdf;

  useEffect(() => {
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  // Reset image error when existing document changes
  useEffect(() => {
    setExistingPreviewError(false);
  }, [existingDocument?.filePath]);

  const isImageFile = file?.type?.startsWith("image/");
  const isPdfFile = file?.type === "application/pdf";

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <label className="block text-sm font-medium text-black mb-2">
        {label}
      </label>

      {hasExistingDoc && !file && (
        <div className="mb-3 p-3 bg-[#c2edda]/50 border border-[#c2edda] rounded-md">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Preview: thumbnail for image, badge for PDF */}
            {existingIsImage && (
              <div className="h-20 w-20 flex-shrink-0 rounded border border-gray-300 overflow-hidden bg-gray-100">
                {existingPreviewError ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-xs text-black text-center px-1">Preview unavailable</span>
                  </div>
                ) : (
                  <img
                    src={existingDocUrl}
                    alt="Uploaded document"
                    className="h-full w-full object-cover"
                    onError={() => setExistingPreviewError(true)}
                  />
                )}
              </div>
            )}
            {existingIsPdf && (
              <div className="h-20 w-14 flex-shrink-0 rounded border border-red-200 bg-red-50 flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">PDF</span>
              </div>
            )}
            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
              <FiCheck className="text-black flex-shrink-0" />
              <span className="text-sm text-black">Document uploaded</span>
              <a
                href={existingDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#d85a30] hover:text-[#68d388] font-medium"
              >
                View
              </a>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
                title="Delete document"
              >
                {deleting ? <Spinner /> : <FiTrash2 />}
              </button>
            </div>
          </div>
          {existingPreviewError && (
            <p className="text-xs text-black mt-2">Image could not be loaded. Use View to open the file.</p>
          )}
        </div>
      )}

      {file && (
        <div className="mb-3 p-3 bg-[#68d388]/30 border border-[#d85a30]/50 rounded-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isImageFile && previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded border border-gray-300 flex-shrink-0"
                />
              )}
              {isPdfFile && (
                <div className="h-16 w-12 flex-shrink-0 rounded border border-red-200 bg-red-50 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">PDF</span>
                </div>
              )}
              <span className="text-sm text-slate-800 truncate" title={file.name}>
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="text-red-600 hover:text-red-800 flex-shrink-0 p-1"
              title="Remove file"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <label className="cursor-pointer block">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={(e) => onFileChange(e.target.files[0] || null)}
          className="hidden"
        />
        <div className="w-full border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-[#d85a30] transition-colors">
          <FiUpload className="mx-auto mb-2 text-gray-400" />
          <span className="text-sm text-black">
            {file ? "Change File" : "Choose File"}
          </span>
        </div>
      </label>

      <p className="mt-2 text-xs text-black">
        Supported: JPEG, PNG, WebP, PDF (Max 10MB). Saved when you press Submit.
      </p>
    </div>
  );
}
