/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "../../api/axios";
import { BULK_UPLOAD_PREVIEW_URL, BULK_UPLOAD_CONFIRM_URL } from "../../api/api_routing_urls";
import Spinner from "../spinner/spinner.component";
import showToast from "../../utils/notification/NotificationModal";

const BulkUploadModal = ({ isOpen, onClose, schemeId, schemeName, adminDepartment, adminDepartmentName }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("upload"); // 'upload', 'preview', 'success'
  const [previewData, setPreviewData] = useState(null);
  const [saveResults, setSaveResults] = useState(null);
  const [error, setError] = useState(null);

  // Get admin credentials
  const getAdminCredentials = () => {
    const username = sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username");
    const password = sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password");
    return { username, password };
  };

  // File selection handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validExtensions = [".xls", ".xlsx", ".csv"];
      const fileExt = "." + file.name.split(".").pop().toLowerCase();

      if (!validExtensions.includes(fileExt)) {
        setError("Invalid file type. Please select Excel (.xls, .xlsx) or CSV (.csv) file.");
        setSelectedFile(null);
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  // Phase 1: Upload and Preview
  const handleUpload = async () => {
    if (!selectedFile || !schemeId) {
      setError("Please select a file and ensure scheme is selected.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("scheme_id", schemeId);
      if (adminDepartment) {
        formData.append("department", adminDepartment);
      }

      const credentials = getAdminCredentials();

      // Add credentials as query parameters to avoid CORS issues
      const url = `${BULK_UPLOAD_PREVIEW_URL}?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        console.log("Bulk Upload Preview Response:", response.data);
        console.log("Preview Data:", response.data.preview_data);
        console.log("Valid Rows:", response.data.valid_rows);
        console.log("Total Rows:", response.data.total_rows);
        setPreviewData(response.data);
        setPhase("preview");
        showToast("File uploaded successfully. Please review the preview.", "success");
      } else {
        setError(response.data.message || "Upload failed");
        showToast(response.data.message || "Upload failed", "error");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Upload failed";
      setError(errorMessage);
      showToast(errorMessage, "error");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Confirm and Save
  const handleConfirm = async () => {
    if (!previewData) {
      setError("Preview data not found. Please upload again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credentials = getAdminCredentials();

      // Add credentials as query parameters to avoid CORS issues
      const url = `${BULK_UPLOAD_CONFIRM_URL}?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

      const response = await axios.post(
        url,
        {
          file_path: previewData.file_path,
          scheme_id: schemeId,
          department: adminDepartment,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        setSaveResults(response.data.results);
        setPhase("success");
        showToast("Bulk upload completed successfully!", "success");
      } else {
        setError(response.data.message || "Save failed");
        showToast(response.data.message || "Save failed", "error");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Save failed";
      setError(errorMessage);
      showToast(errorMessage, "error");
      console.error("Confirm error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset modal
  const handleReset = () => {
    setSelectedFile(null);
    setPhase("upload");
    setPreviewData(null);
    setSaveResults(null);
    setError(null);
    setLoading(false);
  };

  // Close handler
  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Mask Aadhaar number
  const maskAadhaar = (aadhaar) => {
    if (!aadhaar || aadhaar.length !== 12) return aadhaar || "N/A";
    return `XXXX-XXXX-${aadhaar.slice(8)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10002]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Bulk Upload Beneficiaries</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Phase 1: Upload */}
          {phase === "upload" && (
            <div className="space-y-6">
              {/* Scheme Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheme
                </label>
                <input
                  type="text"
                  value={schemeName || schemeId || "N/A"}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
              </div>

              {/* Department Display */}
              {(adminDepartment || adminDepartmentName) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={adminDepartmentName || adminDepartment || "N/A"}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel/CSV File *
                </label>
                <input
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#f43a09] focus:border-[#f43a09]"
                  disabled={loading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Supported formats: .xls, .xlsx, .csv (Max size: 10MB)
                </p>
                {selectedFile && (
                  <p className="mt-1 text-sm text-[#f43a09] font-medium">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={loading || !selectedFile || !schemeId}
                className="w-full bg-[#f43a09] text-white py-3 px-6 rounded-md hover:bg-[#ffb766] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Uploading...
                  </span>
                ) : (
                  "Upload & Preview"
                )}
              </button>
            </div>
          )}

          {/* Phase 2: Preview */}
          {phase === "preview" && previewData && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-[#c2edda]/20 p-4 rounded-lg border border-[#f43a09]/30">
                  <div className="text-2xl font-bold text-[#f43a09]">
                    {previewData.total_rows || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="bg-[#c2edda]/20 p-4 rounded-lg border border-[#c2edda]/50">
                  <div className="text-2xl font-bold text-[#f43a09]">
                    {previewData.valid_rows || 0}
                  </div>
                  <div className="text-sm text-gray-600">Valid Rows</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {previewData.error_rows || 0}
                  </div>
                  <div className="text-sm text-gray-600">Error Rows</div>
                </div>
                <div className="bg-[#68d388]/20 p-4 rounded-lg border border-[#68d388]/40">
                  <div className="text-2xl font-bold text-[#68d388]">
                    {previewData.redundancy_rows || previewData.redundancies?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Redundancy Rows</div>
                </div>
                <div className="bg-[#68d388]/20 p-4 rounded-lg border border-[#68d388]/40">
                  <div className="text-2xl font-bold text-black">
                    {previewData.total_rows > 0
                      ? ((previewData.valid_rows / previewData.total_rows) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Preview Table */}
              {(() => {
                // Try different possible field names for preview data
                const previewDataArray = 
                  previewData.preview_data || 
                  previewData.previewData || 
                  previewData.data || 
                  previewData.valid_data ||
                  [];
                
                console.log("Preview Data Array:", previewDataArray);
                console.log("Preview Data Length:", previewDataArray.length);
                console.log("Full Preview Data Object:", JSON.stringify(previewData, null, 2));
                
                if (previewDataArray.length > 0) {
                  return (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Preview Data (First 10 rows)
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Row
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Full Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aadhaar
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                DOB
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Gender
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Address
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewDataArray.slice(0, 10).map((item, index) => {
                              // Handle different data structures
                              const userData = item.userData || item.user_data || item;
                              const demographics = userData.demographics || userData.demographic || {};
                              const address = userData.address || {};
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.row || index + 1}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                    {demographics.fullName || demographics.full_name || userData.fullName || userData.full_name || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                    {maskAadhaar(userData.aadhaarNumber || userData.aadhaar_number || userData.aadhaar)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatDate(demographics.dob?.date || demographics.dob || userData.dob || userData.dateOfBirth)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {demographics.gender || userData.gender || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {address.locality || ""}
                                    {address.locality && address.district ? ", " : ""}
                                    {address.district || ""}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {item.hasExistingApplication ? (
                                      <span className="px-2 py-1 bg-[#68d388]/25 text-black rounded-full text-xs font-medium">
                                        Existing Application
                                      </span>
                                    ) : item.hasExistingUser ? (
                                      <span className="px-2 py-1 bg-[#c2edda]/30 text-black rounded-full text-xs font-medium">
                                        Existing User
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-[#c2edda]/30 text-black rounded-full text-xs font-medium">
                                        New User
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-[#68d388]/20 border border-[#68d388]/40 rounded-lg p-4">
                      <p className="text-black text-sm">
                        No preview data available. Valid rows: {previewData.valid_rows || 0}
                      </p>
                      <p className="text-black text-xs mt-2">
                        Debug: preview_data = {JSON.stringify(previewData.preview_data)}, 
                        previewData = {JSON.stringify(previewData.previewData)}, 
                        data = {JSON.stringify(previewData.data)}
                      </p>
                      <details className="mt-2">
                        <summary className="text-black cursor-pointer text-xs font-medium">
                          Click to see full API response structure
                        </summary>
                        <pre className="mt-2 text-xs bg-[#68d388]/25 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(previewData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                }
              })()}

              {/* Redundancies */}
              {(() => {
                const redundancies = previewData.redundancies || [];
                const redundancyCount = previewData.redundancy_rows || redundancies.length;
                console.log("Redundancies check:", {
                  exists: !!previewData.redundancies,
                  arrayLength: redundancies.length,
                  countFromAPI: redundancyCount,
                  data: redundancies
                });
                
                if (redundancies.length > 0) {
                  return (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-[#68d388] flex items-center gap-2">
                        <svg
                          className="h-5 w-5 text-[#68d388]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Redundancies ({redundancyCount} total, showing {redundancies.length})
                      </h3>
                  <div className="overflow-x-auto border border-[#68d388]/40 rounded-lg bg-[#68d388]/20">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[#68d388]/25">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Aadhaar
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Full Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {redundancies.map((redundancy, index) => (
                          <tr key={index} className="hover:bg-[#68d388]/20">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {redundancy.row}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                              {maskAadhaar(redundancy.aadhaarNumber || redundancy.aadhaar)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {redundancy.fullName || redundancy.name || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  redundancy.type === "duplicate_in_file"
                                    ? "bg-[#68d388]/25 text-black"
                                    : redundancy.type === "excluded_scheme_conflict"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-[#68d388]/25 text-black"
                                }`}>
                                  {redundancy.type === "duplicate_in_file"
                                    ? "Duplicate in File"
                                    : redundancy.type === "excluded_scheme_conflict"
                                    ? "Scheme Conflict"
                                    : redundancy.type === "existing_application"
                                    ? "Existing Application"
                                    : redundancy.type || "Redundant"}
                                </span>
                                {redundancy.type === "excluded_scheme_conflict" && redundancy.conflictingSchemes && redundancy.conflictingSchemes.length > 0 && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Conflicts: {redundancy.conflictingSchemes.map(s => s.scheme_name || s.name).join(", ")}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-black">
                              {redundancy.error || redundancy.message || "Duplicate entry"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.redundancy_rows && previewData.redundancy_rows > redundancies.length && (
                    <p className="mt-2 text-sm text-[#68d388] italic">
                      Note: Showing {redundancies.length} of {previewData.redundancy_rows} redundancies. Some may be duplicates within the file.
                    </p>
                  )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Errors */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-600">
                    Errors ({previewData.errors.length} rows)
                  </h3>
                  <div className="overflow-x-auto border border-red-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Full Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Aadhaar
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            DOB
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Error Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.errors.map((error, index) => {
                          const errorData = error.data || {};
                          return (
                            <tr key={index} className="hover:bg-red-50">
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {error.row}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {errorData["Full Name"] || errorData.fullName || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                {maskAadhaar(errorData["Aadhaar Number"] || errorData.aadhaarNumber || errorData.aadhaar)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {errorData["Date of Birth"] || errorData.dateOfBirth || errorData.dob || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-red-600 font-medium">
                                {error.error}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setPhase("upload")}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || (previewData.valid_rows || 0) === 0}
                  className="flex-1 bg-[#f43a09] text-white py-3 px-6 rounded-md hover:bg-[#ffb766] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> Processing...
                    </span>
                  ) : (
                    "Confirm & Save"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase 3: Success */}
          {phase === "success" && saveResults && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl text-[#f43a09] mb-4">✓</div>
                <h3 className="text-2xl font-bold text-[#f43a09] mb-2">
                  Upload Completed Successfully!
                </h3>
                <p className="text-gray-600">
                  Your bulk upload has been processed and saved to the database.
                </p>
              </div>

              {/* Results Statistics */}
              <div className="grid grid-cols-6 gap-4">
                <div className="bg-[#c2edda]/20 p-4 rounded-lg border border-[#f43a09]/30">
                  <div className="text-2xl font-bold text-[#f43a09]">{saveResults.total || 0}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-[#c2edda]/20 p-4 rounded-lg border border-[#c2edda]/50">
                  <div className="text-2xl font-bold text-[#f43a09]">
                    {saveResults.success || 0}
                  </div>
                  <div className="text-sm text-gray-600">Success</div>
                </div>
                <div className="bg-[#68d388]/20 p-4 rounded-lg border border-[#68d388]/40">
                  <div className="text-2xl font-bold text-black">
                    {saveResults.skipped || 0}
                  </div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
                <div className="bg-[#68d388]/20 p-4 rounded-lg border border-[#68d388]/40">
                  <div className="text-2xl font-bold text-[#68d388]">
                    {saveResults.redundancies?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Redundancies</div>
                </div>
                <div className="bg-[#c2edda]/20 p-4 rounded-lg border border-[#c2edda]/50">
                  <div className="text-2xl font-bold text-[#f43a09]">
                    {saveResults.created_users || 0}
                  </div>
                  <div className="text-sm text-gray-600">New Users</div>
                </div>
                <div className="bg-[#c2edda]/20 p-4 rounded-lg border border-[#f43a09]/30">
                  <div className="text-2xl font-bold text-[#f43a09]">
                    {saveResults.created_applications || 0}
                  </div>
                  <div className="text-sm text-gray-600">Applications</div>
                </div>
              </div>

              {/* Redundancy Warnings */}
              {saveResults.redundancies && saveResults.redundancies.length > 0 && (
                <div className="bg-[#68d388]/25 border-l-4 border-[#68d388] p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-[#68d388]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-black">
                        Redundancy Warning
                      </h3>
                      <div className="mt-2 text-sm text-black">
                        <p className="mb-2">
                          {saveResults.redundancies.length} row(s) were skipped due to redundancies:
                        </p>
                        <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                          {saveResults.redundancies.slice(0, 10).map((redundancy, index) => (
                            <li key={index}>
                              Row {redundancy.row}: {redundancy.error || redundancy.message || "Duplicate entry"} (
                              {redundancy.type === "duplicate_in_file"
                                ? "Duplicate in File"
                                : redundancy.type === "excluded_scheme_conflict"
                                ? "Scheme Conflict"
                                : redundancy.type === "existing_application"
                                ? "Existing Application"
                                : redundancy.type || "Redundant"}
                              {redundancy.type === "excluded_scheme_conflict" && redundancy.conflictingSchemes && redundancy.conflictingSchemes.length > 0 && (
                                <> - Conflicts: {redundancy.conflictingSchemes.map(s => s.scheme_name || s.name).join(", ")}</>
                              )}
                              )
                            </li>
                          ))}
                          {saveResults.redundancies.length > 10 && (
                            <li className="text-[#68d388] italic">
                              ... and {saveResults.redundancies.length - 10} more redundancies
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Redundancy Warnings */}
              {saveResults.redundancies && saveResults.redundancies.length > 0 && (
                <div className="bg-[#68d388]/25 border-l-4 border-[#68d388] p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-[#68d388]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-black">
                        Redundancy Warning
                      </h3>
                      <div className="mt-2 text-sm text-black">
                        <p className="mb-2">
                          {saveResults.redundancies.length} row(s) were skipped due to redundancies:
                        </p>
                        <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                          {saveResults.redundancies.slice(0, 10).map((redundancy, index) => (
                            <li key={index}>
                              Row {redundancy.row}: {redundancy.error || redundancy.message || "Duplicate entry"} (
                              {redundancy.type === "duplicate_in_file"
                                ? "Duplicate in File"
                                : redundancy.type === "excluded_scheme_conflict"
                                ? "Scheme Conflict"
                                : redundancy.type === "existing_application"
                                ? "Existing Application"
                                : redundancy.type || "Redundant"}
                              {redundancy.type === "excluded_scheme_conflict" && redundancy.conflictingSchemes && redundancy.conflictingSchemes.length > 0 && (
                                <> - Conflicts: {redundancy.conflictingSchemes.map(s => s.scheme_name || s.name).join(", ")}</>
                              )}
                              )
                            </li>
                          ))}
                          {saveResults.redundancies.length > 10 && (
                            <li className="text-[#68d388] italic">
                              ... and {saveResults.redundancies.length - 10} more redundancies
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors Summary */}
              {saveResults.errors && saveResults.errors.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-red-600">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto border border-red-200 rounded-lg p-4 bg-red-50">
                    <ul className="list-disc list-inside space-y-1">
                      {saveResults.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="text-sm text-red-600">
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                      {saveResults.errors.length > 10 && (
                        <li className="text-sm text-gray-500 italic">
                          ... and {saveResults.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full bg-[#f43a09] text-white py-3 px-6 rounded-md hover:bg-[#ffb766] font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
