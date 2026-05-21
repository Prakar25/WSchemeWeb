/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaTrophy,
} from "react-icons/fa";

import axios from "../../../api/axios";
import { APPLICATIONS_USER_URL } from "../../../api/api_routing_urls";
import { useActiveApplicantId } from "../../../hooks/useActiveApplicantId";
import { formatDateInDDMonYYYY, formatTSWTZDate } from "../../../utils/dateFunctions/formatdate";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";

import Footer from "../footer.component";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import PublicHeader from "../components/PublicHeader.component";

export default function PublicApplications() {
  const activeApplicantId = useActiveApplicantId();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        if (!activeApplicantId) {
          setApplications([]);
          return;
        }

        const userId = activeApplicantId;
        const response = await axios.get(`${APPLICATIONS_USER_URL}/${userId}`, {
          withCredentials: true,
        });

        if (response.status === 200 && response.data?.status === "success") {
          const apps = response.data.data || [];
          setApplications(apps);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [activeApplicantId]);

  const handleViewDetails = (app) => {
    setSelectedApplication(app);
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  const isPdfFile = (fileUrl) => /\.pdf(\?.*)?$/i.test(String(fileUrl || ""));

  const openDocument = (fileUrl) => {
    const fullUrl = displayMedia(fileUrl);
    if (fullUrl) window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? String(dateString) : formatTSWTZDate(dateString);
    } catch {
      return String(dateString);
    }
  };

  // Get status config
  const statusConfig = {
    Approved: {
      bg: "bg-[#c2edda]/30",
      text: "text-black",
      icon: <FaCheckCircle className="text-[#d85a30]" />,
    },
    "Under Review": {
      bg: "bg-[#68d388]/25",
      text: "text-black",
      icon: <FaTrophy className="text-[#68d388]" />,
    },
    Applied: {
      bg: "bg-[#c2edda]/30",
      text: "text-black",
      icon: <FaFileAlt className="text-[#d85a30]" />,
    },
    Rejected: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <FaClock className="text-red-600" />,
    },
    Pending: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      icon: <FaClock className="text-gray-600" />,
    },
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <PublicHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          <SplitText text="My Applications" splitType="chars" delay={35} className="inline-block" />
        </h1>

        {/* Application Status Tracker */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SCHEME
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      VERIFICATION STAGE
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      DATE APPLIED
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        Loading applications...
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app, index) => {
                    const status = statusConfig[app.status] || statusConfig.Applied;
                      const dateApplied = app.date_applied 
                        ? formatDateInDDMonYYYY(app.date_applied) 
                        : "N/A";
                      const verificationStage = app.verification_stage_display || app.verification_stage || "N/A";

                    return (
                        <tr
                          key={app._id || app.applicationId || index}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleViewDetails(app)}
                        >
                          <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                              {app.schemeName || app.scheme_name || "N/A"}
                            </div>
                            {app.applicationId && (
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {app.applicationId}
                          </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
                          >
                            {status.icon}
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {verificationStage}
                            {app.current_verifier && (
                              <div className="text-xs text-gray-500 mt-1">
                                Verifier: {app.current_verifier.name || app.current_verifier.role || "N/A"}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dateApplied}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(app)}
                            className="text-[#d85a30] hover:text-[#ffb766] font-semibold"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Application Detail Modal - uses list data (public user's own applications) */}
      {selectedApplication && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {selectedApplication && (
                <div className="space-y-6">
                  {/* Scheme name */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Scheme</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedApplication.schemeName || selectedApplication.scheme_name || "N/A"}
                    </p>
                  </div>

                  {/* Status & Verification Stage */}
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status: </span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        selectedApplication.status === "Approved" ? "bg-[#c2edda]/40 text-black" :
                        selectedApplication.status === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-[#68d388]/25 text-black"
                      }`}>
                        {selectedApplication.status || "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Stage: </span>
                      <span className="text-sm text-gray-900">
                        {selectedApplication.verification_stage_display || 
                         (selectedApplication.verification_stage || "N/A").replace(/_/g, " ")}
                      </span>
                    </div>
                    {selectedApplication.date_applied && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Applied: </span>
                        <span className="text-sm text-gray-900">{formatDate(selectedApplication.date_applied)}</span>
                      </div>
                    )}
                  </div>

                  {/* Form Data */}
                  {selectedApplication.form_data && Object.keys(selectedApplication.form_data).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Information You Submitted</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(selectedApplication.form_data).map(([key, value]) => (
                            <div key={key}>
                              <label className="text-sm font-medium text-gray-500 block">
                                {key.replace(/_/g, " ")}
                              </label>
                              <p className="text-gray-900 text-sm">
                                {value === null || value === undefined ? "—" :
                                 typeof value === "object"
                                   ? (Array.isArray(value) ? value.join(", ") : JSON.stringify(value))
                                   : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {(() => {
                    const docs = selectedApplication.documents || selectedApplication.documents_submitted || [];
                    if (!Array.isArray(docs) || docs.length === 0) return null;
                    return (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitted Documents</h3>
                        <div className="space-y-2">
                          {docs.map((doc, idx) => {
                            const docType = doc.document_type || doc.documentType;
                            const fileUrl = doc.file_url || doc.fileUrl;
                            const uploadedAt = doc.uploaded_at || doc.uploadedAt;
                            return (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                {docType && <p className="font-medium text-gray-900">{docType}</p>}
                                {uploadedAt && <p className="text-xs text-gray-500">Uploaded: {formatDate(uploadedAt)}</p>}
                                {fileUrl && (
                                  isPdfFile(fileUrl) ? (
                                    <button
                                      type="button"
                                      onClick={() => openDocument(fileUrl)}
                                      className="text-[#d85a30] hover:text-[#ffb766] text-sm mt-1"
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

                  {/* Verification Progress */}
                  {selectedApplication.verification_history && selectedApplication.verification_history.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Progress</h3>
                      <div className="space-y-3">
                        {selectedApplication.verification_history.map((h, idx) => (
                          <div key={idx} className="border-l-4 border-[#d85a30] pl-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-medium text-gray-900">{h.verified_by_name || "—"}</span>
                                <span className="text-xs text-gray-500 ml-1">
                                  ({h.verified_by_role || "—"} {h.verified_by_role_level ? `• Level ${h.verified_by_role_level}` : ""})
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    h.action === "Verified" || h.action === "Forwarded" ? "bg-[#c2edda]/30" :
                                    h.action === "Rejected" ? "bg-red-100 text-red-800" : "bg-gray-100"
                                  }`}>
                                    {h.action}
                                  </span>
                                  {h.stage && <span className="text-xs text-gray-500">{h.stage.replace(/_/g, " ")}</span>}
                                </div>
                                {h.remarks && <p className="text-sm text-gray-600 mt-1 italic">"{h.remarks}"</p>}
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(h.verified_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current verifier */}
                  {selectedApplication.current_verifier && (
                    <div className="pt-2 border-t">
                      <span className="text-sm font-medium text-gray-500">Currently with: </span>
                      <span className="text-sm text-gray-900">
                        {selectedApplication.current_verifier.name || selectedApplication.current_verifier.role || "—"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

