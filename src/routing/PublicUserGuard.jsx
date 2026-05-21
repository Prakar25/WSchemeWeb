import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isPublicUserLoggedIn } from "../utils/user.utils";

/**
 * Protects /user/* routes and keeps browser Back/Forward inside the logged-in area.
 * Uses popstate (BrowserRouter-compatible; useBlocker requires a data router).
 */
export default function PublicUserGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPublicUserLoggedIn()) return;
    const onPopState = () => {
      queueMicrotask(() => {
        if (!window.location.pathname.startsWith("/user")) {
          navigate("/user/dashboard", { replace: true });
        }
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navigate]);

  useEffect(() => {
    if (!isPublicUserLoggedIn()) return;
    if (!location.pathname.startsWith("/user")) {
      navigate("/user/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  if (!isPublicUserLoggedIn()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}
