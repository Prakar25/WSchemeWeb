/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";

import axios from "../../api/axios";
import { ADMIN_LOGIN_URL } from "../../api/api_routing_urls";
import Input from "../../reusable-components/inputs/InputTextBox/Input";
import SplitText from "../../reusable-components/SplitText/SplitText";
import PasswordInput from "../../reusable-components/inputs/InputTextBox/PasswordInput";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");

  const { register, handleSubmit, formState: { isSubmitting }, setError, clearErrors, setValue } = useForm({
    mode: "onChange",
  });

  const handleAdminLogin = async (data) => {
    setLoginError("");
    try {
      const response = await axios.post(ADMIN_LOGIN_URL, {
        username: data.admin_username.trim(),
        password: data.admin_password,
      });

      const { status, user, message } = response.data;

      if (status !== "success" || !user) {
        setLoginError(message || "Incorrect credentials. Try again.");
        return;
      }

      const roleLevel = user.roleLevel || user.role_level || null;
      const userToStore = { ...user, role: user.role || "System Admin", roleLevel };
      localStorage.setItem("user", JSON.stringify(userToStore));
      localStorage.setItem("role", user.role || "System Admin");
      sessionStorage.setItem("admin_username", data.admin_username.trim());
      sessionStorage.setItem("admin_password", data.admin_password);

      const role = (user.role || "").trim();
      if (role === "CSDAdmin") {
        navigate("/csd-admin/dashboard", { replace: true });
      } else {
        navigate("/system-admin/dashboard", { replace: true });
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setLoginError(error.response?.data?.message || error.response?.data?.error || "Incorrect credentials.");
      } else {
        setLoginError("Unable to login. Please try again later.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-8 bg-gradient-to-br from-[#c2edda]/30 via-[#c2edda]/20 to-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10"
      >
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#c2edda] text-[#d85a30]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
        </div>

        <h1 className="text-center text-2xl font-bold text-black">
          <SplitText text="Admin Login" splitType="chars" delay={35} className="inline-block" />
        </h1>
        <p className="text-center text-black text-sm mt-1 mb-8">
          Sign in with your admin credentials
        </p>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-red-50 border-l-4 border-red-400 text-red-700 text-sm"
          >
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{loginError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(handleAdminLogin)}>
          <Input
            defaultName="admin_username"
            register={register}
            name="Username"
            required={true}
            errors={{}}
            placeholder="Enter your username"
            setError={setError}
            clearError={clearErrors}
            type="text"
            classes="mb-4 rounded-lg px-4 py-3 text-base border-slate-200 focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30] w-full"
            onChangeInput={null}
            setValue={setValue}
          />

          <PasswordInput
            id="adminPasswordInput"
            type="password"
            defaultName="admin_password"
            register={register}
            name="Password"
            required={true}
            errors={{}}
            placeholder="Enter your password"
            setError={setError}
            clearError={clearErrors}
            autoComplete="current-password"
            classes="rounded-lg px-4 py-3 text-base border-slate-200 focus:ring-2 focus:ring-[#d85a30] w-full"
            onChangeInput={null}
            setValue={setValue}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full bg-[#d85a30] text-white font-medium rounded-lg py-3 hover:bg-[#ffb766] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <hr className="my-6 border-slate-100" />
          <p className="text-center text-sm text-black">
            Don&apos;t have an admin account?{" "}
            <Link to="/admin-register" className="text-[#d85a30] hover:text-[#68d388] font-medium underline underline-offset-2">
              Register as Admin
            </Link>
          </p>
          <p className="mt-3 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">← Back to Home</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
