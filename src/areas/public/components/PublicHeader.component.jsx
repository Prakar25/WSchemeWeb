/* eslint-disable no-unused-vars */
import { Link, useNavigate, useLocation } from "react-router-dom";
import skGovtLogo from "../../../assets/sikkim_gov.png";
import ApplicantSwitcherDropdown from "./ApplicantSwitcherDropdown";

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/user/dashboard" className="flex items-center gap-3">
            <img src={skGovtLogo} alt="Logo" className="h-6 w-6 object-contain" />
            <span className="text-xl font-bold text-[#d85a30]">
              WelfareConnect
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/user/dashboard")}
              className={`font-medium transition-colors ${
                isActive("/user/dashboard")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/user/schemes")}
              className={`font-medium transition-colors ${
                isActive("/user/schemes")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              Schemes
            </button>
            <button
              onClick={() => navigate("/user/applications")}
              className={`font-medium transition-colors ${
                isActive("/user/applications")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => navigate("/user/household-members")}
              className={`font-medium transition-colors ${
                isActive("/user/household-members")
                  ? "text-[#d85a30] font-semibold"
                  : "text-black hover:text-[#d85a30]"
              }`}
            >
              Household
            </button>
          </nav>

          {/* Profile + applicant switcher (single control) */}
          <ApplicantSwitcherDropdown />
        </div>
      </div>
    </header>
  );
}
