/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import Input from "../../reusable-components/inputs/InputTextBox/Input";
import PasswordInput from "../../reusable-components/inputs/InputTextBox/PasswordInput";
import Error from "../../reusable-components/outputs/Error";

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

  const publicUsers = [
    {
      fullName: "Prakash Lepcha",
      contactEmail: "prakash.lepcha@example.com",
      phoneNumber: "9800015247",
      address: "Gangtok, Sikkim",
      dob: "12-03-1990",
      aadhaar: "123456789012",
    },
    {
      fullName: "Sonam Chhetri",
      contactEmail: "sonam.chhetri@example.com",
      phoneNumber: "9802216258",
      address: "Pakyong, Sikkim",
      dob: "22-09-1988",
      aadhaar: "987654321098",
    },
    {
      fullName: "Mingma Sherpa",
      contactEmail: "mingma.sherpa@example.com",
      phoneNumber: "9805511468",
      address: "Namchi, Sikkim",
      dob: "17-05-1993",
      aadhaar: "564738291034",
    },
    {
      fullName: "Pema Tamang",
      contactEmail: "pema.tamang@example.com",
      phoneNumber: "9808811258",
      address: "Mangan, North Sikkim",
      dob: "03-08-1995",
      aadhaar: "675849302156",
    },
    {
      fullName: "Rinchen Bhutia",
      contactEmail: "rinchen.bhutia@example.com",
      phoneNumber: "9811115472",
      address: "Ravangla, Sikkim",
      dob: "25-11-1991",
      aadhaar: "453627890123",
    },
    {
      fullName: "Tashi Gurung",
      contactEmail: "tashi.gurung@example.com",
      phoneNumber: "9814413587",
      address: "Gyalshing, West Sikkim",
      dob: "10-04-1994",
      aadhaar: "890123456789",
    },
    {
      fullName: "Lhamu Shering",
      contactEmail: "lhamu.shering@example.com",
      phoneNumber: "9817713957",
      address: "Dentam, Sikkim",
      dob: "27-01-1992",
      aadhaar: "321654987012",
    },
    {
      fullName: "Bijay Rai",
      contactEmail: "bijay.rai@example.com",
      phoneNumber: "9820014587",
      address: "Jorethang, Sikkim",
      dob: "16-06-1990",
      aadhaar: "789654123098",
    },
    {
      fullName: "Anita Subba",
      contactEmail: "anita.subba@example.com",
      phoneNumber: "9823313164",
      address: "Tadong, Sikkim",
      dob: "30-12-1996",
      aadhaar: "234567890111",
    },
    {
      fullName: "Sangay Tamang",
      contactEmail: "sangay.tamang@example.com",
      phoneNumber: "9826615126",
      address: "Lachung, Sikkim",
      dob: "08-07-1987",
      aadhaar: "998877665544",
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

  const handlePublicAadhaarSubmit = (data) => {
    setLoginError("");

    const user = publicUsers.find(
      (u) => u.aadhaar === data.aadhaar_number.trim()
    );

    if (!user) {
      setLoginError(
        "Aadhaar details not found in UIDAI database. Enter the correct details."
      );
      return;
    }

    setAadhaarFoundUser(user);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // setGeneratedOtp(otp);
    setGeneratedOtp("123456");
    setOtpSent(true);

    // console.log("Mock OTP (for testing):", otp);
  };

  const handleOtpVerify = (data) => {
    if (data.otp_input === generatedOtp) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...aadhaarFoundUser,
        })
      );
      localStorage.setItem("role", "Public User");

      const to = "/user/dashboard";

      navigate(to, { replace: true });
    } else {
      setLoginError("Incorrect OTP entered. Please try again.");
    }
  };

  const handleAdminLogin = (data) => {
    setLoginError("");

    const admin = adminUsers.find(
      (u) => u.username === data.admin_username.trim()
    );

    if (!admin || admin.password !== data.admin_password) {
      setLoginError("Incorrect credentials entered. Try again.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(admin));
    localStorage.setItem("role", "System Admin");

    navigate("/");
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
                    ******{aadhaarFoundUser.phoneNumber.slice(-4)}
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
