/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import { PublicLayout } from "./areas/public/PublicLayout";
import DesktopOnlyRoute from "./areas/DesktopOnlyRoute";

import Home from "./areas/public/pages/home.component";
import Login from "./areas/common/login.component";

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
      </Routes>
    </>
  );
}

export default App;
