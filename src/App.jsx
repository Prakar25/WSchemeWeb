/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import { PublicLayout } from "./areas/public/PublicLayout";
import DesktopOnlyRoute from "./areas/DesktopOnlyRoute";

import Home from "./areas/public/pages/home.component";
import Login from "./areas/common/login.component";

import PublicDashboard from "./areas/public/dashboard/PublicDashboard";
import PublicProfile from "./areas/public/dashboard/PublicProfile.page";
import PublicSchemes from "./areas/public/dashboard/PublicSchemes.page";
import PublicApplications from "./areas/public/dashboard/PublicApplications.page";
import ApplyToScheme from "./areas/public/dashboard/ApplyToScheme.page";

import SysAdminDashboard from "./areas/systemAdmin/dashboard/SysAdminDashboard";
import SchemesConfig from "./areas/systemAdmin/modules/scheme-management/schemesConfig.component";
import PendingApprovals from "./areas/systemAdmin/modules/scheme-management/pendingApprovals.component";
import Beneficiaries from "./areas/systemAdmin/modules/beneficiaries/beneficiaries.component";
import SchemeBeneficiaries from "./areas/systemAdmin/modules/beneficiaries/SchemeBeneficiaries.page";
import Applications from "./areas/systemAdmin/modules/applications/applications.component";
import Reports from "./areas/systemAdmin/modules/reports/reports.component";
import Alerts from "./areas/systemAdmin/modules/alerts/alerts.component";
import AdminProfile from "./areas/systemAdmin/modules/profile/AdminProfile.page";

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
      <Routes>
        <Route element={<PublicLayout />}>
          <Route exact path="/" element={<Home />} />

          <Route exact path="/login" element={<Login />} />
        </Route>

        {/* Public User Dashboard Routes */}
        <Route exact path="/user/dashboard" element={<PublicDashboard />} />
        <Route exact path="/user/profile" element={<PublicProfile />} />
        <Route exact path="/user/schemes" element={<PublicSchemes />} />
        <Route exact path="/user/applications" element={<PublicApplications />} />
        <Route exact path="/user/apply-to-scheme" element={<ApplyToScheme />} />

        {/* System Admin Dashboard Routes */}
        <Route
          exact
          path="/system-admin/dashboard"
          element={<SysAdminDashboard />}
        />
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
          path="/system-admin/beneficiaries"
          element={<Beneficiaries />}
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
        <Route exact path="/system-admin/reports" element={<Reports />} />
        <Route exact path="/system-admin/alerts" element={<Alerts />} />
        <Route exact path="/system-admin/profile" element={<AdminProfile />} />
      </Routes>
    </>
  );
}

export default App;
