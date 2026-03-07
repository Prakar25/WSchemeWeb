/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiEdit2, FiFileText } from "react-icons/fi";
import axios from "../../../api/axios";
import { PUBLIC_PROFILE_GET_URL } from "../../../api/api_routing_urls";
import { getStoredUser, formatDobForAge } from "../../../utils/user.utils";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";

export default function PublicProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      setLoading(false);
      return;
    }

    const userId = storedUser._id || storedUser.userId;
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
  }, []);

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
  const docLabel = (key) =>
    key === "aadhaarCard"
      ? "Aadhaar Card"
      : key === "birthCertificate"
        ? "Birth Certificate"
        : "Certificate of Identification";

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
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
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <button
            type="button"
            onClick={() => navigate("/user/complete-profile")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#f43a09] text-white rounded-lg hover:bg-[#ffb766] font-medium transition-colors"
          >
            <FiEdit2 size={18} />
            Edit profile
          </button>
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
                {user.kycLevel && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      user.kycLevel === "FULL"
                        ? "bg-[#c2edda]/30 text-black"
                        : user.kycLevel === "PARTIAL"
                          ? "bg-[#68d388]/25 text-black"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    KYC: {user.kycLevel}
                  </span>
                )}
                {user.status?.verificationStatus && (
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    {user.status.verificationStatus === "verified"
                      ? "✔ Verified"
                      : user.status.verificationStatus === "pending"
                        ? "Pending verification"
                        : user.status.verificationStatus}
                  </span>
                )}
              </div>
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

        {/* Documents */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FiFileText /> Documents
          </h3>
          <div className="space-y-3">
            {["aadhaarCard", "birthCertificate", "certificateOfIdentification"].map(
              (key) => {
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
                        className="text-[#f43a09] hover:text-[#ffb766] text-sm font-medium"
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

