/* eslint-disable no-unused-vars */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

export function FraudAlertCard({ alert, index = 0, onCardClick }) {
  const isDuplicate = alert.type === "duplicate";
  const bgColor = isDuplicate ? "bg-[#68d388]/20" : "bg-red-50";
  const borderColor = isDuplicate ? "border-[#68d388]/40" : "border-red-200";
  const textColor = isDuplicate ? "text-black" : "text-red-600";
  const title = alert.title || (isDuplicate ? "Duplicate Application" : "Ineligible Claim");
  const applicantName = alert.applicantName || "";

  const handleClick = () => {
    if (onCardClick) onCardClick(alert);
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
          {alert.description || `${title} detected for applicant: ${applicantName}.`}{" "}
          <span
            className={`underline font-medium ${
              isDuplicate ? "text-black" : "text-red-800"
            } group-hover:${isDuplicate ? "text-black" : "text-red-900"} transition-colors`}
          >
            {isDuplicate ? "Review" : "Investigate"}
          </span>
        </p>
      </div>
    </motion.div>
  );
}

export function FraudAlertDetailsContent({ alert, onDismiss }) {
  const navigate = useNavigate();
  const isDuplicate = alert.type === "duplicate";
  const applicationId =
    alert.applicationId ||
    alert.application_id ||
    alert._id ||
    alert.id;

  const handleViewApplication = () => {
    if (applicationId) {
      navigate("/system-admin/applications", {
        state: { applicationId, autoOpen: true },
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDuplicate ? "bg-[#68d388]/25 text-black" : "bg-red-100 text-red-800"
          }`}
        >
          {isDuplicate ? "Duplicate Detection" : "Fraud/Ineligibility Alert"}
        </span>
        {alert.severity && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              alert.severity === "high"
                ? "bg-red-200 text-red-900"
                : "bg-[#68d388]/25 text-black"
            }`}
          >
            {alert.severity.toUpperCase()} Priority
          </span>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Applicant Information</h3>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Name:</span>{" "}
            {alert.applicantName ||
              alert.applicant?.fullName ||
              alert.applicant?.name ||
              alert.applicant?.full_name ||
              alert.application?.applicantName ||
              alert.application?.fullName ||
              alert.fullName ||
              alert.name ||
              "N/A"}
          </p>
          {(alert.aadhaarNumber ||
            alert.aadhaar_number ||
            alert.applicant?.aadhaarNumber ||
            alert.applicant?.aadhaar_number ||
            alert.applicant?.aadhaar ||
            alert.application?.aadhaarNumber ||
            alert.application?.aadhaar_number ||
            alert.aadhaar) && (
            <p>
              <span className="font-medium">Aadhaar:</span>{" "}
              {alert.aadhaarNumber ||
                alert.aadhaar_number ||
                alert.applicant?.aadhaarNumber ||
                alert.applicant?.aadhaar_number ||
                alert.applicant?.aadhaar ||
                alert.application?.aadhaarNumber ||
                alert.application?.aadhaar_number ||
                alert.aadhaar}
            </p>
          )}
          {(alert.schemeName ||
            alert.scheme_name ||
            alert.scheme?.scheme_name ||
            alert.scheme?.name ||
            alert.application?.schemeName ||
            alert.application?.scheme_name) && (
            <p>
              <span className="font-medium">Scheme:</span>{" "}
              {alert.schemeName ||
                alert.scheme_name ||
                alert.scheme?.scheme_name ||
                alert.scheme?.name ||
                alert.application?.schemeName ||
                alert.application?.scheme_name}
            </p>
          )}
          {applicationId && (
            <p>
              <span className="font-medium">Application ID:</span> {applicationId}
            </p>
          )}
          {alert.alertId && (
            <p>
              <span className="font-medium">Alert ID:</span> {alert.alertId}
            </p>
          )}
          {!alert.applicantName && !alert.applicant && !alert.application && (
            <div className="mt-2 p-2 bg-[#68d388]/20 border border-[#68d388]/40 rounded text-xs">
              <p className="font-medium text-black mb-1">Debug: Available alert fields:</p>
              <pre className="text-black overflow-auto max-h-32">
                {JSON.stringify(alert, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
          <FaExclamationTriangle className="text-red-600" />
          Why This Alert Was Triggered
        </h3>
        <p className="text-sm text-red-700 whitespace-pre-wrap">
          {alert.reason ||
            alert.description ||
            alert.message ||
            "No specific reason provided."}
        </p>
      </div>

      {alert.details && (
        <div className="bg-[#c2edda]/20 border border-[#d85a30]/30 p-4 rounded-lg">
          <h3 className="font-semibold text-black mb-2">Additional Details</h3>
          <div className="text-sm text-black space-y-2">
            {typeof alert.details === "string" ? (
              <p className="whitespace-pre-wrap">{alert.details}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(alert.details).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {alert.evidence && (
        <div className="bg-[#68d388]/20 border border-[#68d388]/40 p-4 rounded-lg">
          <h3 className="font-semibold text-black mb-2">Evidence</h3>
          <div className="text-sm text-black">
            {typeof alert.evidence === "string" ? (
              <p className="whitespace-pre-wrap">{alert.evidence}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(alert.evidence).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {alert.createdAt && (
        <div className="text-sm text-gray-500">
          <span className="font-medium">Alert Created:</span>{" "}
          {new Date(alert.createdAt).toLocaleString()}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        {applicationId && (
          <button
            onClick={handleViewApplication}
            className="flex-1 px-4 py-2 bg-[#d85a30] text-white rounded-md hover:bg-[#ffb766] transition-colors font-medium"
          >
            View Full Application
          </button>
        )}
        <button
          onClick={() => (onDismiss ? onDismiss(alert) : undefined)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
        >
          Dismiss Alert
        </button>
      </div>
    </div>
  );
}
