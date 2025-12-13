export default function ViewSchemeDetails({ scheme, onClose }) {
  if (!scheme) {
    return (
      <aside className="bg-slate-50 rounded-md shadow p-5">
        <p className="text-slate-500 text-sm text-center font-semibold">
          Click on a scheme to view details
        </p>
      </aside>
    );
  }

  return (
    <aside className="bg-white rounded-md shadow p-5 sticky top-24">
      <h2 className="text-xl font-semibold">{scheme.schemeName}</h2>

      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        {scheme.schemeDescription}
      </p>

      <Section title="Objectives" items={scheme.schemeObjectives} />
      <Section title="Benefits" items={scheme.schemeBenefits} />
      <Section
        title="Required Documents"
        items={scheme.schemeRequiredDocuments}
      />

      <button
        type="button"
        className="mt-10 w-full py-2 bg-green-600 text-white rounded-md
                   hover:bg-green-700 transition-all ease-in-out duration-500 cursor-pointer"
      >
        Apply Now →
      </button>

      <button
        type="button"
        onClick={() => {
          if (onClose) onClose();
        }}
        className="mt-3 w-full py-2 border border-gray-300
                   text-gray-600 rounded-md hover:bg-gray-100 transition cursor-pointer"
      >
        Close
      </button>
    </aside>
  );
}

function Section({ title, items }) {
  const normalizedItems = Array.isArray(items)
    ? items
    : items && typeof items === "object"
    ? Object.values(items)
    : [];

  if (normalizedItems.length === 0) return null;

  return (
    <div className="mt-5">
      <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
        {normalizedItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
