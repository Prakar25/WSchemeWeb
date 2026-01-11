/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "../../api/axios";
import { ADMIN_PROFILE_URL } from "../../api/api_routing_urls";

import { FiLogOut } from "react-icons/fi";

import Logo from "../../assets/sikkim_gov.png";

function Header({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState(null);

  // Get admin credentials helper
  const getAdminCredentials = () => {
    return {
      username: sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username"),
      password: sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password"),
    };
  };

  // Fetch admin profile if System Admin
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole === "System Admin") {
      const fetchAdminProfile = async () => {
        try {
          const credentials = getAdminCredentials();
          const params = new URLSearchParams();
          if (credentials.username) params.append("username", credentials.username);
          if (credentials.password) params.append("password", credentials.password);

          const response = await axios.get(
            `${ADMIN_PROFILE_URL}?${params.toString()}`
          );
          console.log("Admin profile API response (header):", response.data);
          if (response.data.status === "success" && response.data.user) {
            const userData = response.data.user;
            // Normalize roleLevel (handle both camelCase and snake_case)
            const roleLevel = userData.roleLevel || userData.role_level || userData.roleLevel;
            if (roleLevel !== undefined) {
              userData.roleLevel = roleLevel;
            }
            console.log("Admin profile fetched (header) - userData:", userData);
            console.log("Admin profile (header) - roleLevel value:", userData.roleLevel);
            setAdminProfile(userData);
          }
        } catch (err) {
          console.error("Error fetching admin profile:", err);
        }
      };

      fetchAdminProfile();
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("sidebar-expanded");
    sessionStorage.removeItem("admin_username");
    sessionStorage.removeItem("admin_password");
    navigate("/");
  };

  return (
    <header className="sticky top-0 bg-white border-b border-blue-900 z-20">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Header: Left side */}

          <NavLink end to="/" className="block">
            <div className="flex items-center">
              <img src={Logo} className="h-12 w-16" />
              {
                <p className="text-slate-800 text-sm font-medium">
                  Women &amp; Child Welfare Department, Government of Sikkim
                </p>
              }
            </div>
          </NavLink>

          <div className="flex">
            {/* Hamburger button */}
            <button
              className="text-slate-500 hover:text-slate-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center gap-3">
            {adminProfile && (
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-gray-700 font-medium">
                  {adminProfile.fullName}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{adminProfile.role}</span>
                {adminProfile.roleLevel !== undefined && adminProfile.roleLevel !== null && adminProfile.roleLevel !== 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      Level {adminProfile.roleLevel}
                    </span>
                  </>
                )}
              </div>
            )}
            <p
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 border border-gray-200 py-1.5 px-4 bg-white text-primary rounded-md text-sm font-medium hover:bg-blue-800 hover:text-white cursor-pointer transition-all duration-300 ease-in-out"
            >
              <FiLogOut size={16} />
              Logout
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
