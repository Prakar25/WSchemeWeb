/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import axios from "../../api/axios";
import {
  PUBLIC_AUTH_REGISTER_SEND_OTP_URL,
  PUBLIC_AUTH_REGISTER_VERIFY_OTP_URL,
  PUBLIC_AUTH_LOGIN_SEND_OTP_URL,
  PUBLIC_AUTH_LOGIN_VERIFY_OTP_URL,
} from "../../api/api_routing_urls";

import Input from "../../reusable-components/inputs/InputTextBox/Input";
import SplitText from "../../reusable-components/SplitText/SplitText";

export default function PublicLogin() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
    setValue,
  } = useForm({ mode: "onChange", criteriaMode: "all" });

  const [isRegistering, setIsRegistering] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpFromServer, setOtpFromServer] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const validateMobileNumber = (mobile) => /^[6-9]\d{9}$/.test(mobile);

  const handleLoginSendOtp = async (data) => {
    setLoginError("");
    setOtpSent(false);
    const mobile = data.mobile_number?.trim() || "";
    if (!validateMobileNumber(mobile)) {
      setLoginError("Invalid mobile number. Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    try {
      const response = await axios.post(PUBLIC_AUTH_LOGIN_SEND_OTP_URL, { mobileNumber: mobile });
      const { status, message, otp } = response.data;
      if (status === "success") {
        setMobileNumber(mobile);
        setOtpSent(true);
        setOtpFromServer(otp || null);
        setOtpTimer(600);
        setLoginError("");
        reset({ mobile_number: "" });
      } else {
        setLoginError(message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || error.message || "Unable to send OTP. Please try again later.");
    }
  };

  const handleLoginVerifyOtp = async (data) => {
    setLoginError("");
    try {
      const response = await axios.post(PUBLIC_AUTH_LOGIN_VERIFY_OTP_URL, {
        mobileNumber: mobileNumber,
        otp: data.otp_input?.trim() || "",
      });
      const { status, user, message } = response.data;
      if (status === "success" && user) {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", "Public User");
        reset();
        setOtpSent(false);
        setMobileNumber("");
        setOtpTimer(0);
        navigate("/user/dashboard", { replace: true });
      } else {
        setLoginError(message || "OTP verification failed. Please try again.");
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || error.message || "Invalid OTP. Please try again.");
    }
  };

  const handleRegisterSendOtp = async (data) => {
    setLoginError("");
    setOtpSent(false);
    const mobile = data.mobile_number?.trim() || "";
    if (!validateMobileNumber(mobile)) {
      setLoginError("Invalid mobile number. Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    try {
      const response = await axios.post(PUBLIC_AUTH_REGISTER_SEND_OTP_URL, { mobileNumber: mobile });
      const { status, message, otp } = response.data;
      if (status === "success") {
        setMobileNumber(mobile);
        setOtpSent(true);
        setOtpFromServer(otp || null);
        setOtpTimer(600);
        setLoginError("");
        reset({ mobile_number: "" });
      } else {
        setLoginError(message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || error.message || "Unable to send OTP. Please try again later.");
    }
  };

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
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", "Public User");
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
      setLoginError(error.response?.data?.message || error.message || "Registration failed. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!mobileNumber || isResendingOtp) return;
    setIsResendingOtp(true);
    setLoginError("");
    try {
      const endpoint = isRegistering ? PUBLIC_AUTH_REGISTER_SEND_OTP_URL : PUBLIC_AUTH_LOGIN_SEND_OTP_URL;
      const response = await axios.post(endpoint, { mobileNumber });
      if (response.data.status === "success") {
        setOtpFromServer(response.data.otp || null);
        setOtpTimer(600);
      } else {
        setLoginError(response.data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-8 bg-gradient-to-br from-[#ffb766]/30 via-[#c2edda]/20 to-[#ffb766]/30">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10"
      >
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${!otpSent ? "bg-[#d85a30] text-white" : "bg-[#ffb766] text-[#68d388]"}`}>1</span>
          <span className={`w-8 h-0.5 self-center rounded ${otpSent ? "bg-[#ffb766]" : "bg-slate-200"}`} />
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${otpSent ? "bg-[#d85a30] text-white" : "bg-slate-200 text-black"}`}>2</span>
        </div>

        <h1 className="text-center text-2xl font-bold text-black">
          <SplitText text={isRegistering ? "Create Account" : "Welcome Back"} splitType="chars" delay={35} className="inline-block" />
        </h1>
        <p className="text-center text-black text-sm mt-1 mb-8">
          {!otpSent
            ? isRegistering
              ? "Enter your mobile number to get started"
              : "Sign in with your mobile number"
            : "Enter the OTP sent to your mobile"}
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

        {!otpSent ? (
          <>
            <form onSubmit={handleSubmit(isRegistering ? handleRegisterSendOtp : handleLoginSendOtp)}>
              <Input
                defaultName="mobile_number"
                register={register}
                name="Mobile Number"
                required={true}
                pattern={/^[6-9]\d{9}$/}
                errors={errors}
                placeholder="e.g. 9876543210"
                setError={setError}
                clearError={clearErrors}
                autoComplete="tel"
                type="tel"
                classes="rounded-lg px-4 py-3 text-base border-slate-200 focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30] transition-all w-full"
                onChangeInput={null}
                setValue={setValue}
              />
              <p className="mt-1 text-xs text-black">10-digit Indian mobile number</p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full bg-[#d85a30] text-white font-medium rounded-lg py-3 hover:bg-[#ffb766] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
            <hr className="my-6 border-slate-100" />
            <p className="text-center text-sm text-black">
              {!isRegistering ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setLoginError("");
                      reset();
                      setOtpSent(false);
                      setMobileNumber("");
                      setOtpTimer(0);
                    }}
                    className="text-[#d85a30] hover:text-[#68d388] font-medium underline underline-offset-2"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setLoginError("");
                      reset();
                      setOtpSent(false);
                      setMobileNumber("");
                      setOtpTimer(0);
                    }}
                    className="text-[#d85a30] hover:text-[#68d388] font-medium underline underline-offset-2"
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <div className="mb-5 p-3 rounded-lg bg-[#c2edda]/20 border border-[#c2edda]/50">
              <p className="text-sm text-black text-center">
                ✓ OTP sent to <span className="font-semibold">{mobileNumber ? `******${mobileNumber.slice(-4)}` : "your mobile"}</span>
              </p>
              {otpTimer > 0 && (
                <p className="text-xs text-[#d85a30] text-center mt-1">
                  Expires in <span className="font-mono font-semibold">{formatTimer(otpTimer)}</span>
                </p>
              )}
            </div>
            {otpFromServer && (
              <div className="mb-3 p-2 bg-[#68d388]/20 border border-[#68d388]/40 rounded-md">
                <p className="text-xs text-black text-center"><strong>Dev Mode:</strong> OTP is {otpFromServer}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(isRegistering ? handleRegisterVerifyOtp : handleLoginVerifyOtp)}>
              {isRegistering && (
                <>
                  <Input
                    defaultName="full_name"
                    register={register}
                    name="Full Name (Optional)"
                    required={false}
                    errors={errors}
                    placeholder="Full name (optional)"
                    setError={setError}
                    clearError={clearErrors}
                    type="text"
                    classes="mb-3 rounded-lg px-4 py-3 text-base border-slate-200 focus:ring-2 focus:ring-[#d85a30] w-full"
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
                    placeholder="Email (optional)"
                    setError={setError}
                    clearError={clearErrors}
                    type="email"
                    classes="mb-3 rounded-lg px-4 py-3 text-base border-slate-200 focus:ring-2 focus:ring-[#d85a30] w-full"
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
                placeholder="Enter 6-digit OTP"
                setError={setError}
                clearError={clearErrors}
                type="text"
                classes="rounded-lg px-4 py-3 text-base border-slate-200 focus:ring-2 focus:ring-[#d85a30] w-full"
                onChangeInput={null}
                setValue={setValue}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full bg-[#d85a30] text-white font-medium rounded-lg py-3 hover:bg-[#ffb766] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Verifying..." : isRegistering ? "Register" : "Login"}
              </button>
              <div className="mt-4 text-center">
                {otpTimer > 0 ? (
                  <p className="text-xs text-gray-500">Resend in {formatTimer(otpTimer)}</p>
                ) : (
                  <button type="button" onClick={handleResendOtp} disabled={isResendingOtp} className="text-sm text-[#d85a30] hover:text-[#68d388] font-medium disabled:text-black">
                    {isResendingOtp ? "Resending..." : "Resend OTP"}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setOtpSent(false); reset(); setOtpTimer(0); }}
                className="mt-3 w-full text-sm text-black hover:text-black py-2"
              >
                ← Change Mobile Number
              </button>
            </form>
            <hr className="my-6 border-slate-100" />
            <p className="text-center text-sm text-black">
              {isRegistering ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setLoginError("");
                      reset();
                      setOtpSent(false);
                      setMobileNumber("");
                      setOtpTimer(0);
                    }}
                    className="text-[#d85a30] hover:text-[#68d388] font-medium underline underline-offset-2"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setLoginError("");
                      reset();
                      setOtpSent(false);
                      setMobileNumber("");
                      setOtpTimer(0);
                    }}
                    className="text-[#d85a30] hover:text-[#68d388] font-medium underline underline-offset-2"
                  >
                    Register
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
