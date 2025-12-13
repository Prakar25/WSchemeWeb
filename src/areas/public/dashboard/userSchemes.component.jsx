/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";

import schemeDetails from "../../../data/schemeDetails.data";
import { calculateAge, getStoredUser } from "../../../utils/user.utils";

import Dashboard from "../../dashboard-components/dashboard.component";

import ViewSchemeDetails from "./viewSchemeDetails.component";

export default function UserSchemes() {
  const [user, setUser] = useState(null);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [otherSchemes, setOtherSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) return;

    setUser(storedUser);

    const age = calculateAge(storedUser.dob);
    const gender = storedUser.gender;

    const eligible = [];
    const others = [];

    schemeDetails.forEach((scheme) => {
      const genderMatch = scheme.eligibilityGender.includes(gender);

      const ageMatch =
        age >= scheme.eligibilityLowerAgeLimit &&
        age <= scheme.eligibilityUpperAgeLimit;

      if (genderMatch && ageMatch) {
        eligible.push(scheme);
      } else {
        others.push(scheme);
      }
    });

    setEligibleSchemes(eligible);
    setOtherSchemes(others);
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <>
      <Dashboard sidebarType="Public User">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schemes List */}
          <div className="lg:col-span-2 space-y-6">
            <SchemeSection
              title="Eligible Schemes"
              schemes={eligibleSchemes}
              eligible={true}
              onSelect={setSelectedScheme}
              selectedScheme={selectedScheme}
            />

            <SchemeSection
              title="Other Schemes"
              schemes={otherSchemes}
              eligible={false}
              onSelect={setSelectedScheme}
              selectedScheme={selectedScheme}
            />
          </div>

          <ViewSchemeDetails
            scheme={selectedScheme}
            onClose={() => {
              setSelectedScheme(null);
              scrollToTop();
            }}
          />
        </section>
      </Dashboard>
    </>
  );
}

function SchemeSection({ title, schemes, eligible, onSelect, selectedScheme }) {
  return (
    <div className="">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemes.map((scheme, index) => (
          <div
            key={index}
            onClick={() => onSelect(scheme)}
            className={`border border-gray-400 hover:border-gray-600 ${
              scheme === selectedScheme &&
              "border-green-600 border-2 hover:border-green-600"
            } hover:bg-slate-100 rounded-md p-4 cursor-pointer hover:shadow ${
              eligible ? "bg-white" : "bg-slate-50"
            }`}
          >
            <span className="text-xs font-semibold uppercase text-blue-600">
              {scheme.schemeFrom} Scheme
            </span>

            <h4 className="font-semibold mt-2">{scheme.schemeName}</h4>
            <p className="text-sm text-slate-600 mt-1 line-clamp-3">
              {scheme.schemeDescription}
            </p>

            <button
              disabled={!eligible}
              className={`mt-4 w-full py-2 rounded-md text-sm font-medium ${
                eligible
                  ? "bg-green-600 text-white"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              Apply Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
