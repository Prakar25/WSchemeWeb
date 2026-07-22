/* eslint-disable react/prop-types */

function DocTypeCheckbox({ dt, checked, disabled, onToggle }) {
  return (
    <label
      className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
        checked ? "bg-[#c2edda]/40 border border-[#68d388]/30" : "hover:bg-white border border-transparent"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        className="mt-0.5 rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900">{dt.label}</span>
        {dt.profileReusable && (
          <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
            Can reuse from profile
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Admin scheme form: multi-select required documents by catalog key.
 */
export default function DocumentTypeMultiSelect({
  documentTypes = [],
  profileReusableTypes = [],
  schemeOnlyTypes = [],
  selectedKeys = [],
  onChange,
  disabled = false,
  loading = false,
}) {
  const selectedSet = new Set(selectedKeys);

  const toggle = (key) => {
    if (disabled) return;
    const next = selectedSet.has(key)
      ? selectedKeys.filter((k) => k !== key)
      : [...selectedKeys, key];
    onChange(next);
  };

  const profileGroup =
    profileReusableTypes.length > 0
      ? profileReusableTypes
      : documentTypes.filter((d) => d.profileReusable);
  const schemeGroup =
    schemeOnlyTypes.length > 0
      ? schemeOnlyTypes
      : documentTypes.filter((d) => !d.profileReusable);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading document types…</p>;
  }

  if (!documentTypes.length) {
    return (
      <p className="text-sm text-amber-700">
        No document types available. Restart the API or add types in the catalog.
      </p>
    );
  }

  const renderGroup = (title, items) =>
    items.length > 0 ? (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
          {title}
        </p>
        {items.map((dt) => (
          <DocTypeCheckbox
            key={dt.key}
            dt={dt}
            checked={selectedSet.has(dt.key)}
            disabled={disabled}
            onToggle={() => toggle(dt.key)}
          />
        ))}
      </div>
    ) : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        Select required documents for this scheme. Only catalog keys are saved.
      </p>
      <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50/50">
        {renderGroup("Profile reusable", profileGroup)}
        {renderGroup("Application only", schemeGroup)}
      </div>
      {selectedKeys.length > 0 && (
        <p className="text-xs text-gray-600">{selectedKeys.length} document type(s) selected.</p>
      )}
    </div>
  );
}
