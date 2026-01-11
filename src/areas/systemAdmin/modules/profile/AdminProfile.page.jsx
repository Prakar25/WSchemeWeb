import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../../api/axios";
import { ADMIN_PROFILE_URL } from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";

function AdminProfile() {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get admin credentials helper
  const getAdminCredentials = () => {
    return {
      username: sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username"),
      password: sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password"),
    };
  };

  // Fetch admin profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const credentials = getAdminCredentials();
        const params = new URLSearchParams();
        if (credentials.username) params.append("username", credentials.username);
        if (credentials.password) params.append("password", credentials.password);

        const response = await axios.get(
          `${ADMIN_PROFILE_URL}?${params.toString()}`
        );
        console.log("Admin profile API response (profile page):", response.data);
        if (response.data.status === "success" && response.data.user) {
          const userData = response.data.user;
          // Normalize roleLevel (handle both camelCase and snake_case)
          const roleLevel = userData.roleLevel || userData.role_level || userData.roleLevel;
          if (roleLevel !== undefined) {
            userData.roleLevel = roleLevel;
          }
          console.log("Admin profile fetched (profile page) - userData:", userData);
          console.log("Admin profile (profile page) - roleLevel value:", userData.roleLevel);
          setAdminProfile(userData);
        } else {
          setError("Failed to load profile data");
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
        if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
          setError("Unable to connect to server. Please ensure the backend is running.");
        } else {
          setError("Failed to load profile. Please try again later.");
        }
        // Fallback to localStorage user if API fails
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setAdminProfile(JSON.parse(storedUser));
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const getRoleLevelDescription = (level) => {
    const descriptions = {
      1: "Super Admin - Highest authority",
      2: "Admin - High authority",
      3: "Department Secretary - Senior authority",
      4: "Department Head - Mid-level authority",
      5: "Department User - Standard authority",
      6: "DistrictHQ Head - District authority",
      7: "District Overlookers - Field authority",
      8: "Post Operator - Basic authority",
    };
    return descriptions[level] || `Level ${level}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your profile information</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error && !adminProfile ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : adminProfile ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 rounded-t-lg">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-12 h-12 text-blue-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{adminProfile.fullName || "Admin User"}</h2>
                  <p className="text-blue-100 mt-1">{adminProfile.role || "System Admin"}</p>
                  {adminProfile.roleLevel !== undefined && adminProfile.roleLevel !== null && adminProfile.roleLevel !== 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                        Level {adminProfile.roleLevel}
                      </span>
                      {adminProfile.roleLevel === 1 && (
                        <span className="text-xs text-yellow-300 font-medium">(Highest)</span>
                      )}
                      {adminProfile.roleLevel === 8 && (
                        <span className="text-xs text-gray-300 font-medium">(Lowest)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Personal Information
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 mt-1">{adminProfile.fullName || "N/A"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-gray-900 mt-1">{adminProfile.username || "N/A"}</p>
                  </div>

                  {adminProfile.contactNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Number</label>
                      <p className="text-gray-900 mt-1">{adminProfile.contactNumber}</p>
                    </div>
                  )}
                </div>

                {/* Role & Authority */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Role & Authority
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-gray-900 mt-1">{adminProfile.role || "N/A"}</p>
                  </div>

                  {adminProfile.roleLevel !== undefined && adminProfile.roleLevel !== null && adminProfile.roleLevel !== 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Authority Level</label>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-blue-100 text-blue-800">
                          Level {adminProfile.roleLevel}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {getRoleLevelDescription(adminProfile.roleLevel)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          adminProfile.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {adminProfile.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              {(adminProfile.createdAt || adminProfile.updatedAt) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {adminProfile.createdAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Created</label>
                        <p className="text-gray-900 mt-1">{formatDate(adminProfile.createdAt)}</p>
                      </div>
                    )}
                    {adminProfile.updatedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-gray-900 mt-1">{formatDate(adminProfile.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">No profile data available.</p>
          </div>
        )}
      </div>
    </Dashboard>
  );
}

export default AdminProfile;

