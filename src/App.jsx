/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import { PublicLayout } from "./areas/public/PublicLayout";
import DesktopOnlyRoute from "./areas/DesktopOnlyRoute";

import Home from "./areas/public/pages/home.component";
import Login from "./areas/common/login.component";

import PublicDashboard from "./areas/public/dashboard/PublicDashboard";
import UserProfile from "./areas/public/dashboard/userProfile.component";
import UserSchemes from "./areas/public/dashboard/userSchemes.component";
import UserApplicationTracker from "./areas/public/dashboard/userApplicationTracker.component";

import SysAdminDashboard from "./areas/systemAdmin/dashboard/SysAdminDashboard";
import SchemeConfig from "./areas/systemAdmin/modules/scheme-management/schemeConfig.component";
import Beneficiaries from "./areas/systemAdmin/modules/beneficiaries/beneficiaries.component";
import Reports from "./areas/systemAdmin/modules/reports/reports.component";
import Alerts from "./areas/systemAdmin/modules/alerts/alerts.component";

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
        <Route exact path="/user/profile" element={<UserProfile />} />
        <Route exact path="/user/available-schemes" element={<UserSchemes />} />
        <Route
          exact
          path="/user/application-status"
          element={<UserApplicationTracker />}
        />

        {/* System Admin Dashboard Routes */}
        <Route
          exact
          path="/system-admin/dashboard"
          element={<SysAdminDashboard />}
        />
        <Route exact path="/system-admin/schemes" element={<SchemeConfig />} />
        <Route
          exact
          path="/system-admin/beneficiaries"
          element={<Beneficiaries />}
        />
        <Route exact path="/system-admin/reports" element={<Reports />} />
        <Route exact path="/system-admin/alerts" element={<Alerts />} />
      </Routes>
    </>
  );
}

export default App;
