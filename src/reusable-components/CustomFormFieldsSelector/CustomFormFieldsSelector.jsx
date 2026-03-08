/* eslint-disable react/prop-types */
import React from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Custom Form Fields Selector
 * Lets admins define per-scheme form fields that applicants fill when applying.
 * Uses title; backend derives field_key from title. Supports depends_on for conditional fields.
 */
const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Textarea" },
  { value: "checkbox", label: "Checkbox" },
];

const deriveFieldKey = (title) =>
  (title || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

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
        title: "",
        type: "text",
        required: true,
        options: "",
        depends_on: null,
      },
    ]);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-gray-800">
          Custom form fields
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Extra fields applicants fill when applying to this scheme
        </p>
      </div>

      {fields.length === 0 ? (
        <div className="py-6 px-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-center">
          <p className="text-sm text-gray-500">No custom fields yet</p>
          <p className="text-xs text-gray-400 mt-0.5">Click &quot;Add field&quot; to add form fields for applicants</p>
        </div>
      ) : (
        <div
          className={`space-y-2 ${fields.length > 6 ? "max-h-[400px] overflow-y-auto pr-1" : ""}`}
        >
          <AnimatePresence mode="popLayout">
            {fields.map((field, index) => {
              const parentOptions = fields
                .map((f, i) => {
                  const key = f.field_key || deriveFieldKey(f.title || f.label);
                  if (i === index || !key) return null;
                  return { value: key, label: (f.title || f.label || key) || `Field ${i + 1}` };
                })
                .filter(Boolean);
              const parentField = fields.find(
                (f) => (f.field_key || deriveFieldKey(f.title || f.label)) === (field.depends_on?.field_key)
              );
              const parentType = parentField?.type || parentField?.field_type || "text";

              return (
                <motion.div
                  key={`custom-field-${index}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="group relative flex flex-wrap items-end gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 pr-10"
                >
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    disabled={disabled}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="Remove"
                  >
                    <FiTrash2 size={14} />
                  </button>

                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={field.title ?? field.label ?? ""}
                      onChange={(e) => updateField(index, { title: e.target.value })}
                      placeholder="Label"
                      disabled={disabled}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#d85a30]/40 focus:border-[#d85a30] placeholder:text-gray-400"
                    />
                  </div>
                  <select
                    value={field.type ?? field.field_type ?? "text"}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value,
                        field_type: e.target.value,
                        options: e.target.value === "select" ? (field.options || "") : "",
                      })
                    }
                    disabled={disabled}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#d85a30]/40 focus:border-[#d85a30] bg-white"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={!!field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      disabled={disabled}
                      className="rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
                    />
                    Req
                  </label>
                  {(field.type ?? field.field_type ?? "text") === "select" && (
                    <input
                      type="text"
                      value={field.options ?? ""}
                      onChange={(e) => updateField(index, { options: e.target.value })}
                      placeholder="Opt1, Opt2"
                      disabled={disabled}
                      className="flex-1 min-w-[100px] max-w-[180px] px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#d85a30]/40 focus:border-[#d85a30] placeholder:text-gray-400"
                    />
                  )}
                  <select
                    value={field.depends_on?.field_key ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) updateField(index, { depends_on: null });
                      else updateField(index, {
                        depends_on: { field_key: val, value: parentType === "checkbox" ? true : "" },
                      });
                    }}
                    disabled={disabled}
                    title="Show only when"
                    className="w-28 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#d85a30]/40 focus:border-[#d85a30] bg-white text-gray-600"
                  >
                    <option value="">Always</option>
                    {parentOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {field.depends_on?.field_key && parentType === "checkbox" && (
                    <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={field.depends_on.value === true || field.depends_on.value === "true"}
                        onChange={(e) =>
                          updateField(index, { depends_on: { ...field.depends_on, value: e.target.checked } })
                        }
                        disabled={disabled}
                        className="rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
                      />
                      =checked
                    </label>
                  )}
                  {field.depends_on?.field_key && parentType === "select" && parentField?.options && (
                    <select
                      value={field.depends_on.value ?? ""}
                      onChange={(e) =>
                        updateField(index, { depends_on: { ...field.depends_on, value: e.target.value } })
                      }
                      disabled={disabled}
                      className="w-24 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#d85a30]/40 focus:border-[#d85a30] bg-white"
                    >
                      {(String(parentField.options || "").split(",").map((o) => o.trim()).filter(Boolean)).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {field.depends_on?.field_key && parentType !== "checkbox" && parentType !== "select" && (
                    <input
                      type="text"
                      value={field.depends_on.value ?? ""}
                      onChange={(e) =>
                        updateField(index, { depends_on: { ...field.depends_on, value: e.target.value } })
                      }
                      placeholder="Value"
                      disabled={disabled}
                      className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#d85a30]/40 focus:border-[#d85a30]"
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <button
        type="button"
        onClick={addField}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#d85a30] bg-[#d85a30]/5 border border-[#d85a30]/30 rounded-lg hover:bg-[#d85a30]/10 hover:border-[#d85a30]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FiPlus size={16} strokeWidth={2.5} />
        Add field
      </button>
    </div>
  );
};

export default CustomFormFieldsSelector;
