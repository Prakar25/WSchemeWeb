/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSearch } from "react-icons/fa";

import axios from "../../../../api/axios";
import { APPLICATIONS_SCHEME_URL } from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import { formatDateInDDMonYYYY } from "../../../../utils/dateFunctions/formatdate";

export default function SchemeBeneficiaries() {
  const navigate = useNavigate();
  const { scheme_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheme, setScheme] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [countByStatus, setCountByStatus] = useState({});
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch scheme beneficiaries
  useEffect(() => {
    const fetchSchemeBeneficiaries = async () => {
      if (!scheme_id) {
        setError("Scheme ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${APPLICATIONS_SCHEME_URL}/${scheme_id}`);

        console.log("Scheme Beneficiaries API Response:", response.data);
        console.log("Full Response:", JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data) {
          const data = response.data;
          
          // Log the structure to understand what we're getting
          console.log("Scheme data:", data.scheme);
          console.log("Applicants data:", data.applicants);
          console.log("Count by status:", data.count_by_status);
          console.log("Total applicants:", data.total_applicants);
          
          setScheme(data.scheme || null);
          setApplicants(data.applicants || []);
          setCountByStatus(data.count_by_status || {});
          setTotalApplicants(data.total_applicants || 0);
          
          // Log first applicant to see structure
          if (data.applicants && data.applicants.length > 0) {
            console.log("First applicant structure:", JSON.stringify(data.applicants[0], null, 2));
          }
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
    };

    fetchSchemeBeneficiaries();
  }, [scheme_id]);

  // Filter applicants based on search query
  const filteredApplicants = applicants.filter((application) => {
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

  const getStatusBadgeColor = (status) => {
    const colors = {
      "Applied": "bg-yellow-100 text-yellow-800",
      "Under Review": "bg-purple-100 text-purple-800",
      "Approved": "bg-green-100 text-green-800",
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
          <button
            onClick={() => navigate("/system-admin/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
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
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">{totalApplicants}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-600 font-medium">Applied</p>
                <p className="text-2xl font-bold text-yellow-900">{countByStatus.Applied || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Under Review</p>
                <p className="text-2xl font-bold text-purple-900">{countByStatus["Under Review"] || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-900">{countByStatus.Approved || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{countByStatus.Rejected || 0}</p>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name, Aadhaar, application ID, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {searchQuery && (
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-left text-slate-600 border-b border-gray-200">
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
                        
                        // Status can be at top level or nested
                        const status = application.application_status || 
                                      application.status || 
                                      application.verification_status ||
                                      "Unknown";
                        
                        // Full name can be at top level (flattened) or nested
                        const fullName = application.full_name || 
                                        applicant.full_name || 
                                        applicant.fullName || 
                                        applicant.name || 
                                        "N/A";
                        
                        const applicationId = application.application_id || application._id || application.id || "N/A";
                        const verificationStage = (application.verification_stage || application.verificationStage)?.replace(/_/g, " ") || 
                                                  `Level ${application.verification_level || application.verificationLevel || "N/A"}`;
                        const dateApplied = (application.date_applied || application.dateApplied || application.createdAt) 
                                          ? formatDateInDDMonYYYY(application.date_applied || application.dateApplied || application.createdAt) 
                                          : "N/A";
                        
                        return (
                          <motion.tr
                            key={applicationId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-blue-50 transition-colors"
                          >
                            <td className="py-4 px-4 text-gray-900 font-medium">{fullName}</td>
                            <td className="py-4 px-4 text-gray-700 font-mono text-xs">{applicationId}</td>
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
      </div>
    </Dashboard>
  );
}
