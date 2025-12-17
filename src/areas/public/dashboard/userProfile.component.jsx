/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";

import { FiEye, FiEyeOff } from "react-icons/fi";

import Dashboard from "../../dashboard-components/dashboard.component";
import { getStoredUser, formatDobForAge } from "../../../utils/user.utils";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  if (!user) return null;

  const formatAddress = (address) => {
    if (!address) return "-";

    return [
      address.house,
      address.street,
      address.locality,
      address.district,
      address.state,
      address.pincode,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const formatGender = (gender) =>
    gender === "M" ? "Male" : gender === "F" ? "Female" : gender;

  const formatAadhaar = (aadhaar = "") => {
    return aadhaar.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  return (
    <Dashboard sidebarType="Public User">
      <section className="bg-linear-to-r from-orange-600 via-white to-green-500 text-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-white text-green-700 flex items-center justify-center text-3xl font-bold shadow">
            {user.fullName?.charAt(0)}
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-semibold">{user.fullName}</h2>

            <div className="flex items-center gap-2 text-sm text-white">
              <span>
                Aadhaar Number:{" "}
                {showAadhaar
                  ? formatAadhaar(user.aadhaarNumber)
                  : `**** **** ${user.aadhaarNumber?.slice(-4)}`}
              </span>

              <button
                type="button"
                onClick={() => setShowAadhaar((prev) => !prev)}
                className="text-white cursor-pointer"
                aria-label={
                  showAadhaar ? "Hide Aadhaar number" : "Show Aadhaar number"
                }
              >
                {showAadhaar ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>

            <span className="inline-block mt-3 px-4 py-1 text-xs font-semibold bg-white text-green-700 rounded-full">
              ✔ Verified Public User
            </span>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">
          Personal Information
        </h3>

        <div className="divide-y divide-slate-200 text-sm">
          <DetailRow label="Email Address" value={user.contactEmail} />
          <DetailRow label="Phone Number" value={user.phoneNumber} />
          <DetailRow label="Gender" value={formatGender(user.gender)} />
          <DetailRow label="Date of Birth" value={formatDobForAge(user.dob)} />

          <div className="py-4 flex flex-col sm:flex-row">
            <span className="sm:w-1/4 text-slate-500 font-medium mb-1 sm:mb-0">
              Address
            </span>
            <span className="sm:w-3/4 text-slate-800 leading-relaxed font-medium">
              {formatAddress(user.address)}
            </span>
          </div>
        </div>
      </section>
    </Dashboard>
  );
}

/* ---------------------- SMALL REUSABLE CARD ---------------------- */
const DetailRow = ({ label, value }) => {
  return (
    <div className="py-4 flex flex-col sm:flex-row">
      <span className="sm:w-1/4 text-slate-500 font-medium mb-1 sm:mb-0">
        {label}
      </span>
      <span className="sm:w-3/4 text-slate-800 font-semibold">
        {value || "-"}
      </span>
    </div>
  );
};
