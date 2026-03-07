/* eslint-disable react/prop-types */
import React from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

/**
 * Dynamic Authorization Levels Selector
 * - Add/remove levels
 * - Each dropdown lists all roles (levels 1–8)
 * - Order defines the verification workflow
 * - authorization_levels can be [] for default workflow
 */
const DynamicAuthLevelsSelector = ({
  levels = [], // Array of { level: number } (level = role level 1-8)
  options = [], // Array of { label, value }
  onChange,
  onAddLevel,
  onRemoveLevel,
  onClearAll,
  onStartWithDefault,
  loading = false,
  disabled = false,
  showPreview = true,
}) => {
  const getLabelForLevel = (levelNum) => {
    const opt = options.find((o) => o.value === levelNum);
    return opt ? opt.label : `Level ${levelNum}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-gray-900">
          Authorization Levels
          <span className="text-gray-500 font-normal text-sm ml-1">(optional – order defines workflow)</span>
        </h3>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={onStartWithDefault}
            disabled={loading || disabled || options.length === 0}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
          >
            Start with 1 level
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={loading || disabled || levels.length === 0}
            className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Define who can authorize applications at each stage. Empty = default workflow. Levels 1–8 only.
      </p>

      <div className="space-y-3">
        {levels.map((item, index) => (
          <div
            key={`auth-level-${index}`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <span className="text-sm font-medium text-gray-500 w-24">Level {index + 1}</span>
            <select
              value={item.level ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                const updated = [...levels];
                updated[index] = { level: val };
                onChange(updated);
              }}
              disabled={loading || disabled}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#f43a09] focus:border-[#f43a09]"
            >
              <option value="">Select role...</option>
              {options
                .filter((o) => o.value >= 1 && o.value <= 8)
                .map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => onRemoveLevel(index)}
              disabled={disabled}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              aria-label="Remove level"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddLevel}
          disabled={loading || disabled || options.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#f43a09] border border-[#f43a09]/50 rounded-lg hover:bg-[#c2edda]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlus size={16} />
          Add level
        </button>
      </div>

      {showPreview && levels.filter((l) => l?.level != null && !isNaN(l.level)).length > 0 && (
        <div className="mt-3 p-3 bg-[#c2edda]/20 border border-[#f43a09]/30 rounded-lg">
          <p className="text-xs font-medium text-black mb-2">Workflow order</p>
          <ol className="list-decimal list-inside text-sm text-black space-y-1">
            {levels
              .filter((l) => l?.level != null && !isNaN(l.level))
              .map((l, i) => (
                <li key={i}>{getLabelForLevel(l.level)}</li>
              ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default DynamicAuthLevelsSelector;
