/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DesktopOnlyRoute = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      navigate("/"); // Redirect to home if not desktop
    }
  }, [isDesktop, navigate]);

  return isDesktop ? children : null;
};

export default DesktopOnlyRoute;
