/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  MdOutlineDashboardCustomize,
  MdFormatListBulleted,
} from "react-icons/md";
import { AiOutlineUser } from "react-icons/ai";
import { LuFileClock } from "react-icons/lu";
import { FiUserCheck } from "react-icons/fi";

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
                  ? "bg-white text-[#d85a30] font-semibold rounded-e-full"
                  : "text-[#c2edda] font-normal"
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
                pathname.includes("/user/profile") && !pathname.includes("/user/complete-profile")
                  ? "bg-white text-[#d85a30] font-semibold rounded-e-full"
                  : "text-[#c2edda] font-normal"
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
                pathname.includes("/user/complete-profile")
                  ? "bg-white text-[#d85a30] font-semibold rounded-e-full"
                  : "text-[#c2edda] font-normal"
              }`}
            >
              <FiUserCheck size={20} />
              <div className="text-lg cursor-pointer">
                <Link to="/user/complete-profile" className="py-1">
                  <p>Complete Profile</p>
                </Link>
              </div>
            </div>
          </li>

          <li>
            <div
              className={`flex items-center gap-x-2 my-3 py-2 px-2 ${
                pathname.includes("/user/schemes")
                  ? "bg-white text-[#d85a30] font-semibold rounded-e-full"
                  : "text-[#c2edda] font-normal"
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
                  ? "bg-white text-[#d85a30] font-semibold rounded-e-full"
                  : "text-[#c2edda] font-normal"
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
