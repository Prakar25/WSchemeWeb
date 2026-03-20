/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "../../api/axios";
import { ADMIN_REGISTER_URL, ADMIN_ROLES_FOR_AUTHORIZATION_URL, DEPARTMENTS_URL } from "../../api/api_routing_urls";
import Input from "../../reusable-components/inputs/InputTextBox/Input";
import SplitText from "../../reusable-components/SplitText/SplitText";
import PasswordInput from "../../reusable-components/inputs/InputTextBox/PasswordInput";
import showToast from "../../utils/notification/NotificationModal";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm({ mode: "onChange" });

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [rolesRes, deptRes] = await Promise.all([
          axios.get(ADMIN_ROLES_FOR_AUTHORIZATION_URL),
          axios.get(DEPARTMENTS_URL),
        ]);

        if (rolesRes.status === 200 && rolesRes.data?.roles) {
          const availableRoles = rolesRes.data.roles
            .filter((r) => r.level !== 1 && r.role?.toLowerCase() !== "super admin")
            .map((r) => ({
              value: r.level,
              label: `${r.displayName || r.role} (Level ${r.level})`,
              role: r.role,
              displayName: r.displayName || r.role,
            }));
          setRoles(availableRoles);
        } else {
          // Fallback: sequential role levels 2–5 (level 1 = Super Admin, created separately)
          setRoles([
            { value: 2, label: "Admin (Level 2)", role: "Admin" },
            { value: 3, label: "DistrictHQ Head (Level 3)", role: "DistrictHQ Head" },
            { value: 4, label: "District Overlookers (Level 4)", role: "District Overlookers" },
            { value: 5, label: "CSCAdmin (Level 5)", role: "CSCAdmin" },
          ]);
        }

        if (deptRes.status === 200) {
          let deptData = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.departments || deptRes.data?.data || [];
          const valid = (deptData || []).filter((d) => d._id);
          setDepartments(valid.map((d) => ({ value: d._id, label: d.department_display_name || d.department_name || "Unknown" })));
        }
      } catch (err) {
        console.error("Error fetching options:", err);
        setRoles([
          { value: 2, label: "Admin (Level 2)" },
          { value: 3, label: "DistrictHQ Head (Level 3)" },
          { value: 4, label: "District Overlookers (Level 4)" },
          { value: 5, label: "CSCAdmin (Level 5)" },
        ]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const roleLevel = data.roleLevel ? Number(data.roleLevel) : undefined;
      if (!roleLevel || isNaN(roleLevel)) {
        showToast("Please select a role.", "error");
        return;
      }

      const payload = {
        username: data.username?.trim(),
        password: data.password,
        fullName: data.fullName?.trim() || undefined,
        email: data.email?.trim() || undefined,
        contactNumber: data.contactNumber?.trim() || undefined,
        roleLevel,
        departmentId: data.departmentId?.trim() || undefined,
      };

      const response = await axios.post(ADMIN_REGISTER_URL, payload);

      if (response.data?.status === "success") {
        showToast("Registration successful. Your account is pending verification.", "success");
        navigate("/admin-login", { replace: true });
      } else {
        throw new Error(response.data?.message || "Registration failed.");
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Registration failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          <SplitText text="Admin Registration" splitType="chars" delay={30} className="inline-block" />
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Register as an admin. Your account will be pending until a Super Admin or Secretary verifies you.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            const first = Object.values(errors)[0];
            showToast(first?.message || "Please fill all required fields correctly.", "error");
          })}
          className="space-y-4"
        >
          <Input
            defaultName="username"
            register={register}
            name="Username"
            required={true}
            pattern={null}
            errors={errors}
            placeholder="Choose a username"
            setError={setError}
            clearError={clearErrors}
            type="text"
            classes="rounded-md px-3 py-2 text-sm w-full"
            onChangeInput={null}
            setValue={setValue}
          />

          <PasswordInput
            id="adminRegPassword"
            type="password"
            defaultName="password"
            register={register}
            name="Password"
            required={true}
            pattern={null}
            errors={errors}
            placeholder="Choose a password"
            setError={setError}
            clearError={clearErrors}
            autoComplete="new-password"
            classes="rounded-md px-3 py-2 text-sm w-full"
            onChangeInput={null}
            setValue={setValue}
          />

          <Input
            defaultName="fullName"
            register={register}
            name="Full Name"
            required={true}
            pattern={null}
            errors={errors}
            placeholder="Enter your full name"
            setError={setError}
            clearError={clearErrors}
            type="text"
            classes="rounded-md px-3 py-2 text-sm w-full"
            onChangeInput={null}
            setValue={setValue}
          />

          <Input
            defaultName="email"
            register={register}
            name="Email"
            required={true}
            pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
            errors={errors}
            placeholder="Enter your email"
            setError={setError}
            clearError={clearErrors}
            type="email"
            classes="rounded-md px-3 py-2 text-sm w-full"
            onChangeInput={null}
            setValue={setValue}
          />

          <Input
            defaultName="contactNumber"
            register={register}
            name="Contact Number"
            required={false}
            pattern={/^[6-9]\d{9}$/}
            errors={errors}
            placeholder="10-digit mobile number (optional)"
            setError={setError}
            clearError={clearErrors}
            type="text"
            classes="rounded-md px-3 py-2 text-sm w-full"
            onChangeInput={null}
            setValue={setValue}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              {...register("departmentId")}
              className="w-full rounded-md px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d85a30]"
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? "Loading..." : "Select your department (optional)"}</option>
              {departments.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-600">*</span>
            </label>
            <select
              {...register("roleLevel", { required: "Please select a role" })}
              className="w-full rounded-md px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d85a30]"
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? "Loading..." : "Select your role"}</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.roleLevel && (
              <p className="text-red-600 text-xs mt-1">{errors.roleLevel.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || loadingOptions}
            className="mt-6 w-full bg-[#d85a30] text-white rounded-md py-2.5 hover:bg-[#ffb766] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          After registration, your account will remain in <strong>pending</strong> state until a Super Admin or Secretary verifies you. You will not be able to login until then.
        </p>

        <div className="mt-4 text-center">
          <Link to="/admin-login" className="text-[#d85a30] hover:text-[#ffb766] text-sm font-medium">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
