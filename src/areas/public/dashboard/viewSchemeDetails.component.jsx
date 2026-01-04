/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";

const ViewSchemeDetails = ({ scheme, onClose }) => {
  if (!scheme) return null;

  // Helper function to normalize items (handle both array and object formats)
  const normalizeItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === "object") return Object.values(items);
    return [];
  };

  // Get scheme data (support both old and new formats)
  const schemeName = scheme.scheme_name || scheme.schemeName || "";
  const schemeDescription =
    scheme.scheme_description || scheme.schemeDescription || "";
  const schemeObjectives = normalizeItems(
    scheme.scheme_objectives || scheme.schemeObjectives
  );
  const schemeBenefits = normalizeItems(
    scheme.scheme_benefits || scheme.schemeBenefits
  );
  const schemeRequiredDocuments = normalizeItems(
    scheme.scheme_required_documents
      ? Array.isArray(scheme.scheme_required_documents)
        ? scheme.scheme_required_documents.map((doc) => doc.document_type || doc)
        : scheme.scheme_required_documents
      : scheme.schemeRequiredDocuments
  );

  // Get eligibility data
  const eligibility = {
    gender: scheme.gender || scheme.eligibilityGender || "All",
    lowerAge:
      scheme.scheme_eligibility?.lower_age_limit ||
      scheme.eligibilityLowerAgeLimit ||
      null,
    upperAge:
      scheme.scheme_eligibility?.upper_age_limit ||
      scheme.eligibilityUpperAgeLimit ||
      null,
  };

  // Build eligibility items
  const eligibilityItems = [];
  if (eligibility.gender && eligibility.gender !== "All") {
    const genderMap = {
      Female: "Female",
      Male: "Male",
      Others: "Others",
      All: "All",
      F: "Female",
      M: "Male",
    };
    eligibilityItems.push(genderMap[eligibility.gender] || eligibility.gender);
  }
  if (eligibility.lowerAge !== null && eligibility.upperAge !== null) {
    eligibilityItems.push(
      `${eligibility.lowerAge} to ${eligibility.upperAge} years of age`
    );
  }
  // Add more generic eligibility items if needed
  if (eligibilityItems.length === 0) {
    eligibilityItems.push("As per scheme guidelines");
  }

  // Mock application status (this would come from API in real scenario)
  const applicationStatus = "eligible"; // or "applied", "in_progress", etc.
  const progressPercentage = 60; // Mock progress
  const progressSteps = [
    "Application Submitted",
    "Documents Verified",
    "Approved",
    "Benefit Disbursed",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Go Back Button */}
        <button
          type="button"
          onClick={onClose}
          className="mb-6 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
        >
          ← Go Back
        </button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-8 md:p-12">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {schemeName}
              </h1>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description Section */}
                <Section
                  title="Description"
                  underlineColor="yellow"
                  content={
                    <p className="text-gray-700 leading-relaxed">
                      {schemeDescription}
                    </p>
                  }
                />

                {/* Objectives Section */}
                {schemeObjectives.length > 0 && (
                  <Section
                    title="Objectives"
                    underlineColor="green"
                    content={
                      <ul className="list-disc pl-6 space-y-2 text-gray-700">
                        {schemeObjectives.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    }
                  />
                )}

                {/* Benefits Section */}
                {schemeBenefits.length > 0 && (
                  <Section
                    title="Benefits"
                    underlineColor="blue"
                    content={
                      <p className="text-gray-700 leading-relaxed">
                        {schemeBenefits.join(" ")}
                      </p>
                    }
                  />
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Eligibility */}
                {eligibilityItems.length > 0 && (
                  <SidebarSection
                    title="Eligibility"
                    items={eligibilityItems}
                  />
                )}

                {/* Required Documents */}
                {schemeRequiredDocuments.length > 0 && (
                  <SidebarSection
                    title="Required Documents"
                    items={schemeRequiredDocuments}
                  />
                )}

                {/* Application Status */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Application Status
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You are eligible to apply.
                  </p>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    Apply Now
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>

            {/* Track Application Progress */}
            {applicationStatus === "in_progress" && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Track Application Progress
                </h3>
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium">
                    IN PROGRESS
                  </span>
                </div>
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {progressSteps.map((step, index) => {
                    const isCompleted = index < progressPercentage / 25;
                    return (
                      <div
                        key={index}
                        className={`text-center p-4 rounded-lg ${
                          isCompleted
                            ? "bg-blue-50 border-2 border-blue-200"
                            : "bg-gray-50 border-2 border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center font-bold ${
                            isCompleted
                              ? "bg-blue-600 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            isCompleted ? "text-blue-900" : "text-gray-600"
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ViewSchemeDetails;

// Section Component with colored underline
function Section({ title, underlineColor, content }) {
  const underlineColors = {
    yellow: "border-yellow-400",
    green: "border-green-500",
    blue: "border-blue-500",
  };

  return (
    <div>
      <h3
        className={`text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b-4 ${underlineColors[underlineColor] || "border-gray-300"}`}
      >
        {title}
      </h3>
      <div>{content}</div>
    </div>
  );
}

// Sidebar Section Component
function SidebarSection({ title, items }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}