/* eslint-disable no-unused-vars */
import React from "react";

const UnderDevelopment = ({
  title = "Under Development",
  message = "This section is currently under development. Please check back later.",
}) => {
  return (
    <section className="flex items-center justify-center min-h-[60vh] bg-slate-50">
      <div className="bg-white rounded-lg shadow-md px-8 py-10 max-w-md text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-12 h-12 text-orange-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.007M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-slate-800 mb-2">{title}</h2>

        {/* Message */}
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
      </div>
    </section>
  );
};

export default UnderDevelopment;
