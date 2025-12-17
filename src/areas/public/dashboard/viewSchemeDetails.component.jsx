/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import educationImg from "../../../assets/educationFinance.jpeg";

const ViewSchemeDetails = ({ scheme, onClose }) => {
  if (!scheme) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full relative mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8 p-6 md:p-10"
    >
      {/* Top-right Go Back Button */}
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer absolute top-6 right-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 z-10"
      >
        Go Back
      </button>

      {/* Cover Image */}
      <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6">
        <img
          src={educationImg}
          alt={scheme.schemeName}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Scheme Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">
        {scheme.schemeName}
      </h2>

      {/* Scheme Description */}
      <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-6">
        {scheme.schemeDescription}
      </p>

      {/* Sections */}
      <Section title="Objectives" items={scheme.schemeObjectives} />
      <Section title="Benefits" items={scheme.schemeBenefits} />
      <Section
        title="Required Documents"
        items={scheme.schemeRequiredDocuments}
      />
    </motion.section>
  );
};

export default ViewSchemeDetails;

function Section({ title, items }) {
  const normalizedItems = Array.isArray(items)
    ? items
    : items && typeof items === "object"
    ? Object.values(items)
    : [];

  if (normalizedItems.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-lg md:text-xl font-semibold text-blue-700 mb-3">
        {title}
      </h4>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm md:text-base">
        {normalizedItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
