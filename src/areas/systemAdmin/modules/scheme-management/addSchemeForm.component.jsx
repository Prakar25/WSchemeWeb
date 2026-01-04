/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import styled from "styled-components";

import { BsUpload } from "react-icons/bs";
import { IoChevronBack, IoChevronBackCircleOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";

import axios from "../../../../api/axios";
import { SCHEMES_CONFIG_URL } from "../../../../api/api_routing_urls";

import HeadingAndButton from "../../../../reusable-components/HeadingAndButton";
import Input from "../../../../reusable-components/inputs/InputTextBox/Input";
import Dropdown from "../../../../reusable-components/inputs/Dropdowns/Dropdown";
import TextArea from "../../../../reusable-components/inputs/InputTextAreas/TextArea";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import DocDropzone from "../../../../reusable-components/FileUploader/PDFImageDropZoneUploader/PDFImageDropZoneUploader.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";

import RichTextArea from "../../../../reusable-components/richtexteditor/RichTextArea";

import showToast from "../../../../utils/notification/NotificationModal";
import {
  uploadFileToServer,
  displayMedia,
} from "../../../../utils/uploadFiles/uploadFileToServerController";
import { formatDateForInput } from "../../../../utils/dateFunctions/formatdate";

// Styled components for layout and styling
const EditorContainer = styled.div`
  margin-bottom: 1rem;
`;

const AddSchemeForm = ({
  setCurrentPage,
  currentPage,
  getSchemesList,
  editSchemeDetails,
  editSchemeDeleteImagePath,
  setEditSchemeDeleteImagePath,
  handleDeleteFile,
}) => {
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [showSchemeDz, setShowSchemeDz] = useState(false);
  const [docScheme, setDocScheme] = useState(null);

  const [genderDD, setGenderDD] = useState([]);
  const [categoryDD, setCategoryDD] = useState([]);
  const [subCategoryDD, setSubCategoryDD] = useState([]);

  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Master Data
  let genderList = [
    { gender_name: "Male", gender_id: 1 },
    { gender_name: "Female", gender_id: 2 },
    { gender_name: "Others", gender_id: 3 },
    { gender_name: "All", gender_id: 4 },
  ];

  let categoryList = [{ category_name: "Pension", category_id: 1 }];

  let subCategoryList = [
    { category_id: 1, sub_category_name: "Aama Yojana", sub_category_id: 1 },
  ];

  const prepareGenderList = () => {
    let genderDD = [];
    genderList?.map((genderObj) => {
      genderDD.push({
        label: genderObj?.gender_name,
        value: genderObj?.gender_id,
      });
    });
    setGenderDD(genderDD);
  };

  const prepareCategoryList = () => {
    let categoryDD = [];
    categoryList?.map((categoryObj) => {
      categoryDD.push({
        label: categoryObj?.category_name,
        value: categoryObj?.category_id,
      });
    });
    setCategoryDD(categoryDD);
  };

  const prepareSubCategoryList = () => {
    let subCategoryDD = [];
    subCategoryList?.map((subCategoryObj) => {
      subCategoryDD.push({
        label: subCategoryObj?.sub_category_name,
        value: subCategoryObj?.sub_category_id,
        category_id: subCategoryObj?.category_id,
      });
    });
    setSubCategoryDD(subCategoryDD);
  };

  useEffect(() => {
    prepareGenderList();
    prepareCategoryList();
    prepareSubCategoryList();
  }, []);

  const isEdit = Object.keys(editSchemeDetails)?.length > 0;

  // Helper function to convert array to HTML string for RichTextArea
  const arrayToHtmlString = (arr) => {
    if (!arr) return "";
    if (typeof arr === "string") return arr; // Already a string
    if (Array.isArray(arr)) {
      return arr.map((item) => `<div>${item}</div>`).join("\n");
    }
    return "";
  };

  // Helper function to find gender_id from gender string
  const getGenderIdFromName = (genderName) => {
    const gender = genderList.find((g) => g.gender_name === genderName);
    return gender ? gender.gender_id : null;
  };

  // Helper function to find category_id from category string
  const getCategoryIdFromName = (categoryName) => {
    const category = categoryList.find((c) => c.category_name === categoryName);
    return category ? category.category_id : null;
  };

  // Helper function to find sub_category_id from sub_category string
  const getSubCategoryIdFromName = (subCategoryName) => {
    const subCategory = subCategoryList.find(
      (sc) => sc.sub_category_name === subCategoryName
    );
    return subCategory ? subCategory.sub_category_id : null;
  };

  const defaultValues = {
    scheme_id: !isEdit ? "" : editSchemeDetails?._id || editSchemeDetails?.scheme_id,
    scheme_name: !isEdit ? "" : editSchemeDetails?.scheme_name,
    scheme_date: !isEdit
      ? ""
      : formatDateForInput(editSchemeDetails?.scheme_date),
    gender_id: !isEdit
      ? ""
      : {
          label: editSchemeDetails?.gender || editSchemeDetails?.gender_name,
          value:
            getGenderIdFromName(editSchemeDetails?.gender) ||
            editSchemeDetails?.gender_id,
        },
    category_id: !isEdit
      ? ""
      : {
          label: editSchemeDetails?.category || editSchemeDetails?.category_name,
          value:
            getCategoryIdFromName(editSchemeDetails?.category) ||
            editSchemeDetails?.category_id,
        },
    sub_category_id: !isEdit
      ? ""
      : {
          label:
            editSchemeDetails?.sub_category ||
            editSchemeDetails?.sub_category_name,
          value:
            getSubCategoryIdFromName(editSchemeDetails?.sub_category) ||
            editSchemeDetails?.sub_category_id,
        },
    scheme_description: !isEdit ? "" : editSchemeDetails?.scheme_description,
    scheme_objectives: !isEdit
      ? ""
      : arrayToHtmlString(editSchemeDetails?.scheme_objectives),
    scheme_benefits: !isEdit
      ? ""
      : arrayToHtmlString(editSchemeDetails?.scheme_benefits),
    scheme_eligibility_lower_age_limit: !isEdit
      ? ""
      : editSchemeDetails?.scheme_eligibility?.lower_age_limit ||
        editSchemeDetails?.scheme_eligibility_lower_age_limit,
    scheme_eligibility_upper_age_limit: !isEdit
      ? ""
      : editSchemeDetails?.scheme_eligibility?.upper_age_limit ||
        editSchemeDetails?.scheme_eligibility_upper_age_limit,
    scheme_required_documents: !isEdit
      ? ""
      : Array.isArray(editSchemeDetails?.scheme_required_documents)
        ? arrayToHtmlString(
            editSchemeDetails.scheme_required_documents.map(
              (doc) => doc.document_type || doc
            )
          )
        : editSchemeDetails?.scheme_required_documents || "",
    scheme_image_file_url: !isEdit
      ? ""
      : editSchemeDetails?.scheme_image_file_url,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
    getValues,
    setValue,
    control,
  } = useForm({
    defaultValues: defaultValues,
  });

  const onSubmit = async (data) => {
    try {
      setIsFormSubmitting(true);
      let fileURL = null;

      if (!isEdit && docScheme === null) {
        showToast("Please upload an image for the scheme.", "error");
        return;
      }

      if (isEdit && editSchemeDeleteImagePath === null && docScheme === null) {
        showToast("Please upload an image for the scheme.", "error");
        return;
      }

      if (docScheme) {
        const file = docScheme[0];
        const folderName = "admin-uploads";

        fileURL = await uploadFileToServer(file, folderName);
      }

      let updatedFileURL = `public${fileURL}`; //Since the folder path received from server is missing out on the "public" parent folder

      let sendDataObj = {
        scheme_name: data?.scheme_name,
        scheme_date: data?.scheme_date,
        gender_id: selectedGender?.value,
        gender_name: selectedGender?.label,
        category_id: selectedCategory?.value,
        category_name: selectedCategory?.label,
        sub_category_id: selectedSubCategory?.value,
        sub_category_name: selectedSubCategory?.label,
        scheme_description: data?.scheme_description,
        scheme_objectives: data?.scheme_objectives,
        scheme_benefits: data?.scheme_benefits,
        scheme_eligibility_lower_age_limit:
          data?.scheme_eligibility_lower_age_limit,
        scheme_eligibility_upper_age_limit:
          data?.scheme_eligibility_upper_age_limit,
        scheme_required_documents: data?.scheme_required_documents,
      };

      // console.log("sendDataObj inside onSubmit()", sendDataObj);

      let response = "";

      if (!isEdit) {
        sendDataObj.scheme_image_file_url = updatedFileURL || null;

        response = await axios.post(SCHEMES_CONFIG_URL, sendDataObj);
      } else {
        sendDataObj.scheme_image_file_url =
          editSchemeDeleteImagePath || updatedFileURL;
        sendDataObj.scheme_id =
          editSchemeDetails?._id || editSchemeDetails?.scheme_id;

        response = await axios.post(
          `${SCHEMES_CONFIG_URL}/update`,
          sendDataObj
        );
      }

      // console.log("Schemes Config Post Call Response", response);

      if (response.status === 200) {
        showToast("Scheme has been logged successfully.", "success");
        setCurrentPage(!currentPage);

        getSchemesList();
      } else {
        showToast(
          "Something went wrong. Please contact the administrator.",
          "error"
        );

        return;
      }
      reset();
    } catch (error) {
      console.error("error", error);
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
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const onClickDeleteImage = async (schemeId) => {
    try {
      let response = "";
      if (schemeId) {
        // Use _id if available, otherwise use scheme_id
        const idToSend = editSchemeDetails?._id || schemeId;
        response = await axios.post(`${SCHEMES_CONFIG_URL}/deleteImage`, {
          scheme_id: idToSend,
        });
      }

      if (response.status === 200) {
        // console.log(
        //   "Scheme image details has been deleted successfully.",
        //   "success"
        // );
        handleDeleteFile(editSchemeDeleteImagePath);
      }
      // else {
      //   console.log("Scheme image details deletion failed.", "error");
      // }
    } catch (error) {
      console.log("Delete Scheme Image Error", error);
    } finally {
      setEditSchemeDeleteImagePath(null);
    }
  };

  return (
    <section>
      <HeadingAndButton
        title="Add Schemes"
        buttonText="Back"
        buttonIcon={IoChevronBack}
        onButtonClick={() => setCurrentPage(!currentPage)}
      />

      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10 gap-y-5">
            <Input
              defaultName="scheme_name"
              register={register}
              name="Scheme Name"
              required={true}
              pattern={null}
              errors={errors}
              placeholder="Enter scheme name"
              setError={setError}
              clearError={clearErrors}
              autoComplete="off"
              type="text"
              classes={`px-3 py-2 text-sm w-full rounded`}
              onChangeInput={null}
              defaultValue={defaultValues.scheme_name}
              setValue={setValue}
            />

            <Input
              defaultName="scheme_date"
              register={register}
              name="Scheme Date"
              required={false}
              pattern={null}
              errors={errors}
              placeholder={null}
              setError={setError}
              clearError={clearErrors}
              autoComplete="off"
              type="date"
              classes={`px-3 py-2 text-sm w-full rounded`}
              onChangeInput={null}
              setValue={setValue}
              defaultValue={defaultValues.scheme_date}
            />

            <div className="col-span-2 grid grid-cols-3 gap-x-5">
              <Dropdown
                defaultName="gender_id"
                register={register}
                labelname="Gender"
                required={true}
                pattern={false}
                errors={errors}
                classes={`rounded-lg text-sm w-full z-40 cursor-pointer`}
                setError={setError}
                clearError={clearErrors}
                onChangeInput={null}
                control={control}
                data={genderDD}
                defaultValue={defaultValues.gender_id}
                setValue={setValue}
                setSelected={setSelectedGender}
                selected={selectedGender}
                maxMenuHeight={120}
              />

              <Dropdown
                defaultName="category_id"
                register={register}
                labelname="Category"
                required={true}
                pattern={false}
                errors={errors}
                classes={`rounded-lg text-sm w-full z-40 cursor-pointer`}
                setError={setError}
                clearError={clearErrors}
                onChangeInput={null}
                control={control}
                data={categoryDD}
                defaultValue={defaultValues.category_id}
                setValue={setValue}
                setSelected={setSelectedCategory}
                selected={selectedCategory}
                maxMenuHeight={120}
              />

              <Dropdown
                defaultName="sub_category_id"
                register={register}
                labelname="Sub-Category"
                required={true}
                pattern={false}
                errors={errors}
                classes={`rounded-lg text-sm w-full z-40 cursor-pointer`}
                setError={setError}
                clearError={clearErrors}
                onChangeInput={null}
                control={control}
                data={subCategoryDD}
                defaultValue={defaultValues.sub_category_id}
                setValue={setValue}
                setSelected={setSelectedSubCategory}
                selected={selectedSubCategory}
                maxMenuHeight={120}
              />
            </div>

            <div className="col-span-2">
              <TextArea
                defaultName="scheme_description"
                register={register}
                name="Scheme Description"
                required={true}
                pattern={null}
                errors={errors}
                placeholder={"Enter the description for the scheme"}
                setError={setError}
                clearError={clearErrors}
                autoComplete="off"
                type="text"
                classes={`rounded px-3 py-2 text-sm w-full resize-none h-32`}
                onChangeInput={null}
                defaultValue={defaultValues.scheme_description}
                setValue={setValue}
              />
            </div>

            <div className="col-span-2">
              <RichTextArea
                defaultName="scheme_objectives"
                register={register}
                name="Scheme Objectives"
                required={true}
                errors={errors}
                setValue={setValue}
                data={defaultValues?.scheme_objectives}
                rows={4}
              />
            </div>

            <div className="col-span-2">
              <RichTextArea
                defaultName="scheme_benefits"
                register={register}
                name="Scheme Benefits"
                required={true}
                errors={errors}
                setValue={setValue}
                data={defaultValues?.scheme_benefits}
                rows={4}
              />
            </div>

            <Input
              defaultName="scheme_eligibility_lower_age_limit"
              register={register}
              name="Eligibility Lower Age Limit"
              required={true}
              pattern={null}
              errors={errors}
              placeholder="Enter age"
              setError={setError}
              clearError={clearErrors}
              autoComplete="off"
              type="number"
              classes={`px-3 py-2 text-sm w-full rounded`}
              onChangeInput={null}
              defaultValue={defaultValues.scheme_eligibility_lower_age_limit}
              setValue={setValue}
            />

            <Input
              defaultName="scheme_eligibility_upper_age_limit"
              register={register}
              name="Eligibility Upper Age Limit"
              required={true}
              pattern={null}
              errors={errors}
              placeholder="Enter age"
              setError={setError}
              clearError={clearErrors}
              autoComplete="off"
              type="number"
              classes={`px-3 py-2 text-sm w-full rounded`}
              onChangeInput={null}
              defaultValue={defaultValues.scheme_eligibility_upper_age_limit}
              setValue={setValue}
            />

            <div className="col-span-2">
              <RichTextArea
                defaultName="scheme_required_documents"
                register={register}
                name="Required Documents"
                required={true}
                errors={errors}
                setValue={setValue}
                data={defaultValues?.scheme_required_documents}
              />
            </div>

            <div className="flex flex-col justify-start mt-3 items-start">
              <div className="mb-4 font-semibold">
                Scheme Image <span className="text-red-700">*</span>
              </div>

              {!isEdit ? (
                <div className="flex gap-x-5 items-center">
                  <div
                    onClick={() => setShowSchemeDz(true)}
                    className="h-10 flex items-center gap-x-2 border rounded px-4 cursor-pointer hover:border-primary"
                  >
                    <div className="text-sm">
                      {docScheme !== null ? "Change" : "Upload"}
                    </div>
                    <div>
                      <BsUpload size={14} />
                    </div>
                  </div>

                  <div>
                    {docScheme !== null && (
                      <div className="flex flex-wrap gap-x-2 items-center">
                        <div className="text-sm text-blue-700">
                          {docScheme[0]?.name}
                        </div>

                        <div
                          onClick={() => setDocScheme(null)}
                          className="ml-1 p-1 bg-red-500 text-white cursor-pointer"
                        >
                          <RxCross2 />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {editSchemeDeleteImagePath ? (
                    <div>
                      <img
                        src={displayMedia(
                          // defaultValues?.scheme_image_file_url
                          editSchemeDeleteImagePath
                        )}
                        className="h-72 w-full object-cover rounded"
                      />

                      <div
                        onClick={() =>
                          onClickDeleteImage(defaultValues?.scheme_id)
                        }
                        className="text-red-700 text-sm mt-1 font-semibold cursor-pointer"
                      >
                        Remove Image
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-x-5 items-center">
                      <div
                        onClick={() => setShowSchemeDz(true)}
                        className="h-10 flex items-center gap-x-2 border rounded px-4 cursor-pointer hover:border-primary"
                      >
                        <div className="text-sm">
                          {docScheme !== null ? "Change" : "Upload"}
                        </div>
                        <div>
                          <BsUpload size={14} />
                        </div>
                      </div>

                      <div>
                        {docScheme !== null && (
                          <div className="flex flex-wrap gap-x-2 items-center">
                            <div className="text-sm text-blue-700">
                              {docScheme[0]?.name}
                            </div>

                            <div
                              onClick={() => setDocScheme(null)}
                              className="ml-1 p-1 bg-red-500 text-white cursor-pointer"
                            >
                              <RxCross2 />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {showSchemeDz && (
            <GenericModal
              open={showSchemeDz}
              setOpen={setShowSchemeDz}
              title={`Upload Scheme Photo`}
              isAdd={true}
            >
              <div>
                <DocDropzone
                  // fieldTitle={"Scheme Photo"}
                  onChange={setDocScheme}
                  multiple={false}
                  setShowDropzone={setShowSchemeDz}
                />
              </div>
            </GenericModal>
          )}

          {/* Buttons */}
          <div className="mt-10 mb-5 w-full grid grid-cols-3">
            {!isFormSubmitting ? (
              <button
                type="submit"
                className="col-start-2 flex justify-self-center items-center bg-blue-800 w-fit text-white py-2 px-5 rounded cursor-pointer"
              >
                <span className="text-sm font-medium">
                  {!isEdit ? "Submit" : "Update"}
                </span>
              </button>
            ) : (
              <div className="col-start-2 flex justify-self-center items-center bg-blue-800 w-fit text-white py-2 px-5 rounded cursor-pointer">
                <div className="flex gap-x-1 items-center">
                  <p className="text-sm font-medium">
                    {!isEdit ? "Submitting" : "Updating"}
                  </p>
                  <p className="pl-1">
                    <Spinner />
                  </p>
                </div>
              </div>
            )}

            <div
              onClick={() => setCurrentPage(!currentPage)}
              className="justify-self-end py-2 px-5 border rounded cursor-pointer text-sm font-medium"
            >
              Cancel
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddSchemeForm;
