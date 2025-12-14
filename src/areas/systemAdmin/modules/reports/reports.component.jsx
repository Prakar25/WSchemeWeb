/* eslint-disable no-unused-vars */
import React from "react";

import Dashboard from "../../../dashboard-components/dashboard.component";

import UnderDevelopment from "../../../common/underDevelopment.component";

const Reports = () => {
  return (
    <>
      <Dashboard sidebarType="System Admin">
        <div>
          <UnderDevelopment />
        </div>
      </Dashboard>
    </>
  );
};

export default Reports;
