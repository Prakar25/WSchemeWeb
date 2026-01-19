/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaTrophy,
  FaSearch,
} from "react-icons/fa";

import axios from "../../../api/axios";
import { SCHEMES_CONFIG_URL, PROFILE_URL, DEPARTMENTS_URL, CATEGORIES_URL, APPLICATIONS_USER_URL } from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import { getStoredUser } from "../../../utils/user.utils";
import { formatDateInDDMonYYYY } from "../../../utils/dateFunctions/formatdate";
import ViewSchemeDetails from "./viewSchemeDetails.component";
import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";

export default function PublicDashboard() {
  const [user, setUser] = useState(null);
  const [schemesList, setSchemesList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>

  // Fetch departments and categories for lookup maps
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        // Fetch departments
        const deptResponse = await axios.get(DEPARTMENTS_URL);
        if (deptResponse.status === 200) {
          const deptData = deptResponse.data?.departments || deptResponse.data || [];
          const deptMap = new Map();
          deptData.forEach((dept) => {
            deptMap.set(dept._id, dept);
          });
          setDepartments(deptMap);
        }

        // Fetch categories
        const catResponse = await axios.get(CATEGORIES_URL);
        if (catResponse.status === 200) {
          const catData = catResponse.data?.categories || catResponse.data || [];
          const catMap = new Map();
          catData.forEach((cat) => {
            catMap.set(cat._id, cat);
          });
          setCategories(catMap);
        }
      } catch (error) {
        console.error("Error fetching departments/categories:", error);
      }
    };

    fetchLookups();
  }, []);

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
        if (!userId) {
          // No user ID, use stored user as fallback
          if (storedUser) {
            setUser(storedUser);
          }
          return;
        }
        
        const response = await axios.get(`${PROFILE_URL}/${userId}`);
        
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

    // Fetch schemes with user_id if available
    // Public users should only see approved schemes
    const getSchemesList = async () => {
      try {
        const userId = user?._id || user?.userId || storedUser?._id || storedUser?.userId;
        const params = new URLSearchParams();
        params.append("approved_only", "true");
        
        if (userId) {
          params.append("user_id", userId);
          params.append("filter_type", "applicant"); // Use applicant filter when user_id is provided
        } else {
          params.append("filter_type", "scheme"); // Use scheme filter when no user_id
        }
        
        const url = `${SCHEMES_CONFIG_URL}?${params.toString()}`;
        const response = await axios.get(url);
        if (response.status === 200) {
          const schemes = Array.isArray(response.data) ? response.data : [];
          // Additional client-side filter to ensure only approved schemes
          const approvedSchemes = schemes.filter(scheme => 
            !scheme.approval_status || scheme.approval_status === "approved"
          );
          setSchemesList(approvedSchemes);
        }
      } catch (error) {
        console.error("getSchemesList", error);
      }
    };

    getSchemesList();

    // Fetch user applications
    const fetchApplications = async () => {
      try {
        const userId = user?._id || user?.userId || storedUser?._id || storedUser?.userId;
        if (!userId) {
          setApplications([]);
          return;
        }

        const response = await axios.get(`${APPLICATIONS_USER_URL}/${userId}`);
        if (response.status === 200 && response.data?.status === "success") {
          const apps = response.data.data || [];
          // Show only recent applications (limit to 3 for dashboard)
          setApplications(apps.slice(0, 3));
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        setApplications([]);
      }
    };

    if (user || storedUser) {
      fetchApplications();
    }
  }, [user]);

  // Mask Aadhaar number for display
  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return "**** **** ****";
    const str = aadhaar.toString().replace(/\s/g, "");
    if (str.length >= 4) {
      return `**** **** ${str.slice(-4)}`;
    }
    return "**** **** ****";
  };

  // Get eligibility status from profile API
  const getEligibilityStatus = (user) => {
    return user?.eligibilityStatus || 
           user?.economicStatus?.category || 
           "Not Specified";
  };

  // Filter schemes based on search and filters
  const filteredSchemes = schemesList.filter((scheme) => {
    const matchesSearch =
      scheme.scheme_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.scheme_description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Department and category are now ObjectId strings
    const categoryObj = categories.get(scheme.category);
    const schemeCategory = categoryObj 
      ? (categoryObj.category_display_name || categoryObj.category_name)
      : scheme.category;

    const matchesCategory =
      categoryFilter === "All" || schemeCategory === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Get status config
  const statusConfig = {
    Approved: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <FaCheckCircle className="text-green-600" />,
    },
    "Under Review": {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: <FaTrophy className="text-yellow-600" />,
    },
    Applied: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <FaFileAlt className="text-blue-600" />,
    },
    Rejected: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <FaClock className="text-red-600" />,
    },
  };


  // Reset scroll position when scheme is selected or closed
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedScheme]);

  const handleSchemeClick = (scheme) => {
    setSelectedScheme(scheme);
  };

  const handleCloseScheme = () => {
    setSelectedScheme(null);
  };

  // If a scheme is selected, show the detail view
  if (selectedScheme) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PublicHeader />
        <ViewSchemeDetails
          scheme={selectedScheme}
          onClose={handleCloseScheme}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Public User Dashboard
        </h1>

        {/* User Profile Summary */}
        {user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex items-center gap-6">
              {/* Profile Picture */}
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.photo?.url ? (
                  <img
                    src={displayMedia(user.photo.url)}
                    alt={user.fullName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-2xl font-bold">
                    {(user.fullName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.fullName || "User Name"}
                </h2>
                <p className="text-gray-600 mt-1">
                  Aadhaar: {maskAadhaar(user.aadhaarNumber)}
                </p>
                <span className="inline-block mt-2 px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Eligible: {getEligibilityStatus(user)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Available Schemes Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Available Schemes
          </h2>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">Category</option>
                <option value="Pension">Pension</option>
                <option value="Education">Education</option>
                <option value="Health">Health</option>
              </select>

              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for schemes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Scheme Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.slice(0, 6).map((scheme, index) => {
              // Use isEligible from API response (defaults to true if not provided for backward compatibility)
              const isEligible = scheme.isEligible !== undefined ? scheme.isEligible : true;
              const eligibilityReason = scheme.eligibilityReason || null;
              const schemeCategory = typeof scheme.category === "object"
                ? scheme.category.category_display_name || scheme.category.category_name
                : scheme.category;
              const schemeType = schemeCategory || "STATE"; // Determine if STATE or CENTRAL

              return (
                <motion.div
                  key={scheme._id || scheme.scheme_id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all cursor-pointer ${
                    isEligible 
                      ? "hover:shadow-lg" 
                      : "opacity-60 grayscale hover:opacity-70"
                  }`}
                  onClick={() => handleSchemeClick(scheme)}
                >
                  {/* Scheme Image */}
                  {scheme.scheme_image_file_url && (
                    <div className="h-48 w-full overflow-hidden">
                      <img
                        src={displayMedia(scheme.scheme_image_file_url)}
                        alt={scheme.scheme_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    {/* Scheme Type Badge and Title */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          schemeType === "STATE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {schemeType} SCHEME
                      </span>
                      {!isEligible && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          Not Eligible
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {scheme.scheme_name}
                    </h3>

                    {/* Eligibility */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Eligibility:
                      </p>
                      <p className="text-sm text-gray-700">
                        {scheme.scheme_eligibility
                          ? `Age: ${scheme.scheme_eligibility.lower_age_limit || "N/A"} - ${scheme.scheme_eligibility.upper_age_limit || "N/A"} years`
                          : "Check scheme details"}
                      </p>
                      {!isEligible && eligibilityReason && (
                        <p className="text-xs text-red-600 mt-1 italic">
                          {eligibilityReason}
                        </p>
                      )}
                    </div>

                    {/* Benefits */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Benefits:
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {Array.isArray(scheme.scheme_benefits) &&
                        scheme.scheme_benefits.length > 0
                          ? scheme.scheme_benefits[0]
                          : "See scheme details"}
                      </p>
                    </div>

                    {/* Apply Now Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSchemeClick(scheme);
                      }}
                      disabled={!isEligible}
                      className={`w-full py-3 rounded-md font-semibold text-sm transition-colors ${
                        isEligible
                          ? schemeType === "STATE"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Apply Now
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredSchemes.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No schemes found matching your criteria.
            </p>
          )}
        </div>

        {/* Application Status Tracker */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Application Status Tracker
          </h2>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SCHEME
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      DATE APPLIED
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app, index) => {
                      const status = statusConfig[app.status] || statusConfig.Applied;
                      const dateApplied = app.date_applied 
                        ? formatDateInDDMonYYYY(app.date_applied) 
                        : "N/A";

                      return (
                        <tr key={app._id || app.applicationId || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {app.schemeName || app.scheme_name || "N/A"}
                            </div>
                            {app.verification_stage_display && (
                              <div className="text-xs text-gray-500 mt-1">
                                {app.verification_stage_display}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
                            >
                              {status.icon}
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dateApplied}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-800 font-semibold">
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
