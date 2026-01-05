/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { FaSearch, FaFilter, FaDownload, FaTimes } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

import Dashboard from "../../dashboard-components/dashboard.component";

export default function SysAdminDashboard() {
  const [searchText, setSearchText] = useState("");

  const schemes = [
    {
      scheme: "Child Care Support",
      total: "3,456",
      approved: "2,890",
      pending: "456",
      rejected: "110",
    },
    {
      scheme: "Maternity Assistance",
      total: "2,987",
      approved: "2,500",
      pending: "300",
      rejected: "187",
    },
    {
      scheme: "Education Grant",
      total: "2,500",
      approved: "2,000",
      pending: "350",
      rejected: "150",
    },
    {
      scheme: "Skill Development Program",
      total: "1,800",
      approved: "1,500",
      pending: "200",
      rejected: "100",
    },
    {
      scheme: "Health Insurance",
      total: "1,602",
      approved: "1,200",
      pending: "300",
      rejected: "102",
    },
  ];

  /* Dummy search handler */
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  /* Filter logic */
  const filteredSchemes = schemes.filter((item) =>
    item.scheme.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log("Export as Excel");
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Export as PDF");
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
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <FaDownload size={16} />
                  Export as Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <FaDownload size={16} />
                  Export as PDF
                </button>
              </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SummaryCard 
                title="Total Applicants" 
                value="12,345"
                icon="users"
              />
              <SummaryCard
                title="Approved"
                value="8,765"
                bg="bg-green-500"
                text="text-white"
              />
              <SummaryCard
                title="Pending"
                value="2,345"
                bg="bg-orange-500"
                text="text-white"
              />
              <SummaryCard
                title="Rejected"
                value="1,235"
                bg="bg-white"
                text="text-red-600"
                border="border-2 border-red-500"
                icon="reject"
              />
            </div>

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
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  <FaFilter size={14} />
                  Filter
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-600">
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">SCHEME NAME</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">TOTAL BENEFICIARIES</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">APPROVED</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">PENDING</th>
                      <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">REJECTED</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {filteredSchemes.length > 0 ? (
                      filteredSchemes.map((item, index) => (
                        <TableRow key={index} {...item} />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-6 text-center text-slate-500"
                        >
                          No matching schemes found
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

              <div className="space-y-4">
                {/* Warning Alert */}
                <div className="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <FiAlertTriangle className="text-yellow-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-700 mb-1">
                      Duplicate Application
                    </p>
                    <p className="text-sm text-yellow-700">
                      Duplicate application detected for applicant:{" "}
                      <span className="font-medium">Priya Sharma</span>.{" "}
                      <span className="underline cursor-pointer hover:text-yellow-800">Review</span>
                    </p>
                  </div>
                </div>

                {/* Error Alert */}
                <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-red-600"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-600 mb-1">
                      Ineligible Claim
                    </p>
                    <p className="text-sm text-red-600">
                      Ineligible claim detected for applicant:{" "}
                      <span className="font-medium">Rajesh Kumar</span>.{" "}
                      <span className="underline cursor-pointer hover:text-red-800">
                        Investigate
                      </span>
                    </p>
                  </div>
                </div>
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
}) {
  return (
    <div className={`p-5 rounded-lg shadow ${bg} ${border} relative`}>
      {icon === "reject" && (
        <FaTimes className="absolute top-3 right-3 text-red-500" size={20} />
      )}
      {icon === "users" && (
        <div className="absolute top-3 right-3 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
      )}
      <p className={`text-sm mb-2 ${text}`}>{title}</p>
      <h3 className={`text-3xl font-bold ${text}`}>{value}</h3>
    </div>
  );
}

function TableRow({ scheme, total, approved, pending, rejected }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 text-gray-800">{scheme}</td>
      <td className="py-3 px-4 text-gray-700">{total}</td>
      <td className="py-3 px-4 text-gray-700">{approved}</td>
      <td className="py-3 px-4 text-gray-700">{pending}</td>
      <td className="py-3 px-4 text-gray-700">{rejected}</td>
    </tr>
  );
}
