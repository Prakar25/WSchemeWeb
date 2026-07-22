/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import Header from "./header.component";
import Sidebar from "./sidebar.component";

export default function Dashboard(props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}

      <div className="relative group bg-primary">
        <div
          className={`absolute z-40 ${
            toggleSidebar ? "right-0" : "left-2"
          } top-5`}
          onClick={() => {
            setToggleSidebar((prev) => !prev);
          }}
        >
          {toggleSidebar ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6 cursor-pointer text-white me-2 group-hover:block hidden"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6 cursor-pointer"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
              />
            </svg>
          )}
        </div>
        {toggleSidebar && (
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarType={props?.sidebarType}
          />
        )}
      </div>

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main>
          <div className="px-4 sm:px-6 lg:px-3 py-8 w-full max-w-9xl mx-auto">
            {props?.children}
          </div>
        </main>
      </div>
    </div>
  );
}
