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
import { SCHEMES_CONFIG_URL, PROFILE_URL, DEPARTMENTS_URL, CATEGORIES_URL, APPLICATIONS_USER_URL, PUBLIC_PROFILE_GET_URL } from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";
import { getStoredUser, isProfileComplete } from "../../../utils/user.utils";
import { formatDateInDDMonYYYY } from "../../../utils/dateFunctions/formatdate";
import ViewSchemeDetails from "./viewSchemeDetails.component";
import Footer from "../footer.component";
import PublicHeader from "../components/PublicHeader.component";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiX } from "react-icons/fi";

export default function PublicDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [schemesList, setSchemesList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");

  const AGE_OPTIONS = [
    { value: "", label: "Age Group" },
    { value: "all", label: "All" },
    { value: "20-30", label: "20-30" },
    { value: "30-40", label: "30-40" },
    { value: "40-50", label: "40-50" },
    { value: "50-60", label: "50-60" },
    { value: "60-70", label: "60-70" },
    { value: "70_and_above", label: "70+" },
  ];
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

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
            // Check if profile is incomplete
            if (!isProfileComplete(storedUser)) {
              setShowProfilePrompt(true);
            }
          }
          return;
        }
        
        // Try new profile endpoint first
        try {
          const profileResponse = await axios.get(PUBLIC_PROFILE_GET_URL, {
            params: { userId },
          });
          
          if (profileResponse.data.status === "success" && profileResponse.data.user) {
            const userData = profileResponse.data.user;
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            
            // Check if profile is incomplete
            if (!isProfileComplete(userData)) {
              setShowProfilePrompt(true);
            }
            return;
          }
        } catch (profileError) {
          // Silently handle errors - backend might not have endpoint yet or server error
          // Only try old endpoint if it's not a network/server error
          if (profileError.response?.status && profileError.response.status !== 500 && profileError.response.status !== 404) {
            // Only log unexpected errors (not 500, not 404, not network)
            if (profileError.code !== "ERR_NETWORK") {
              console.log("New profile endpoint failed, trying old endpoint");
            }
          }
        }
        
        // Fallback to old profile endpoint (only if new one didn't work)
        try {
          const response = await axios.get(`${PROFILE_URL}/${userId}`);
          
          if (response && response.status === 200 && response.data?.user) {
            const userData = response.data.user;
            setUser(userData);
            // Check if profile is incomplete
            if (!isProfileComplete(userData)) {
              setShowProfilePrompt(true);
            }
            return;
          }
        } catch (oldEndpointError) {
          // Silently handle - will fall back to localStorage
        }
        
        // Fallback to stored user if API fails
        if (storedUser) {
          setUser(storedUser);
          if (!isProfileComplete(storedUser)) {
            setShowProfilePrompt(true);
          }
        }
      } catch (error) {
        // Silently fall back to stored user for any error
        if (storedUser) {
          setUser(storedUser);
          if (!isProfileComplete(storedUser)) {
            setShowProfilePrompt(true);
          }
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
        if (ageGroupFilter && ageGroupFilter !== "all") {
          params.append("age_group", ageGroupFilter);
        }
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
        // Silently handle errors - backend might be down or endpoint not available
        // Only log unexpected errors (not network/server errors)
        if (error.code !== "ERR_NETWORK" && error.response?.status !== 500) {
          console.error("getSchemesList", error);
        }
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
        // Silently handle errors - backend might be down or endpoint not available
        // Only log unexpected errors (not network/server errors)
        if (error.code !== "ERR_NETWORK" && error.response?.status !== 500) {
          console.error("Error fetching applications:", error);
        }
        setApplications([]);
      }
    };

    if (user || storedUser) {
      fetchApplications();
    }
  }, [user, ageGroupFilter]);

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
      bg: "bg-[#c2edda]/30",
      text: "text-black",
      icon: <FaCheckCircle className="text-[#f43a09]" />,
    },
    "Under Review": {
      bg: "bg-[#68d388]/25",
      text: "text-black",
      icon: <FaTrophy className="text-[#68d388]" />,
    },
    Applied: {
      bg: "bg-[#c2edda]/30",
      text: "text-black",
      icon: <FaFileAlt className="text-[#f43a09]" />,
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
      <div className="min-h-screen bg-gradient-to-b from-[#68d388]/20 via-white to-[#c2edda]/20 flex flex-col">
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
    <div className="min-h-screen bg-gradient-to-b from-[#68d388]/20 via-white to-[#c2edda]/20 flex flex-col">
      <PublicHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero & Dashboard Title */}
        <div className="mb-8 text-center">
          <p className="text-black text-sm font-medium font-montserrat tracking-wide uppercase mb-1">
            Welcome to WelfareConnect
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black font-montserrat">
            Welcome, {user?.fullName?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-black mt-1">
            Here are schemes you can apply for and your application status.
          </p>
        </div>

        {/* Verification status message (when not verified) */}
        {user?.accountStatusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-[#c2edda]/20/90 backdrop-blur border border-[#f43a09]/30 p-4 rounded-xl shadow-sm"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#c2edda] flex items-center justify-center">
                <FiAlertCircle className="text-[#f43a09] text-xl" />
              </div>
              <p className="text-black text-sm font-medium pt-1.5">{user.accountStatusMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Profile Completion Prompt */}
        {showProfilePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-[#c2edda]/20 to-[#68d388]/20 border border-[#f43a09]/30 p-5 rounded-2xl shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#c2edda] flex items-center justify-center">
                  <FiAlertCircle className="text-[#f43a09] text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-black mb-1 font-montserrat">
                    Complete Your Profile
                  </h3>
                  <p className="text-black/90 text-sm mb-4">
                    Your profile is incomplete. Complete it to apply for schemes and access all features.
                  </p>
                  <button
                    onClick={() => navigate("/user/complete-profile")}
                    className="bg-[#f43a09] hover:bg-[#ffb766] text-white font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    Complete Profile Now
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowProfilePrompt(false)}
                className="flex-shrink-0 text-[#f43a09] hover:text-black hover:bg-[#c2edda] rounded-lg p-2 transition-colors"
                aria-label="Dismiss"
              >
                <FiX size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {/* User Profile Summary Card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-white shadow-lg">
                  {user.photo?.url ? (
                    <img
                      src={displayMedia(user.photo.url)}
                      alt={user.fullName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#68d388] via-[#f43a09] to-[#c2edda] flex items-center justify-center text-white text-2xl font-bold font-montserrat">
                      {(user.fullName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#f43a09] border-2 border-white" />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-black font-montserrat">
                  {user.fullName || "User Name"}
                </h2>
                <p className="text-black text-sm mt-1 font-medium">
                  Aadhaar: {maskAadhaar(user.aadhaarNumber)}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#c2edda]/50 text-black rounded-xl text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#f43a09] animate-pulse" />
                  Eligible: {getEligibilityStatus(user)}
                </span>
              </div>

              <button
                onClick={() => navigate("/user/profile")}
                className="hidden sm:flex items-center gap-2 text-black hover:text-black font-medium text-sm transition-colors"
              >
                View Profile
                <span className="text-slate-400">→</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Available Schemes Section */}
        <div className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black font-montserrat">
              Available Schemes
            </h2>
            <button
              onClick={() => navigate("/user/schemes")}
              className="text-[#f43a09] hover:text-[#c2edda] font-semibold text-sm flex items-center gap-1"
            >
              View all schemes
              <span>→</span>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="w-1/2 min-w-[320px] max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 p-4 sm:p-5 mb-6 border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search schemes by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f43a09]/50 focus:border-[#f43a09] transition-all"
                  />
                </div>
                {/* Age Group Filter */}
                <select
                  value={ageGroupFilter}
                  onChange={(e) => setAgeGroupFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f43a09]/50 focus:border-[#f43a09] bg-white min-w-[160px]"
                >
                  {AGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f43a09]/50 focus:border-[#f43a09] bg-white min-w-[160px]"
                >
                <option value="All">All Categories</option>
                <option value="Pension">Pension</option>
                <option value="Education">Education</option>
                <option value="Health">Health</option>
              </select>
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
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className={`group bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 overflow-hidden cursor-pointer transition-all duration-300 ${
                    isEligible
                      ? "hover:shadow-xl hover:shadow-[#68d388]/50 hover:-translate-y-1 hover:border-[#68d388]/60"
                      : "opacity-65 grayscale-[0.3] hover:opacity-75"
                  }`}
                  onClick={() => handleSchemeClick(scheme)}
                >
                  {/* Scheme Image */}
                  <div className="h-40 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {scheme.scheme_image_file_url ? (
                      <img
                        src={displayMedia(scheme.scheme_image_file_url)}
                        alt={scheme.scheme_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-slate-400/60 text-5xl font-bold font-montserrat">
                          {(scheme.scheme_name || "S").charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          schemeType === "STATE"
                            ? "bg-[#c2edda]/20 text-black"
                            : "bg-[#68d388]/20 text-black"
                        }`}
                      >
                        {schemeType}
                      </span>
                      {!isEligible && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                          Not Eligible
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-black mb-3 font-montserrat line-clamp-2 group-hover:text-[#c2edda] transition-colors">
                      {scheme.scheme_name}
                    </h3>

                    <div className="mb-4 space-y-2">
                      <p className="text-xs text-black">
                        {scheme.scheme_eligibility
                          ? `Age ${scheme.scheme_eligibility.lower_age_limit || "N/A"}–${scheme.scheme_eligibility.upper_age_limit || "N/A"} yrs`
                          : "See details"}
                      </p>
                      {!isEligible && eligibilityReason && (
                        <p className="text-xs text-red-600 italic">{eligibilityReason}</p>
                      )}
                      <p className="text-sm text-black line-clamp-2">
                        {Array.isArray(scheme.scheme_benefits) && scheme.scheme_benefits.length > 0
                          ? scheme.scheme_benefits[0]
                          : "Check scheme for benefits"}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSchemeClick(scheme);
                      }}
                      disabled={!isEligible}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                        isEligible
                          ? "bg-[#f43a09] hover:bg-[#68d388] text-white shadow-sm hover:shadow-md active:scale-[0.98]"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isEligible ? "Apply Now" : "View Details"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredSchemes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 px-6 bg-slate-50/80 rounded-2xl border border-slate-100"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-200/60 flex items-center justify-center">
                <FaSearch className="text-slate-400 text-2xl" />
              </div>
              <p className="text-black font-medium">No schemes found</p>
              <p className="text-black text-sm mt-1">Try adjusting your search or category filter.</p>
            </motion.div>
          )}
        </div>

        {/* Application Status Tracker */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black font-montserrat">
              Application Status
            </h2>
            <button
              onClick={() => navigate("/user/applications")}
              className="text-[#f43a09] hover:text-[#c2edda] font-semibold text-sm flex items-center gap-1"
            >
              View all applications
              <span>→</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                      Date Applied
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-black uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                            <FaFileAlt className="text-slate-400 text-xl" />
                          </div>
                          <div>
                            <p className="text-black font-medium">No applications yet</p>
                            <p className="text-black text-sm mt-0.5">Apply for schemes to track your status here.</p>
                          </div>
                          <button
                            onClick={() => navigate("/user/schemes")}
                            className="text-[#f43a09] hover:text-[#c2edda] font-semibold text-sm"
                          >
                            Browse schemes →
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app, index) => {
                      const status = statusConfig[app.status] || statusConfig.Applied;
                      const dateApplied = app.date_applied
                        ? formatDateInDDMonYYYY(app.date_applied)
                        : "N/A";

                      return (
                        <tr key={app._id || app.applicationId || index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-black">
                              {app.schemeName || app.scheme_name || "N/A"}
                            </div>
                            {app.verification_stage_display && (
                              <div className="text-xs text-black mt-0.5">
                                {app.verification_stage_display}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${status.bg} ${status.text}`}
                            >
                              {status.icon}
                              {app.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-black">
                            {dateApplied}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => navigate("/user/applications")}
                              className="text-[#f43a09] hover:text-[#c2edda] font-semibold text-sm"
                            >
                              View
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
