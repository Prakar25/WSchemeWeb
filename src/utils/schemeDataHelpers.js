/**
 * Helper functions for working with scheme data
 * Department and category are now ObjectId strings (24-character hex strings)
 * Use lookup maps to get display names
 */

/**
 * Safely extracts department display name from scheme
 * @param {string} departmentId - Department ObjectId string
 * @param {Map} departmentMap - Map of departmentId -> department object
 * @returns {string} Department display name or fallback
 */
export const getDepartmentDisplayName = (departmentId, departmentMap = null) => {
  if (!departmentId) return "N/A";
  
  // If departmentMap is provided, use it
  if (departmentMap && departmentMap instanceof Map) {
    const dept = departmentMap.get(departmentId);
    if (dept) {
      return dept.department_display_name || dept.department_name || departmentId;
    }
  }
  
  // Fallback: return the ID if no map provided
  return departmentId;
};

/**
 * Safely extracts department name (for API calls) from scheme
 * @param {string} departmentId - Department ObjectId string
 * @param {Map} departmentMap - Map of departmentId -> department object
 * @returns {string} Department name or fallback
 */
export const getDepartmentName = (departmentId, departmentMap = null) => {
  if (!departmentId) return null;
  
  if (departmentMap && departmentMap instanceof Map) {
    const dept = departmentMap.get(departmentId);
    if (dept) {
      return dept.department_name || dept._id || departmentId;
    }
  }
  
  return departmentId;
};

/**
 * Gets department ObjectId from scheme (it's already a string)
 * @param {string} departmentId - Department ObjectId string
 * @returns {string|null} Department ObjectId or null
 */
export const getDepartmentId = (departmentId) => {
  return departmentId || null;
};

/**
 * Safely extracts category display name from scheme
 * @param {string} categoryId - Category ObjectId string
 * @param {Map} categoryMap - Map of categoryId -> category object
 * @returns {string} Category display name or fallback
 */
export const getCategoryDisplayName = (categoryId, categoryMap = null) => {
  if (!categoryId) return "N/A";
  
  // If categoryMap is provided, use it
  if (categoryMap && categoryMap instanceof Map) {
    const cat = categoryMap.get(categoryId);
    if (cat) {
      return cat.category_display_name || cat.category_name || categoryId;
    }
  }
  
  // Fallback: return the ID if no map provided
  return categoryId;
};

/**
 * Safely extracts category name (for API calls) from scheme
 * @param {string} categoryId - Category ObjectId string
 * @param {Map} categoryMap - Map of categoryId -> category object
 * @returns {string} Category name or fallback
 */
export const getCategoryName = (categoryId, categoryMap = null) => {
  if (!categoryId) return null;
  
  if (categoryMap && categoryMap instanceof Map) {
    const cat = categoryMap.get(categoryId);
    if (cat) {
      return cat.category_name || cat._id || categoryId;
    }
  }
  
  return categoryId;
};

/**
 * Gets category ObjectId from scheme (it's already a string)
 * @param {string} categoryId - Category ObjectId string
 * @returns {string|null} Category ObjectId or null
 */
export const getCategoryId = (categoryId) => {
  return categoryId || null;
};

/**
 * Checks if scheme uses new structure (ObjectId string IDs)
 * @param {Object} scheme - Scheme object
 * @returns {boolean} True if using new structure (always true now)
 */
export const isSchemeMigrated = (scheme) => {
  if (!scheme) return false;
  // Department and category are now always strings (ObjectId strings)
  return typeof scheme.department === "string" && typeof scheme.category === "string";
};

/**
 * Gets scheme department for display
 * @param {Object} scheme - Scheme object
 * @param {Map} departmentMap - Map of departmentId -> department object
 * @returns {string} Department display name
 */
export const getSchemeDepartment = (scheme, departmentMap = null) => {
  return getDepartmentDisplayName(scheme?.department, departmentMap);
};

/**
 * Gets scheme category for display
 * @param {Object} scheme - Scheme object
 * @param {Map} categoryMap - Map of categoryId -> category object
 * @returns {string} Category display name
 */
export const getSchemeCategory = (scheme, categoryMap = null) => {
  return getCategoryDisplayName(scheme?.category, categoryMap);
};

/**
 * Extracts all scheme data in a normalized format
 * @param {Object} scheme - Scheme object
 * @param {Map} departmentMap - Map of departmentId -> department object
 * @param {Map} categoryMap - Map of categoryId -> category object
 * @returns {Object} Normalized scheme data
 */
export const normalizeSchemeData = (scheme, departmentMap = null, categoryMap = null) => {
  if (!scheme) return null;

  return {
    ...scheme,
    department_display_name: getDepartmentDisplayName(scheme.department, departmentMap),
    department_name: getDepartmentName(scheme.department, departmentMap),
    department_id: getDepartmentId(scheme.department),
    category_display_name: getCategoryDisplayName(scheme.category, categoryMap),
    category_name: getCategoryName(scheme.category, categoryMap),
    category_id: getCategoryId(scheme.category),
    is_migrated: isSchemeMigrated(scheme),
  };
};
