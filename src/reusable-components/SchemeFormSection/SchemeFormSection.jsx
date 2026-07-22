/* eslint-disable react/prop-types */

/**
 * Card section for long admin forms (scheme create/edit).
 */
export default function SchemeFormSection({
  step,
  title,
  description,
  children,
  optional = false,
  className = "",
}) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <header className="flex items-start gap-3 px-3 sm:px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#c2edda]/25 via-white to-white">
        {step != null && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d85a30] text-sm font-bold text-white shadow-sm"
            aria-hidden
          >
            {step}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {optional && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                Optional
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </header>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function SchemeFormSubBlock({ title, hint, children, className = "" }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-gray-50/60 p-3 ${className}`}>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
