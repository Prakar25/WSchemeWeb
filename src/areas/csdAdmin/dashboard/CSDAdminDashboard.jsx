/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdPersonAdd, MdAssignment } from "react-icons/md";
import axios from "../../../api/axios";
import {
  CSD_PENDING_PUBLIC_USERS_URL,
  CSD_PENDING_APPLICATIONS_URL,
  ADMIN_PROFILE_URL,
} from "../../../api/api_routing_urls";
import Dashboard from "../../dashboard-components/dashboard.component";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import Spinner from "../../../reusable-components/spinner/spinner.component";

export default function CSDAdminDashboard() {
  const navigate = useNavigate();
  const [pendingRegistrationsCount, setPendingRegistrationsCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canAccess, setCanAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const getCredentials = () => ({
    username: sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username"),
    password: sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password"),
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setCheckingAccess(true);
        const creds = getCredentials();
        if (!creds.username || !creds.password) {
          setCanAccess(false);
          navigate("/login", { replace: true });
          setCheckingAccess(false);
          return;
        }
        const params = new URLSearchParams();
        params.append("username", creds.username);
        params.append("password", creds.password);
        const response = await axios.get(`${ADMIN_PROFILE_URL}?${params.toString()}`);
        if (response.status === 200 && response.data?.user) {
          const user = response.data.user;
          const role = (user.role || "").trim();
          const allowed = role === "CSDAdmin";
          setCanAccess(!!allowed);
          if (!allowed) {
            const storedRole = localStorage.getItem("role");
            if (storedRole === "System Admin") {
              navigate("/system-admin/dashboard", { replace: true });
            } else {
              navigate("/login", { replace: true });
            }
          }
        } else {
          setCanAccess(false);
          navigate("/login", { replace: true });
        }
      } catch (err) {
        setCanAccess(false);
        navigate("/login", { replace: true });
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [navigate]);

  useEffect(() => {
    if (!canAccess || checkingAccess) return;
    const fetchCounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const creds = getCredentials();
        const params = new URLSearchParams();
        if (creds.username) params.append("username", creds.username);
        if (creds.password) params.append("password", creds.password);

        // Fetch pending public users (registrations)
        try {
          const regResponse = await axios.get(
            `${CSD_PENDING_PUBLIC_USERS_URL}?${params.toString()}`
          );
          if (regResponse.data?.status === "success") {
            const users = regResponse.data?.pendingPublicUsers ?? regResponse.data?.users ?? [];
            setPendingRegistrationsCount(Array.isArray(users) ? users.length : regResponse.data?.count ?? 0);
          }
        } catch (regErr) {
          if (regErr.response?.status === 403 || regErr.response?.status === 401) {
            setError(regErr.response?.data?.message || "Access denied");
          }
        }

        // Fetch pending applications (CSD-specific endpoint: verification_level 9, status !== Rejected)
        try {
          const appResponse = await axios.get(
            `${CSD_PENDING_APPLICATIONS_URL}?${params.toString()}`
          );
          if (appResponse.status === 200 && appResponse.data) {
            const apps = appResponse.data?.applications ?? appResponse.data?.data ?? [];
            const list = Array.isArray(apps) ? apps : [];
            setPendingApplicationsCount(list.length);
          }
        } catch (appErr) {
          setPendingApplicationsCount(0);
        }
      } catch (err) {
        console.error("Error fetching dashboard counts:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [canAccess, checkingAccess]);

  if (checkingAccess) {
    return (
      <Dashboard sidebarType="CSD Admin">
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </Dashboard>
    );
  }

  if (!canAccess) {
    return null; // Will redirect in useEffect
  }

  return (
    <Dashboard sidebarType="CSD Admin">
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">
            <SplitText text="CSD Admin Dashboard" splitType="chars" delay={35} className="inline-block" />
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Verify pending registrations and review pending applications.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-[#68d388]/20 border border-[#68d388]/40 rounded-lg text-black text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link to="/csd-admin/pending-registrations" className="block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-6 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#68d388]/25 rounded-lg flex items-center justify-center">
                    <MdPersonAdd className="text-[#d85a30]" size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Pending Registrations
                    </h2>
                    <p className="text-3xl font-bold text-[#d85a30] mt-1">
                      {pendingRegistrationsCount}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Public users awaiting verification
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link to="/csd-admin/pending-applications" className="block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-6 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#c2edda]/30 rounded-lg flex items-center justify-center">
                    <MdAssignment className="text-[#d85a30]" size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Pending Applications
                    </h2>
                    <p className="text-3xl font-bold text-[#d85a30] mt-1">
                      {pendingApplicationsCount}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Scheme applications pending review
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        )}
      </div>
    </Dashboard>
  );
}
