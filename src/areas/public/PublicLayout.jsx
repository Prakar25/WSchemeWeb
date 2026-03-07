import { Outlet } from "react-router-dom";

import PublicNavbar from "./navbar.component";
import PublicFooter from "./footer.component";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#c2edda]/50 via-white to-[#c2edda]/25">
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
