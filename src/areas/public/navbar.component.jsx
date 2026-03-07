/* eslint-disable no-unused-vars */
import React from "react";
import { Link, useLocation } from "react-router-dom";

import skGovtLogo from "../../assets/sikkim_gov.png";
import RotatingText from "../../reusable-components/RotatingText/RotatingText";

const Navbar = () => {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/login" || pathname === "/admin-login" || pathname === "/admin-register";
  const isHome = pathname === "/";
  return (
    <header className="bg-[#c2edda]/20 border-b border-[#68d388]/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand (same as PublicHeader) */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={skGovtLogo}
              alt="Sikkim Gov Logo"
              className="h-6 w-6 object-contain"
            />
            <span className="text-xl font-bold text-[#d85a30]">
              WelfareConnect
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${isHome ? "text-[#d85a30] font-semibold" : "text-black hover:text-[#d85a30]"}`}
            >
              Home
            </Link>
            <a href="#" className="font-medium text-black hover:text-[#d85a30] transition-colors">
              About
            </a>
            <a href="#" className="font-medium text-black hover:text-[#d85a30] transition-colors">
              Schemes
            </a>
            <a href="#" className="font-medium text-black hover:text-[#d85a30] transition-colors">
              Contact
            </a>
          </nav>

          {/* Right side: Login button or spacer to keep nav centered */}
          {!isAuthPage ? (
            <Link to="/login">
              <button className="bg-[#d85a30] hover:bg-[#ffb766] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[7.5rem]">
                <RotatingText
                  texts={["Login", "Register"]}
                  mainClassName="overflow-hidden"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={2000}
                />
              </button>
            </Link>
          ) : (
            <div className="min-w-[7.5rem]" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
