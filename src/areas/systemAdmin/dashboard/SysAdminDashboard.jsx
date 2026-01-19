/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaDownload, FaTimes } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import axios from "../../../api/axios";
import {
  DASHBOARD_STATISTICS_URL,
  DASHBOARD_SCHEME_BENEFICIARIES_URL,
  DASHBOARD_FRAUD_ALERTS_URL,
} from "../../../api/api_routing_urls";

import Dashboard from "../../dashboard-components/dashboard.component";

export default function SysAdminDashboard() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalApplicants: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // Schemes state
  const [schemes, setSchemes] = useState([]);
  const [schemesLoading, setSchemesLoading] = useState(true);

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Get admin credentials from sessionStorage
  const getAdminCredentials = () => {
    const username = sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username");
    const password = sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password");
    
    // Debug: Check if credentials exist
    if (!username || !password) {
      console.warn("Missing credentials:", { username: !!username, password: !!password });
    }
    
    return {
      username,
      password,
    };
  };

  // Fetch dashboard statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const credentials = getAdminCredentials();
      const params = new URLSearchParams();
      if (credentials.username) params.append("username", credentials.username);
      if (credentials.password) params.append("password", credentials.password);

      const response = await axios.get(
        `${DASHBOARD_STATISTICS_URL}?${params.toString()}`
      );

      if (response.data.status === "success" && response.data.data) {
        setStatistics({
          totalApplicants: response.data.data.totalApplicants || 0,
          approved: response.data.data.approved || 0,
          pending: response.data.data.pending || 0,
          rejected: response.data.data.rejected || 0,
        });
      }
        } catch (err) {
          console.error("Error fetching statistics:", err);
          if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
            setError("Unable to connect to server. Please ensure the backend is running.");
          } else {
            setError("Failed to load dashboard statistics");
          }
        } finally {
          setLoading(false);
        }
  };

  // Fetch scheme beneficiaries
  const fetchSchemeBeneficiaries = async (searchQuery = "") => {
    try {
      setSchemesLoading(true);
      const credentials = getAdminCredentials();
      const params = new URLSearchParams();
      if (credentials.username) params.append("username", credentials.username);
      if (credentials.password) params.append("password", credentials.password);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");
      params.append("skip", "0");

      const response = await axios.get(
        `${DASHBOARD_SCHEME_BENEFICIARIES_URL}?${params.toString()}`
      );

      if (response.data.status === "success" && response.data.data) {
        const schemesData = response.data.data.schemes || [];
        setSchemes(
          schemesData.map((scheme) => ({
            scheme: scheme.schemeName || scheme.scheme_name || "",
            schemeId: scheme.schemeId || scheme.scheme_id || scheme._id || "",
            total: (scheme.totalBeneficiaries || scheme.total_beneficiaries || 0).toLocaleString(),
            approved: (scheme.approved || 0).toLocaleString(),
            pending: (scheme.pending || 0).toLocaleString(),
            rejected: (scheme.rejected || 0).toLocaleString(),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching scheme beneficiaries:", err);
      if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
        setError("Unable to connect to server. Please ensure the backend is running.");
      } else {
        setError("Failed to load scheme beneficiaries");
      }
    } finally {
      setSchemesLoading(false);
    }
  };

  // Fetch fraud alerts
  const fetchFraudAlerts = async () => {
    try {
      setAlertsLoading(true);
      const credentials = getAdminCredentials();
      const params = new URLSearchParams();
      if (credentials.username) params.append("username", credentials.username);
      if (credentials.password) params.append("password", credentials.password);
      params.append("limit", "10");
      params.append("type", "all");
      params.append("status", "active");

      const response = await axios.get(
        `${DASHBOARD_FRAUD_ALERTS_URL}?${params.toString()}`
      );

      if (response.data.status === "success" && response.data.data) {
        setAlerts(response.data.data.alerts || []);
      }
    } catch (err) {
      console.error("Error fetching fraud alerts:", err);
      if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
        setError("Unable to connect to server. Please ensure the backend is running.");
      } else {
        setError("Failed to load fraud alerts");
      }
    } finally {
      setAlertsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchStatistics();
    fetchSchemeBeneficiaries();
    fetchFraudAlerts();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchemeBeneficiaries(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log("Export as Excel");
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Export as PDF");
  };

  const formatNumber = (num) => {
    if (typeof num === "number") {
      return num.toLocaleString();
    }
    return num;
  };

  return (
    <>
      <section className="hidden lg:block bg-gray-100">
        <Dashboard sidebarType="System Admin">
          <div className="p-6 bg-slate-50 min-h-screen">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
              <div className="flex gap-3">
                <motion.button
                  onClick={handleExportExcel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                >
                  <FaDownload size={16} />
                  Export as Excel
                </motion.button>
                <motion.button
                  onClick={handleExportPDF}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700 hover:shadow-md transition-all duration-200"
                >
                  <FaDownload size={16} />
                  Export as PDF
                </motion.button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Top Summary Cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-lg shadow-md bg-white animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard
                  title="Total Applicants"
                  value={formatNumber(statistics.totalApplicants)}
                  icon="users"
                  index={0}
                />
                <SummaryCard
                  title="Approved"
                  value={formatNumber(statistics.approved)}
                  bg="bg-green-500"
                  text="text-white"
                  index={1}
                />
                <SummaryCard
                  title="Pending"
                  value={formatNumber(statistics.pending)}
                  bg="bg-orange-500"
                  text="text-white"
                  index={2}
                />
                <SummaryCard
                  title="Rejected"
                  value={formatNumber(statistics.rejected)}
                  bg="bg-white"
                  text="text-red-600"
                  border="border-2 border-red-500"
                  icon="reject"
                  index={3}
                />
              </div>
            )}

            {/* Scheme-wise Beneficiaries */}
            <div className="bg-white rounded-lg shadow mb-10 p-6">
              <h2 className="text-lg font-semibold mb-1">
                Scheme-wise Beneficiaries
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                View and manage beneficiaries for each scheme.
              </p>

              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or scheme"
                    value={searchText}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 hover:shadow-md transition-all duration-200"
                >
                  <FaFilter size={14} />
                  Filter
                </motion.button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse text-sm bg-white">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-600 border-b border-gray-200">
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">SCHEME NAME</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">TOTAL BENEFICIARIES</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">APPROVED</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">PENDING</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">REJECTED</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {schemesLoading ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : schemes.length > 0 ? (
                      schemes.map((item, index) => (
                        <TableRow 
                          key={item.schemeId || index} 
                          {...item} 
                          index={index}
                          onRowClick={(schemeId) => {
                            if (schemeId) {
                              navigate(`/system-admin/scheme-beneficiaries/${schemeId}`);
                            }
                          }}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-8 text-center text-slate-500"
                        >
                          No schemes found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fraud Detection Alerts */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Fraud Detection Alerts
              </h2>

              <div className="space-y-3">
                {alertsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <AlertCard key={alert.alertId || index} alert={alert} index={index} />
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                    No active alerts
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dashboard>
      </section>
    </>
  );
}

function SummaryCard({
  title,
  value,
  bg = "bg-white",
  text = "text-slate-800",
  border = "",
  icon,
  index = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`p-5 rounded-lg shadow-md hover:shadow-xl ${bg} ${border} relative cursor-pointer transition-all duration-200 overflow-hidden`}
    >
      {/* Subtle gradient overlay on hover for colored cards */}
      {(bg.includes("green") || bg.includes("orange")) && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
      )}

      {icon === "reject" && (
        <FaTimes className="absolute top-3 right-3 text-red-500 hover:text-red-600 transition-colors" size={20} />
      )}
      {icon === "users" && (
        <div className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </div>
      )}
      <p className={`text-sm mb-2 ${text} font-medium`}>{title}</p>
      <h3 className={`text-3xl font-bold ${text} relative z-10`}>{value}</h3>
    </motion.div>
  );
}

function TableRow({ scheme, schemeId, total, approved, pending, rejected, index, onRowClick }) {
  const handleClick = () => {
    if (onRowClick && schemeId) {
      onRowClick(schemeId);
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="hover:bg-blue-50 transition-colors cursor-pointer border-b border-gray-100"
      whileHover={{ backgroundColor: "rgb(239 246 255)" }}
      onClick={handleClick}
    >
      <td className="py-4 px-4 text-gray-800 font-medium">{scheme}</td>
      <td className="py-4 px-4 text-gray-700">{total}</td>
      <td className="py-4 px-4 text-gray-700">
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium">
          {approved}
        </span>
      </td>
      <td className="py-4 px-4 text-gray-700">
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-xs font-medium">
          {pending}
        </span>
      </td>
      <td className="py-4 px-4 text-gray-700">
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs font-medium">
          {rejected}
        </span>
      </td>
    </motion.tr>
  );
}

function AlertCard({ alert, index }) {
  const isDuplicate = alert.type === "duplicate";
  const bgColor = isDuplicate ? "bg-yellow-50" : "bg-red-50";
  const borderColor = isDuplicate ? "border-yellow-200" : "border-red-200";
  const textColor = isDuplicate ? "text-yellow-700" : "text-red-600";
  const title = alert.title || (isDuplicate ? "Duplicate Application" : "Ineligible Claim");
  const description = alert.description || "";
  const applicantName = alert.applicantName || "";

  const handleClick = () => {
    if (alert.actionUrl) {
      // TODO: Navigate to action URL
      console.log("Navigate to:", alert.actionUrl);
    } else if (alert.applicationId) {
      // TODO: Handle application review/investigation
      console.log(
        isDuplicate ? "Review application" : "Investigate claim",
        alert.applicationId
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`flex items-start gap-4 p-4 ${bgColor} border ${borderColor} rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group`}
      onClick={handleClick}
    >
      {isDuplicate ? (
        <FiAlertTriangle
          className={`${textColor} mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform`}
          size={20}
        />
      ) : (
        <div className="flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-5 h-5 ${textColor}`}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
      )}
      <div className="flex-1">
        <p className={`font-semibold ${textColor} mb-1`}>{title}</p>
        <p className={`text-sm ${textColor}`}>
          {description || `${title} detected for applicant: ${applicantName}.`}{" "}
          <span
            className={`underline font-medium ${
              isDuplicate ? "text-yellow-800" : "text-red-800"
            } group-hover:${isDuplicate ? "text-yellow-900" : "text-red-900"} transition-colors`}
          >
            {isDuplicate ? "Review" : "Investigate"}
          </span>
        </p>
      </div>
    </motion.div>
  );
}
