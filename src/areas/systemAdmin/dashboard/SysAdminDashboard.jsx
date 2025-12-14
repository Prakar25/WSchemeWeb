/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";

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

  return (
    <>
      <section className="hidden lg:block bg-gray-100">
        <Dashboard sidebarType="System Admin">
          <div className="p-6 bg-slate-50 min-h-screen">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SummaryCard title="Total Applicants" value="12,345" />
              <SummaryCard
                title="Approved"
                value="8,765"
                bg="bg-green-500"
                text="text-white"
              />
              <SummaryCard
                title="Pending"
                value="2,345"
                bg="bg-yellow-400"
                text="text-white"
              />
              <SummaryCard
                title="Rejected"
                value="1,235"
                bg="bg-red-100"
                text="text-red-600"
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
                <input
                  type="text"
                  placeholder="Search by scheme name..."
                  value={searchText}
                  onChange={handleSearchChange}
                  className="flex-1 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-0"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  Filter
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-600">
                      <th className="py-3 px-4">Scheme Name</th>
                      <th className="py-3 px-4">Total Beneficiaries</th>
                      <th className="py-3 px-4">Approved</th>
                      <th className="py-3 px-4">Pending</th>
                      <th className="py-3 px-4">Rejected</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
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
                  <div className="text-yellow-500 text-xl">⚠️</div>
                  <div>
                    <p className="font-semibold text-yellow-700">
                      Duplicate Application
                    </p>
                    <p className="text-sm text-yellow-700">
                      Duplicate application detected for applicant:{" "}
                      <span className="font-medium">Priya Sharma</span>.{" "}
                      <span className="underline cursor-pointer">Review</span>
                    </p>
                  </div>
                </div>

                {/* Error Alert */}
                <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-red-500 text-xl">❌</div>
                  <div>
                    <p className="font-semibold text-red-600">
                      Ineligible Claim
                    </p>
                    <p className="text-sm text-red-600">
                      Ineligible claim detected for applicant:{" "}
                      <span className="font-medium">Rajesh Kumar</span>.{" "}
                      <span className="underline cursor-pointer">
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
}) {
  return (
    <div className={`p-5 rounded-lg shadow ${bg}`}>
      <p className={`text-sm mb-2 ${text}`}>{title}</p>
      <h3 className={`text-3xl font-bold ${text}`}>{value}</h3>
    </div>
  );
}

function TableRow({ scheme, total, approved, pending, rejected }) {
  return (
    <tr>
      <td className="py-3 px-4">{scheme}</td>
      <td className="py-3 px-4">{total}</td>
      <td className="py-3 px-4">{approved}</td>
      <td className="py-3 px-4">{pending}</td>
      <td className="py-3 px-4">{rejected}</td>
    </tr>
  );
}

function TableRowRest({ ...rest }) {
  return (
    <tr>
      <td className="py-3 px-4">{rest.scheme}</td>
      <td className="py-3 px-4">{rest.total}</td>
      <td className="py-3 px-4">{rest.approved}</td>
      <td className="py-3 px-4">{rest.pending}</td>
      <td className="py-3 px-4">{rest.rejected}</td>
    </tr>
  );
}

function TableRowProps(props) {
  return (
    <tr>
      <td className="py-3 px-4">{props.scheme}</td>
      <td className="py-3 px-4">{props.total}</td>
      <td className="py-3 px-4">{props.approved}</td>
      <td className="py-3 px-4">{props.pending}</td>
      <td className="py-3 px-4">{props.rejected}</td>
    </tr>
  );
}
