/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaChevronDown, 
  FaChevronRight, 
  FaCheckSquare, 
  FaSquare,
  FaBuilding,
  FaFolder,
  FaFileAlt
} from "react-icons/fa";
import axios from "../../api/axios";
import { SCHEMES_SIMPLE_URL, DEPARTMENTS_URL, CATEGORIES_URL } from "../../api/api_routing_urls";
import Spinner from "../spinner/spinner.component";

const ExcludedSchemesSelector = ({
  selectedSchemeIds = [],
  onChange,
  currentSchemeId = null, // Exclude current scheme if editing
  className = "",
}) => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>
  const [departmentCategories, setDepartmentCategories] = useState(new Map()); // Map<departmentId, Array<categoryId>>
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedSchemes, setSelectedSchemes] = useState(new Set(selectedSchemeIds));

  // Group schemes by department and category using ObjectId strings
  // Show ALL departments and categories, even if they have no schemes
  const groupedSchemes = useMemo(() => {
    const grouped = {};
    
    // First, initialize ALL departments with their categories
    departments.forEach((dept, deptId) => {
      grouped[deptId] = {
        department: dept,
        categories: {},
      };
      
      // Get categories for this department from departmentCategories map
      const deptCategoryIds = departmentCategories.get(deptId) || [];
      deptCategoryIds.forEach((catId) => {
        const category = categories.get(catId);
        if (category) {
          // Initialize category even if it has no schemes
          grouped[deptId].categories[catId] = {
            category: category,
            schemes: [],
          };
        }
      });
    });
    
    // Now, populate with schemes and their categories
    schemes.forEach((scheme) => {
      // Skip current scheme if editing
      if (currentSchemeId && (scheme._id === currentSchemeId || scheme.scheme_id === currentSchemeId)) {
        return;
      }

      // Department and category are now ObjectId strings
      const departmentId = scheme.department; // ObjectId string
      const categoryId = scheme.category; // ObjectId string

      // Get department and category objects from lookup maps
      const department = departments.get(departmentId);
      const category = categories.get(categoryId);

      // Skip if department or category not found
      if (!department || !category) {
        return;
      }

      // Use ObjectId strings as keys
      const deptKey = departmentId;
      const catKey = categoryId;

      // Initialize department if not already done (shouldn't happen, but safety check)
      if (!grouped[deptKey]) {
        grouped[deptKey] = {
          department: department,
          categories: {},
        };
      }

      // Initialize category if not already done
      if (!grouped[deptKey].categories[catKey]) {
        grouped[deptKey].categories[catKey] = {
          category: category,
          schemes: [],
        };
      }

      grouped[deptKey].categories[catKey].schemes.push(scheme);
    });
    
    // Now, for each department, also add categories that belong to it but have no schemes
    // We need to fetch categories by department. For now, we'll show categories that appear in schemes
    // If you want to show ALL categories for each department, we'd need to fetch /api/departments/:name/categories
    
    return grouped;
  }, [schemes, currentSchemeId, departments, categories, departmentCategories]);

  // Get all department keys - use all departments from map, not just those with schemes
  // MUST be before any early returns to follow Rules of Hooks
  const departmentKeys = useMemo(() => {
    // Get all department IDs from the departments map
    const allDeptKeys = Array.from(departments.keys());
    // Also include any departments that might be in groupedSchemes but not in the map (safety)
    const groupedKeys = Object.keys(groupedSchemes);
    const combined = new Set([...allDeptKeys, ...groupedKeys]);
    return Array.from(combined);
  }, [departments, groupedSchemes]);

  // Fetch departments and categories for lookup maps
  useEffect(() => {
    const fetchDepartmentsAndCategories = async () => {
      try {
        // Fetch departments
        const deptResponse = await axios.get(DEPARTMENTS_URL);
        if (deptResponse.status === 200) {
          const deptData = deptResponse.data?.departments || deptResponse.data || [];
          const deptMap = new Map();
          deptData.forEach((dept) => {
            deptMap.set(dept._id, dept);
          });
          setDepartments(deptMap);
          
          // Fetch categories for each department
          const deptCategoriesMap = new Map();
          for (const dept of deptData) {
            try {
              const catResponse = await axios.get(`/departments/${encodeURIComponent(dept.department_name)}/categories`);
              if (catResponse.status === 200) {
                const catData = catResponse.data?.categories || catResponse.data || [];
                deptCategoriesMap.set(dept._id, catData.map(cat => cat._id));
              }
            } catch (err) {
              console.warn(`Failed to fetch categories for department ${dept.department_name}:`, err);
              deptCategoriesMap.set(dept._id, []);
            }
          }
          setDepartmentCategories(deptCategoriesMap);
        }

        // Fetch all categories for lookup
        const catResponse = await axios.get(CATEGORIES_URL);
        if (catResponse.status === 200) {
          const catData = catResponse.data?.categories || catResponse.data || [];
          const catMap = new Map();
          catData.forEach((cat) => {
            catMap.set(cat._id, cat);
          });
          setCategories(catMap);
        }
      } catch (error) {
        console.error("Error fetching departments/categories:", error);
      }
    };

    fetchDepartmentsAndCategories();
  }, []);

  // Fetch all schemes using the simple endpoint
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        
        // Try the simple endpoint first
        let response;
        try {
          // Fetch only approved schemes for exclusion selector
          const params = new URLSearchParams();
          params.append("approved_only", "true");
          params.append("filter_type", "scheme");
          response = await axios.get(`${SCHEMES_SIMPLE_URL}?${params.toString()}`);
        } catch (simpleError) {
          // Fallback to regular schemes endpoint if simple doesn't exist
          console.warn("Simple endpoint not available, using regular schemes endpoint:", simpleError);
          try {
            const params = new URLSearchParams();
            params.append("approved_only", "true");
            params.append("filter_type", "scheme");
            response = await axios.get(`/api/schemes?${params.toString()}`);
          } catch (fallbackError) {
            console.error("Both endpoints failed:", fallbackError);
            throw fallbackError;
          }
        }
        
        // Handle both response formats (direct array or wrapped in status object)
        if (response.status === 200) {
          let schemesData = [];
          
          if (response.data?.status === "success" && Array.isArray(response.data.schemes)) {
            // New format: { status: "success", schemes: [...], count: ... }
            schemesData = response.data.schemes;
          } else if (Array.isArray(response.data)) {
            // Old format: direct array
            schemesData = response.data;
          } else if (response.data?.schemes && Array.isArray(response.data.schemes)) {
            // Alternative format
            schemesData = response.data.schemes;
          }
          
          // Filter to only approved schemes if not already filtered
          const approvedSchemes = schemesData.filter(scheme => {
            // Include schemes with no approval_status (legacy schemes) or approved ones
            return !scheme.approval_status || scheme.approval_status === "approved";
          });
          
          console.log("Fetched schemes:", {
            total: schemesData.length,
            approved: approvedSchemes.length,
            sample: approvedSchemes[0]
          });
          
          setSchemes(approvedSchemes);
        }
      } catch (error) {
        console.error("Error fetching schemes:", error);
        console.error("Error details:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  // Update selected schemes when prop changes
  useEffect(() => {
    setSelectedSchemes(new Set(selectedSchemeIds));
  }, [selectedSchemeIds]);

  const toggleDepartment = (deptKey) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptKey)) {
      newExpanded.delete(deptKey);
    } else {
      newExpanded.add(deptKey);
    }
    setExpandedDepartments(newExpanded);
  };

  const toggleCategory = (catKey) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(catKey)) {
      newExpanded.delete(catKey);
    } else {
      newExpanded.add(catKey);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleScheme = (schemeId) => {
    const newSelected = new Set(selectedSchemes);
    if (newSelected.has(schemeId)) {
      newSelected.delete(schemeId);
    } else {
      newSelected.add(schemeId);
    }
    setSelectedSchemes(newSelected);
    onChange(Array.from(newSelected));
  };

  const toggleCategorySelection = (deptKey, catKey) => {
    const category = groupedSchemes[deptKey]?.categories[catKey];
    if (!category) return;

    const schemeIds = category.schemes.map(s => s._id || s.scheme_id);
    const allSelected = schemeIds.every(id => selectedSchemes.has(id));

    const newSelected = new Set(selectedSchemes);
    if (allSelected) {
      // Deselect all schemes in category
      schemeIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all schemes in category
      schemeIds.forEach(id => newSelected.add(id));
    }
    setSelectedSchemes(newSelected);
    onChange(Array.from(newSelected));
  };

  const toggleDepartmentSelection = (deptKey) => {
    const department = groupedSchemes[deptKey];
    if (!department) return;

    // Get all scheme IDs in this department
    const schemeIds = [];
    Object.values(department.categories).forEach(cat => {
      cat.schemes.forEach(scheme => {
        schemeIds.push(scheme._id || scheme.scheme_id);
      });
    });

    const allSelected = schemeIds.every(id => selectedSchemes.has(id));

    const newSelected = new Set(selectedSchemes);
    if (allSelected) {
      // Deselect all schemes in department
      schemeIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all schemes in department
      schemeIds.forEach(id => newSelected.add(id));
    }
    setSelectedSchemes(newSelected);
    onChange(Array.from(newSelected));
  };

  const isCategoryFullySelected = (deptKey, catKey) => {
    const category = groupedSchemes[deptKey]?.categories[catKey];
    if (!category) return false;
    const schemeIds = category.schemes.map(s => s._id || s.scheme_id);
    return schemeIds.length > 0 && schemeIds.every(id => selectedSchemes.has(id));
  };

  const isCategoryPartiallySelected = (deptKey, catKey) => {
    const category = groupedSchemes[deptKey]?.categories[catKey];
    if (!category) return false;
    const schemeIds = category.schemes.map(s => s._id || s.scheme_id);
    const selectedCount = schemeIds.filter(id => selectedSchemes.has(id)).length;
    return selectedCount > 0 && selectedCount < schemeIds.length;
  };

  const isDepartmentFullySelected = (deptKey) => {
    const department = groupedSchemes[deptKey];
    if (!department) return false;
    const schemeIds = [];
    Object.values(department.categories).forEach(cat => {
      cat.schemes.forEach(scheme => {
        schemeIds.push(scheme._id || scheme.scheme_id);
      });
    });
    return schemeIds.length > 0 && schemeIds.every(id => selectedSchemes.has(id));
  };

  const isDepartmentPartiallySelected = (deptKey) => {
    const department = groupedSchemes[deptKey];
    if (!department) return false;
    const schemeIds = [];
    Object.values(department.categories).forEach(cat => {
      cat.schemes.forEach(scheme => {
        schemeIds.push(scheme._id || scheme.scheme_id);
      });
    });
    const selectedCount = schemeIds.filter(id => selectedSchemes.has(id)).length;
    return selectedCount > 0 && selectedCount < schemeIds.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
        <span className="ml-3 text-gray-600">Loading schemes...</span>
      </div>
    );
  }

  if (departmentKeys.length === 0 && !loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-2">No schemes available to exclude.</p>
        <p className="text-xs text-gray-400">
          {schemes.length === 0 
            ? "No approved schemes found in the system. Please create schemes first." 
            : `Found ${schemes.length} scheme(s) but couldn't group them. Check console for details.`}
        </p>
        {schemes.length > 0 && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
              {JSON.stringify(schemes.slice(0, 2), null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Select schemes that should be excluded. If a user applies to any of these schemes, they cannot apply to this scheme.
        </p>
      </div>

      <div className="space-y-3">
        {departmentKeys.map((deptKey) => {
          // Get department from groupedSchemes or from departments map
          let department = groupedSchemes[deptKey];
          if (!department) {
            const dept = departments.get(deptKey);
            if (dept) {
              department = {
                department: dept,
                categories: {},
              };
            } else {
              return null; // Skip if department not found
            }
          }
          
          const isDeptExpanded = expandedDepartments.has(deptKey);
          const isDeptFullySelected = isDepartmentFullySelected(deptKey);
          const isDeptPartiallySelected = isDepartmentPartiallySelected(deptKey);

          return (
            <motion.div
              key={deptKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Department Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleDepartment(deptKey)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDepartmentSelection(deptKey);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDepartmentSelection(deptKey);
                        }
                      }}
                      className="flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      {isDeptFullySelected ? (
                        <FaCheckSquare className="w-5 h-5" />
                      ) : isDeptPartiallySelected ? (
                        <div className="w-5 h-5 border-2 border-blue-600 bg-blue-100 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded" />
                        </div>
                      ) : (
                        <FaSquare className="w-5 h-5" />
                      )}
                    </div>
                    <FaBuilding className="text-blue-600 w-4 h-4" />
                    <span className="font-semibold text-gray-900">
                      {department.department.department_display_name || 
                       department.department.department_name || 
                       deptKey}
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                      {Object.values(department.categories).reduce((sum, cat) => sum + cat.schemes.length, 0)} schemes
                    </span>
                  </div>
                  {isDeptExpanded ? (
                    <FaChevronDown className="text-gray-500 w-4 h-4" />
                  ) : (
                    <FaChevronRight className="text-gray-500 w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Categories */}
              <AnimatePresence>
                {isDeptExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-gray-100">
                      {Object.keys(department.categories).map((catKey) => {
                        const category = department.categories[catKey];
                        const isCatExpanded = expandedCategories.has(catKey);
                        const isCatFullySelected = isCategoryFullySelected(deptKey, catKey);
                        const isCatPartiallySelected = isCategoryPartiallySelected(deptKey, catKey);

                        return (
                          <div key={catKey} className="bg-gray-50">
                            {/* Category Header */}
                            <div className="px-4 py-2.5 border-l-4 border-indigo-300">
                              <button
                                type="button"
                                onClick={() => toggleCategory(catKey)}
                                className="w-full flex items-center justify-between hover:bg-indigo-50 rounded transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCategorySelection(deptKey, catKey);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleCategorySelection(deptKey, catKey);
                                      }
                                    }}
                                    className="flex items-center justify-center w-5 h-5 text-indigo-600 hover:text-indigo-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                                  >
                                    {isCatFullySelected ? (
                                      <FaCheckSquare className="w-5 h-5" />
                                    ) : isCatPartiallySelected ? (
                                      <div className="w-5 h-5 border-2 border-indigo-600 bg-indigo-100 rounded flex items-center justify-center">
                                        <div className="w-2 h-2 bg-indigo-600 rounded" />
                                      </div>
                                    ) : (
                                      <FaSquare className="w-5 h-5" />
                                    )}
                                  </div>
                                  <FaFolder className="text-indigo-600 w-4 h-4" />
                                  <span className="font-medium text-gray-800">
                                    {category.category.category_display_name || 
                                     category.category.category_name || 
                                     catKey}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                    {category.schemes.length} scheme{category.schemes.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                {isCatExpanded ? (
                                  <FaChevronDown className="text-gray-500 w-3 h-3" />
                                ) : (
                                  <FaChevronRight className="text-gray-500 w-3 h-3" />
                                )}
                              </button>
                            </div>

                            {/* Schemes */}
                            <AnimatePresence>
                              {isCatExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-8 pr-4 py-2 space-y-1 bg-white">
                                    {category.schemes.map((scheme) => {
                                      const schemeId = scheme._id || scheme.scheme_id;
                                      const isSelected = selectedSchemes.has(schemeId);

                                      return (
                                        <motion.button
                                          key={schemeId}
                                          type="button"
                                          onClick={() => toggleScheme(schemeId)}
                                          whileHover={{ x: 4 }}
                                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left"
                                        >
                                          <div className="flex items-center justify-center w-4 h-4 text-gray-600">
                                            {isSelected ? (
                                              <FaCheckSquare className="w-4 h-4 text-green-600" />
                                            ) : (
                                              <FaSquare className="w-4 h-4" />
                                            )}
                                          </div>
                                          <FaFileAlt className="text-gray-400 w-3 h-3" />
                                          <span className={`text-sm flex-1 ${isSelected ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                                            {scheme.scheme_name}
                                          </span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Count */}
      {selectedSchemes.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-green-800">
            <strong>{selectedSchemes.size}</strong> scheme{selectedSchemes.size !== 1 ? "s" : ""} selected for exclusion
          </p>
        </div>
      )}
    </div>
  );
};

export default ExcludedSchemesSelector;
