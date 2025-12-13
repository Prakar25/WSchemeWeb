/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";

import Dashboard from "../../dashboard-components/dashboard.component";

export default function PublicDashboard() {
  return (
    <>
      <section className="hidden lg:block bg-gray-100">
        <Dashboard sidebarType="Public User">
          <div className="min-h-screen">
            <div className="mt-20 text-center font-bold text-xl text-blue-900">
              Welcome User
            </div>
          </div>
        </Dashboard>
      </section>
    </>
  );
}
