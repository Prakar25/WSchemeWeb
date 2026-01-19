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
import { getStoredUser } from "../../../utils/user.utils";
import { formatDateInDDMonYYYY } from "../../../utils/dateFunctions/formatdate";

import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";

export default function PublicApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const user = getStoredUser();
        
        if (!user || (!user._id && !user.userId)) {
          console.error("No user ID found");
          setApplications([]);
          return;
        }

        const userId = user._id || user.userId;
        const response = await axios.get(`${APPLICATIONS_USER_URL}/${userId}`);

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
  }, []);

  // Get status config
  const statusConfig = {
    Approved: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <FaCheckCircle className="text-green-600" />,
    },
    "Under Review": {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: <FaTrophy className="text-yellow-600" />,
    },
    Applied: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <FaFileAlt className="text-blue-600" />,
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
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          My Applications
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
                        <tr key={app._id || app.applicationId || index} className="hover:bg-gray-50">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-800 font-semibold">
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

      <Footer />
    </div>
  );
}

