/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  MdOutlineDashboardCustomize,
  MdFormatListBulleted,
} from "react-icons/md";
import { HiOutlineUserGroup, HiOutlineDocumentReport } from "react-icons/hi";
import { TbBellRinging } from "react-icons/tb";

export default function SysAdminSidebar({
  // keep the pathname later to highlight the selected text
  pathname,
  sidebarExpanded,
  setSidebarExpanded,
}) {
  return (
    <section>
      <div>
        <ul>
          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/system-admin/dashboard")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <MdOutlineDashboardCustomize size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/system-admin/dashboard" className="py-1">
                  <p>Dashboard</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/system-admin/schemes")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <MdFormatListBulleted size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/system-admin/schemes" className="py-1">
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
    </section>
  );
}
