/* eslint-disable no-unused-vars */
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../../../api/axios";
import { PROFILE_URL } from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import { getStoredUser } from "../../../utils/user.utils";
import { useEffect, useState } from "react";
import skGovtLogo from "../../../assets/sikkim_gov.png";
import ApplicantSwitcherDropdown from "./ApplicantSwitcherDropdown";

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // OTP account (avatar / mobile line) — not the active beneficiary
  useEffect(() => {
    const storedUser = getStoredUser();

    const fetchUserProfile = async () => {
      if (!storedUser?._id && !storedUser?.userId) {
        // Fallback to stored user if no ID
        if (storedUser) {
          setUser(storedUser);
        }
        return;
      }

      try {
        const userId = storedUser._id || storedUser.userId;
        if (!userId) {
          // No user ID, use stored user as fallback
          if (storedUser) {
            setUser(storedUser);
          }
          return;
        }
        
        // Try path parameter first, then query parameter as fallback
        let response;
        try {
          response = await axios.get(`${PROFILE_URL}/${userId}`);
        } catch (pathError) {
          // If path parameter fails (404), try query parameter
          if (pathError.response?.status === 404) {
            // Try query parameter as fallback
            try {
          response = await axios.get(`${PROFILE_URL}?user_id=${userId}`);
            } catch (queryError) {
              // Both endpoints failed, use stored user
              if (storedUser) {
                setUser(storedUser);
              }
              return;
            }
          } else {
            // Non-404 error, use stored user
            if (storedUser) {
              setUser(storedUser);
            }
            return;
          }
        }
        
        if (response && response.status === 200 && response.data?.user) {
          setUser(response.data.user);
        } else {
          // API response doesn't have user data, use stored user
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } catch (error) {
        // Only log non-404 errors (404 is expected if endpoint doesn't exist)
        if (error.response?.status !== 404) {
          console.error("fetchUserProfile error:", error);
        }
        // Fallback to stored user if API fails
        if (storedUser) {
          setUser(storedUser);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/user/dashboard" className="flex items-center gap-3">
            <img src={skGovtLogo} alt="Logo" className="h-6 w-6 object-contain" />
            <span className="text-xl font-bold text-[#d85a30]">
              WelfareConnect
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/user/dashboard")}
              className={`font-medium transition-colors ${
                isActive("/user/dashboard")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/user/schemes")}
              className={`font-medium transition-colors ${
                isActive("/user/schemes")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              Schemes
            </button>
            <button
              onClick={() => navigate("/user/applications")}
              className={`font-medium transition-colors ${
                isActive("/user/applications")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => navigate("/user/household-members")}
              className={`font-medium transition-colors ${
                isActive("/user/household-members")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              Household
            </button>
          </nav>

          {/* Right side - Profile and Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ApplicantSwitcherDropdown />

            {/* Profile Picture */}
            {user && (
              <button
                onClick={() => navigate("/user/profile")}
                className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d85a30] focus:ring-offset-2"
              >
                {user.photo?.url ? (
                  <img
                    src={displayMedia(user.photo.url)}
                    alt={user.fullName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#c2edda] to-[#d85a30] flex items-center justify-center text-white font-bold">
                    {(user.fullName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

