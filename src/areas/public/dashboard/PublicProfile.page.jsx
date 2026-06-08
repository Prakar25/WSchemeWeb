/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiEdit2, FiFileText, FiLogOut, FiUsers } from "react-icons/fi";
import axios from "../../../api/axios";
import { PUBLIC_PROFILE_GET_URL } from "../../../api/api_routing_urls";
import {
  clearPublicAuthState,
  getStoredUser,
  formatDobForAge,
  getKycLevel,
  isProfileKycFull,
  getCscVerificationStatus,
  getKycMissingFields,
  formatKycMissingFieldsList,
  getCscStatusMessage,
} from "../../../utils/user.utils";
import { useActiveApplicantId } from "../../../hooks/useActiveApplicantId";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import Footer from "../footer.component";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import PublicHeader from "../components/PublicHeader.component";
import { fetchDocumentTypes, documentTypesByKey } from "../../../utils/documentTypes";

export default function PublicProfile() {
  const navigate = useNavigate();
  const activeApplicantId = useActiveApplicantId();
  const [user, setUser] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileDocTypes, setProfileDocTypes] = useState([]);

  useEffect(() => {
    fetchDocumentTypes({ profileOnly: true })
      .then(setProfileDocTypes)
      .catch(() => setProfileDocTypes([]));
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      setLoading(false);
      return;
    }

    const userId =
      activeApplicantId || storedUser._id || storedUser.userId;
    if (!userId) {
      setUser(storedUser);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(PUBLIC_PROFILE_GET_URL, {
          params: { userId },
          withCredentials: true,
        });
        if (response.data?.status === "success" && response.data?.user) {
          setUser(response.data.user);
          return;
        }
      } catch (err) {
        if (err.response?.status !== 404 && err.code !== "ERR_NETWORK") {
          console.error("fetchUserProfile error:", err);
        }
      }
      setUser(storedUser);
    };

    fetchProfile().finally(() => setLoading(false));
  }, [activeApplicantId]);

  const handleLogout = () => {
    clearPublicAuthState();
    localStorage.removeItem("sidebar-expanded");
    navigate("/login", { replace: true });
  };

  const fullName = user?.demographics?.fullName || user?.fullName || "User Name";
  const email = user?.contact?.email?.value ?? user?.contactEmail ?? "-";
  const phone = user?.contact?.mobile?.value ?? user?.phoneNumber ?? "-";
  const dobRaw = user?.dob ?? user?.demographics?.dob;
  const dobDisplay =
    typeof dobRaw === "string"
      ? formatDobForAge(dobRaw)
      : dobRaw?.date
        ? formatDobForAge(dobRaw.date)
        : "-";
  const address = user?.address || {};

  const formatAddress = (addr) => {
    if (!addr) return "-";
    const parts = [
      addr.careOf,
      addr.house,
      addr.street,
      addr.locality,
      addr.district,
      addr.state,
      addr.pincode,
      addr.country,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "-";
  };

  const formatGender = (g) => {
    if (!g) return "-";
    if (g === "M" || g === "Male") return "Male";
    if (g === "F" || g === "Female") return "Female";
    return g;
  };

  const formatAadhaar = (aadhaar = "") => {
    if (!aadhaar) return "";
    const cleaned = String(aadhaar).replace(/\s/g, "");
    return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return "**** **** ****";
    const str = String(aadhaar).replace(/\s/g, "");
    if (str.length >= 4) return `**** **** ${str.slice(-4)}`;
    return "**** **** ****";
  };

  const hasDoc = (doc) => doc?.filePath != null && doc?.filePath !== "";
  const docTypesByKey = documentTypesByKey(profileDocTypes);
  const docLabel = (key) => docTypesByKey[key]?.label || key;

  const profileDocumentKeys = () => {
    if (profileDocTypes.length) return profileDocTypes.map((t) => t.key);
    const docs = user?.documents;
    return docs && typeof docs === "object" ? Object.keys(docs) : [];
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <PublicHeader />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">
            {loading ? "Loading profile..." : "No profile data."}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <PublicHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            <SplitText text="My Profile" splitType="chars" delay={40} className="inline-block" />
          </h1>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/user/household-members")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              <FiUsers size={18} />
              Household Members
            </button>
            <button
              type="button"
              onClick={() => navigate("/user/complete-profile")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] font-medium transition-colors"
            >
              <FiEdit2 size={18} />
              Edit profile
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.photo?.url ? (
                <img
                  src={displayMedia(user.photo.url)}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-3xl font-bold">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{fullName}</h2>

              {(user.aadhaarNumber || user.aadhaarNumberFull) && (
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
                    aria-label={showAadhaar ? "Hide Aadhaar" : "Show Aadhaar"}
                  >
                    {showAadhaar ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {(getKycLevel(user) || isProfileKycFull(user)) && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      isProfileKycFull(user)
                        ? "bg-[#c2edda]/30 text-black"
                        : getKycLevel(user) === "PARTIAL"
                          ? "bg-[#68d388]/25 text-black"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Profile KYC: {isProfileKycFull(user) ? "FULL" : getKycLevel(user) || "Incomplete"}
                  </span>
                )}
                {getCscVerificationStatus(user) && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      getCscVerificationStatus(user) === "verified"
                        ? "bg-[#c2edda]/30 text-black"
                        : getCscVerificationStatus(user) === "pending"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    CSC:{" "}
                    {getCscVerificationStatus(user) === "verified"
                      ? "Verified"
                      : getCscVerificationStatus(user) === "pending"
                        ? "Pending"
                        : getCscVerificationStatus(user)}
                  </span>
                )}
              </div>
              {!isProfileKycFull(user) && getKycMissingFields(user).length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Still needed for profile KYC:{" "}
                  {formatKycMissingFieldsList(getKycMissingFields(user))}
                </p>
              )}
              {getCscStatusMessage(user) && (
                <p className="text-sm text-gray-700 mt-2">{getCscStatusMessage(user)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Personal Information
          </h3>
          <div className="divide-y divide-gray-200">
            <DetailRow label="Email" value={email} />
            <DetailRow label="Phone" value={phone} />
            <DetailRow label="Gender" value={formatGender(user.gender)} />
            <DetailRow label="Date of Birth" value={dobDisplay} />
            <div className="py-4 flex flex-col sm:flex-row">
              <span className="sm:w-1/4 text-gray-600 font-medium mb-2 sm:mb-0">
                Address
              </span>
              <span className="sm:w-3/4 text-gray-900 leading-relaxed">
                {formatAddress(address)}
              </span>
            </div>
          </div>
        </div>

        {/* Family Details */}
        {Array.isArray(user.familyDetails) && user.familyDetails.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Family Details
            </h3>
            <div className="divide-y divide-gray-200">
              {user.familyDetails.map((member, idx) => (
                <div
                  key={idx}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2"
                >
                  <span className="sm:w-1/4 text-gray-600 font-medium">
                    {member.relationWithApplicant || "Family member"}
                  </span>
                  <span className="sm:w-3/4 text-gray-900 font-semibold">
                    {member.name}
                    {member.age != null && member.age !== "" ? `, ${member.age} years` : ""}
                    {member.occupation ? ` — ${member.occupation}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FiFileText /> Documents
          </h3>
          <div className="space-y-3">
            {profileDocumentKeys().map((key) => {
                const doc = user.documents?.[key];
                const uploaded = hasDoc(doc);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-700">{docLabel(key)}</span>
                    {uploaded ? (
                      <a
                        href={displayMedia(doc.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d85a30] hover:text-[#ffb766] text-sm font-medium"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Not uploaded</span>
                    )}
                  </div>
                );
              }
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            You can add or update documents from the Edit profile page.
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Account</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sign out of WelfareConnect on this device. Use the applicant menu in the header to switch household members.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-600 bg-red-600 text-white font-medium hover:bg-red-700 hover:border-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2"
          >
            <FiLogOut size={18} />
            Log out
          </button>
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

