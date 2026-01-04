/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import styled from "styled-components";

import { MdAdd } from "react-icons/md";

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
      <HeadingAndButton
        title="Schemes Configuration"
        buttonText="  Add Scheme"
        buttonIcon={MdAdd}
        onButtonClick={() => {
          setCurrentPage(!currentPage);
          setEditSchemeDetails({});
        }}
      />

      <div className="mt-10 grid grid-cols-1 gap-x-4">
        {schemesList?.length > 0 ? (
          <>
            {schemesList?.map((mapObj, index) => (
              <div key={index} className="my-5">
                <SchemeCardAdmin
                  schemeObj={mapObj}
                  onClickEdit={onClickEdit}
                  setSchemeDeleteId={setSchemeDeleteId}
                  setSchemeDeleteImagePath={setSchemeDeleteImagePath}
                  setShowDelete={setShowDelete}
                />
              </div>
            ))}
          </>
        ) : (
          <div className="text-center text-sm font-semibold text-gray-500">
            No records found.
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
  return (
    <section>
      <div className="flex justify-between">
        <div className="bg-primary text-white inline-block px-5 py-1 rounded-t-sm">
          <div className="text-sm font-medium">
            Scheme Date: {formatDateInDDMonYYYY(schemeObj?.scheme_date)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b flex py-4 px-5 border border-gray-300">
        <div className="">
          {schemeObj?.scheme_image_file_url ? (
            <div>
              <img
                src={displayMedia(schemeObj?.scheme_image_file_url)}
                className="h-72 w-72 object-cover rounded"
              />
            </div>
          ) : (
            <div className="h-72 w-72 border flex flex-col justify-center bg-slate-50">
              <p className="text-center text-gray-500 font-semibold text-xs">
                No image added.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between flex-1 px-5">
          <div>
            <div className="flex justify-between mb-4">
              <div className="font-semibold text-primary">
                {schemeObj?.scheme_name}
              </div>

              <div className="flex items-center gap-x-2 text-gray-700 text-sm">
                <strong>Gender:</strong>{" "}
                <p className="py-1 px-3 rounded-full font-light bg-green-600 text-xs text-white">
                  {schemeObj?.gender || schemeObj?.gender_name}
                </p>
              </div>
            </div>

            <div className="mb-5 flex gap-x-8">
              <div className="flex items-center gap-x-2 text-gray-700 text-sm">
                <strong>Category:</strong>{" "}
                <p className="">{schemeObj?.category || schemeObj?.category_name}</p>
              </div>

              <div className="flex items-center gap-x-2 text-gray-700 text-sm">
                <strong>Sub-Category:</strong>{" "}
                <p className="">
                  {schemeObj?.sub_category || schemeObj?.sub_category_name}
                </p>
              </div>
            </div>

            {/* <div className="mt-1 text-sm text-gray-600 font-light">
              {schemeObj?.scheme_description}
            </div> */}

            <div
              className="mt-1 text-sm text-gray-600 font-light"
              dangerouslySetInnerHTML={{
                __html: schemeObj?.scheme_description,
              }}
            ></div>

            {/* <Container>
              <div className="mx-6 lg:mx-40 submittedContent text-xs md:text-sm lg:text-base">
                <div dangerouslySetInnerHTML={{ __html: schemeObj?.scheme_name }} />
              </div>
            </Container> */}
          </div>

          <div className="mt-3 flex gap-x-4 text-sm font-bold">
            <div
              onClick={() => onClickEdit(schemeObj)}
              className="cursor-pointer uppercase text-gray-700"
            >
              Edit
            </div>

            <div
              onClick={() => {
                setSchemeDeleteId(schemeObj?._id || schemeObj?.scheme_id || null);
                setSchemeDeleteImagePath(
                  schemeObj?.scheme_image_file_url || null
                );
                setShowDelete(true);
              }}
              className="cursor-pointer uppercase text-red-700"
            >
              Delete
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
