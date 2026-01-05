/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaTrophy,
} from "react-icons/fa";

import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";

export default function PublicApplications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Mock applications data - replace with actual API call
    setApplications([
      {
        schemeName: "Child Care Assistance Program",
        status: "Under Review",
        dateApplied: "2023-08-15",
      },
      {
        schemeName: "Maternity Support Scheme",
        status: "Approved",
        dateApplied: "2023-07-20",
      },
      {
        schemeName: "Skill Enhancement for Women",
        status: "Applied",
        dateApplied: "2023-09-05",
      },
    ]);
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
                      DATE APPLIED
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app, index) => {
                    const status = statusConfig[app.status] || statusConfig.Applied;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {app.schemeName}
                          </div>
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
                          {app.dateApplied}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-800 font-semibold">
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {applications.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No applications found.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

