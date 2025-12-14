/* eslint-disable no-unused-vars */
import React from "react";

import Dashboard from "../../../dashboard-components/dashboard.component";

import UnderDevelopment from "../../../common/underDevelopment.component";

const Beneficiaries = () => {
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

export default Beneficiaries;
