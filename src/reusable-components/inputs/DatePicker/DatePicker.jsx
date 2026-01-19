/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { useController } from "react-hook-form";
import { FaCalendarAlt } from "react-icons/fa";
import Error from "../../outputs/Error";

export default function DatePicker({
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
  control,
  setValue,
  defaultValue,
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const dateInputRef = useRef(null);
  const containerRef = useRef(null);

  const {
    field: { onChange, onBlur, value, ref },
  } = useController({
    name: defaultName,
    control,
    rules: { required: required, pattern: pattern },
    defaultValue: defaultValue || "",
  });

  // Initialize selected date from defaultValue or value
  useEffect(() => {
    if (defaultValue) {
      setSelectedDate(defaultValue);
      setValue?.(defaultName, defaultValue, { shouldTouch: true });
    } else if (value) {
      setSelectedDate(value);
    }
  }, [defaultValue, value, defaultName, setValue]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);
    onChange(e);
    
    if (onChangeInput) {
      onChangeInput(dateValue);
    }
    
    if (required && !dateValue) {
      setError(defaultName, {
        type: "required",
        message: `${name} is required`,
      });
    } else {
      clearError(defaultName);
    }

    // Validate max date if provided
    if (rest?.max && dateValue) {
      if (new Date(dateValue) > new Date(rest.max)) {
        setError(defaultName, {
          type: "manual",
          message: `${name} cannot be after ${new Date(rest.max).toLocaleDateString()}`,
        });
      } else {
        clearError(defaultName);
      }
    }

    // Validate min date if provided
    if (rest?.min && dateValue) {
      if (new Date(dateValue) < new Date(rest.min)) {
        setError(defaultName, {
          type: "manual",
          message: `${name} cannot be before ${new Date(rest.min).toLocaleDateString()}`,
        });
      } else {
        clearError(defaultName);
      }
    }
  };

  const handleCalendarIconClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && dateInputRef.current) {
      setTimeout(() => {
        dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus();
      }, 0);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${
        rest?.showInput === undefined || rest?.showInput === true
          ? "flex flex-col"
          : "hidden"
      } w-full my-2 justify-start items-start`}
    >
      <label className="font-medium text-left text-gray-900 pl-1 pb-1 text-xs md:text-sm lg:text-base">
        {name} {required && <span className="text-red-700">*</span>}
      </label>
      
      <div className="relative w-full">
        <input
          ref={(e) => {
            ref(e);
            dateInputRef.current = e;
          }}
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          onBlur={onBlur}
          {...rest}
          className={`placeholder:text-xs lg:placeholder:text-sm text-xs md:text-sm ${classes} border focus:outline-none focus:ring-0 focus:border-secondary pr-10 cursor-pointer ${
            errors[defaultName]
              ? "border-red-700"
              : "border-gray-400"
          }`}
          style={{
            colorScheme: "light",
            WebkitAppearance: "none",
            MozAppearance: "textfield",
          }}
          onClick={() => {
            if (dateInputRef.current) {
              dateInputRef.current.showPicker?.();
            }
          }}
        />
        <button
          type="button"
          onClick={handleCalendarIconClick}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none cursor-pointer z-10"
          tabIndex={-1}
          aria-label="Open date picker"
        >
          <FaCalendarAlt className="w-5 h-5" />
        </button>
      </div>

      {/* Display formatted date below input */}
      {selectedDate && (
        <p className="text-xs text-gray-600 mt-1 pl-1">
          Selected: {formatDisplayDate(selectedDate)}
        </p>
      )}

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
          message={errors[defaultName].message}
        />
      )}
    </div>
  );
}
