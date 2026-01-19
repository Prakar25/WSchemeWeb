/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { ADMIN_PROFILE_URL } from "../../api/api_routing_urls";

import PublicSidebar from "../public/dashboard/PublicSidebar";
import SysAdminSidebar from "../systemAdmin/dashboard/SysAdminSidebar";

function Sidebar({ sidebarOpen, setSidebarOpen, sidebarType }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const navigate = useNavigate();

  // Get admin credentials helper
  const getAdminCredentials = () => {
    return {
      username: sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username"),
      password: sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password"),
    };
  };

  // Fetch admin profile for System Admin
  useEffect(() => {
    if (sidebarType === "System Admin") {
      const fetchAdminProfile = async () => {
        try {
          const credentials = getAdminCredentials();
          const params = new URLSearchParams();
          if (credentials.username) params.append("username", credentials.username);
          if (credentials.password) params.append("password", credentials.password);

          const response = await axios.get(
            `${ADMIN_PROFILE_URL}?${params.toString()}`
          );
          console.log("Admin profile API response:", response.data);
          if (response.data.status === "success" && response.data.user) {
            const userData = response.data.user;
            // Normalize roleLevel (handle both camelCase and snake_case)
            const roleLevel = userData.roleLevel || userData.role_level || userData.roleLevel;
            if (roleLevel !== undefined) {
              userData.roleLevel = roleLevel;
            }
            console.log("Admin profile fetched - userData:", userData);
            console.log("Admin profile - roleLevel value:", userData.roleLevel);
            console.log("Admin profile - department:", userData.department);
            console.log("Admin profile - departmentId:", userData.departmentId || userData.department_id);
            setAdminProfile(userData);
          }
        } catch (err) {
          console.error("Error fetching admin profile:", err);
          // Fallback to localStorage user if API fails
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              setAdminProfile(JSON.parse(storedUser));
            } catch (e) {
              console.error("Error parsing stored user:", e);
            }
          }
        }
      };

      fetchAdminProfile();
    }
  }, [sidebarType]);

  // Fetch localStorage user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (!storedUser) {
      // Not logged in or wrong access
      navigate("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    setUserRole(storedRole);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef(null);
  const sidebar = useRef(null);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const [showSubConfig, setShowSubConfig] = useState(true);

  const configClickHandler = () => {
    setShowSubConfig(!showSubConfig);
  };

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded);
    if (sidebarExpanded) {
      document.querySelector("body").classList.add("sidebar-expanded");
    } else {
      document.querySelector("body").classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <div>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-slate-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`bg-blue-900 flex flex-col hide-sidebar-scrollbar absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto  
        lg:translate-x-0 transform h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-[16rem]
        lg:sidebar-expanded:!w-[16rem] shrink-0  pb-32  p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-44"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-5 pr-3 border-b border-white pb-3">
          <button
            ref={trigger}
            className="lg:hidden text-white hover:text-gray-200"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
            }}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>

          {sidebarType === "System Admin" ? (
            <NavLink end to="#" className="block w-full">
              {sidebarExpanded && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="white"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-base font-semibold truncate">
                      {adminProfile?.fullName || user?.fullName || "Welfare Admin"}
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {adminProfile?.role && (
                        <p className="text-white text-xs font-medium truncate">
                          {adminProfile.role}
                        </p>
                      )}
                      {adminProfile?.roleLevel !== undefined && adminProfile?.roleLevel !== null && adminProfile?.roleLevel !== 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/25 text-white border border-white/30">
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
                      {!adminProfile?.role && !adminProfile?.roleLevel && (
                        <p className="text-white text-xs text-gray-200 truncate">
                          Manage welfare programs
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </NavLink>
          ) : (
            <NavLink end to="#" className="block">
              <div className="flex items-center">
                {sidebarExpanded && (
                  <div className="flex gap-1 items-center">
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1"
                        stroke="currentColor"
                        className="size-[45px] text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="text-white text-base font-medium">
                        {user?.fullName}
                      </p>

                      <p className="text-white text-xs">{userRole}</p>
                    </div>
                  </div>
                )}
              </div>
            </NavLink>
          )}
        </div>

        {sidebarType === "Public User" && (
          <PublicSidebar
            pathname={pathname}
            sidebarExpanded={sidebarExpanded}
            setSidebarExpanded={setSidebarExpanded}
          />
        )}

        {sidebarType === "System Admin" && (
          <SysAdminSidebar
            pathname={pathname}
            sidebarExpanded={sidebarExpanded}
            setSidebarExpanded={setSidebarExpanded}
          />
        )}
      </div>
    </div>
  );
}

export default Sidebar;