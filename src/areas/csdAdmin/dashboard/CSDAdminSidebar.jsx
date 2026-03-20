/* eslint-disable no-unused-vars */
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { MdAssignment } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";

function NavItem({ to, pathname, icon, label, isActive }) {
  return (
    <Link to={to} className="block">
      <motion.div
        whileHover={{ x: 4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-x-2 my-3 py-2 px-3 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-white text-[#d85a30] font-semibold shadow-sm"
            : "text-[#c2edda] font-normal hover:bg-white/10 hover:text-white"
        }`}
      >
        <div className={isActive ? "text-[#d85a30]" : ""}>{icon}</div>
        <div className="text-lg cursor-pointer">
          <p>{label}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CSDAdminSidebar({
  pathname,
  sidebarExpanded,
  setSidebarExpanded,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("sidebar-expanded");
    sessionStorage.removeItem("admin_username");
    sessionStorage.removeItem("admin_password");
    navigate("/admin-login");
  };

  return (
    <section className="flex flex-col h-full">
      <div className="flex-1">
        <ul>
          <li>
            <NavItem
              to="/csd-admin/pending-applications"
              pathname={pathname}
              icon={<MdAssignment size={20} />}
              label="Applications"
              isActive={pathname.includes("/csd-admin/pending-applications")}
            />
          </li>
        </ul>
      </div>

      {/* Settings and Logout at bottom */}
      <div className="border-t border-white/20 pt-3 mt-auto">
        <ul>
          <li>
            <NavItem
              to="/csd-admin/profile"
              pathname={pathname}
              icon={<IoSettingsOutline size={20} />}
              label="Settings"
              isActive={pathname.includes("/csd-admin/profile")}
            />
          </li>

          <li>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-x-2 my-3 py-2 px-2 text-[#c2edda] font-normal hover:text-white transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              <FiLogOut size={20} />
              <div className="text-lg">
                <p>Logout</p>
              </div>
            </motion.div>
          </li>
        </ul>
      </div>
    </section>
  );
}
