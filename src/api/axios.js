import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// JWT: Attach Bearer token to all admin requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        window.location.pathname.startsWith("/csd-admin");
      if (isAdminRoute) {
        window.location.href = "/admin-login";
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
