/* eslint-disable react/prop-types */

/**
 * Admin scheme form: multi-select required documents by catalog key.
 */
export default function DocumentTypeMultiSelect({
  documentTypes = [],
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

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600">
        Select required documents for this scheme. Saved as catalog keys (e.g. aadhaarCard).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50/50">
        {documentTypes.map((dt) => {
          const checked = selectedSet.has(dt.key);
          return (
            <label
              key={dt.key}
              className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                checked ? "bg-[#c2edda]/40 border border-[#68d388]/30" : "hover:bg-white border border-transparent"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                className="mt-0.5 rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(dt.key)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{dt.label}</span>
                <span className="block text-[10px] text-gray-500 font-mono">{dt.key}</span>
                {dt.profileReusable && (
                  <span className="text-[10px] text-emerald-700">Reusable from profile</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {selectedKeys.length > 0 && (
        <p className="text-xs text-gray-600">
          {selectedKeys.length} selected: {selectedKeys.join(", ")}
        </p>
      )}
    </div>
  );
}
