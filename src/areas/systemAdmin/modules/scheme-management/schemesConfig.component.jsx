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

  const getSchemesList = async () => {
    try {
      const response = await axios.get(SCHEMES_CONFIG_URL);

      // console.log("Schemes List", { response });
      response.status === 200 && setSchemesList(response?.data?.schemesList);
      response.status === 202 &&
        showToast("No schemes list found in the system.", "error");
    } catch (error) {
      console.error("getSchemesList", error);
      if (!error?.response) {
        showToast("No Server Response");
      } else if (error.response.status === 422) {
        showToast("Some of the required inputs were not provided.", "error");
      } else {
        showToast(
          "Something went wrong. Please contact the administrator.",
          "error"
        );
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      // getSchemesList();
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
