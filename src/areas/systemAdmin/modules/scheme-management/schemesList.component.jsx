/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

import { MdAdd } from "react-icons/md";
import { FaSearch } from "react-icons/fa";

import axios from "../../../../api/axios";
import { SCHEMES_CONFIG_URL, DEPARTMENTS_URL, CATEGORIES_URL, APPLICATIONS_SCHEME_URL } from "../../../../api/api_routing_urls";

import HeadingAndButton from "../../../../reusable-components/HeadingAndButton";
import DeleteModal from "../../../../reusable-components/modals/DeleteModal.component";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";

import showToast from "../../../../utils/notification/NotificationModal";
import { formatDateInDDMonYYYY } from "../../../../utils/dateFunctions/formatdate";
import { displayMedia } from "../../../../utils/uploadFiles/uploadFileToServerController";

// Styled components for layout and styling

const Container = styled.section`
  .submittedContent {
    h3 {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    /* Styles for bullet points */
    ul {
      padding-left: 1.5rem;
      margin: 0.5rem 0;
      list-style-type: disc;
    }

    ol {
      padding-left: 1.5rem;
      margin: 0.5rem 0;
      list-style-type: decimal;
    }

    li {
      margin: 0.25rem 0;
    }

    /* Styles for tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;

      th,
      td {
        border: 1px solid #ddd;
        padding: 0.75rem;
        text-align: left;
      }

      th {
        background-color: #ffffff;
      }
    }
  }
`;

