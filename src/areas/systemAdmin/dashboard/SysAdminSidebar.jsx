/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  MdOutlineDashboardCustomize,
  MdFormatListBulleted,
} from "react-icons/md";
import { HiOutlineUserGroup, HiOutlineDocumentReport } from "react-icons/hi";
import { TbBellRinging } from "react-icons/tb";
import { IoSettingsOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";

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
    navigate("/login");
  };

  return (
    <section className="flex flex-col h-full">
      <div className="flex-1">
        <ul>
          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/system-admin/schemes-configuration")
                  ? "bg-white text-orange-600 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <MdFormatListBulleted size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/system-admin/schemes-configuration" className="py-1">
                  <p>Schemes</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/system-admin/beneficiaries")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <HiOutlineUserGroup size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/system-admin/beneficiaries" className="py-1">
                  <p>Beneficiaries</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/system-admin/reports")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <HiOutlineDocumentReport size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/system-admin/reports" className="py-1">
                  <p>Reports</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/system-admin/alerts")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <TbBellRinging size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/system-admin/alerts" className="py-1">
                  <p>Alerts</p>
                </Link>
              </div>
            </div>
          </li>
        </ul>
      </div>

      {/* Settings and Logout at bottom */}
      <div className="border-t border-white/20 pt-3 mt-auto">
        <ul>
          <li>
            <div className="flex items-center gap-x-2 my-3 py-2 px-2 text-yellow-200 font-normal hover:text-white transition-colors">
              <IoSettingsOutline size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="#" className="py-1">
                  <p>Settings</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div 
              className="flex items-center gap-x-2 my-3 py-2 px-2 text-yellow-200 font-normal hover:text-white transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              <FiLogOut size={20} />
              <div className="text-lg">
                <p>Logout</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
