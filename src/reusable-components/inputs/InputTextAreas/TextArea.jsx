/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect } from "react";
import Error from "../../outputs/Error";

export default function TextArea({
  defaultName,
  register,
  name,
  required,
  pattern,
  errors,
  classes,
  setError,
  clearError,
  onChangeInput,
  ...rest
}) {
  const { onChange, ...props } = register(defaultName, {
    required: required,
    pattern: pattern,
  });
  useEffect(() => {
    if (rest?.defaultValue !== "") {
      rest.setValue(defaultName, rest?.defaultValue, { shouldTouch: true });
    } else {
      rest.setValue(defaultName, "", { shouldTouch: true });
    }
  }, [rest?.defaultValue]);
  return (
    <div className="flex flex-col w-full max-w-full my-2 justify-start items-start">
      <label className="font-medium text-left text-gray-900 pl-1 pb-1 text-xs md:text-sm lg:text-base">
        {name} {required && <span className="text-red-700">*</span>}
      </label>
      <textarea
        rows="4"
        onChange={async (e) => {
          if (required) {
            if (e.target.value === "") {
              setError(defaultName, {
                type: "required",
                message: `${name} is required`,
              });
              onChange(e);
            } else if (pattern !== null) {
              if (!pattern.test(e.target.value)) {
                setError(defaultName, {
                  type: "pattern",
                  message: `${name} is not valid`,
                });
              } else {
                clearError(defaultName);
              }
            } else if (onChangeInput !== null) {
              const res = await onChangeInput(e.target.value);
              if (res) {
                setError(defaultName, {
                  type: "manual",
                  message: `${name} is not available`,
                });
              } else {
                clearError(defaultName);
              }
            } else {
              clearError(defaultName);
            }
          }
          if (onChangeInput !== null) {
            onChangeInput(e?.target?.value);
          }
          onChange(e);
        }}
        {...props}
        {...rest}
        className={`placeholder:text-xs lg:placeholder:text-sm text-xs md:text-sm ${classes} border focus:border-secondary focus:outline-none focus:ring-0 ${
          required && errors[defaultName] ? "border-red-700" : "border-gray-400"
        }`}
      ></textarea>
      {errors[defaultName] && errors[defaultName].type === "required" && (
        <Error
          classes="flex flex-row gap-1 justify-start items-center max-w-sm w-full mt-1"
          message={`${name} is required`}
        />
      )}
      {errors[defaultName] && errors[defaultName].type === "pattern" && (
        <Error
          classes="flex flex-row gap-1 justify-start items-center max-w-sm w-full mt-1"
          message={`${name} is not valid`}
        />
      )}
      {errors[defaultName] && errors[defaultName].type === "manual" && (
        <Error
          classes="flex flex-row gap-1 justify-start items-center max-w-sm w-full mt-1"
          message={`${name} is not available`}
        />
      )}
    </div>
  );
}
