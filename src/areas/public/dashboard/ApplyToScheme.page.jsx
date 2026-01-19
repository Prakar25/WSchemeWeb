import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaUpload, FaCheckCircle, FaTimes } from "react-icons/fa";

import axios from "../../../api/axios";
import { APPLICATIONS_APPLY_URL, DEPARTMENTS_URL, CATEGORIES_URL } from "../../../api/api_routing_urls";
import { uploadFileToServer } from "../../../utils/uploadFiles/uploadFileToServerController";
import { getStoredUser } from "../../../utils/user.utils";
import showToast from "../../../utils/notification/NotificationModal";
import PublicHeader from "../components/PublicHeader.component";
import Footer from "../footer.component";
import DocDropzone from "../../../reusable-components/FileUploader/PDFImageDropZoneUploader/PDFImageDropZoneUploader.component";
import Spinner from "../../../reusable-components/spinner/spinner.component";

export default function ApplyToScheme() {
  const navigate = useNavigate();
  const location = useLocation();
  const scheme = location.state?.scheme;

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
    setUser(storedUser);

    // Initialize document state for each required document
    const initialDocs = {};
    requiredDocuments.forEach((docType) => {
      initialDocs[docType] = [];
      setShowDocUploader((prev) => ({ ...prev, [docType]: false }));
    });
    setDocuments(initialDocs);
  }, [scheme, navigate, requiredDocuments]);

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

      // Prepare request payload
      // Ensure form_data is not empty object if no data provided
      const payload = {
        user_id: user._id || user.userId,
        scheme_id: scheme._id || scheme.scheme_id,
        form_data: Object.keys(formData).length > 0 ? formData : {},
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
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Log the full error details for debugging
      if (error.response?.data) {
        console.error("API Error Details:", JSON.stringify(error.response.data, null, 2));
      }
      
      // Build a detailed error message from API response
      let errorMessage = "Failed to submit application. Please try again.";
      
      if (error.response?.data) {
        const apiError = error.response.data;
        
        // If there's a specific message and reason, combine them
        if (apiError.message && apiError.reason) {
          errorMessage = `${apiError.message}: ${apiError.reason}`;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.response?.status === 400) {
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
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
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

            {/* Dynamic Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Income
                </label>
                <input
                  type="number"
                  value={formData.income || ""}
                  onChange={(e) => handleFieldChange("income", e.target.value)}
                  placeholder="Enter annual income"
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Family Members
                </label>
                <input
                  type="number"
                  value={formData.family_members || ""}
                  onChange={(e) => handleFieldChange("family_members", e.target.value)}
                  placeholder="Enter number of family members"
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Household Type
                </label>
                <select
                  value={formData.household_type || ""}
                  onChange={(e) => handleFieldChange("household_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select household type</option>
                  <option value="Nuclear">Nuclear</option>
                  <option value="Joint">Joint</option>
                  <option value="Extended">Extended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level
                </label>
                <select
                  value={formData.education_level || ""}
                  onChange={(e) => handleFieldChange("education_level", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select education level</option>
                  <option value="Illiterate">Illiterate</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Higher Secondary">Higher Secondary</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Status
                </label>
                <select
                  value={formData.employment_status || ""}
                  onChange={(e) => handleFieldChange("employment_status", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select employment status</option>
                  <option value="Employed">Employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Self Employed">Self Employed</option>
                  <option value="Student">Student</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
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
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
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
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
                                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm"
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
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

