/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import styled from "styled-components";

import { BsUpload } from "react-icons/bs";
import { IoChevronBack, IoChevronBackCircleOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";

import axios from "../../../../api/axios";
import { 
  SCHEMES_CONFIG_URL,
  DEPARTMENTS_URL,
  DEPARTMENTS_SIMPLE_URL,
  CATEGORIES_SIMPLE_URL,
  ADMIN_ROLES_FOR_AUTHORIZATION_URL
} from "../../../../api/api_routing_urls";

import HeadingAndButton from "../../../../reusable-components/HeadingAndButton";
import Input from "../../../../reusable-components/inputs/InputTextBox/Input";
import Dropdown from "../../../../reusable-components/inputs/Dropdowns/Dropdown";
import TextArea from "../../../../reusable-components/inputs/InputTextAreas/TextArea";
import DatePicker from "../../../../reusable-components/inputs/DatePicker/DatePicker";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import DocDropzone from "../../../../reusable-components/FileUploader/PDFImageDropZoneUploader/PDFImageDropZoneUploader.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import ExcludedSchemesSelector from "../../../../reusable-components/ExcludedSchemesSelector/ExcludedSchemesSelector";

import RichTextArea from "../../../../reusable-components/richtexteditor/RichTextArea";
import ArrayInput from "../../../../reusable-components/inputs/ArrayInput/ArrayInput";

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
  const [departmentDD, setDepartmentDD] = useState([]);
  const [categoryDD, setCategoryDD] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExcludedSchemeIds, setSelectedExcludedSchemeIds] = useState([]);

  // Authorization levels state
  const [selectedFirstAuthLevel, setSelectedFirstAuthLevel] = useState(null);
  const [selectedSecondAuthLevel, setSelectedSecondAuthLevel] = useState(null);
  const [selectedThirdAuthLevel, setSelectedThirdAuthLevel] = useState(null);
  const [selectedFourthAuthLevel, setSelectedFourthAuthLevel] = useState(null);
  
  // Authorization level options (fetched from API)
  const [authLevelOptions, setAuthLevelOptions] = useState([]);
  const [loadingAuthLevels, setLoadingAuthLevels] = useState(false);

  // Master Data
  let genderList = [
    { gender_name: "Male", gender_id: 1 },
    { gender_name: "Female", gender_id: 2 },
    { gender_name: "Others", gender_id: 3 },
    { gender_name: "All", gender_id: 4 },
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

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(DEPARTMENTS_URL);
      console.log("Departments API response:", response.data);
      if (response.status === 200) {
        // Handle different response structures
        let deptData = [];
        if (Array.isArray(response.data)) {
          // Direct array response
          deptData = response.data;
        } else if (response.data?.departments && Array.isArray(response.data.departments)) {
          // Wrapped in object with departments property
          deptData = response.data.departments;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Nested data property
          deptData = response.data.data;
        }
        
        console.log("Full API response:", response.data);
        console.log("Extracted departments data:", deptData);
        console.log("Number of departments received:", deptData.length);
        
        // Filter out any departments missing required fields and log them
        const validDepartments = deptData.filter((dept) => {
          if (!dept._id) {
            console.warn("Department missing _id:", dept);
            return false;
          }
          return true;
        });
        
        console.log("Valid departments (with _id):", validDepartments.length);
        
        const departmentsDD = validDepartments.map((dept) => ({
          label: dept.department_display_name || dept.department_name || "Unknown",
          value: dept._id, // ObjectId string
          department_name: dept.department_name,
          department_display_name: dept.department_display_name,
        }));
        
        console.log("Processed departments dropdown:", departmentsDD);
        console.log("Number of departments in dropdown:", departmentsDD.length);
        setDepartmentDD(departmentsDD);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      console.error("Error response:", error.response?.data);
      showToast("Failed to fetch departments.", "error");
    }
  };

  // Fetch categories for selected department (using department ObjectId)
  const fetchCategoriesForDepartment = async (departmentId) => {
    if (!departmentId) {
      setCategoryDD([]);
      setSelectedCategory(null);
      return;
    }

    try {
      setLoadingCategories(true);
      // Find department name from departmentDD to use in API call
      const department = departmentDD.find(d => d.value === departmentId);
      if (!department) {
        console.error("Department not found in dropdown list");
        setCategoryDD([]);
        setSelectedCategory(null);
        return;
      }

      const departmentName = department.department_name;
      const response = await axios.get(`${DEPARTMENTS_SIMPLE_URL.replace('/simple', '')}/${encodeURIComponent(departmentName)}/categories`);
      if (response.status === 200 && response.data?.categories) {
        const categoriesDD = response.data.categories.map((cat) => ({
          label: cat.category_display_name || cat.category_name,
          value: cat._id,
          category_name: cat.category_name,
          category_display_name: cat.category_display_name,
        }));
        setCategoryDD(categoriesDD);
        // Clear selected category when department changes (unless editing)
        if (!isEdit) {
          setSelectedCategory(null);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Failed to fetch categories for selected department.", "error");
      setCategoryDD([]);
      setSelectedCategory(null);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Check if editing (must be declared before useEffects that use it)
  const isEdit = Object.keys(editSchemeDetails)?.length > 0;

  // Set default excluded schemes if editing
  useEffect(() => {
    if (isEdit && editSchemeDetails?.excluded_schemes && Array.isArray(editSchemeDetails.excluded_schemes)) {
      const excludedIds = editSchemeDetails.excluded_schemes.map((schemeId) => {
        return schemeId._id || schemeId || schemeId;
      });
      setSelectedExcludedSchemeIds(excludedIds);
    }
  }, [isEdit, editSchemeDetails]);

  // Fetch admin roles for authorization levels from database
  const fetchAdminRoles = async () => {
    try {
      setLoadingAuthLevels(true);
      console.log("Fetching admin roles from API:", ADMIN_ROLES_FOR_AUTHORIZATION_URL);
      const response = await axios.get(ADMIN_ROLES_FOR_AUTHORIZATION_URL);
      console.log("Admin roles API response:", response.data);
      
      if (response.status === 200 && response.data?.roles) {
        // Convert API response to dropdown format
        const options = response.data.roles.map((role) => ({
          label: `${role.displayName} (Level ${role.level})`,
          value: role.level,
          role: role.role,
          displayName: role.displayName,
        }));
        console.log("Processed authorization level options from database:", options);
        setAuthLevelOptions(options);
      } else {
        console.warn("Unexpected API response format:", response.data);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching admin roles from database:", error);
      console.error("Error details:", error.response?.data || error.message);
      showToast("Failed to fetch authorization levels from database. Using default values.", "warning");
      // Fallback to default options if API fails
      setAuthLevelOptions([
        { label: "Super Admin (Level 1)", value: 1 },
        { label: "Admin (Level 2)", value: 2 },
        { label: "Department Secretary (Level 3)", value: 3 },
        { label: "Department Head (Level 4)", value: 4 },
        { label: "DistrictHQ Head (Level 5)", value: 5 },
        { label: "Department User (Level 6)", value: 6 },
        { label: "District Overlookers (Level 7)", value: 7 },
        { label: "Post Operator (Level 8)", value: 8 },
      ]);
    } finally {
      setLoadingAuthLevels(false);
    }
  };

  useEffect(() => {
    prepareGenderList();
    fetchDepartments();
    fetchAdminRoles();
  }, []);

  // Fetch categories when department is selected
  useEffect(() => {
    if (selectedDepartment?.value) {
      fetchCategoriesForDepartment(selectedDepartment.value);
    } else {
      setCategoryDD([]);
      if (!isEdit) {
        setSelectedCategory(null);
      }
    }
  }, [selectedDepartment]);

  // Set default department and category when editing
  useEffect(() => {
    if (isEdit && editSchemeDetails) {
      // Set department if it exists
      if (editSchemeDetails.department) {
        const dept = typeof editSchemeDetails.department === "object"
          ? editSchemeDetails.department
          : null;
        
        if (dept && departmentDD.length > 0) {
          const matchingDept = departmentDD.find(
            d => d.value === dept._id || d.department_name === dept.department_name
          );
          if (matchingDept) {
            setSelectedDepartment(matchingDept);
          }
        }
      }

      // Set category if it exists (after department is set)
      if (editSchemeDetails.category && categoryDD.length > 0) {
        const cat = typeof editSchemeDetails.category === "object"
          ? editSchemeDetails.category
          : null;
        
        if (cat) {
          const matchingCat = categoryDD.find(
            c => c.value === cat._id || c.category_name === cat.category_name
          );
          if (matchingCat) {
            setSelectedCategory(matchingCat);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editSchemeDetails, departmentDD, categoryDD]);

  // Set default authorization levels (after roles are fetched)
  useEffect(() => {
    if (authLevelOptions.length === 0) return; // Wait for roles to load
    
    if (isEdit && editSchemeDetails?.authorization_levels && Array.isArray(editSchemeDetails.authorization_levels)) {
      const authLevels = editSchemeDetails.authorization_levels;
      
      // Set first level
      if (authLevels[0] !== undefined) {
        const firstOption = authLevelOptions.find(opt => opt.value === authLevels[0]);
        if (firstOption) setSelectedFirstAuthLevel(firstOption);
      }
      
      // Set second level
      if (authLevels[1] !== undefined) {
        const secondOption = authLevelOptions.find(opt => opt.value === authLevels[1]);
        if (secondOption) setSelectedSecondAuthLevel(secondOption);
      }
      
      // Set third level
      if (authLevels[2] !== undefined) {
        const thirdOption = authLevelOptions.find(opt => opt.value === authLevels[2]);
        if (thirdOption) setSelectedThirdAuthLevel(thirdOption);
      }
      
      // Set fourth level
      if (authLevels[3] !== undefined) {
        const fourthOption = authLevelOptions.find(opt => opt.value === authLevels[3]);
        if (fourthOption) setSelectedFourthAuthLevel(fourthOption);
      }
    } else if (!isEdit) {
      // Set default values for new schemes (use first 4 roles from API, or fallback)
      if (authLevelOptions.length >= 4) {
        setSelectedFirstAuthLevel(authLevelOptions[0]); // First role (usually highest authority)
        setSelectedSecondAuthLevel(authLevelOptions[1]); // Second role
        setSelectedThirdAuthLevel(authLevelOptions[2]); // Third role
        setSelectedFourthAuthLevel(authLevelOptions[3]); // Fourth role
      } else if (authLevelOptions.length > 0) {
        // Fallback if less than 4 roles available
        setSelectedFirstAuthLevel(authLevelOptions[0]);
        if (authLevelOptions.length > 1) setSelectedSecondAuthLevel(authLevelOptions[1]);
        if (authLevelOptions.length > 2) setSelectedThirdAuthLevel(authLevelOptions[2]);
        if (authLevelOptions.length > 3) setSelectedFourthAuthLevel(authLevelOptions[3]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editSchemeDetails, authLevelOptions]);

  // Helper function to convert array to HTML string for RichTextArea
  const arrayToHtmlString = (arr) => {
    if (!arr) return "";
    if (typeof arr === "string") return arr; // Already a string
    if (Array.isArray(arr)) {
      return arr.map((item) => `<div>${item}</div>`).join("\n");
    }
    return "";
  };

  // Helper function to convert HTML string to array (for API submission)
  const htmlStringToArray = (htmlString) => {
    if (!htmlString || typeof htmlString !== "string") return [];
    // Remove HTML tags and split by div or newline
    const text = htmlString.replace(/<[^>]*>/g, "").trim();
    if (!text) return [];
    // Split by newline or div separator and filter empty strings
    const items = text.split(/\n|\r\n/).map(item => item.trim()).filter(item => item.length > 0);
    return items.length > 0 ? items : [];
  };

  // Helper function to find gender_id from gender string
  const getGenderIdFromName = (genderName) => {
    const gender = genderList.find((g) => g.gender_name === genderName);
    return gender ? gender.gender_id : null;
  };

  // Helper function to get gender string from gender_id
  const getGenderNameFromId = (genderId) => {
    const gender = genderList.find((g) => g.gender_id === genderId);
    return gender ? gender.gender_name : "All";
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
    department: !isEdit
      ? ""
      : editSchemeDetails?.department
        ? {
            // Department is now an ObjectId string, we'll match it with departmentDD
            value: editSchemeDetails.department,
            // Label will be set when we match with departmentDD
          }
        : "",
    category: !isEdit
      ? ""
      : editSchemeDetails?.category
        ? {
            // Category is now an ObjectId string, we'll match it with categoryDD
            value: editSchemeDetails.category,
            // Label will be set when we match with categoryDD
          }
        : "",
    scheme_description: !isEdit ? "" : editSchemeDetails?.scheme_description,
    scheme_objectives: !isEdit
      ? []
      : (Array.isArray(editSchemeDetails?.scheme_objectives) 
          ? editSchemeDetails.scheme_objectives 
          : []),
    scheme_benefits: !isEdit
      ? []
      : (Array.isArray(editSchemeDetails?.scheme_benefits) 
          ? editSchemeDetails.scheme_benefits 
          : []),
    scheme_eligibility_lower_age_limit: !isEdit
      ? ""
      : editSchemeDetails?.scheme_eligibility?.lower_age_limit ||
        editSchemeDetails?.scheme_eligibility_lower_age_limit,
    scheme_eligibility_upper_age_limit: !isEdit
      ? ""
      : editSchemeDetails?.scheme_eligibility?.upper_age_limit ||
        editSchemeDetails?.scheme_eligibility_upper_age_limit,
    scheme_required_document_types: !isEdit
      ? []
      : (Array.isArray(editSchemeDetails?.scheme_required_document_types)
          ? editSchemeDetails.scheme_required_document_types
          : []),
    scheme_image_file_url: !isEdit
      ? ""
      : editSchemeDetails?.scheme_image_file_url,
    excluded_schemes: !isEdit ? [] : selectedExcludedSchemeIds || [],
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

  // Set default department and category when editing (must be after useForm)
  useEffect(() => {
    if (isEdit && editSchemeDetails?.department && departmentDD.length > 0) {
      // Find department in dropdown by ObjectId
      const deptOption = departmentDD.find(d => d.value === editSchemeDetails.department);
      if (deptOption) {
        setSelectedDepartment(deptOption);
        setValue("department", deptOption);
      }
    }
  }, [isEdit, editSchemeDetails?.department, departmentDD, setValue]);

  // Set default category when editing and categories are loaded (must be after useForm)
  useEffect(() => {
    if (isEdit && editSchemeDetails?.category && categoryDD.length > 0) {
      // Find category in dropdown by ObjectId
      const catOption = categoryDD.find(c => c.value === editSchemeDetails.category);
      if (catOption) {
        setSelectedCategory(catOption);
        setValue("category", catOption);
      }
    }
  }, [isEdit, editSchemeDetails?.category, categoryDD, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsFormSubmitting(true);
      
      // Validate authorization levels (for both new and edit)
      if (!selectedFirstAuthLevel || !selectedSecondAuthLevel || !selectedThirdAuthLevel || !selectedFourthAuthLevel) {
        showToast("Please select all authorization levels.", "error");
        setIsFormSubmitting(false);
        return;
      }
      
      let fileURL = null;

      if (!isEdit && docScheme === null) {
        showToast("Please upload an image for the scheme.", "error");
        setIsFormSubmitting(false);
        return;
      }

      if (isEdit && editSchemeDeleteImagePath === null && docScheme === null) {
        showToast("Please upload an image for the scheme.", "error");
        setIsFormSubmitting(false);
        return;
      }

      if (docScheme) {
        const file = docScheme[0];
        const folderName = "admin-uploads";

        fileURL = await uploadFileToServer(file, folderName);
      }

      let updatedFileURL = `public${fileURL}`; //Since the folder path received from server is missing out on the "public" parent folder

      // Use selected excluded scheme IDs
      const excludedSchemeIds = Array.isArray(selectedExcludedSchemeIds)
        ? selectedExcludedSchemeIds
        : [];

      // Build authorization_levels array (for both new and edit)
      const authorization_levels = [
        selectedFirstAuthLevel?.value || 7,
        selectedSecondAuthLevel?.value || 6,
        selectedThirdAuthLevel?.value || 4,
        selectedFourthAuthLevel?.value || 3,
      ];

      // Validate department and category for new schemes
      if (!isEdit) {
        if (!selectedDepartment) {
          showToast("Please select a department.", "error");
          setIsFormSubmitting(false);
          return;
        }
        if (!selectedCategory) {
          showToast("Please select a category.", "error");
          setIsFormSubmitting(false);
          return;
        }
      }

      // Department and category are now ObjectId strings
      // selectedDepartment.value and selectedCategory.value are already ObjectId strings from dropdowns
      const departmentValue = selectedDepartment?.value || editSchemeDetails?.department;
      const categoryValue = selectedCategory?.value || editSchemeDetails?.category;

      // Convert gender_id to gender string
      const genderString = selectedGender?.label || getGenderNameFromId(selectedGender?.value) || "All";

      // Get arrays directly from form data (ArrayInput already provides arrays)
      const scheme_objectives = Array.isArray(data?.scheme_objectives) 
        ? data.scheme_objectives.filter(item => item && item.trim() !== "")
        : [];
      const scheme_benefits = Array.isArray(data?.scheme_benefits)
        ? data.scheme_benefits.filter(item => item && item.trim() !== "")
        : [];
      const scheme_required_document_types = Array.isArray(data?.scheme_required_document_types)
        ? data.scheme_required_document_types.filter(item => item && item.trim() !== "")
        : [];

      // Validate arrays are not empty
      if (scheme_objectives.length === 0) {
        showToast("Please provide at least one scheme objective.", "error");
        setIsFormSubmitting(false);
        return;
      }
      if (scheme_benefits.length === 0) {
        showToast("Please provide at least one scheme benefit.", "error");
        setIsFormSubmitting(false);
        return;
      }
      if (scheme_required_document_types.length === 0) {
        showToast("Please provide at least one required document type.", "error");
        setIsFormSubmitting(false);
        return;
      }

      // Convert age limits to scheme_eligibility object
      const lowerAgeLimit = parseInt(data?.scheme_eligibility_lower_age_limit, 10);
      const upperAgeLimit = parseInt(data?.scheme_eligibility_upper_age_limit, 10);

      if (isNaN(lowerAgeLimit) || isNaN(upperAgeLimit)) {
        showToast("Please provide valid age limits.", "error");
        setIsFormSubmitting(false);
        return;
      }

      // Format scheme_date to ISO string if provided
      let schemeDateISO = null;
      if (data?.scheme_date) {
        const date = new Date(data.scheme_date);
        if (!isNaN(date.getTime())) {
          schemeDateISO = date.toISOString();
        }
      }

      let sendDataObj = {
        scheme_name: data?.scheme_name,
        ...(schemeDateISO && { scheme_date: schemeDateISO }),
        gender: genderString, // String: "All", "Male", or "Female"
        department: departmentValue, // ObjectId string
        category: categoryValue, // ObjectId string
        scheme_description: data?.scheme_description,
        scheme_objectives: scheme_objectives, // Array of strings
        scheme_benefits: scheme_benefits, // Array of strings
        scheme_eligibility: {
          lower_age_limit: lowerAgeLimit,
          upper_age_limit: upperAgeLimit,
        },
        scheme_required_document_types: scheme_required_document_types, // Array of strings
        scheme_required_documents: [], // Empty array (documents uploaded separately)
        excluded_schemes: excludedSchemeIds, // Array of ObjectId strings
        authorization_levels, // Array of numbers (max 4) - included for both new and edit
        ...(!isEdit && { 
          approval_status: "pending_department_head_approval" // For new schemes only
        }),
      };

      // console.log("sendDataObj inside onSubmit()", sendDataObj);

      let response = "";

      if (!isEdit) {
        sendDataObj.scheme_image_file_url = updatedFileURL || null;

        response = await axios.post(SCHEMES_CONFIG_URL, sendDataObj);
      } else {
        sendDataObj.scheme_image_file_url =
          editSchemeDeleteImagePath || updatedFileURL;
        
        // Backend expects _id field, not scheme_id
        const schemeId = editSchemeDetails?._id || editSchemeDetails?.scheme_id;
        if (!schemeId) {
          showToast("Scheme ID is missing. Cannot update scheme.", "error");
          setIsFormSubmitting(false);
          return;
        }
        
        // Add _id to the request body (backend expects this field)
        sendDataObj._id = schemeId;
        // Also keep scheme_id for backward compatibility if needed
        sendDataObj.scheme_id = schemeId;

        // Use query parameters for authentication (to avoid CORS issues)
        const adminUsername = sessionStorage.getItem("admin_username") || localStorage.getItem("admin_username");
        const adminPassword = sessionStorage.getItem("admin_password") || localStorage.getItem("admin_password");
        const params = new URLSearchParams();
        if (adminUsername) params.append("username", adminUsername);
        if (adminPassword) params.append("password", adminPassword);

        console.log("Updating scheme with data:", {
          _id: sendDataObj._id,
          scheme_id: sendDataObj.scheme_id,
          scheme_name: sendDataObj.scheme_name,
          authorization_levels: sendDataObj.authorization_levels,
        });

        response = await axios.post(
          `${SCHEMES_CONFIG_URL}/update?${params.toString()}`,
          sendDataObj
        );
      }

      // console.log("Schemes Config Post Call Response", response);

      if (response.status === 200 || response.status === 201) {
        if (!isEdit) {
          showToast("Scheme created successfully. Pending Department Head approval.", "success");
        } else {
          showToast("Scheme has been updated successfully.", "success");
        }
        setCurrentPage(!currentPage);

        getSchemesList();
      } else {
        showToast(
          "Something went wrong. Please contact the administrator.",
          "error"
        );

        return;
      }
      // Reset form including excluded schemes and authorization levels
      setSelectedExcludedSchemeIds([]);
      if (!isEdit && authLevelOptions.length >= 4) {
        setSelectedFirstAuthLevel(authLevelOptions[0]);
        setSelectedSecondAuthLevel(authLevelOptions[1]);
        setSelectedThirdAuthLevel(authLevelOptions[2]);
        setSelectedFourthAuthLevel(authLevelOptions[3]);
      }
      reset();
    } catch (error) {
      console.error("Error submitting scheme:", error);
      
      // Log full error response for debugging
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        console.error("Full error response:", JSON.stringify(error.response.data, null, 2));
      }
      
      if (!error?.response) {
        showToast("No Server Response. Please check your connection.", "error");
      } else {
        const errorData = error.response.data || {};
        const status = error.response.status;
        
        // Build error message from backend response
        let errorMessage = "Something went wrong. Please try again.";
        
        // Check for detailed error messages from backend
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Handle validation errors array
          const validationErrors = errorData.errors.map(err => 
            typeof err === 'string' ? err : err.message || err.msg || JSON.stringify(err)
          ).join(", ");
          errorMessage = `Validation errors: ${validationErrors}`;
        } else if (errorData.status && errorData.message) {
          errorMessage = errorData.message;
        }
        
        // Add status code to message for 400 errors to help debugging
        if (status === 400) {
          errorMessage = `Bad Request (400): ${errorMessage}`;
          console.error("400 Bad Request - Check if _id is being sent correctly in the request body");
        } else if (status === 422) {
          errorMessage = `Validation Error (422): ${errorMessage}`;
        }
        
        showToast(errorMessage, "error");
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

            <DatePicker
              defaultName="scheme_date"
              register={register}
              name="Scheme Date"
              required={false}
              pattern={null}
              errors={errors}
              setError={setError}
              clearError={clearErrors}
              control={control}
              setValue={setValue}
              defaultValue={defaultValues.scheme_date}
              classes={`px-3 py-2 text-sm w-full rounded`}
            />

            <Dropdown
              defaultName="department"
              register={register}
              labelname="Department"
              required={true}
              pattern={false}
              errors={errors}
              classes={`rounded-lg text-sm w-full z-50 cursor-pointer`}
              setError={setError}
              clearError={clearErrors}
              onChangeInput={null}
              control={control}
              data={departmentDD}
              defaultValue={defaultValues.department}
              setValue={setValue}
              setSelected={setSelectedDepartment}
              selected={selectedDepartment}
              maxMenuHeight={200}
              placeholder="Select department"
            />

            <Dropdown
              defaultName="category"
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
              defaultValue={defaultValues.category}
              setValue={setValue}
              setSelected={setSelectedCategory}
              selected={selectedCategory}
              maxMenuHeight={200}
              placeholder={selectedDepartment ? "Select category" : "Select department first"}
              isDisabled={!selectedDepartment || loadingCategories}
            />

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
                classes={`rounded px-3 py-2 text-sm w-full resize-y min-h-40`}
                onChangeInput={null}
                defaultValue={defaultValues.scheme_description}
                setValue={setValue}
              />
            </div>

            <div className="col-span-2">
              <ArrayInput
                defaultName="scheme_objectives"
                register={register}
                name="Scheme Objectives"
                required={true}
                errors={errors}
                setValue={setValue}
                data={!isEdit ? [] : (Array.isArray(editSchemeDetails?.scheme_objectives) 
                  ? editSchemeDetails.scheme_objectives 
                  : [])}
                placeholder="Enter objective"
              />
            </div>

            <div className="col-span-2">
              <ArrayInput
                defaultName="scheme_benefits"
                register={register}
                name="Scheme Benefits"
                required={true}
                errors={errors}
                setValue={setValue}
                data={!isEdit ? [] : (Array.isArray(editSchemeDetails?.scheme_benefits) 
                  ? editSchemeDetails.scheme_benefits 
                  : [])}
                placeholder="Enter benefit"
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
              <label className="font-medium text-left text-gray-900 pl-1 pb-3 text-xs md:text-sm lg:text-base block">
                Excluded Schemes
                <span className="text-gray-500 text-xs ml-2 font-normal">
                  (Optional - Select schemes that should be excluded)
                </span>
              </label>
              <ExcludedSchemesSelector
                selectedSchemeIds={selectedExcludedSchemeIds}
                onChange={setSelectedExcludedSchemeIds}
                currentSchemeId={isEdit ? (editSchemeDetails?._id || editSchemeDetails?.scheme_id) : null}
                className="mt-2"
              />
            </div>

            {/* Authorization Levels Section - Show for both new and edit */}
            <div className="col-span-2 border-t pt-5 mt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Authorization Levels <span className="text-red-700">*</span>
              </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Dropdown
                    defaultName="first_auth_level"
                    register={register}
                    labelname="First Authorization Level"
                    required={true}
                    pattern={false}
                    errors={errors}
                    classes={`rounded-lg text-sm w-full z-40 cursor-pointer`}
                    setError={setError}
                    clearError={clearErrors}
                    onChangeInput={null}
                    control={control}
                    data={authLevelOptions}
                    defaultValue={selectedFirstAuthLevel}
                    setValue={setValue}
                    setSelected={setSelectedFirstAuthLevel}
                    selected={selectedFirstAuthLevel}
                    maxMenuHeight={200}
                    placeholder={loadingAuthLevels ? "Loading roles..." : "Select first authorization level"}
                    isDisabled={loadingAuthLevels || authLevelOptions.length === 0}
                  />

                  <Dropdown
                    defaultName="second_auth_level"
                    register={register}
                    labelname="Second Authorization Level"
                    required={true}
                    pattern={false}
                    errors={errors}
                    classes={`rounded-lg text-sm w-full z-40 cursor-pointer`}
                    setError={setError}
                    clearError={clearErrors}
                    onChangeInput={null}
                    control={control}
                    data={authLevelOptions}
                    defaultValue={selectedSecondAuthLevel}
                    setValue={setValue}
                    setSelected={setSelectedSecondAuthLevel}
                    selected={selectedSecondAuthLevel}
                    maxMenuHeight={200}
                    placeholder={loadingAuthLevels ? "Loading roles..." : "Select second authorization level"}
                    isDisabled={loadingAuthLevels || authLevelOptions.length === 0}
                  />

                  <Dropdown
                    defaultName="third_auth_level"
                    register={register}
                    labelname="Third Authorization Level"
                    required={true}
                    pattern={false}
                    errors={errors}
                    classes={`rounded-lg text-sm w-full z-40 cursor-pointer`}
                    setError={setError}
                    clearError={clearErrors}
                    onChangeInput={null}
                    control={control}
                    data={authLevelOptions}
                    defaultValue={selectedThirdAuthLevel}
                    setValue={setValue}
                    setSelected={setSelectedThirdAuthLevel}
                    selected={selectedThirdAuthLevel}
                    maxMenuHeight={200}
                    placeholder={loadingAuthLevels ? "Loading roles..." : "Select third authorization level"}
                    isDisabled={loadingAuthLevels || authLevelOptions.length === 0}
                  />

                  <Dropdown
                    defaultName="fourth_auth_level"
                    register={register}
                    labelname="Fourth Authorization Level"
                    required={true}
                    pattern={false}
                    errors={errors}
                    classes={`rounded-lg text-sm w-full z-40 cursor-pointer`}
                    setError={setError}
                    clearError={clearErrors}
                    onChangeInput={null}
                    control={control}
                    data={authLevelOptions}
                    defaultValue={selectedFourthAuthLevel}
                    setValue={setValue}
                    setSelected={setSelectedFourthAuthLevel}
                    selected={selectedFourthAuthLevel}
                    maxMenuHeight={200}
                    placeholder={loadingAuthLevels ? "Loading roles..." : "Select fourth authorization level"}
                    isDisabled={loadingAuthLevels || authLevelOptions.length === 0}
                  />
                </div>
              <p className="mt-2 text-xs text-gray-600">
                Authorization levels define who can authorize applications at each stage of the workflow.
              </p>
            </div>

            <div className="col-span-2">
              <ArrayInput
                defaultName="scheme_required_document_types"
                register={register}
                name="Required Document Types"
                required={true}
                errors={errors}
                setValue={setValue}
                data={!isEdit ? [] : (Array.isArray(editSchemeDetails?.scheme_required_document_types) 
                  ? editSchemeDetails.scheme_required_document_types 
                  : [])}
                placeholder="Enter document type (e.g., Aadhaar Card)"
              />
            </div>

            <div className="flex flex-col justify-start mt-3 items-start">
              <div className="mb-4 font-semibold">
                Scheme Image <span className="text-red-700">*</span>
              </div>

              {!isEdit ? (
                <div className="flex gap-x-5 items-center">
                  <div
                    onClick={() => {
                      // Close any open dropdowns before opening modal
                      document.body.click();
                      setTimeout(() => setShowSchemeDz(true), 100);
                    }}
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
                        onClick={() => {
                          // Close any open dropdowns before opening modal
                          document.body.click();
                          setTimeout(() => setShowSchemeDz(true), 100);
                        }}
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
                  <div className="pl-1">
                    <Spinner />
                  </div>
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
