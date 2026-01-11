/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import axios from "../../api/axios";
import { CHECK_AADHAAR_URL, ADMIN_LOGIN_URL } from "../../api/api_routing_urls";

import Input from "../../reusable-components/inputs/InputTextBox/Input";
import PasswordInput from "../../reusable-components/inputs/InputTextBox/PasswordInput";

const Login = () => {
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
    // defaultValues: defaultValues,
  });

  const [activeTab, setActiveTab] = useState("public");
  const [aadhaarFoundUser, setAadhaarFoundUser] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [loginError, setLoginError] = useState("");

  const handlePublicAadhaarSubmit = async (data) => {
    setLoginError("");
    setOtpSent(false);

    try {
      const response = await axios.get(CHECK_AADHAAR_URL, {
        params: {
          aadhaarNumber: data.aadhaar_number.trim(),
        },
        // withCredentials: true,
      });

      const { status, user, message } = response.data;

      // Safety check (for 200 but invalid payload)
      if (status !== "success" || !user) {
        setLoginError(
          "Aadhaar details not found in UIDAI database. Enter the correct details." ||
            message
        );
        return;
      }

      // Aadhaar found - store the user object from API
      setAadhaarFoundUser(user);

      // Mock OTP (temporary)
      setGeneratedOtp("123456");
      setOtpSent(true);
    } catch (error) {
      console.error("Aadhaar verification error:", error);

      // Aadhaar not found / invalid (404)
      if (error.response?.status === 404) {
        setLoginError(
          "Aadhaar details not found in UIDAI database. Enter the correct details." ||
            error.response.data?.message
        );
        return;
      }

      // Other errors (500, network, etc.)
      setLoginError(
        "Unable to verify Aadhaar at the moment. Please try again later."
      );
    }
  };

  const handleOtpVerify = (data) => {
    if (data.otp_input === generatedOtp) {
      // Store the user object from API (already has _id and userId)
      localStorage.setItem("user", JSON.stringify(aadhaarFoundUser));
      localStorage.setItem("role", "Public User");

      const to = "/user/dashboard";

      navigate(to, { replace: true });
    } else {
      setLoginError("Incorrect OTP entered. Please try again.");
    }
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

      navigate("/system-admin/dashboard", { replace: true });
    } catch (error) {
      console.error("Admin login error:", error);

      // Unauthorized (401 / 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        setLoginError(
          "Incorrect credentials entered. Try again." ||
            error.response.data?.message
        );
        return;
      }

      // Server / network error
      setLoginError("Unable to login at the moment. Please try again later.");
    }
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
            onClick={() => {
              setActiveTab("public");
              setLoginError("");
            }}
            className={`cursor-pointer w-1/2 pb-2 text-center font-medium ${
              activeTab === "public"
                ? "text-orange-600 border-b-2 border-orange-600"
                : "text-gray-500"
            }`}
          >
            Public User
          </button>

          <button
            onClick={() => {
              setActiveTab("admin");
              setLoginError("");
            }}
            className={`cursor-pointer w-1/2 pb-2 text-center font-medium ${
              activeTab === "admin"
                ? "text-orange-600 border-b-2 border-orange-600"
                : "text-gray-500"
            }`}
          >
            Admin
          </button>
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="text-red-700 text-xs mb-4 text-center font-semibold">
            {loginError}
          </div>
        )}

        {/* -------------------------- PUBLIC USER FORM -------------------------- */}
        {activeTab === "public" && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSubmit(handlePublicAadhaarSubmit)}>
                <Input
                  defaultName="aadhaar_number"
                  register={register}
                  name="Aadhaar Number"
                  required={true}
                  pattern={/^[0-9]{12}$/}
                  errors={errors}
                  placeholder="Enter your 12-digit Aadhaar number"
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
                  className="mt-8 w-full bg-green-600 text-white rounded-md py-2 hover:bg-green-700 cursor-pointer transition-all ease-in-out duration-500"
                >
                  Get OTP
                </button>
              </form>
            ) : (
              <>
                <p className="text-sm text-gray-700 text-center mb-3">
                  A 6-digit OTP is sent to the linked mobile number ending with{" "}
                  <span className="font-semibold">
                    {aadhaarFoundUser?.phoneNumber
                      ? `******${aadhaarFoundUser.phoneNumber.slice(-4)}`
                      : "****"}
                  </span>
                </p>

                <form onSubmit={handleSubmit(handleOtpVerify)}>
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
                    className="mt-8 w-full bg-orange-600 text-white rounded-md py-2 hover:bg-orange-700 cursor-pointer transition-all ease-in-out duration-500"
                  >
                    Login
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
              // defaultValue={defaultValues.admin_password}
              setValue={setValue}
            />

            <button
              type="submit"
              className="mt-8 w-full bg-orange-600 text-white rounded-md py-2 hover:bg-orange-700 cursor-pointer transition-all ease-in-out duration-500"
            >
              Login
            </button>
          </form>
        )}

        {/* Register Link */}
        {activeTab === "public" && !otpSent && (
          <p className="mt-8 text-center text-xs">
            Don&apos;t have an account?{" "}
            <span className="text-blue-600 cursor-pointer">Register</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
