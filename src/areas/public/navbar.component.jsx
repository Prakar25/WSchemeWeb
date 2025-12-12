/* eslint-disable no-unused-vars */
import React from "react";
import { Link } from "react-router-dom";

import skGovtLogo from "../../assets/sikkim_gov.png";

const Navbar = () => {
  return (
    <section>
      <nav className="w-full shadow-sm bg-white">
        <div className="w-full mx-auto flex items-center justify-between py-4 px-10">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <img
              src={skGovtLogo}
              alt="Sikkim Gov Logo"
              className="w-28 h-28 object-cover"
            />
            <div>
              <h1 className="font-semibold text-gray-900">
                Women and Child Welfare Department
              </h1>
              <p className="text-xs text-gray-600">Government of Sikkim</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600">
              About
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600">
              Schemes
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600">
              Contact
            </a>
          </div>

          <Link to="/login">
            <button className="bg-yellow-400 px-4 py-2 rounded-md font-medium hover:bg-yellow-500 cursor-pointer transition-all ease-in-out duration-500">
              Login / Register
            </button>
          </Link>
        </div>
      </nav>
    </section>
  );
};

export default Navbar;
