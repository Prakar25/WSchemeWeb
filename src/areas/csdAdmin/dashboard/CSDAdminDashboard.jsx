/* eslint-disable no-unused-vars */
import { Navigate } from "react-router-dom";

/**
 * CSC Admin dashboard - redirects directly to Applications page.
 * CSC Admin should only see Applications with Aadhaar search.
 */
export default function CSCAdminDashboard() {
  return <Navigate to="/csd-admin/pending-applications" replace />;
}
