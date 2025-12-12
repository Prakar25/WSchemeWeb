/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { Fragment, useEffect } from "react";
import Error from "../../outputs/Error";

export default function Input({
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
  showInput,
  ...rest
}) {
  const { onChange, ...props } = register(defaultName, {
    required: required,
    pattern: pattern,
  });

  useEffect(() => {
    if (rest?.defaultValue !== "") {
      rest.setValue(defaultName, rest?.defaultValue, { shouldTouch: true });
    }
  }, [rest?.defaultValue]);

  return (
    <Fragment>
      <div
        className={`${
          showInput === undefined || showInput === true
            ? "flex flex-col"
            : "hidden"
        } w-full my-2 justify-start items-start`}
      >
        <label className="flex items-center font-medium text-left text-gray-500 font-inria-sans text-xs lg:text-sm pb-1">
          {name === "User Name" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3 text-secondary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          ) : name === "Password" ? null : ( // </svg> //   /> //     clipRule="evenodd" //     d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" //     fillRule="evenodd" //   <path // > //   fill="currentColor" //   viewBox="0 0 20 20" //   className="h-5 w-5 mr-3 text-black" //   xmlns="http://www.w3.org/2000/svg" // <svg
            ""
          )}
          {name} {required && <span className="text-red-700">*</span>}
        </label>
        <input
          onBlur={async (e) => {
            rest?.onBlur(e);
          }}
          onChange={async (e) => {
            // setFormErrMsg("");
            if (e.target.value === "") {
              if (required) {
                setError(defaultName, {
                  type: "required",
                  message: `${name} is required`,
                });
              } else {
                clearError(defaultName);
                clearError(`${defaultName}_onChange`);
                onChange(e);
              }
              if (onChangeInput !== null) {
                onChangeInput(e?.target?.value);
              }
              // onChange(e);
            } else if (pattern !== null) {
              if (!pattern.test(e.target.value)) {
                clearError(defaultName);
                clearError(`${defaultName}_onChange`);
                setError(defaultName, {
                  type: "pattern",
                  message: `${name} is not valid`,
                });
              } else {
                if (onChangeInput !== null) {
                  clearError(defaultName);
                  clearError(`${defaultName}_onChange`);
                  const res = await onChangeInput(e?.target?.value);
                  if (res) {
                    setError(`${defaultName}_onChange`, {
                      type: "manual",
                      message: `${name} is not available`,
                    });
                  } else {
                    clearError(`${defaultName}_onChange`);
                    onChange(e);
                  }
                } else {
                  onChange(e);
                }
              }
            } else if (onChangeInput !== null) {
              const res = await onChangeInput(e.target.value);
              if (res) {
                setError(`${defaultName}_onChange`, {
                  type: "manual",
                  message: `${name} is not available`,
                });
              } else {
                clearError(`${defaultName}_onChange`);
                onChange(e);
              }
            } else {
              clearError(defaultName);
              clearError(`${defaultName}_onChange`);

              onChange(e);
            }
            if (rest?.type === "number") {
              if (parseInt(e.target.value) < parseInt(rest?.min)) {
                setError(`${defaultName}_onChange`, {
                  type: "manual",
                  message: `${name} is less than expected`,
                });
              } else {
                clearError(`${defaultName}_onChange`);
                onChange(e);
              }
            }
            if (rest?.type === "date") {
              if (new Date(e.target.value) > new Date(rest?.max)) {
                setError(`${defaultName}_onChange`, {
                  type: "manual",
                  message: `${name} is less than expected`,
                });
              } else {
                clearError(`${defaultName}_onChange`);
                onChange(e);
              }
            }
          }}
          {...props}
          {...rest}
          autoSave="off"
          className={`${classes} border ${
            errors[defaultName]
              ? "border-red-700"
              : errors[`${defaultName}_onChange`]
              ? "border-red-700"
              : "border-gray-400"
          }`}
        />
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
        {errors[`${defaultName}_onChange`] && (
          <Error
            classes="flex flex-row gap-1 justify-start items-center max-w-sm w-full mt-1"
            message={`${errors[`${defaultName}_onChange`].message}`}
          />
        )}
      </div>
    </Fragment>
  );
}
