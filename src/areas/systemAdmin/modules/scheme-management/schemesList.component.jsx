/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

import { MdAdd } from "react-icons/md";
import { FaSearch } from "react-icons/fa";

import axios from "../../../../api/axios";
import { SCHEMES_CONFIG_URL } from "../../../../api/api_routing_urls";

import HeadingAndButton from "../../../../reusable-components/HeadingAndButton";
import DeleteModal from "../../../../reusable-components/modals/DeleteModal.component";

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

  // Filter schemes based on search query
  const filteredSchemes = useMemo(() => {
    if (!searchQuery.trim()) {
      return schemesList;
    }
    const query = searchQuery.toLowerCase();
    return schemesList.filter((scheme) => {
      const schemeName = (scheme?.scheme_name || "").toLowerCase();
      const category = (scheme?.category || scheme?.category_name || "").toLowerCase();
      const subCategory = (scheme?.sub_category || scheme?.sub_category_name || "").toLowerCase();
      const gender = (scheme?.gender || scheme?.gender_name || "").toLowerCase();
      const department = (scheme?.department || "").toLowerCase();
      const description = (scheme?.scheme_description || "").toLowerCase();
      
      return (
        schemeName.includes(query) ||
        category.includes(query) ||
        subCategory.includes(query) ||
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
}) => {
  // Truncate description for card view
  const truncateDescription = (html, maxLength = 100) => {
    if (!html) return "";
    const text = html.replace(/<[^>]*>/g, ""); // Remove HTML tags
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {schemeObj?.scheme_name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {schemeObj?.gender || schemeObj?.gender_name || "N/A"}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {schemeObj?.category || schemeObj?.category_name || "N/A"}
          </span>
          {schemeObj?.department && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {schemeObj.department}
            </span>
          )}
        </div>

        {/* Sub-Category */}
        {schemeObj?.sub_category || schemeObj?.sub_category_name ? (
          <div className="mb-3">
            <span className="text-xs text-gray-500">Sub-Category: </span>
            <span className="text-xs font-medium text-gray-700">
              {schemeObj?.sub_category || schemeObj?.sub_category_name}
            </span>
          </div>
        ) : null}

        {/* Description */}
        <div className="flex-1 mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {truncateDescription(schemeObj?.scheme_description, 120)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-200">
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
      </div>
    </motion.div>
  );
};
