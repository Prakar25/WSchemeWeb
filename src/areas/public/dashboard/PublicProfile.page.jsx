/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "../../../api/axios";
import { PROFILE_URL } from "../../../api/api_routing_urls";
import { getStoredUser, formatDobForAge } from "../../../utils/user.utils";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";

export default function PublicProfile() {
  const [user, setUser] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    
    // Fetch user profile from API
    const fetchUserProfile = async () => {
      if (!storedUser?._id && !storedUser?.userId) {
        console.error("No user ID found");
        // Use stored user as fallback
        if (storedUser) {
          setUser(storedUser);
        }
        return;
      }

      try {
        const userId = storedUser._id || storedUser.userId;
        const response = await axios.get(`${PROFILE_URL}/${userId}`);
        
        if (response.status === 200 && response.data?.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("fetchUserProfile", error);
        // Fallback to stored user if API fails
        if (storedUser) {
          setUser(storedUser);
        }
      }
    };

    fetchUserProfile();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <PublicHeader />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Loading profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

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

  const formatGender = (gender) => {
    if (!gender) return "-";
    if (gender === "M" || gender === "Male") return "Male";
    if (gender === "F" || gender === "Female") return "Female";
    return gender;
  };

  const formatAadhaar = (aadhaar = "") => {
    if (!aadhaar) return "";
    const cleaned = aadhaar.toString().replace(/\s/g, "");
    return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return "**** **** ****";
    const str = aadhaar.toString().replace(/\s/g, "");
    if (str.length >= 4) {
      return `**** **** ${str.slice(-4)}`;
    }
    return "**** **** ****";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Profile Picture */}
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.photo?.url ? (
                <img
                  src={displayMedia(user.photo.url)}
                  alt={user.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-3xl font-bold">
                  {(user.fullName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {user.fullName || "User Name"}
              </h2>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600 mb-3">
                <span>
                  Aadhaar:{" "}
                  {showAadhaar
                    ? formatAadhaar(user.aadhaarNumberFull || user.aadhaarNumber)
                    : maskAadhaar(user.aadhaarNumber)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAadhaar((prev) => !prev)}
                  className="text-gray-600 hover:text-gray-800 cursor-pointer"
                  aria-label={
                    showAadhaar
                      ? "Hide Aadhaar number"
                      : "Show Aadhaar number"
                  }
                >
                  {showAadhaar ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>

              <span className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                ✔ Verified Public User
              </span>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Personal Information
          </h3>

          <div className="divide-y divide-gray-200">
            <DetailRow
              label="Email Address"
              value={user.contact?.email?.value || user.contactEmail || "-"}
            />
            <DetailRow
              label="Phone Number"
              value={user.contact?.mobile?.value || user.phoneNumber || "-"}
            />
            <DetailRow
              label="Gender"
              value={formatGender(user.gender)}
            />
            <DetailRow
              label="Date of Birth"
              value={formatDobForAge(user.dob) || user.dob || "-"}
            />

            <div className="py-4 flex flex-col sm:flex-row">
              <span className="sm:w-1/4 text-gray-600 font-medium mb-2 sm:mb-0">
                Address
              </span>
              <span className="sm:w-3/4 text-gray-900 leading-relaxed">
                {formatAddress(user.address)}
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ---------------------- Detail Row Component ---------------------- */
const DetailRow = ({ label, value }) => {
  return (
    <div className="py-4 flex flex-col sm:flex-row">
      <span className="sm:w-1/4 text-gray-600 font-medium mb-2 sm:mb-0">
        {label}
      </span>
      <span className="sm:w-3/4 text-gray-900 font-semibold">{value}</span>
    </div>
  );
};

