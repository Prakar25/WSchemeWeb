/**
 * Helper function to parse scheme field data
 * Handles both array format (new) and HTML string format (backward compatibility)
 * @param {string|Array} field - The field data (can be array or HTML string)
 * @returns {Array} - Array of strings
 */
export const parseSchemeField = (field) => {
  // If already an array, return it (filter out empty items)
  if (Array.isArray(field)) {
    return field
      .map((item) => {
        // Handle objects (like scheme_required_documents with document_type)
        if (typeof item === "object" && item !== null) {
          return item.document_type || item.toString();
        }
        return item;
      })
      .filter((item) => item && item.toString().trim() !== "");
  }

  // If it's a string, try to parse it
  if (typeof field === "string" && field.trim()) {
    // Try to parse HTML divs
    const divMatches = field.match(/<div[^>]*>(.*?)<\/div>/g);
    if (divMatches) {
      return divMatches
        .map((div) => div.replace(/<[^>]*>/g, "").trim())
        .filter((item) => item);
    }

    // Fallback: split by newlines
    return field
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
  }

  // Return empty array if field is empty or invalid
  return [];
};

/**
 * Normalize scheme data to ensure array fields are arrays
 * Handles new structure (arrays) and old structure (HTML strings) for backward compatibility
 * @param {Object} scheme - Scheme object from API
 * @returns {Object} - Normalized scheme object
 */
export const normalizeSchemeData = (scheme) => {
  if (!scheme) return scheme;

  const normalized = {
    ...scheme,
    scheme_objectives: parseSchemeField(scheme.scheme_objectives),
    scheme_benefits: parseSchemeField(scheme.scheme_benefits),
  };

  // Handle scheme_required_documents - can be array of objects or array of strings
  if (Array.isArray(scheme.scheme_required_documents)) {
    // New structure: array of objects or strings
    normalized.scheme_required_documents = scheme.scheme_required_documents;
  } else {
    // Old structure: HTML string or other format
    normalized.scheme_required_documents = parseSchemeField(
      scheme.scheme_required_documents
    );
  }

  return normalized;
};

/**
 * Prepare scheme data for API submission
 * Filters out empty strings from arrays
 * @param {Object} schemeData - Scheme form data
 * @returns {Object} - Prepared data for API
 */
export const prepareSchemeDataForAPI = (schemeData) => {
  const prepared = { ...schemeData };

  // Ensure array fields are arrays and filter empty strings
  if (prepared.scheme_objectives) {
    prepared.scheme_objectives = Array.isArray(prepared.scheme_objectives)
      ? prepared.scheme_objectives.filter((item) => item && item.trim() !== "")
      : [];
  }

  if (prepared.scheme_benefits) {
    prepared.scheme_benefits = Array.isArray(prepared.scheme_benefits)
      ? prepared.scheme_benefits.filter((item) => item && item.trim() !== "")
      : [];
  }

  if (prepared.scheme_required_documents) {
    prepared.scheme_required_documents = Array.isArray(
      prepared.scheme_required_documents
    )
      ? prepared.scheme_required_documents.filter(
          (item) => item && item.trim() !== ""
        )
      : [];
  }

  return prepared;
};

