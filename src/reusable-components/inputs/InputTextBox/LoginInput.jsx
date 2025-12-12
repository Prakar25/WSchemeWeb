/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import Error from "../../outputs/Error";
import { HiUser, HiLockClosed } from "react-icons/hi";
import { IconContext } from "react-icons";

export default function LoginInput({
  register,
  name,
  required,
  pattern,
  errors,
  classes,
  setError,
  clearError,
  formHasError,
  setFormHasError,
  ...rest
}) {
  const { onChange, ...props } = register(name, {
    required: { value: required, message: `${name} is required` },
    pattern: pattern,
  });

  return (
    <div className="flex flex-col w-full mb-4">
      <IconContext.Provider value={{ className: "text-lg" }}>
        <div className="flex items-center">
          {name === "Username" ? <HiUser /> : <HiLockClosed />}
          <p className="font-bold text-left mb-0">{name}</p>
        </div>
      </IconContext.Provider>
      <input
        onChange={(e) => {
          if (e.target.value === "") {
            setError(name, {
              type: "required",
              message: `${name} is required`,
            });
            onChange(e);
          } else {
            setFormHasError(false);
            clearError(name);
          }
        }}
        {...props}
        {...rest}
        className={`${classes} border ${
          errors[name] ? "border-red-700" : "border-gray-300"
        }`}
        autoComplete={"off"}
      />
      {errors[name] && (
        <Error
          classes="flex flex-row gap-1 justify-start items-center max-w-sm w-full mt-1"
          message={`${name} is required`}
        />
      )}
    </div>
  );
}
