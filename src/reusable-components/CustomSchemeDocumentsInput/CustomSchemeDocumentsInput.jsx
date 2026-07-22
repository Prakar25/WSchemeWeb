/* eslint-disable react/prop-types */
import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";

/**
 * Admin scheme form: free-text custom required documents (saved as label strings).
 */
export default function CustomSchemeDocumentsInput({
  documents = [],
  onChange,
  disabled = false,
  placeholder = "e.g. Certificate from Food & Civil Supplies Department",
}) {
  const [input, setInput] = useState("");

  const addDocument = () => {
    const label = input.trim();
    if (!label || disabled) return;
    const exists = documents.some(
      (d) => d.trim().toLowerCase() === label.toLowerCase()
    );
    if (exists) {
      setInput("");
      return;
    }
    onChange([...documents, label]);
    setInput("");
  };

  const removeDocument = (index) => {
    if (disabled) return;
    onChange(documents.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        Type each document name exactly as applicants should see it. Stored as plain text —
        not catalog keys. Applicants upload these for every application.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDocument();
            }
          }}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d85a30] disabled:bg-gray-100"
        />
        <button
          type="button"
          disabled={disabled || !input.trim()}
          onClick={addDocument}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#d85a30] rounded-md hover:bg-[#ffb766] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlus className="w-4 h-4" />
          Add
        </button>
      </div>
      {documents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc, index) => (
            <span
              key={`${doc}-${index}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-violet-50 text-violet-900 border border-violet-200 rounded-full"
            >
              <span className="max-w-[280px] truncate" title={doc}>
                {doc}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeDocument(index)}
                className="text-violet-600 hover:text-violet-900 disabled:opacity-50"
                aria-label={`Remove ${doc}`}
              >
                <FiX className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No custom documents added yet.</p>
      )}
    </div>
  );
}
