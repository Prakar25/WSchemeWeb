/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { useController } from "react-hook-form";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
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
          className={`placeholder:text-xs lg:placeholder:text-sm text-xs md:text-sm ${classes} relative z-0 border focus:outline-none focus:ring-0 focus:border-secondary pr-11 cursor-pointer text-gray-900 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${
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
          className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-[#d85a30] shadow-sm hover:bg-gray-50 hover:text-[#b84a28] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d85a30] focus-visible:ring-offset-1"
          tabIndex={-1}
          aria-label="Open date picker"
        >
          <CalendarDaysIcon className="h-5 w-5 shrink-0" aria-hidden />
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
