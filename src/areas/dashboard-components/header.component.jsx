/* eslint-disable no-unused-vars */
import { useNavigate, NavLink } from "react-router-dom";

import { FiLogOut } from "react-icons/fi";

import Logo from "../../assets/sikkim_gov.png";

function Header({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();

  const signOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("sidebar-expanded");
    navigate("/");
  };

  return (
    <header className="sticky top-0 bg-white border-b border-blue-900 z-20">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Header: Left side */}

          <NavLink end to="/" className="block">
            <div className="flex items-center">
              <img src={Logo} className="h-12 w-16" />
              {
                <p className="text-slate-800 text-sm font-medium">
                  Women &amp; Child Welfare Department, Government of Sikkim
                </p>
              }
            </div>
          </NavLink>

          <div className="flex">
            {/* Hamburger button */}
            <button
              className="text-slate-500 hover:text-slate-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
          </div>

          {/* Header: Right side */}
          <p
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 border border-gray-200 py-1.5 px-4 bg-white text-primary rounded-md text-sm font-medium hover:bg-blue-800 hover:text-white cursor-pointer transition-all duration-300 ease-in-out"
          >
            <FiLogOut size={16} />
            Logout
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
