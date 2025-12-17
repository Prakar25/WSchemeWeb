/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import schemeDetails from "../../../data/schemeDetails.data";
import {
  formatDobForAge,
  calculateAge,
  getStoredUser,
} from "../../../utils/user.utils";

import Dashboard from "../../dashboard-components/dashboard.component";
import ViewSchemeDetails from "./viewSchemeDetails.component";

import childCareImg from "../../../assets/childCare.jpeg";
import motherImg from "../../../assets/expectingMother.jpeg";
import educationImg from "../../../assets/educationFinance.jpeg";
import childHealthImg from "../../../assets/childHealth.jpeg";
import childDevImg from "../../../assets/childDevelopment.jpeg";
import womenEmpImg from "../../../assets/womenEmpowerment.jpeg";

// Framer Motion variants
const cardVariants = {
  offscreen: { opacity: 0, y: 50 },
  onscreen: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } },
};

const containerVariants = {
  offscreen: {},
  onscreen: { transition: { staggerChildren: 0.25 } },
};

const SchemeSection = ({ title, schemes, eligible, onSelect }) => {
  return (
    <div className="mb-16">
      <p className="text-lg font-semibold mb-8 text-slate-700 border-b border-gray-200">
        {title}
      </p>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial="offscreen"
        animate="onscreen"
        variants={containerVariants}
      >
        {schemes.map((scheme, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3, delay: 0.05, ease: "easeOut" }, // slight delay and smooth ease
            }}
            whileTap={{
              scale: 0.97,
              transition: { duration: 0.2, ease: "easeInOut" }, // smooth tap effect
            }}
            className={`rounded-xl overflow-hidden shadow-lg cursor-pointer border-2 ${
              eligible ? "border-green-100" : "border-gray-300"
            }`}
            onClick={() => onSelect(scheme)}
          >
            <img
              src={scheme.img}
              className="h-56 w-full object-cover"
              alt={scheme.schemeName}
            />
            <div
              className={`p-6 ${
                eligible
                  ? "bg-linear-to-br from-green-500 to-blue-500 text-white"
                  : "bg-gray-50 text-gray-800"
              }`}
            >
              <h4 className="font-bold text-lg mb-3">{scheme.schemeName}</h4>
              <p className="text-sm line-clamp-4">{scheme.schemeDescription}</p>
              <button
                disabled={!eligible}
                onClick={(e) => e.stopPropagation()}
                className={`mt-5 w-full py-3 rounded-md font-medium text-sm ${
                  eligible
                    ? "bg-white text-green-700 hover:bg-green-500 hover:text-white cursor-pointer transition-all ease-in-out duration-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Apply Now
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default function UserSchemes() {
  const [user, setUser] = useState(null);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [otherSchemes, setOtherSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) return;

    setUser(storedUser);

    // Convert dob to DD-MM-YYYY
    const formattedDob = formatDobForAge(storedUser.dob);
    const age = calculateAge(formattedDob);

    const gender = storedUser.gender;

    const eligible = [];
    const others = [];

    schemeDetails.forEach((scheme) => {
      const genderMatch = scheme.eligibilityGender.includes(gender);
      const ageMatch =
        age >= scheme.eligibilityLowerAgeLimit &&
        age <= scheme.eligibilityUpperAgeLimit;

      if (genderMatch && ageMatch) eligible.push(scheme);
      else others.push(scheme);
    });

    setEligibleSchemes(eligible);
    setOtherSchemes(others);
  }, []);

  // Map images to schemes
  const schemeImages = [
    childCareImg,
    motherImg,
    educationImg,
    childHealthImg,
    childDevImg,
    womenEmpImg,
  ];

  const mapSchemesWithImages = (schemes) =>
    schemes.map((scheme, index) => ({
      ...scheme,
      img: schemeImages[index % schemeImages.length],
    }));

  const eligibleSchemesWithImages = mapSchemesWithImages(eligibleSchemes);
  const otherSchemesWithImages = mapSchemesWithImages(otherSchemes);

  return (
    <Dashboard sidebarType="Public User">
      {selectedScheme ? (
        <ViewSchemeDetails
          scheme={selectedScheme}
          onClose={() => setSelectedScheme(null)}
        />
      ) : (
        <section className="py-12 px-6">
          <div className="text-2xl font-bold text-center text-blue-800 mb-10">
            Schemes
          </div>

          {/* Eligible Schemes */}
          {eligibleSchemesWithImages.length > 0 ? (
            <SchemeSection
              title="Eligible Schemes"
              schemes={eligibleSchemesWithImages}
              eligible={true}
              onSelect={setSelectedScheme}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-center p-8 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 mb-10"
            >
              You are not eligible for any schemes currently.
            </motion.div>
          )}

          {/* Other Schemes */}
          {otherSchemesWithImages.length > 0 && (
            <SchemeSection
              title="Other Schemes"
              schemes={otherSchemesWithImages}
              eligible={false}
              onSelect={setSelectedScheme}
            />
          )}
        </section>
      )}
    </Dashboard>
  );
}
