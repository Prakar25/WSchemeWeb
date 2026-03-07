/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";

import axios from "../../api/axios";
import {
  ADMIN_LOGIN_URL,
  PUBLIC_AUTH_REGISTER_SEND_OTP_URL,
  PUBLIC_AUTH_REGISTER_VERIFY_OTP_URL,
  PUBLIC_AUTH_LOGIN_SEND_OTP_URL,
  PUBLIC_AUTH_LOGIN_VERIFY_OTP_URL,
} from "../../api/api_routing_urls";

import Input from "../../reusable-components/inputs/InputTextBox/Input";
import PasswordInput from "../../reusable-components/inputs/InputTextBox/PasswordInput";

const Login = () => {
  const location = useLocation();
  const adminUsers = [
    {
      fullName: "Karma Tshering",
      username: "karma.tshering",
      contactNumber: "9876543210",
      password: "Admin@123",
    },
    {
      fullName: "Maya Subba",
      username: "maya.subba",
      contactNumber: "9123456780",
      password: "Admin@456",
    },
  ];

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
    setValue,
    control,
  } = useForm({
    mode: "onChange",
    criteriaMode: "all",
  });

  const [activeTab, setActiveTab] = useState(location.state?.tab || "public");

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location.state?.tab]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpFromServer, setOtpFromServer] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  // Mobile number validation: 10-digit Indian mobile number starting with 6-9
  const validateMobileNumber = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  // Handle sending OTP for login
  const handleLoginSendOtp = async (data) => {
    setLoginError("");
    setOtpSent(false);
    const mobile = data.mobile_number?.trim() || "";

    if (!validateMobileNumber(mobile)) {
      setLoginError("Invalid mobile number. Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      const response = await axios.post(PUBLIC_AUTH_LOGIN_SEND_OTP_URL, {
        mobileNumber: mobile,
      });

      const { status, message, otp } = response.data;

      if (status === "success") {
        setMobileNumber(mobile);
        setOtpSent(true);
        setOtpFromServer(otp || null); // Store OTP if returned (dev mode)
        setOtpTimer(600); // 10 minutes = 600 seconds
        setLoginError("");
        // Clear mobile number field
        reset({ mobile_number: "" });
      } else {
        setLoginError(message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Login send OTP error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to send OTP at the moment. Please try again later.";
      setLoginError(errorMessage);
    }
  };

  // Handle verifying OTP for login
  const handleLoginVerifyOtp = async (data) => {
    setLoginError("");

    try {
      const response = await axios.post(PUBLIC_AUTH_LOGIN_VERIFY_OTP_URL, {
        mobileNumber: mobileNumber,
        otp: data.otp_input?.trim() || "",
      });

      const { status, user, message } = response.data;

      if (status === "success" && user) {
        // Store user data
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", "Public User");

        // Reset form state
        reset();
        setOtpSent(false);
        setMobileNumber("");
        setOtpTimer(0);

        navigate("/user/dashboard", { replace: true });
      } else {
        setLoginError(message || "OTP verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Login verify OTP error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Invalid OTP. Please try again.";
      setLoginError(errorMessage);
    }
  };

  // Handle sending OTP for registration
  const handleRegisterSendOtp = async (data) => {
    setLoginError("");
    setOtpSent(false);
    const mobile = data.mobile_number?.trim() || "";

    if (!validateMobileNumber(mobile)) {
      setLoginError("Invalid mobile number. Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      const response = await axios.post(PUBLIC_AUTH_REGISTER_SEND_OTP_URL, {
        mobileNumber: mobile,
      });

      const { status, message, otp } = response.data;

      if (status === "success") {
        setMobileNumber(mobile);
        setOtpSent(true);
        setOtpFromServer(otp || null); // Store OTP if returned (dev mode)
        setOtpTimer(600); // 10 minutes = 600 seconds
        setLoginError("");
        // Clear mobile number field
        reset({ mobile_number: "" });
      } else {
        setLoginError(message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Register send OTP error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to send OTP at the moment. Please try again later.";
      setLoginError(errorMessage);
    }
  };

  // Handle verifying OTP for registration
  const handleRegisterVerifyOtp = async (data) => {
    setLoginError("");

    try {
      const response = await axios.post(PUBLIC_AUTH_REGISTER_VERIFY_OTP_URL, {
        mobileNumber: mobileNumber,
        otp: data.otp_input?.trim() || "",
        fullName: data.full_name?.trim() || "",
        email: data.email?.trim() || "",
      });

      const { status, user, message } = response.data;

      if (status === "success" && user) {
        // Store user data
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", "Public User");

        // Reset form state
        reset();
        setOtpSent(false);
        setIsRegistering(false);
        setMobileNumber("");
        setOtpTimer(0);

        navigate("/user/dashboard", { replace: true });
      } else {
        setLoginError(message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Register verify OTP error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Invalid OTP. Please try again.";
      setLoginError(errorMessage);
    }
  };

  // Handle resending OTP
  const handleResendOtp = async () => {
    if (!mobileNumber || isResendingOtp) return;

    setIsResendingOtp(true);
    setLoginError("");

    try {
      const endpoint = isRegistering
        ? PUBLIC_AUTH_REGISTER_SEND_OTP_URL
        : PUBLIC_AUTH_LOGIN_SEND_OTP_URL;

      const response = await axios.post(endpoint, {
        mobileNumber: mobileNumber,
      });

      const { status, message, otp } = response.data;

      if (status === "success") {
        setOtpFromServer(otp || null);
        setOtpTimer(600); // Reset timer to 10 minutes
        setLoginError("");
      } else {
        setLoginError(message || "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to resend OTP. Please try again later.";
      setLoginError(errorMessage);
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Format timer display (MM:SS)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAdminLogin = async (data) => {
    setLoginError("");

    try {
      const response = await axios.post(
        ADMIN_LOGIN_URL,
        {
          username: data.admin_username.trim(),
          password: data.admin_password,
        },
        {
          // withCredentials: true,
        }
      );

      console.log("handleAdminLogin response", response);

      const { status, user, message } = response.data;

      // Invalid credentials (200 but unauthorized)
      if (status !== "success" || !user) {
        setLoginError("Incorrect credentials entered. Try again." || message);
        return;
      }

      // Login success
      // Store user with role and roleLevel if available
      // Normalize roleLevel (handle both camelCase and snake_case)
      const normalizedRoleLevel = user.roleLevel || user.role_level || null;
      const userToStore = {
        ...user,
        role: user.role || "System Admin",
        roleLevel: normalizedRoleLevel,
      };
      console.log("Login - Storing user data:", userToStore);
      localStorage.setItem("user", JSON.stringify(userToStore));
      localStorage.setItem("role", user.role || "System Admin");
      // Store credentials in sessionStorage for API authentication (more secure than localStorage)
      sessionStorage.setItem("admin_username", data.admin_username.trim());
      sessionStorage.setItem("admin_password", data.admin_password);

      // CSDAdmin goes to separate dashboard
      const role = (user.role || "").trim();
      if (role === "CSDAdmin") {
        navigate("/csd-admin/dashboard", { replace: true });
      } else {
        navigate("/system-admin/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Admin login error:", error);

      // Unauthorized (401) or Forbidden (403 - e.g. pending/rejected admin)
      if (error.response?.status === 401 || error.response?.status === 403) {
        const msg = error.response?.data?.message || error.response?.data?.error;
        setLoginError(
          msg || "Incorrect credentials entered. Try again."
        );
        return;
      }

      // Server / network error
      setLoginError("Unable to login at the moment. Please try again later.");
    }
  };

  // Reset form when switching tabs or modes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setLoginError("");
    reset();
    setOtpSent(false);
    setIsRegistering(false);
    setMobileNumber("");
    setOtpTimer(0);
  };

  const handleToggleRegister = () => {
    setIsRegistering(!isRegistering);
    setLoginError("");
    reset();
    setOtpSent(false);
    setMobileNumber("");
    setOtpTimer(0);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8">
        <h1 className="text-center text-2xl font-bold">Welcome</h1>
        <p className="text-center text-gray-500 mb-10 text-xs font-medium">
          Please login or register to continue
        </p>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => handleTabChange("public")}
            className={`cursor-pointer w-1/2 pb-2 text-center font-medium ${
              activeTab === "public"
                ? "text-[#f43a09] border-b-2 border-[#f43a09]"
                : "text-gray-500"
            }`}
          >
            Public User
          </button>

          <button
            onClick={() => handleTabChange("admin")}
            className={`cursor-pointer w-1/2 pb-2 text-center font-medium ${
              activeTab === "admin"
                ? "text-[#f43a09] border-b-2 border-[#f43a09]"
                : "text-gray-500"
            }`}
          >
            Admin
          </button>
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="text-red-700 text-xs mb-4 text-center font-semibold bg-red-50 p-3 rounded-md">
            {loginError}
          </div>
        )}

        {/* -------------------------- PUBLIC USER FORM -------------------------- */}
        {activeTab === "public" && (
          <>
            {!otpSent ? (
              <>
                {/* Login/Register Toggle */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={handleToggleRegister}
                    type="button"
                    className={`cursor-pointer w-1/2 pb-2 text-center text-sm font-medium ${
                      !isRegistering
                        ? "text-[#f43a09] border-b-2 border-[#f43a09]"
                        : "text-gray-500"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={handleToggleRegister}
                    type="button"
                    className={`cursor-pointer w-1/2 pb-2 text-center text-sm font-medium ${
                      isRegistering
                        ? "text-[#f43a09] border-b-2 border-[#f43a09]"
                        : "text-gray-500"
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit(
                    isRegistering ? handleRegisterSendOtp : handleLoginSendOtp
                  )}
                >
                  <Input
                    defaultName="mobile_number"
                    register={register}
                    name="Mobile Number"
                    required={true}
                    pattern={/^[6-9]\d{9}$/}
                    errors={errors}
                    placeholder="Enter your 10-digit mobile number"
                    setError={setError}
                    clearError={clearErrors}
                    autoComplete="off"
                    type="text"
                    classes="rounded-md px-3 py-2 text-sm w-full"
                    onChangeInput={null}
                    setValue={setValue}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-8 w-full bg-[#f43a09] text-white rounded-md py-2 hover:bg-[#ffb766] cursor-pointer transition-all ease-in-out duration-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 text-center mb-3">
                  A 6-digit OTP has been sent to{" "}
                  <span className="font-semibold">
                    {mobileNumber ? `******${mobileNumber.slice(-4)}` : "your mobile number"}
                  </span>
                </p>

                {/* OTP Timer */}
                {otpTimer > 0 && (
                  <p className="text-xs text-gray-500 text-center mb-3">
                    OTP expires in: <span className="font-semibold">{formatTimer(otpTimer)}</span>
                  </p>
                )}

                {/* Development Mode OTP Display */}
                {otpFromServer && (
                  <div className="mb-3 p-2 bg-[#68d388]/20 border border-[#68d388]/40 rounded-md">
                    <p className="text-xs text-black text-center">
                      <strong>Dev Mode:</strong> OTP is {otpFromServer}
                    </p>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit(
                    isRegistering ? handleRegisterVerifyOtp : handleLoginVerifyOtp
                  )}
                >
                  {/* Registration fields (only shown during registration) */}
                  {isRegistering && (
                    <>
                      <Input
                        defaultName="full_name"
                        register={register}
                        name="Full Name (Optional)"
                        required={false}
                        pattern={null}
                        errors={errors}
                        placeholder="Enter your full name (optional)"
                        setError={setError}
                        clearError={clearErrors}
                        autoComplete="off"
                        type="text"
                        classes="mb-3 rounded-md px-3 py-2 text-sm w-full"
                        onChangeInput={null}
                        setValue={setValue}
                      />

                      <Input
                        defaultName="email"
                        register={register}
                        name="Email (Optional)"
                        required={false}
                        pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                        errors={errors}
                        placeholder="Enter your email (optional)"
                        setError={setError}
                        clearError={clearErrors}
                        autoComplete="off"
                        type="email"
                        classes="mb-3 rounded-md px-3 py-2 text-sm w-full"
                        onChangeInput={null}
                        setValue={setValue}
                      />
                    </>
                  )}

                  <Input
                    defaultName="otp_input"
                    register={register}
                    name="OTP"
                    required={true}
                    pattern={/^[0-9]{6}$/}
                    errors={errors}
                    placeholder="Enter the 6-digit OTP"
                    setError={setError}
                    clearError={clearErrors}
                    autoComplete="off"
                    type="text"
                    classes="rounded-md px-3 py-2 text-sm w-full"
                    onChangeInput={null}
                    setValue={setValue}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 w-full bg-[#f43a09] text-white rounded-md py-2 hover:bg-[#ffb766] cursor-pointer transition-all ease-in-out duration-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? "Verifying..."
                      : isRegistering
                      ? "Register"
                      : "Login"}
                  </button>

                  {/* Resend OTP */}
                  <div className="mt-4 text-center">
                    {otpTimer > 0 ? (
                      <p className="text-xs text-gray-500">
                        Didn&apos;t receive OTP? Resend in {formatTimer(otpTimer)}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResendingOtp}
                        className="text-xs text-[#f43a09] hover:text-[#ffb766] disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {isResendingOtp ? "Resending..." : "Resend OTP"}
                      </button>
                    )}
                  </div>

                  {/* Back button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      reset();
                      setOtpTimer(0);
                    }}
                    className="mt-2 w-full text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Change Mobile Number
                  </button>
                </form>
              </>
            )}
          </>
        )}

        {/* ----------------------------- ADMIN FORM ----------------------------- */}
        {activeTab === "admin" && (
          <form onSubmit={handleSubmit(handleAdminLogin)}>
            <Input
              defaultName="admin_username"
              register={register}
              name="Username"
              required={true}
              pattern={null}
              errors={errors}
              placeholder="Enter username"
              setError={setError}
              clearError={clearErrors}
              type="text"
              classes="mb-3 rounded-md px-3 py-2 text-sm w-full"
              onChangeInput={null}
              setValue={setValue}
            />

            <PasswordInput
              id="myPasswordInput"
              type="password"
              defaultName="admin_password"
              register={register}
              name="Password"
              required={true}
              pattern={null}
              errors={errors}
              placeholder="Enter password"
              setError={setError}
              clearError={clearErrors}
              autoComplete="off"
              classes={`rounded-md px-3 py-2 text-sm w-full`}
              onChangeInput={null}
              setValue={setValue}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 w-full bg-[#f43a09] text-white rounded-md py-2 hover:bg-[#ffb766] cursor-pointer transition-all ease-in-out duration-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              Don&apos;t have an admin account?{" "}
              <Link to="/admin-register" className="text-[#f43a09] hover:text-[#ffb766] font-medium">
                Register as Admin
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
