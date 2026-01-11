/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  MdOutlineDashboardCustomize,
  MdFormatListBulleted,
} from "react-icons/md";
import { AiOutlineUser } from "react-icons/ai";
import { LuFileClock } from "react-icons/lu";

export default function PublicSidebar({
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
                pathname.includes("/user/dashboard")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <MdOutlineDashboardCustomize size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/user/dashboard" className="py-1">
                  <p>Dashboard</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/user/profile")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <AiOutlineUser size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/user/profile" className="py-1">
                  <p>Profile</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/user/schemes")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <MdFormatListBulleted size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/user/schemes" className="py-1">
                  <p>Schemes</p>
                </Link>
              </div>
            </div>
          </li>

          {/* <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/user/application-status")
                  ? "bg-white text-slate-700 font-semibold rounded-e-full"
                  : "text-yellow-200 font-normal"
              }`}
            >
              <LuFileClock size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/user/application-status" className="py-1">
                  <p>Application Status</p>
                </Link>
              </div>
            </div>
          </li> */}
        </ul>
      </div>
    </section>
  );
}
