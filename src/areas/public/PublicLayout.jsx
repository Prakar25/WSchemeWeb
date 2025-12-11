import { Outlet } from "react-router-dom";

import PublicNavbar from "./navbar.component";
import PublicFooter from "./footer.component";

export function PublicLayout() {
  return (
    <>
      <div className="navbar">
        <PublicNavbar />
      </div>

      <div className="main-content">
        <Outlet />
      </div>

      <div className="footer">
        <PublicFooter />
      </div>
    </>
  );
}
