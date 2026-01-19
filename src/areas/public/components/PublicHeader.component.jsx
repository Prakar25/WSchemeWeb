/* eslint-disable no-unused-vars */
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import axios from "../../../api/axios";
import { PROFILE_URL } from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import { getStoredUser } from "../../../utils/user.utils";
import { useEffect, useState } from "react";
import skGovtLogo from "../../../assets/sikkim_gov.png";

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    
    // Fetch user profile from API for updated data
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("sidebar-expanded");
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/user/dashboard" className="flex items-center gap-3">
            <img src={skGovtLogo} alt="Logo" className="h-12 w-12 object-contain" />
            <span className="text-xl font-bold text-green-600">
              WelfareConnect
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/user/dashboard")}
              className={`font-medium transition-colors ${
                isActive("/user/dashboard")
                  ? "text-green-600 font-semibold"
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/user/schemes")}
              className={`font-medium transition-colors ${
                isActive("/user/schemes")
                  ? "text-green-600 font-semibold"
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              Schemes
            </button>
            <button
              onClick={() => navigate("/user/applications")}
              className={`font-medium transition-colors ${
                isActive("/user/applications")
                  ? "text-green-600 font-semibold"
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              My Applications
            </button>
          </nav>

          {/* Right side - Notification, Profile, and Logout */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative cursor-pointer">
              <FaBell className="text-gray-600 text-xl" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                1
              </span>
            </div>

            {/* Profile Picture */}
            {user && (
              <button
                onClick={() => navigate("/user/profile")}
                className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {user.photo?.url ? (
                  <img
                    src={displayMedia(user.photo.url)}
                    alt={user.fullName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white font-bold">
                    {(user.fullName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 cursor-pointer transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

