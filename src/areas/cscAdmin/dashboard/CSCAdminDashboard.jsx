/* eslint-disable no-unused-vars */
import { Navigate } from "react-router-dom";

/**
 * CSC Admin dashboard - redirects directly to Pending Applications page.
 */
export default function CSCAdminDashboard() {
  return <Navigate to="/csc-admin/pending-applications" replace />;
}

