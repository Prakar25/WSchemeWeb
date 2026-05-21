import axios from "axios";
import { getPublicSessionAnchorParams } from "../utils/user.utils";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

/** Public dashboard routes that require OTP session anchor (publicUserId / mobileNumber). */
function urlNeedsPublicSessionAnchor(url = "") {
  const path = String(url).split("?")[0];
  if (path.includes("/public-profile")) return true;
  if (path.includes("/applications/user")) return true;
  if (path.includes("/applications/apply")) return true;
  if (path.startsWith("/profile") || path.includes("/profile/")) return true;
  return false;
}

function shouldAttachPublicSession(config) {
  if (localStorage.getItem("adminToken")) return false;
  const role = localStorage.getItem("role");
  const hasPublicSession =
    role === "Public User" || Boolean(getStoredPublicUserId());
  if (!hasPublicSession) return false;
  return urlNeedsPublicSessionAnchor(config.url || "");
}

// JWT + public session anchor on protected requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (shouldAttachPublicSession(config)) {
      const anchor = getPublicSessionAnchorParams();
      if (anchor.publicUserId || anchor.mobileNumber) {
        config.params = { ...anchor, ...(config.params || {}) };
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// JWT: Handle 401 (expired/invalid token) – clear auth and redirect to admin login
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      sessionStorage.removeItem("admin_username");
      sessionStorage.removeItem("admin_password");
      const isAdminRoute = window.location.pathname.startsWith("/system-admin") ||
        window.location.pathname.startsWith("/csc-admin");
      if (isAdminRoute) {
        window.location.href = "/admin-login";
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
