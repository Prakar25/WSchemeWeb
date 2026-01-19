/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  MdOutlineDashboardCustomize,
  MdFormatListBulleted,
  MdPendingActions,
} from "react-icons/md";
import { HiOutlineUserGroup, HiOutlineDocumentReport } from "react-icons/hi";
import { TbBellRinging } from "react-icons/tb";
import { IoSettingsOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { FaFileAlt } from "react-icons/fa";

function NavItem({ to, pathname, icon, label, isActive }) {
  return (
    <Link to={to} className="block">
      <motion.div
        whileHover={{ x: 4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-x-2 my-3 py-2 px-3 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-white text-orange-600 font-semibold shadow-sm"
            : "text-yellow-200 font-normal hover:bg-white/10 hover:text-white"
        }`}
      >
        <div className={isActive ? "text-orange-600" : ""}>{icon}</div>
        <div className="text-lg cursor-pointer">
          <p>{label}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export default function SysAdminSidebar({
  // keep the pathname later to highlight the selected text
  pathname,
  sidebarExpanded,
  setSidebarExpanded,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("sidebar-expanded");
    sessionStorage.removeItem("admin_username");
    sessionStorage.removeItem("admin_password");
    navigate("/login");
  };

  return (
    <section className="flex flex-col h-full">
      <div className="flex-1">
        <ul>
          <li>
            <NavItem
              to="/system-admin/dashboard"
              pathname={pathname}
              icon={<MdOutlineDashboardCustomize size={20} />}
              label="Dashboard"
              isActive={pathname === "/system-admin/dashboard" || pathname.includes("/system-admin/dashboard")}
            />
          </li>

          <li>
            <NavItem
              to="/system-admin/schemes-configuration"
              pathname={pathname}
              icon={<MdFormatListBulleted size={20} />}
              label="Schemes"
              isActive={pathname.includes("/system-admin/schemes-configuration")}
            />
          </li>

          <li>
            <NavItem
              to="/system-admin/pending-approvals"
              pathname={pathname}
              icon={<MdPendingActions size={20} />}
              label="Pending Approvals"
              isActive={pathname.includes("/system-admin/pending-approvals")}
            />
          </li>

          <li>
            <NavItem
              to="/system-admin/beneficiaries"
              pathname={pathname}
              icon={<HiOutlineUserGroup size={20} />}
              label="Beneficiaries"
              isActive={pathname.includes("/system-admin/beneficiaries")}
            />
          </li>

          <li>
            <NavItem
              to="/system-admin/applications"
              pathname={pathname}
              icon={<FaFileAlt size={20} />}
              label="Applications"
              isActive={pathname.includes("/system-admin/applications")}
            />
          </li>

          <li>
            <NavItem
              to="/system-admin/reports"
              pathname={pathname}
              icon={<HiOutlineDocumentReport size={20} />}
              label="Reports"
              isActive={pathname.includes("/system-admin/reports")}
            />
          </li>

          <li>
            <NavItem
              to="/system-admin/alerts"
              pathname={pathname}
              icon={<TbBellRinging size={20} />}
              label="Alerts"
              isActive={pathname.includes("/system-admin/alerts")}
            />
          </li>
        </ul>
      </div>

      {/* Settings and Logout at bottom */}
      <div className="border-t border-white/20 pt-3 mt-auto">
        <ul>
          <li>
            <NavItem
              to="/system-admin/profile"
              pathname={pathname}
              icon={<IoSettingsOutline size={20} />}
              label="Settings"
              isActive={pathname.includes("/system-admin/profile")}
            />
          </li>

          <li>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-x-2 my-3 py-2 px-2 text-yellow-200 font-normal hover:text-white transition-colors cursor-pointer"
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
