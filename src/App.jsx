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
import HouseholdMembersPage from "./areas/public/dashboard/HouseholdMembers.page";

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

import CSCAdminDashboard from "./areas/cscAdmin/dashboard/CSCAdminDashboard";
import CSCPendingApplications from "./areas/cscAdmin/modules/CSCPendingApplications.page";

import PublicUserGuard from "./routing/PublicUserGuard";
import PublicGuestOnly from "./routing/PublicGuestOnly";

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

          <Route
            path="/login"
            element={
              <PublicGuestOnly>
                <PublicLogin />
              </PublicGuestOnly>
            }
          />
          <Route exact path="/admin-login" element={<AdminLogin />} />
          <Route exact path="/admin-register" element={<AdminRegister />} />
        </Route>

        {/* Public User Dashboard — auth required; Back cannot leave /user without logout */}
        <Route path="/user" element={<PublicUserGuard />}>
          <Route path="dashboard" element={<PublicDashboard />} />
          <Route path="profile" element={<PublicProfile />} />
          <Route path="complete-profile" element={<CompleteProfile />} />
          <Route path="schemes" element={<PublicSchemes />} />
          <Route path="applications" element={<PublicApplications />} />
          <Route path="apply-to-scheme" element={<ApplyToScheme />} />
          <Route path="household-members" element={<HouseholdMembersPage />} />
        </Route>

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
        <Route exact path="/csc-admin/dashboard" element={<CSCAdminDashboard />} />
        <Route exact path="/csc-admin/pending-applications" element={<CSCPendingApplications />} />
        <Route exact path="/csc-admin/profile" element={<AdminProfile sidebarType="CSC Admin" />} />
      </Routes>
    </>
  );
}

export default App;
