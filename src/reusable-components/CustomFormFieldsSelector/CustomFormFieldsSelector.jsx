/* eslint-disable react/prop-types */
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { FormSelectInput } from "../inputs/FormSelect/FormSelect";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Long text" },
  { value: "checkbox", label: "Yes/No" },
];

const deriveFieldKey = (title) =>
  (title || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

const inputClass =
  "px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#d85a30]/40 focus:border-[#d85a30] placeholder:text-gray-400 disabled:bg-gray-50";

/** Shared column widths — keeps header + rows aligned */
const COL = {
  num: "w-6 shrink-0",
  label: "w-36 sm:w-44 md:w-52 lg:w-60 shrink-0",
  type: "w-[5.5rem] shrink-0",
  options: "w-28 sm:w-32 shrink-0",
  req: "w-10 shrink-0",
  when: "w-28 sm:w-32 shrink-0",
  value: "w-24 sm:w-28 shrink-0",
  delete: "w-8 shrink-0",
};

function ColumnHeader() {
  return (
    <div className="hidden sm:flex flex-nowrap items-center gap-2 px-2 pb-1 border-b border-gray-200 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      <span className={COL.num}>#</span>
      <span className={COL.label}>Label</span>
      <span className={COL.type}>Type</span>
      <span className={COL.options}>Options</span>
      <span className={COL.req}>Req</span>
      <span className={COL.when}>Show when</span>
      <span className={COL.value}>Value</span>
      <span className={COL.delete} />
    </div>
  );
}

function CustomFieldRow({ field, index, fields, disabled, onUpdate, onRemove }) {
  const fieldType = field.type ?? field.field_type ?? "text";
  const isSelect = fieldType === "select";

  const parentOptions = fields
    .map((f, i) => {
      const key = f.field_key || deriveFieldKey(f.title || f.label);
      if (i === index || !key) return null;
      return {
        value: key,
        label: (f.title || f.label || key) || `Q${i + 1}`,
      };
    })
    .filter(Boolean);

  const parentField = fields.find(
    (f) =>
      (f.field_key || deriveFieldKey(f.title || f.label)) ===
      field.depends_on?.field_key
  );
  const parentType = parentField?.type || parentField?.field_type || "text";
  const hasCondition = Boolean(field.depends_on?.field_key);

  return (
    <div className="rounded-md border border-gray-200 bg-white hover:bg-gray-50/50 transition-colors">
      <div className="overflow-x-auto">
        <div className="flex flex-nowrap items-center gap-2 px-2 py-2 min-w-max">
          <span
            className={`${COL.num} text-center text-[11px] font-bold text-gray-400`}
          >
            {index + 1}
          </span>

          <input
            type="text"
            value={field.title ?? field.label ?? ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Question label"
            disabled={disabled}
            className={`${inputClass} ${COL.label}`}
          />

          <FormSelectInput
            size="compact"
            value={fieldType}
            onChange={(e) =>
              onUpdate({
                type: e.target.value,
                field_type: e.target.value,
                options: e.target.value === "select" ? field.options || "" : "",
              })
            }
            disabled={disabled}
            className={COL.type}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </FormSelectInput>

          <input
            type="text"
            value={isSelect ? field.options ?? "" : ""}
            onChange={(e) => onUpdate({ options: e.target.value })}
            placeholder={isSelect ? "A, B, C" : "—"}
            disabled={disabled || !isSelect}
            className={`${inputClass} ${COL.options} ${
              !isSelect ? "opacity-40 cursor-not-allowed bg-gray-50" : ""
            }`}
            tabIndex={isSelect ? 0 : -1}
          />

          <label
            className={`${COL.req} inline-flex items-center justify-center gap-0.5 cursor-pointer text-xs text-gray-600`}
          >
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              disabled={disabled}
              className="rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
              title="Required"
            />
          </label>

          <FormSelectInput
            size="compact"
            value={field.depends_on?.field_key ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) onUpdate({ depends_on: null });
              else
                onUpdate({
                  depends_on: {
                    field_key: val,
                    value: parentType === "checkbox" ? true : "",
                  },
                });
            }}
            disabled={disabled}
            className={COL.when}
            title="Show when"
          >
            <option value="">Always</option>
            {parentOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelectInput>

          <div className={COL.value}>
            {!hasCondition && (
              <span className="block text-center text-xs text-gray-300 py-1.5">—</span>
            )}
            {hasCondition && parentType === "checkbox" && (
              <label className="inline-flex h-[30px] w-full items-center justify-center gap-1 cursor-pointer text-xs text-gray-600 border border-gray-200 rounded-md bg-white">
                <input
                  type="checkbox"
                  checked={
                    field.depends_on.value === true ||
                    field.depends_on.value === "true"
                  }
                  onChange={(e) =>
                    onUpdate({
                      depends_on: {
                        ...field.depends_on,
                        value: e.target.checked,
                      },
                    })
                  }
                  disabled={disabled}
                  className="rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
                />
                Yes
              </label>
            )}
            {hasCondition && parentType === "select" && parentField?.options && (
              <FormSelectInput
                size="compact"
                value={field.depends_on.value ?? ""}
                onChange={(e) =>
                  onUpdate({
                    depends_on: {
                      ...field.depends_on,
                      value: e.target.value,
                    },
                  })
                }
                disabled={disabled}
                className="w-full"
              >
                <option value="">Pick</option>
                {String(parentField.options || "")
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean)
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </FormSelectInput>
            )}
            {hasCondition &&
              parentType !== "checkbox" &&
              parentType !== "select" && (
                <input
                  type="text"
                  value={field.depends_on.value ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      depends_on: {
                        ...field.depends_on,
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Value"
                  disabled={disabled}
                  className={`${inputClass} w-full`}
                />
              )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className={`${COL.delete} flex items-center justify-center p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors`}
            aria-label={`Remove question ${index + 1}`}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

const CustomFormFieldsSelector = ({
  fields = [],
  onChange,
  disabled = false,
  className = "",
  title = "Custom form fields",
  description = "Extra fields applicants fill when applying to this scheme",
  emptyMessage = "No questions added",
  emptyHint = "Optional — add only if you need extra applicant inputs",
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
    <div className={`space-y-2 ${className}`}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-4 text-center">
          <p className="text-xs text-gray-500">{emptyMessage}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{emptyHint}</p>
          <button
            type="button"
            onClick={addField}
            disabled={disabled}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[#d85a30]/40 bg-[#d85a30]/5 px-3 py-1.5 text-xs font-medium text-[#d85a30] hover:bg-[#d85a30]/10 disabled:opacity-50"
          >
            <FiPlus size={14} />
            Add question
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-gray-50/30 overflow-hidden">
            <ColumnHeader />
            <div
              className={`divide-y divide-gray-100 ${
                fields.length > 4 ? "max-h-[240px] overflow-y-auto" : ""
              }`}
            >
              {fields.map((field, index) => (
                <CustomFieldRow
                  key={`custom-field-${index}`}
                  field={field}
                  index={index}
                  fields={fields}
                  disabled={disabled}
                  onUpdate={(updates) => updateField(index, updates)}
                  onRemove={() => removeField(index)}
                />
              ))}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 sm:hidden">
            Swipe horizontally to see all columns.
          </p>

          <button
            type="button"
            onClick={addField}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#d85a30]/40 hover:text-[#d85a30] disabled:opacity-50"
          >
            <FiPlus size={14} />
            Add question
          </button>
        </>
      )}
    </div>
  );
};

export default CustomFormFieldsSelector;
