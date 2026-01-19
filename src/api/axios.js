import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

// console.log("BASE_URL", BASE_URL);

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor to add admin authentication headers
// Only add headers for endpoints that require them (scheme creation/approval/rejection)
// Other endpoints use query parameters for authentication to avoid CORS issues
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the full URL (handles both relative and absolute URLs)
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();
    
    // Check if this is a scheme endpoint that requires headers:
    // - POST /schemes (create scheme) - relative URL
    // Note: Update, approve/reject endpoints use query parameters (not headers) to avoid CORS issues
    // Note: config.url is relative, so we check for /schemes (not /api/schemes)
    const isSchemeCreate = url.includes('/schemes') && 
                           !url.includes('/update') && 
                           !url.includes('/approve') && 
                           !url.includes('/reject') && 
                           method === 'post';
    
    // Scheme update endpoint uses query parameters (NOT headers) to avoid CORS issues
    // Approve/reject endpoints also use query parameters, NOT headers (to avoid CORS)
    const requiresHeaders = isSchemeCreate;
    
    // Only add headers for endpoints that require them
    if (requiresHeaders) {
      const adminUsername = sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username");
      const adminPassword = sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password");
      
      if (adminUsername && adminPassword) {
        config.headers["x-admin-username"] = adminUsername;
        config.headers["x-admin-password"] = adminPassword;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
