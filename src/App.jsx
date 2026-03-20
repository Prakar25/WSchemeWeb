/* eslint-disable no-unused-vars */
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import AuroraBackground from "./reusable-components/Aurora/AuroraBackground";
import { PublicLayout } from "./areas/public/PublicLayout";
import DesktopOnlyRoute from "./areas/DesktopOnlyRoute";

import Home from "./areas/public/pages/home.component";
import PublicSchemeDetailsPage from "./areas/public/pages/PublicSchemeDetails.page";
import PublicLogin from "./areas/common/PublicLogin.page";
import AdminLogin from "./areas/common/AdminLogin.page";
import AdminRegister from "./areas/common/AdminRegister.page";

import PublicDashboard from "./areas/public/dashboard/PublicDashboard";
import PublicProfile from "./areas/public/dashboard/PublicProfile.page";
import CompleteProfile from "./areas/public/dashboard/CompleteProfile.page";
import PublicSchemes from "./areas/public/dashboard/PublicSchemes.page";
import PublicApplications from "./areas/public/dashboard/PublicApplications.page";
import ApplyToScheme from "./areas/public/dashboard/ApplyToScheme.page";

import SysAdminDashboard from "./areas/systemAdmin/dashboard/SysAdminDashboard";
import AnalyticsPage from "./areas/systemAdmin/modules/analytics/Analytics.page";
import SchemesConfig from "./areas/systemAdmin/modules/scheme-management/schemesConfig.component";
import PendingApprovals from "./areas/systemAdmin/modules/scheme-management/pendingApprovals.component";
import SchemeBeneficiaries from "./areas/systemAdmin/modules/beneficiaries/SchemeBeneficiaries.page";
import Applications from "./areas/systemAdmin/modules/applications/applications.component";
import Alerts from "./areas/systemAdmin/modules/alerts/alerts.component";
import AdminProfile from "./areas/systemAdmin/modules/profile/AdminProfile.page";
import PendingAdminsVerification from "./areas/systemAdmin/modules/admin-verification/PendingAdminsVerification.page";
import AdvertisementPage from "./areas/systemAdmin/modules/advertisement/Advertisement.page";

import CSDAdminDashboard from "./areas/csdAdmin/dashboard/CSDAdminDashboard";
import CSDPendingApplications from "./areas/csdAdmin/modules/CSDPendingApplications.page";

function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return (
    <>
      <AuroraBackground />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/scheme/:schemeId" element={<PublicSchemeDetailsPage />} />

          <Route exact path="/login" element={<PublicLogin />} />
          <Route exact path="/admin-login" element={<AdminLogin />} />
          <Route exact path="/admin-register" element={<AdminRegister />} />
        </Route>

        {/* Public User Dashboard Routes */}
        <Route exact path="/user/dashboard" element={<PublicDashboard />} />
        <Route exact path="/user/profile" element={<PublicProfile />} />
        <Route exact path="/user/complete-profile" element={<CompleteProfile />} />
        <Route exact path="/user/schemes" element={<PublicSchemes />} />
        <Route exact path="/user/applications" element={<PublicApplications />} />
        <Route exact path="/user/apply-to-scheme" element={<ApplyToScheme />} />

        {/* System Admin Dashboard Routes */}
        <Route
          exact
          path="/system-admin/dashboard"
          element={<SysAdminDashboard />}
        />
        <Route exact path="/system-admin/analytics" element={<AnalyticsPage />} />
        {/* <Route exact path="/system-admin/schemes" element={<SchemeConfig />} /> */}
        <Route
          exact
          path="/system-admin/schemes-configuration"
          element={<SchemesConfig />}
        />
        <Route
          exact
          path="/system-admin/pending-approvals"
          element={<PendingApprovals />}
        />
        <Route
          exact
          path="/system-admin/scheme-beneficiaries/:scheme_id"
          element={<SchemeBeneficiaries />}
        />
        <Route
          exact
          path="/system-admin/applications"
          element={<Applications />}
        />
        <Route exact path="/system-admin/pending-admins" element={<PendingAdminsVerification />} />
        <Route exact path="/system-admin/advertisement" element={<AdvertisementPage />} />
        <Route exact path="/system-admin/alerts" element={<Alerts />} />
        <Route exact path="/system-admin/profile" element={<AdminProfile />} />

        {/* CSC Admin Routes (CSCAdmin role only) */}
        <Route exact path="/csd-admin/dashboard" element={<CSDAdminDashboard />} />
        <Route exact path="/csd-admin/pending-applications" element={<CSDPendingApplications />} />
        <Route exact path="/csd-admin/profile" element={<AdminProfile sidebarType="CSC Admin" />} />
      </Routes>
    </>
  );
}

export default App;