const SchemesList = ({
  setCurrentPage,
  currentPage,
  getSchemesList,
  schemesList,
  setEditSchemeDetails,
  setEditSchemeDeleteImagePath,
  handleDeleteFile,
}) => {
  // console.log("schemesList", schemesList);

  const [showDelete, setShowDelete] = useState(false);
  const [schemeDeleteId, setSchemeDeleteId] = useState(null);
  const [schemeDeleteImagePath, setSchemeDeleteImagePath] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState(new Map()); // Map<departmentId, departmentObject>
  const [categories, setCategories] = useState(new Map()); // Map<categoryId, categoryObject>
  
  // Applicants modal state
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState(null);
  const [countByStatus, setCountByStatus] = useState({});
  const [totalApplicants, setTotalApplicants] = useState(0);

  // Fetch departments and categories for lookup maps
  useEffect(() => {
    const fetchLookups = async () => {
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
        }

        // Fetch categories
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

    fetchLookups();
  }, []);

  // Filter schemes based on search query
  const filteredSchemes = useMemo(() => {
    if (!searchQuery.trim()) {
      return schemesList;
    }
    const query = searchQuery.toLowerCase();
    return schemesList.filter((scheme) => {
      const schemeName = (scheme?.scheme_name || "").toLowerCase();
      // Department and category are now ObjectId strings
      const deptObj = departments.get(scheme?.department);
      const categoryObj = categories.get(scheme?.category);
      const category = categoryObj 
        ? (categoryObj.category_display_name || categoryObj.category_name || "").toLowerCase()
        : (scheme?.category || "").toLowerCase();
      const gender = (scheme?.gender || scheme?.gender_name || "").toLowerCase();
      const department = deptObj
        ? (deptObj.department_display_name || deptObj.department_name || "").toLowerCase()
        : (scheme?.department || "").toLowerCase();
      const description = (scheme?.scheme_description || "").toLowerCase();
      
      return (
        schemeName.includes(query) ||
        category.includes(query) ||
        gender.includes(query) ||
        department.includes(query) ||
        description.includes(query)
      );
    });
  }, [schemesList, searchQuery]);

  const onClickEdit = (schemeObj) => {
    setEditSchemeDetails(schemeObj);
    setEditSchemeDeleteImagePath(schemeObj?.scheme_image_file_url);
    setCurrentPage(!currentPage);
  };

  // Fetch applicants for a scheme
  const fetchSchemeApplicants = async (schemeId) => {
    if (!schemeId) return;
    
    try {
      setApplicantsLoading(true);
      setApplicantsError(null);
      
      const response = await axios.get(`${APPLICATIONS_SCHEME_URL}/${schemeId}`);
      
      if (response.status === 200 && response.data) {
        setApplicants(response.data.applicants || []);
        setCountByStatus(response.data.count_by_status || {});
        setTotalApplicants(response.data.total_applicants || 0);
        setSelectedScheme(response.data.scheme || null);
      }
    } catch (error) {
      console.error("Error fetching scheme applicants:", error);
      setApplicantsError(error.response?.data?.message || "Failed to fetch applicants");
      setApplicants([]);
      setCountByStatus({});
      setTotalApplicants(0);
    } finally {
      setApplicantsLoading(false);
    }
  };

  // Handle view applicants click
  const handleViewApplicants = (schemeObj) => {
    const schemeId = schemeObj._id || schemeObj.scheme_id;
    if (schemeId) {
      setSelectedScheme(schemeObj);
      setShowApplicantsModal(true);
      fetchSchemeApplicants(schemeId);
    } else {
      showToast("Scheme ID not found", "error");
    }
  };

  const onClickDelete = async () => {
    try {
      let response = "";
      if (schemeDeleteId) {
        response = await axios.post(`${SCHEMES_CONFIG_URL}/delete`, {
          scheme_id: schemeDeleteId,
        });

        setShowDelete(false);
      }

      if (response.status === 200) {
        showToast("Scheme details has been deleted successfully.", "success");
        handleDeleteFile(schemeDeleteImagePath);
        getSchemesList();
      } else {
        showToast("Scheme details deletion failed.", "error");
      }
    } catch (error) {
      console.log("Delete Scheme Error", error);
    } finally {
      setSchemeDeleteId(null);
      setSchemeDeleteImagePath(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <HeadingAndButton
          title="Schemes Configuration"
          buttonText="  Add Scheme"
          buttonIcon={MdAdd}
          onButtonClick={() => {
            setCurrentPage(!currentPage);
            setEditSchemeDetails({});
          }}
        />
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search schemes by name, category, gender, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Found {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredSchemes?.length > 0 ? (
          <>
            {filteredSchemes?.map((mapObj, index) => (
              <SchemeCardAdmin
                key={mapObj?._id || mapObj?.scheme_id || index}
                schemeObj={mapObj}
                onClickEdit={onClickEdit}
                setSchemeDeleteId={setSchemeDeleteId}
                setSchemeDeleteImagePath={setSchemeDeleteImagePath}
                setShowDelete={setShowDelete}
                onViewApplicants={handleViewApplicants}
                departments={departments}
                categories={categories}
              />
            ))}
          </>
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 font-medium">
              {searchQuery ? "No schemes found matching your search." : "No schemes found."}
            </p>
          </div>
        )}
      </div>

      <>
        <DeleteModal
          open={showDelete}
          setOpen={setShowDelete}
          message={"This scheme will be deleted permanently. Are you sure?"}
          onDelete={onClickDelete}
        />
        
        {/* Applicants Modal */}
        <GenericModal
          open={showApplicantsModal}
          setOpen={setShowApplicantsModal}
          title={selectedScheme ? `Applicants for ${selectedScheme.scheme_name || "Scheme"}` : "Scheme Applicants"}
        >
          <div className="max-h-[70vh] overflow-y-auto">
            {applicantsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : applicantsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 font-medium">{applicantsError}</p>
              </div>
            ) : (
              <>
                {/* Statistics */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Total</p>
                    <p className="text-2xl font-bold text-blue-900">{totalApplicants}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-600 font-medium">Applied</p>
                    <p className="text-2xl font-bold text-yellow-900">{countByStatus.Applied || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Under Review</p>
                    <p className="text-2xl font-bold text-purple-900">{countByStatus["Under Review"] || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Approved</p>
                    <p className="text-2xl font-bold text-green-900">{countByStatus.Approved || 0}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 font-medium">Rejected</p>
                    <p className="text-2xl font-bold text-red-900">{countByStatus.Rejected || 0}</p>
                  </div>
                </div>

                {/* Applicants List */}
                {applicants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No applicants found for this scheme.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applicants.map((application, index) => {
                      const applicant = application.applicant || {};
                      const status = application.application_status || "Unknown";
                      const statusColors = {
                        "Applied": "bg-yellow-100 text-yellow-800",
                        "Under Review": "bg-purple-100 text-purple-800",
                        "Approved": "bg-green-100 text-green-800",
                        "Rejected": "bg-red-100 text-red-800",
                        "Pending": "bg-gray-100 text-gray-800",
                      };
                      
                      return (
                        <div key={application.application_id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {applicant.full_name || "N/A"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Application ID: {application.application_id || "N/A"}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.Pending}`}>
                              {status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600"><span className="font-medium">Gender:</span> {applicant.gender || "N/A"}</p>
                              <p className="text-gray-600"><span className="font-medium">DOB:</span> {applicant.dob ? formatDateInDDMonYYYY(applicant.dob) : "N/A"}</p>
                              <p className="text-gray-600"><span className="font-medium">Aadhaar:</span> {applicant.aadhaar_number ? `**** **** ${applicant.aadhaar_number.slice(-4)}` : "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                <span className="font-medium">Contact:</span> {
                                  applicant.contact?.mobile?.value || 
                                  applicant.contact?.email?.value || 
                                  "N/A"
                                }
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Verification Stage:</span> {
                                  application.verification_stage?.replace(/_/g, " ") || 
                                  `Level ${application.verification_level || "N/A"}`
                                }
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Date Applied:</span> {
                                  application.date_applied ? formatDateInDDMonYYYY(application.date_applied) : "N/A"
                                }
                              </p>
                            </div>
                          </div>
                          
                          {application.current_verifier && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Current Verifier:</span> {
                                  application.current_verifier.fullName || 
                                  application.current_verifier.username || 
                                  "N/A"
                                }
                              </p>
                            </div>
                          )}
                          
                          {application.remarks && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Remarks:</span> {application.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </GenericModal>
      </>
    </>
  );
};

export default SchemesList;

const SchemeCardAdmin = ({
  schemeObj,
  onClickEdit,
  setSchemeDeleteId,
  setSchemeDeleteImagePath,
  setShowDelete,
  onViewApplicants,
  departments = new Map(),
  categories = new Map(),
}) => {
  // Truncate description for card view
  const truncateDescription = (html, maxLength = 100) => {
    if (!html) return "";
    const text = html.replace(/<[^>]*>/g, ""); // Remove HTML tags
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Get approval status badge
  const getApprovalStatusBadge = () => {
    const status = schemeObj?.approval_status || "approved"; // Default to approved for legacy schemes
    if (status === "pending_department_head_approval") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
          Pending Approval
        </span>
      );
    } else if (status === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
          Approved
        </span>
      );
    } else if (status === "rejected") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          Rejected
        </span>
      );
    }
    return null;
  };

  // Format authorization levels for display
  const formatAuthorizationLevels = () => {
    if (!schemeObj?.authorization_levels || !Array.isArray(schemeObj.authorization_levels)) {
      return "N/A";
    }
    
    const roleLevelNames = {
      8: "Super Admin",
      7: "Admin",
      6: "Department Secretary",
      5: "Department Head",
      4: "Department User",
      3: "DistrictHQ Head",
      2: "District Overlookers",
      1: "Post Operator",
    };
    
    const levels = schemeObj.authorization_levels.map(level => roleLevelNames[level] || `Level ${level}`);
    return levels.join(" → ");
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
    >
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {schemeObj?.scheme_image_file_url ? (
          <img
            src={displayMedia(schemeObj?.scheme_image_file_url)}
            alt={schemeObj?.scheme_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-12 h-12 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75v5.25a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-5.25m-15-9l3 3m0 0l3-3m-3 3V6.75"
              />
            </svg>
            <p className="text-xs text-gray-500 mt-2">No image</p>
          </div>
        )}
        {/* Date Badge */}
        <div className="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-md text-xs font-medium shadow-md">
          {formatDateInDDMonYYYY(schemeObj?.scheme_date)}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Approval Status Badge */}
        <div className="mb-2">
          {getApprovalStatusBadge()}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {schemeObj?.scheme_name}
        </h3>

        {/* Creator Information */}
        {schemeObj?.created_by && (
          <div className="mb-2 text-xs text-gray-600">
            <span className="font-medium">Created by: </span>
            <span>{schemeObj.created_by.admin_username || "N/A"}</span>
            {schemeObj.created_by.created_at && (
              <span className="ml-2">
                ({formatDateInDDMonYYYY(schemeObj.created_by.created_at)})
              </span>
            )}
          </div>
        )}

        {/* Authorization Levels */}
        {schemeObj?.authorization_levels && (
          <div className="mb-2 text-xs text-gray-600">
            <span className="font-medium">Auth Levels: </span>
            <span className="text-gray-700">{formatAuthorizationLevels()}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {schemeObj?.gender || schemeObj?.gender_name || "N/A"}
          </span>
          {schemeObj?.department && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {(() => {
                const dept = departments.get(schemeObj.department);
                return dept 
                  ? (dept.department_display_name || dept.department_name)
                  : schemeObj.department;
              })()}
            </span>
          )}
          {schemeObj?.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {(() => {
                const cat = categories.get(schemeObj.category);
                return cat 
                  ? (cat.category_display_name || cat.category_name)
                  : (schemeObj.category || "N/A");
              })()}
            </span>
          )}
        </div>


        {/* Approval/Rejection Details */}
        {schemeObj?.department_head_approval && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
            {schemeObj.department_head_approval.approved_by_username && (
              <div className="mb-1">
                <span className="font-medium">
                  {schemeObj.approval_status === "approved" ? "Approved" : "Rejected"} by:{" "}
                </span>
                <span>{schemeObj.department_head_approval.approved_by_username}</span>
                {schemeObj.department_head_approval.approved_at && (
                  <span className="ml-1">
                    ({formatDateInDDMonYYYY(schemeObj.department_head_approval.approved_at)})
                  </span>
                )}
              </div>
            )}
            {schemeObj.department_head_approval.rejection_reason && (
              <div className="text-red-700">
                <span className="font-medium">Reason: </span>
                <span>{schemeObj.department_head_approval.rejection_reason}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="flex-1 mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {truncateDescription(schemeObj?.scheme_description, 120)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => onClickEdit(schemeObj)}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setSchemeDeleteId(schemeObj?._id || schemeObj?.scheme_id || null);
                setSchemeDeleteImagePath(
                  schemeObj?.scheme_image_file_url || null
                );
                setShowDelete(true);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
          <button
            onClick={() => onViewApplicants && onViewApplicants(schemeObj)}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            View Applicants
          </button>
        </div>
      </div>
    </motion.div>
  );
};
