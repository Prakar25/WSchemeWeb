/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import moment from "moment";

import { useDropzone } from "react-dropzone";
import { DropzoneDiv } from "./PDFImageDropZoneUploader.styles";

import { ImFilesEmpty } from "react-icons/im";
import { FaFilePdf } from "react-icons/fa";
import { CiImageOn } from "react-icons/ci";
import { AiOutlineClose } from "react-icons/ai";

import { isPdf } from "../../../utils/fileFunctions/fileBase64";
import { generateRandomAlphaNumericString } from "../../../utils/generalFunctions/generateRandomAlphaNumericString";

const DropzoneFileUploader = ({
  fieldTitle,
  onChange,
  multiple,
  setShowDropzone,
}) => {
  const [loading, setLoading] = useState(false);
  const [docPreview, setDocPreview] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles) {
      let fileArr = [];

      onChange(acceptedFiles);
      acceptedFiles.map((mapObj) => {
        let type = isPdf(mapObj) ? "pdf" : "image";
        let fileName = mapObj.name;

        const timestamp = moment().format("YYYYMMDDHHmmssss");

        const fileExtension = fileName.split(".").pop(); // Extracting file extension

        const fileNameWithoutExtension = fileName.slice(
          0,
          -fileExtension.length - 1
        ); // Extracting filename without extension

        const lastThreeCharacters = generateRandomAlphaNumericString(3);

        const new_file_name = `${fileNameWithoutExtension}_${timestamp}_${lastThreeCharacters}.${fileExtension}`;

        fileArr.push({
          file_url: URL.createObjectURL(mapObj),
          file_name: fileName,
          file_type: type,
        });
      });

      setDocPreview(fileArr);
      setLoading(false);
    }
  }, []);

  const handleRemoveFile = (index) => {
    const updatedDocPreview = [...docPreview];
    updatedDocPreview.splice(index, 1);
    setDocPreview(updatedDocPreview);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: ["image/*", "application/pdf"],
  });

  return (
    <>
      <div className="pt-6 pb-2 grid grid-cols-2">
        <div>
          <div className="font-semibold mb-2">{fieldTitle}</div>

          <DropzoneDiv {...getRootProps()}>
            <input {...getInputProps()} />
            {loading ? (
              <Spinner variant="standard" animation="border" role="status" />
            ) : (
              <div className="flex flex-col">
                <div className="pb-4 flex justify-center">
                  <ImFilesEmpty color="#1c455a" size={30} />
                </div>

                <p className="cursor-pointer font-bold text-[#1c455a]">
                  Drag and drop file(s) to upload
                </p>

                <p className="font-normal text-gray-600 pb-3 flex justify-center text-sm">
                  or use the 'Upload' button.
                </p>

                <div className="mt-3 flex justify-center">
                  <div className="px-5 py-1 bg-primary text-white text-sm rounded-sm cursor-pointer">
                    Upload
                  </div>
                </div>
              </div>
            )}
          </DropzoneDiv>
        </div>

        <div>
          {docPreview.length > 0 ? (
            <div className="px-4">
              <div className="text-sm font-medium text-slate-500 text-center mb-2">
                Preview
              </div>
              <div className="flex flex-col gap-y-5">
                {docPreview.map((mapObj, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-center"
                  >
                    {/* <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-0 right-4 bg-red-500 text-white rounded-full p-1"
                      style={{ transform: "translate(50%, -50%)" }}
                    >
                      <AiOutlineClose size={14} />
                    </button> */}

                    {mapObj?.file_type === "pdf" ? (
                      <div className="flex flex-col items-center">
                        <>
                          <embed
                            // src={URL.createObjectURL(mapObj?.file_url)}
                            src={mapObj?.file_url}
                            type="application/pdf"
                            width="100%"
                            height="200px"
                          />
                        </>

                        <p className="text-xs">{mapObj?.file_name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <img
                          src={mapObj.file_url}
                          alt={mapObj.file_name}
                          className="rounded"
                          style={{
                            // width: "100%",
                            // height: "350px",
                            objectFit: "cover",
                            maxHeight: "200px",
                            maxWidth: "400px",
                            // objectFit: "contain",
                          }}
                        />
                        <p className="mt-3 font-semibold text-xs text-gray-700">
                          {mapObj?.file_name}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="ms-10 text-center mt-2">
              <div className="text-xl rounded-sm bg-slate-200 h-[200px] flex items-center justify-center">
                <p className="text-gray-400">Preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <p
          onClick={() => setShowDropzone(false)}
          className="cursor-pointer border border-black rounded mt-10 mb-5 px-10 py-1"
        >
          Done
        </p>
      </div>
    </>
  );
};

export default DropzoneFileUploader;
