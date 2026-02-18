/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import {
  PUBLIC_PROFILE_GET_URL,
  PUBLIC_PROFILE_SUBMIT_COMPLETE_URL,
  PUBLIC_PROFILE_DELETE_DOCUMENT_URL,
} from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import { getStoredUser } from "../../../utils/user.utils";
import showToast from "../../../utils/notification/NotificationModal";
import Input from "../../../reusable-components/inputs/InputTextBox/Input";
import DatePicker from "../../../reusable-components/inputs/DatePicker/DatePicker";
import Spinner from "../../../reusable-components/spinner/spinner.component";
import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";
import { FiUpload, FiX, FiCheck, FiTrash2 } from "react-icons/fi";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [deletingDocs, setDeletingDocs] = useState({
    aadhaarCard: false,
    birthCertificate: false,
    certificateOfIdentification: false,
  });

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

  const [documents, setDocuments] = useState({
    aadhaarCard: null,
    birthCertificate: null,
    certificateOfIdentification: null,
  });

  // Load user profile on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const storedUserId = storedUser._id || storedUser.userId;
    if (!storedUserId) {
      showToast("User ID not found. Please login again.", "error");
      navigate("/login");
      return;
    }

    setUserId(storedUserId);
    loadProfile(storedUserId);
  }, [navigate]);

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

        // Pre-fill form with existing user data
        setValue("fullName", userData.fullName || "");
        setValue("dob", userData.dob ? new Date(userData.dob).toISOString().split("T")[0] : "");
        setValue("gender", userData.gender || "");
        setValue("email", userData.contactEmail || "");
        setValue("aadhaarNumber", userData.aadhaarNumber || "");
        
        // Address fields
        setValue("careOf", userData.address?.careOf || "");
        setValue("house", userData.address?.house || "");
        setValue("street", userData.address?.street || "");
        setValue("locality", userData.address?.locality || "");
        setValue("district", userData.address?.district || "");
        setValue("state", userData.address?.state || "");
        setValue("pincode", userData.address?.pincode || "");
        setValue("country", userData.address?.country || "India");
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

    if (!window.confirm(`Are you sure you want to delete the ${docType === "aadhaarCard" ? "Aadhaar Card" : docType === "birthCertificate" ? "Birth Certificate" : "Certificate of Identification"}?`)) {
      return;
    }

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

      // Document files (only append if user selected a file)
      if (documents.aadhaarCard) formData.append("aadhaarCard", documents.aadhaarCard);
      if (documents.birthCertificate) formData.append("birthCertificate", documents.birthCertificate);
      if (documents.certificateOfIdentification) formData.append("certificateOfIdentification", documents.certificateOfIdentification);

      const response = await axios.post(PUBLIC_PROFILE_SUBMIT_COMPLETE_URL, formData, {
        params: { userId },
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.data.status === "success") {
        const updatedUser = response.data.user;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setDocuments({ aadhaarCard: null, birthCertificate: null, certificateOfIdentification: null });
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
        return "bg-green-100 text-green-700";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-700";
      case "BASIC":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          {user?.kycLevel && (
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getKycLevelColor(user.kycLevel)}`}>
              KYC Level: {user.kycLevel}
            </span>
          )}
        </div>

        {user?.kycLevel === "FULL" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✓ Your profile is complete! You can now apply for schemes.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Demographics Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
            
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
                defaultValue={user?.dob ? new Date(user.dob).toISOString().split("T")[0] : ""}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  {...register("gender")}
                  className="w-full rounded-md px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

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
          </div>

          {/* Address Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Address</h2>
            
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

              <Input
                defaultName="district"
                register={register}
                name="District"
                required={false}
                pattern={null}
                errors={errors}
                placeholder="District"
                setError={setError}
                clearError={clearErrors}
                autoComplete="address-level1"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

              <Input
                defaultName="state"
                register={register}
                name="State"
                required={false}
                pattern={null}
                errors={errors}
                placeholder="State"
                setError={setError}
                clearError={clearErrors}
                autoComplete="address-level1"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />

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

              <Input
                defaultName="country"
                register={register}
                name="Country"
                required={false}
                pattern={null}
                errors={errors}
                placeholder="Country"
                setError={setError}
                clearError={clearErrors}
                autoComplete="country"
                type="text"
                classes="rounded-md px-3 py-2 text-sm w-full"
                onChangeInput={null}
                setValue={setValue}
              />
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Documents</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Select documents below. They will be saved when you press Submit at the bottom.
            </p>
            <div className="space-y-4">
              <DocumentUpload
                label="Aadhaar Card"
                docType="aadhaarCard"
                file={documents.aadhaarCard}
                existingDocument={user?.documents?.aadhaarCard}
                deleting={deletingDocs.aadhaarCard}
                onFileChange={(file) => handleDocumentChange("aadhaarCard", file)}
                onDelete={() => deleteDocument("aadhaarCard")}
              />
              <DocumentUpload
                label="Birth Certificate"
                docType="birthCertificate"
                file={documents.birthCertificate}
                existingDocument={user?.documents?.birthCertificate}
                deleting={deletingDocs.birthCertificate}
                onFileChange={(file) => handleDocumentChange("birthCertificate", file)}
                onDelete={() => deleteDocument("birthCertificate")}
              />
              <DocumentUpload
                label="Certificate of Identification"
                docType="certificateOfIdentification"
                file={documents.certificateOfIdentification}
                existingDocument={user?.documents?.certificateOfIdentification}
                deleting={deletingDocs.certificateOfIdentification}
                onFileChange={(file) => handleDocumentChange("certificateOfIdentification", file)}
                onDelete={() => deleteDocument("certificateOfIdentification")}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/user/profile")}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner /> Saving profile & documents...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {hasExistingDoc && !file && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Preview: thumbnail for image, badge for PDF */}
            {existingIsImage && (
              <div className="h-20 w-20 flex-shrink-0 rounded border border-gray-300 overflow-hidden bg-gray-100">
                {existingPreviewError ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-xs text-gray-500 text-center px-1">Preview unavailable</span>
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
              <FiCheck className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">Document uploaded</span>
              <a
                href={existingDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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
            <p className="text-xs text-gray-500 mt-2">Image could not be loaded. Use View to open the file.</p>
          )}
        </div>
      )}

      {file && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
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
              <span className="text-sm text-blue-800 truncate" title={file.name}>
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
        <div className="w-full border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition-colors">
          <FiUpload className="mx-auto mb-2 text-gray-400" />
          <span className="text-sm text-gray-600">
            {file ? "Change File" : "Choose File"}
          </span>
        </div>
      </label>

      <p className="mt-2 text-xs text-gray-500">
        Supported: JPEG, PNG, WebP, PDF (Max 10MB). Saved when you press Submit.
      </p>
    </div>
  );
}
