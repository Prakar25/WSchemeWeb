/* eslint-disable react/prop-types */
import React from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Custom Form Fields Selector
 * Lets admins define per-scheme form fields that applicants fill when applying.
 * Each field: field_key, label, type, required, options (for select only)
 */
const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Textarea" },
  { value: "checkbox", label: "Checkbox" },
];

const CustomFormFieldsSelector = ({
  fields = [],
  onChange,
  disabled = false,
  className = "",
}) => {
  const updateField = (index, updates) => {
    const updated = [...fields];
    updated[index] = { ...(updated[index] || {}), ...updates };
    onChange(updated);
  };

  const addField = () => {
    onChange([
      ...fields,
      {
        field_key: "",
        label: "",
        type: "text",
        required: false,
        options: "",
      },
    ]);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Custom application form fields
          <span className="text-gray-500 font-normal text-sm ml-1">(optional)</span>
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          Define extra fields applicants must fill when applying to this scheme
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => (
            <motion.div
              key={`custom-field-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="relative p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
            >
              <button
                type="button"
                onClick={() => removeField(index)}
                disabled={disabled}
                className="absolute top-3 right-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Remove form field"
              >
                <FiTrash2 size={18} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-10">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field key
                  </label>
                  <input
                    type="text"
                    value={field.field_key || ""}
                    onChange={(e) =>
                      updateField(index, {
                        field_key: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "_")
                          .replace(/[^a-z0-9_]/g, ""),
                      })
                    }
                    placeholder="e.g. annual_income"
                    disabled={disabled}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={field.label || ""}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="e.g. Annual Income (INR)"
                    disabled={disabled}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Type
                  </label>
                  <select
                    value={field.type || "text"}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value,
                        options: e.target.value === "select" ? field.options || "" : "",
                      })
                    }
                    disabled={disabled}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={!!field.required}
                    onChange={(e) =>
                      updateField(index, { required: e.target.checked })
                    }
                    disabled={disabled}
                    className="rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
                  />
                  <label
                    htmlFor={`required-${index}`}
                    className="text-sm text-gray-700"
                  >
                    Required
                  </label>
                </div>
                {(field.type || "text") === "select" && (
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={field.options || ""}
                      onChange={(e) =>
                        updateField(index, { options: e.target.value })
                      }
                      placeholder="Option1, Option2, Option3"
                      disabled={disabled}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={addField}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#d85a30] border border-[#d85a30]/40 rounded-lg hover:bg-[#c2edda]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiPlus size={16} />
          Add form field
        </button>
      </div>
    </div>
  );
};

export default CustomFormFieldsSelector;
