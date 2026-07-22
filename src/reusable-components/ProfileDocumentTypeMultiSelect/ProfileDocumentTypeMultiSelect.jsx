/* eslint-disable react/prop-types */
import { FiCheck } from "react-icons/fi";

const SCROLL_THRESHOLD = 5;

function ProfileDocCheckbox({ dt, checked, disabled, onToggle }) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        checked
          ? "bg-[#c2edda]/50 border-[#68d388]/50 shadow-sm"
          : "bg-white border-gray-200 hover:border-[#c2edda] hover:bg-white"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900 leading-snug">
          {dt.label}
        </span>
        <span className="inline-block mt-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
          Pre-fills from profile
        </span>
      </span>
      {checked && (
        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#68d388]/30 text-emerald-800">
          <FiCheck className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
    </label>
  );
}

/**
 * Admin scheme form: profile KYC docs that pre-fill from applicant profile.
 */
export default function ProfileDocumentTypeMultiSelect({
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
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-8 text-center">
        <p className="text-sm text-gray-500">Loading profile document types…</p>
      </div>
    );
  }

  if (!documentTypes.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-6 text-center">
        <p className="text-sm text-amber-800">
          No profile document types available.
        </p>
      </div>
    );
  }

  const needsScroll = documentTypes.length > SCROLL_THRESHOLD;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600 leading-relaxed">
        Identity documents loaded automatically from the applicant&apos;s profile when
        they apply.
      </p>

      <div
        className={`rounded-lg border border-emerald-200/70 bg-gradient-to-b from-emerald-50/40 to-white min-h-[10.5rem] ${
          needsScroll ? "panel-scroll overflow-y-auto max-h-[min(22rem,55vh)]" : ""
        }`}
      >
        <div className={`p-3 space-y-2.5 ${needsScroll ? "pr-1.5" : ""}`}>
          {documentTypes.map((dt) => (
            <ProfileDocCheckbox
              key={dt.key}
              dt={dt}
              checked={selectedSet.has(dt.key)}
              disabled={disabled}
              onToggle={() => toggle(dt.key)}
            />
          ))}
        </div>
      </div>

      {selectedKeys.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Selected:</span>
          {selectedKeys.map((key) => {
            const dt = documentTypes.find((d) => d.key === key);
            return (
              <span
                key={key}
                className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-900"
              >
                {dt?.label || key}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No profile documents selected yet.</p>
      )}
    </div>
  );
}
