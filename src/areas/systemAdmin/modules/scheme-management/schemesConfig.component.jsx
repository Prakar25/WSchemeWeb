/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";

import axios from "../../../../api/axios";
import { SCHEMES_CONFIG_URL } from "../../../../api/api_routing_urls";

import showToast from "../../../../utils/notification/NotificationModal";

import { deleteFileFromServer } from "../../../../utils/uploadFiles/deleteFileFromServerController";

import Dashboard from "../../../dashboard-components/dashboard.component";

import SchemesList from "./schemesList.component";
import AddSchemeForm from "./addSchemeForm.component";

const SchemesConfig = () => {
  const [currentPage, setCurrentPage] = useState(true);

  const [editSchemeDetails, setEditSchemeDetails] = useState({});
  const [editSchemeDeleteImagePath, setEditSchemeDeleteImagePath] =
    useState(null);

  const [schemesList, setSchemesList] = useState([]);

  const getSchemesList = async (filterOptions = {}) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("filter_type", "scheme"); // Use scheme-level filtering
      
      // Add optional filters
      if (filterOptions.pending_approval) {
        params.append("pending_approval", "true");
      }
      if (filterOptions.approved_only) {
        params.append("approved_only", "true");
      }
      
      const url = `${SCHEMES_CONFIG_URL}?${params.toString()}`;
      const response = await axios.get(url);

      // console.log("Schemes List", { response });
      if (response.status === 200) {
        const schemes = Array.isArray(response.data) ? response.data : [];
        setSchemesList(schemes);
      } else if (response.status === 202) {
        showToast("No schemes list found in the system.", "error");
        setSchemesList([]);
      }
    } catch (error) {
      console.error("getSchemesList", error);
      if (!error?.response) {
        showToast("No Server Response", "error");
      } else if (error.response.status === 422) {
        showToast("Some of the required inputs were not provided.", "error");
      } else {
        showToast(
          "Something went wrong. Please contact the administrator.",
          "error"
        );
      }
      setSchemesList([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      getSchemesList();
      setEditSchemeDetails({});
      setEditSchemeDeleteImagePath(null);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteFile = async (imageFilePath) => {
    //const filePath = "/public/uploads/admin-uploads/clearImage.jpeg"; // The file path you want to delete
    const filePath = `/${imageFilePath}`;
    const result = await deleteFileFromServer(filePath);

    if (result) {
      console.log("File deleted successfully:", result);
    } else {
      console.log("Failed to delete the file.");
    }
  };

  return (
    <>
      <Dashboard sidebarType="System Admin">
        {currentPage ? (
          <SchemesList
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            getSchemesList={getSchemesList}
            schemesList={schemesList}
            setEditSchemeDetails={setEditSchemeDetails}
            setEditSchemeDeleteImagePath={setEditSchemeDeleteImagePath}
            handleDeleteFile={handleDeleteFile}
          />
        ) : (
          <AddSchemeForm
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            getSchemesList={getSchemesList}
            editSchemeDetails={editSchemeDetails}
            editSchemeDeleteImagePath={editSchemeDeleteImagePath}
            setEditSchemeDeleteImagePath={setEditSchemeDeleteImagePath}
            handleDeleteFile={handleDeleteFile}
          />
        )}
      </Dashboard>
    </>
  );
};

export default SchemesConfig;
