import { Navigate, useLocation } from "react-router-dom";
import { isPublicUserLoggedIn } from "../utils/user.utils";

/**
 * Login/register pages: already-authenticated users go to dashboard (not back-stack login).
 */
export default function PublicGuestOnly({ children }) {
  const location = useLocation();

  if (!isPublicUserLoggedIn()) {
    return children;
  }

  const returnTo =
    location.state?.returnTo ||
    location.state?.from?.pathname ||
    "/user/dashboard";

  const target =
    typeof returnTo === "string" && returnTo.startsWith("/user")
      ? returnTo
      : "/user/dashboard";

  return <Navigate to={target} replace />;
}
