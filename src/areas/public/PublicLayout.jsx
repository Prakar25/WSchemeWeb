import { Outlet } from "react-router-dom";

import PublicNavbar from "./navbar.component";
import PublicFooter from "./footer.component";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="navbar">
        <PublicNavbar />
      </div>

      <div className="main-content flex-1">
        <Outlet />
      </div>

      <div className="footer mt-auto">
        <PublicFooter />
      </div>
    </div>
  );
}
