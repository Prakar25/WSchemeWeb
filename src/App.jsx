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

        <Route exact path="/user/dashboard" element={<PublicDashboard />} />
        <Route exact path="/user/profile" element={<UserProfile />} />
        <Route exact path="/user/available-schemes" element={<UserSchemes />} />
        <Route
          exact
          path="/user/application-status"
          element={<UserApplicationTracker />}
        />
      </Routes>
    </>
  );
}

export default App;
