import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaArrowRight,
} from "react-icons/fa";

import Dashboard from "../../dashboard-components/dashboard.component";

const applications = [
  {
    schemeName: "Mukhyamantri Kanya Shiksha Yojana",
    applicationId: "APP-2024-001",
    status: "Approved",
    lastUpdated: "12 Sep 2024",
  },
  {
    schemeName: "State Maternity Benefit Scheme",
    applicationId: "APP-2024-014",
    status: "Under Review",
    lastUpdated: "20 Sep 2024",
  },
  {
    schemeName: "Widow Pension Scheme",
    applicationId: "APP-2024-022",
    status: "Rejected",
    lastUpdated: "01 Oct 2024",
  },
];

const statusConfig = {
  Approved: {
    bg: "from-green-400 to-emerald-500",
    text: "text-green-700",
    badge: "bg-green-100",
    icon: <FaCheckCircle className="text-green-600 text-xl" />,
  },
  "Under Review": {
    bg: "from-yellow-400 to-orange-400",
    text: "text-yellow-800",
    badge: "bg-yellow-100",
    icon: <FaClock className="text-yellow-600 text-xl" />,
  },
  Rejected: {
    bg: "from-red-400 to-rose-500",
    text: "text-red-700",
    badge: "bg-red-100",
    icon: <FaTimesCircle className="text-red-600 text-xl" />,
  },
};

export default function UserApplicationTracker() {
  return (
    <Dashboard sidebarType="Public User">
      <section
        className="bg-linear-to-br from-blue-50 via-white to-green-50
                   rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
          Application Tracker
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((app, index) => {
            const status = statusConfig[app.status];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: index * 0.12,
                }}
                className="relative bg-white rounded-xl overflow-hidden
                           shadow-md hover:shadow-xl transition-shadow"
              >
                {/* Status strip */}
                <div className={`h-2 bg-linear-to-r ${status.bg}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="mt-1">{status.icon}</div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {app.schemeName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Application ID: {app.applicationId}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full
                                  ${status.badge} ${status.text}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 flex justify-between items-center text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium">Last Updated:</span>{" "}
                      {app.lastUpdated}
                    </p>

                    <motion.button
                      whileHover={{ x: 4 }}
                      transition={{ ease: "easeOut", duration: 0.2 }}
                      className="flex items-center gap-2 text-blue-600
                                 font-semibold hover:text-blue-700"
                    >
                      View Details
                      <FaArrowRight />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </Dashboard>
  );
}
