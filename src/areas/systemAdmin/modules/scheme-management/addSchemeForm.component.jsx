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
  CATEGORIES_URL,
  ADMIN_ROLES_URL,
  ADMIN_ROLES_FOR_AUTHORIZATION_URL,
} from "../../../../api/api_routing_urls";
import {
  fetchDocumentTypes,
  findProfileDocumentOverlap,
  getSchemeProfileDocumentKeys,
  getSchemeRequiredDocumentLabels,
  getSchemeRequiredDocumentsDisplay,
} from "../../../../utils/documentTypes";
import CustomSchemeDocumentsInput from "../../../../reusable-components/CustomSchemeDocumentsInput/CustomSchemeDocumentsInput";
import ProfileDocumentTypeMultiSelect from "../../../../reusable-components/ProfileDocumentTypeMultiSelect/ProfileDocumentTypeMultiSelect";
import RequiredDocumentsEnrichedList from "../../../../reusable-components/RequiredDocumentsEnrichedList/RequiredDocumentsEnrichedList";
import SchemeFormSection, {
  SchemeFormSubBlock,
} from "../../../../reusable-components/SchemeFormSection/SchemeFormSection";

import HeadingAndButton from "../../../../reusable-components/HeadingAndButton";
import Input from "../../../../reusable-components/inputs/InputTextBox/Input";
import Dropdown from "../../../../reusable-components/inputs/Dropdowns/Dropdown";
import TextArea from "../../../../reusable-components/inputs/InputTextAreas/TextArea";
import DatePicker from "../../../../reusable-components/inputs/DatePicker/DatePicker";
import GenericModal from "../../../../reusable-components/modals/GenericModal.component";
import DocDropzone from "../../../../reusable-components/FileUploader/PDFImageDropZoneUploader/PDFImageDropZoneUploader.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import ExcludedSchemesSelector from "../../../../reusable-components/ExcludedSchemesSelector/ExcludedSchemesSelector";
import DynamicAuthLevelsSelector from "../../../../reusable-components/DynamicAuthLevelsSelector/DynamicAuthLevelsSelector";
import CustomFormFieldsSelector from "../../../../reusable-components/CustomFormFieldsSelector/CustomFormFieldsSelector";

import RichTextArea from "../../../../reusable-components/richtexteditor/RichTextArea";
import ArrayInput from "../../../../reusable-components/inputs/ArrayInput/ArrayInput";

import showToast from "../../../../utils/notification/NotificationModal";
import { useConfirm } from "../../../../reusable-components/ConfirmDialog/ConfirmDialogProvider";
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
  const confirm = useConfirm();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [showSchemeDz, setShowSchemeDz] = useState(false);
  const [docScheme, setDocScheme] = useState(null);

  const [departmentDD, setDepartmentDD] = useState([]);
  const [categoryDD, setCategoryDD] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExcludedSchemeIds, setSelectedExcludedSchemeIds] = useState([]);

  // Dynamic authorization levels: [{ level: 1 }, { level: 3 }, ...]
  const [authLevels, setAuthLevels] = useState([]);
  const [authLevelOptions, setAuthLevelOptions] = useState([]);
  const [loadingAuthLevels, setLoadingAuthLevels] = useState(false);

  // Per-scheme custom form fields: [{ field_key, label, type, required, options }]
  const [customFormFields, setCustomFormFields] = useState([]);

  const [profileDocumentTypes, setProfileDocumentTypes] = useState([]);
  const [loadingProfileDocumentTypes, setLoadingProfileDocumentTypes] = useState(true);
  const [requiredDocumentLabels, setRequiredDocumentLabels] = useState([]);
  const [selectedProfileDocKeys, setSelectedProfileDocKeys] = useState([]);


  // Fixed gender options per spec: All, Male, Female
  const GENDER_OPTIONS = [
    { label: "All", value: "All" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ];

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

  // Fetch all categories from GET /api/categories (flat list, not department-dependent)
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(CATEGORIES_URL);
      if (response.status === 200) {
        const catData = Array.isArray(response.data) ? response.data : response.data?.categories || response.data?.data || [];
        const categoriesDD = (catData || [])
          .filter((cat) => cat._id)
          .map((cat) => ({
            label: cat.category_display_name || cat.category_name || "Unknown",
            value: cat._id,
          }));
        setCategoryDD(categoriesDD);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Failed to fetch categories.", "error");
      setCategoryDD([]);
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

  // Allowed scheme authorization levels (backend validates to [1, 2, 3, 4] only)
  const ALLOWED_SCHEME_AUTH_LEVELS = [1, 2, 3, 4];

  // Fetch admin roles from GET /api/admin-roles or /api/admin-roles/for-authorization
  const fetchAdminRoles = async () => {
    try {
      setLoadingAuthLevels(true);
      let roles = [];
      try {
        const res = await axios.get(ADMIN_ROLES_URL);
        if (res.status === 200) {
          roles = res.data?.roles || res.data || [];
        }
      } catch (_) {
        const res = await axios.get(ADMIN_ROLES_FOR_AUTHORIZATION_URL);
        if (res.status === 200) roles = res.data?.roles || [];
      }
      const options = (Array.isArray(roles) ? roles : [])
        .filter((r) => ALLOWED_SCHEME_AUTH_LEVELS.includes(r.level))
        .map((role) => ({
          label: `${role.displayName || role.role || "Role"} (Level ${role.level})`,
          value: role.level,
          role: role.role,
          displayName: role.displayName || role.role,
        }));
      if (options.length === 0) {
        setAuthLevelOptions([
          { label: "Super Admin (Level 1)", value: 1 },
          { label: "Admin (Level 2)", value: 2 },
          { label: "DistrictHQ Head (Level 3)", value: 3 },
          { label: "District Overlookers (Level 4)", value: 4 },
        ]);
      } else {
        setAuthLevelOptions(options);
      }
    } catch (error) {
      console.error("Error fetching admin roles:", error);
      showToast("Failed to fetch authorization levels. Using defaults.", "warning");
      setAuthLevelOptions([
        { label: "Super Admin (Level 1)", value: 1 },
        { label: "Admin (Level 2)", value: 2 },
        { label: "DistrictHQ Head (Level 3)", value: 3 },
        { label: "District Overlookers (Level 4)", value: 4 },
      ]);
    } finally {
      setLoadingAuthLevels(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchCategories();
    fetchAdminRoles();
    (async () => {
      setLoadingProfileDocumentTypes(true);
      try {
        const types = await fetchDocumentTypes({ profileOnly: true });
        setProfileDocumentTypes(types);
      } catch {
        showToast("Could not load profile document types.", "error");
      } finally {
        setLoadingProfileDocumentTypes(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isEdit && editSchemeDetails) {
      setRequiredDocumentLabels(getSchemeRequiredDocumentLabels(editSchemeDetails));
      setSelectedProfileDocKeys(getSchemeProfileDocumentKeys(editSchemeDetails));
    }
  }, [isEdit, editSchemeDetails]);

  // Set default department and category when editing
  useEffect(() => {
    if (isEdit && editSchemeDetails && departmentDD.length > 0) {
      const deptId = typeof editSchemeDetails.department === "object"
        ? editSchemeDetails.department?._id
        : editSchemeDetails.department;
      if (deptId) {
        const matchingDept = departmentDD.find((d) => d.value === deptId);
        if (matchingDept) setSelectedDepartment(matchingDept);
      }
    }
    if (isEdit && editSchemeDetails && categoryDD.length > 0) {
      const catId = typeof editSchemeDetails.category === "object"
        ? editSchemeDetails.category?._id
        : editSchemeDetails.category;
      if (catId) {
        const matchingCat = categoryDD.find((c) => c.value === catId);
        if (matchingCat) setSelectedCategory(matchingCat);
      }
    }
  }, [isEdit, editSchemeDetails, departmentDD, categoryDD]);

  // Set default authorization levels (dynamic)
  useEffect(() => {
    if (authLevelOptions.length === 0) return;
    if (isEdit && editSchemeDetails?.authorization_levels && Array.isArray(editSchemeDetails.authorization_levels)) {
      const LEGACY_MAP = { 6: 3, 7: 4 }; // Backend migration: 6→3, 7→4
      const ALLOWED = [1, 2, 3, 4];
      const levels = editSchemeDetails.authorization_levels
        .map((l) => (LEGACY_MAP[l] !== undefined ? LEGACY_MAP[l] : l))
        .filter((l) => ALLOWED.includes(l))
        .map((level) => ({ level }));
      setAuthLevels(levels);
    }
    // For new schemes: start with empty (user can add levels or use "Start with 1 level")
  }, [isEdit, editSchemeDetails?.authorization_levels, authLevelOptions.length]);

  // Set default custom form fields when editing
  useEffect(() => {
    if (isEdit && editSchemeDetails?.custom_form_fields && Array.isArray(editSchemeDetails.custom_form_fields)) {
      const fields = editSchemeDetails.custom_form_fields.map((f) => ({
        title: f.title || f.label || "",
        field_key: f.field_key || "",
        type: f.type || f.field_type || "text",
        field_type: f.field_type || f.type || "text",
        required: !!f.required,
        options: f.options || "",
        depends_on: f.depends_on && f.depends_on.field_key ? f.depends_on : null,
      }));
      setCustomFormFields(fields);
    }
  }, [isEdit, editSchemeDetails?.custom_form_fields]);

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

  const defaultValues = {
    scheme_id: !isEdit ? "" : editSchemeDetails?._id || editSchemeDetails?.scheme_id,
    scheme_name: !isEdit ? "" : editSchemeDetails?.scheme_name,
    scheme_date: !isEdit
      ? ""
      : formatDateForInput(editSchemeDetails?.scheme_date),
    gender_id: !isEdit
      ? ""
      : (GENDER_OPTIONS.find((g) => g.value === (editSchemeDetails?.gender || editSchemeDetails?.gender_name)) || { label: "All", value: "All" }),
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
    scheme_eligibility_custom_criteria: !isEdit
      ? []
      : (Array.isArray(editSchemeDetails?.scheme_eligibility?.custom_fields)
          ? editSchemeDetails.scheme_eligibility.custom_fields.map((f) => f.title || f.label || f.field_key || "").filter(Boolean)
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

  // Set default gender when editing
  useEffect(() => {
    if (isEdit && editSchemeDetails?.gender && GENDER_OPTIONS.length > 0) {
      const genderVal = editSchemeDetails.gender || editSchemeDetails.gender_name || "All";
      const match = GENDER_OPTIONS.find((g) => g.value === genderVal);
      if (match) setSelectedGender(match);
    }
  }, [isEdit, editSchemeDetails?.gender]);

  // Set default department and category when editing (must be after useForm)
  useEffect(() => {
    if (isEdit && editSchemeDetails?.department && departmentDD.length > 0) {
      const deptId = typeof editSchemeDetails.department === "object" ? editSchemeDetails.department?._id : editSchemeDetails.department;
      const deptOption = departmentDD.find(d => d.value === deptId);
      if (deptOption) {
        setSelectedDepartment(deptOption);
        setValue("department", deptOption);
      }
    }
  }, [isEdit, editSchemeDetails?.department, departmentDD, setValue]);

  // Set default category when editing and categories are loaded (must be after useForm)
  useEffect(() => {
    if (isEdit && editSchemeDetails?.category && categoryDD.length > 0) {
      const catId = typeof editSchemeDetails.category === "object" ? editSchemeDetails.category?._id : editSchemeDetails.category;
      const catOption = categoryDD.find(c => c.value === catId);
      if (catOption) {
        setSelectedCategory(catOption);
        setValue("category", catOption);
      }
    }
  }, [isEdit, editSchemeDetails?.category, categoryDD, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsFormSubmitting(true);
      
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

      // Build authorization_levels from dynamic list - only [1, 2, 3, 4] allowed
      const ALLOWED_LEVELS = [1, 2, 3, 4];
      const authorization_levels = authLevels
        .map((item) => (item?.level != null && !isNaN(item.level) ? item.level : null))
        .filter((l) => l !== null && ALLOWED_LEVELS.includes(l));

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

      // Gender: All, Male, or Female
      const genderString = selectedGender?.value || selectedGender?.label || "All";

      // Get arrays directly from form data (ArrayInput already provides arrays)
      const scheme_objectives = Array.isArray(data?.scheme_objectives) 
        ? data.scheme_objectives.filter(item => item && item.trim() !== "")
        : [];
      const scheme_benefits = Array.isArray(data?.scheme_benefits)
        ? data.scheme_benefits.filter(item => item && item.trim() !== "")
        : [];
      const scheme_required_document_types = Array.isArray(requiredDocumentLabels)
        ? requiredDocumentLabels.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const scheme_profile_document_types = Array.isArray(selectedProfileDocKeys)
        ? selectedProfileDocKeys.filter((k) => k && String(k).trim())
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
      if (
        scheme_required_document_types.length === 0 &&
        scheme_profile_document_types.length === 0
      ) {
        showToast(
          "Please add at least one required document (custom text and/or profile pre-fill).",
          "error"
        );
        setIsFormSubmitting(false);
        return;
      }

      const overlap = findProfileDocumentOverlap(
        scheme_required_document_types,
        scheme_profile_document_types,
        profileDocumentTypes
      );
      if (overlap.length > 0) {
        showToast(
          `Move profile documents to the profile section instead of the text list: ${overlap.join(", ")}`,
          "error"
        );
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

      // Build eligibility custom_fields (informative text only)
      const deriveFieldKey = (t) =>
        (t || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      const criteriaStrings = Array.isArray(data?.scheme_eligibility_custom_criteria)
        ? data.scheme_eligibility_custom_criteria.filter((s) => s && String(s).trim())
        : [];
      const eligibilityCustomFieldsPayload = criteriaStrings.map((text) => {
        const title = String(text).trim();
        return {
          title,
          field_key: deriveFieldKey(title),
          field_type: "text",
          required: false,
        };
      });

      // Format scheme_date to ISO string if provided
      let schemeDateISO = null;
      if (data?.scheme_date) {
        const date = new Date(data.scheme_date);
        if (!isNaN(date.getTime())) {
          schemeDateISO = date.toISOString();
        }
      }

      // Build custom_form_fields: use title, optional field_key (backend derives from title if omitted)
      const custom_form_fields = (customFormFields || [])
        .filter((f) => f && (f.title || f.label))
        .map((f) => {
          const title = (f.title || f.label || "").trim();
          const fieldKey = (f.field_key || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
            || deriveFieldKey(title);
          const base = {
            title,
            field_type: f.type || f.field_type || "text",
            required: !!f.required,
          };
          if (fieldKey) base.field_key = fieldKey;
          if ((f.type || f.field_type) === "select" && f.options) base.options = String(f.options).trim();
          if (f.depends_on && f.depends_on.field_key) {
            base.depends_on = {
              field_key: f.depends_on.field_key,
              value: f.depends_on.value,
            };
          }
          return base;
        });

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
          ...(eligibilityCustomFieldsPayload.length > 0 && { custom_fields: eligibilityCustomFieldsPayload }),
        },
        scheme_required_document_types: scheme_required_document_types,
        scheme_profile_document_types: scheme_profile_document_types,
        scheme_required_documents: [],
        excluded_schemes: excludedSchemeIds, // Array of ObjectId strings
        authorization_levels, // Array of numbers (max 4) - included for both new and edit
        custom_form_fields, // Per-scheme form field definitions
        ...(!isEdit && { 
          approval_status: "pending_department_head_approval" // For new schemes only
        }),
      };

      // console.log("sendDataObj inside onSubmit()", sendDataObj);

      let response = "";

      const ok = await confirm({
        title: isEdit ? "Update scheme?" : "Create new scheme?",
        description: isEdit
          ? "This will update the scheme details for all users. Continue?"
          : "This will create a new scheme and send it for approval. Continue?",
        confirmText: isEdit ? "Yes, update" : "Yes, create",
        cancelText: "Cancel",
        tone: "neutral",
      });
      if (!ok) {
        setIsFormSubmitting(false);
        return;
      }

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

        console.log("Updating scheme with data:", {
          _id: sendDataObj._id,
          scheme_id: sendDataObj.scheme_id,
          scheme_name: sendDataObj.scheme_name,
          authorization_levels: sendDataObj.authorization_levels,
        });

        response = await axios.post(`${SCHEMES_CONFIG_URL}/update`, sendDataObj);
      }

      // console.log("Schemes Config Post Call Response", response);

      if (response.status === 200 || response.status === 201) {
        if (!isEdit) {
          showToast("Scheme created successfully. Pending approval.", "success");
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
      setSelectedExcludedSchemeIds([]);
      if (!isEdit) {
        setAuthLevels([]);
        setCustomFormFields([]);
        setRequiredDocumentLabels([]);
        setSelectedProfileDocKeys([]);
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
          const code = errorData.code || errorData.error;
          if (code === "NO_REQUIRED_DOCUMENTS") {
            errorMessage =
              errorData.message ||
              "Add at least one required document (custom text and/or profile pre-fill).";
          } else if (code === "INVALID_PROFILE_DOCUMENT_TYPE") {
            const invalid =
              errorData.invalid_keys ??
              errorData.invalidKeys ??
              errorData.invalid_types;
            errorMessage = Array.isArray(invalid) && invalid.length
              ? `Invalid profile document type(s): ${invalid.join(", ")}. Use profile catalog keys only.`
              : errorData.message ||
                "Invalid profile document type. Use keys from the profile document catalog.";
          } else {
            const unknown = errorData.unknown_types ?? errorData.unknownTypes;
            if (Array.isArray(unknown) && unknown.length) {
              errorMessage = `Unknown document type(s): ${unknown.join(", ")}`;
            } else {
              errorMessage = `Validation Error (422): ${errorMessage}`;
            }
          }
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

  const enrichedDocsForEdit =
    isEdit &&
    getSchemeRequiredDocumentsDisplay(
      editSchemeDetails,
      Object.fromEntries(profileDocumentTypes.map((t) => [t.key, t]))
    );

  const renderSchemeImageUpload = () => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <button
        type="button"
        onClick={() => {
          document.body.click();
          setTimeout(() => setShowSchemeDz(true), 100);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:border-[#d85a30] hover:text-[#d85a30] transition-colors"
      >
        <BsUpload size={14} />
        {docScheme !== null ? "Change image" : "Upload image"}
      </button>
      {docScheme !== null && (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="truncate max-w-[200px]">{docScheme[0]?.name}</span>
          <button
            type="button"
            onClick={() => setDocScheme(null)}
            className="rounded p-1 text-red-600 hover:bg-red-50"
            aria-label="Remove selected image"
          >
            <RxCross2 />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section className="pb-8">
      <HeadingAndButton
        title={isEdit ? "Edit Scheme" : "Create Scheme"}
        buttonText="Back to list"
        buttonIcon={IoChevronBack}
        onButtonClick={() => setCurrentPage(!currentPage)}
      />

      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Complete each section below. Required fields are marked on the inputs.
      </p>

      <form
        className="w-full space-y-5"
        onSubmit={handleSubmit(onSubmit, (err) => {
          const first = Object.values(err)[0];
          showToast(first?.message || "Please fix the form errors before submitting.", "error");
        })}
      >
          <SchemeFormSection
            step={1}
            title="Scheme details"
            description="Name, classification, and cover image for this welfare scheme."
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
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
              placeholder={loadingCategories ? "Loading..." : "Select category"}
              isDisabled={loadingCategories}
              />

              <Dropdown
                defaultName="gender_id"
                register={register}
                labelname="Gender"
                required={true}
                pattern={false}
                errors={errors}
                classes="rounded-lg text-sm w-full z-40 cursor-pointer"
                setError={setError}
                clearError={clearErrors}
                onChangeInput={null}
                control={control}
                data={GENDER_OPTIONS}
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
            </div>

            <SchemeFormSubBlock
              title="Scheme image"
              hint="Required for new schemes. Shown on the public schemes list."
              className="mt-5"
            >
              {!isEdit ? (
                renderSchemeImageUpload()
              ) : editSchemeDeleteImagePath ? (
                <div className="space-y-3">
                  <img
                    src={displayMedia(editSchemeDeleteImagePath)}
                    alt="Scheme cover"
                    className="h-48 w-full max-w-md object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => onClickDeleteImage(defaultValues?.scheme_id)}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                renderSchemeImageUpload()
              )}
            </SchemeFormSubBlock>
          </SchemeFormSection>

          <SchemeFormSection
            step={2}
            title="Objectives & benefits"
            description="What this scheme aims to achieve and what applicants receive."
          >
            <div className="space-y-5">
              <SchemeFormSubBlock
                title="Objectives"
                hint="Add at least one. Press Add for more rows."
              >
                <ArrayInput
                  defaultName="scheme_objectives"
                  register={register}
                  name="Scheme Objectives"
                  required={true}
                  errors={errors}
                  setValue={setValue}
                  data={
                    !isEdit
                      ? []
                      : Array.isArray(editSchemeDetails?.scheme_objectives)
                        ? editSchemeDetails.scheme_objectives
                        : []
                  }
                  placeholder="Enter objective"
                />
              </SchemeFormSubBlock>
              <SchemeFormSubBlock
                title="Benefits"
                hint="Add at least one. Press Add for more rows."
              >
                <ArrayInput
                  defaultName="scheme_benefits"
                  register={register}
                  name="Scheme Benefits"
                  required={true}
                  errors={errors}
                  setValue={setValue}
                  data={
                    !isEdit
                      ? []
                      : Array.isArray(editSchemeDetails?.scheme_benefits)
                        ? editSchemeDetails.scheme_benefits
                        : []
                  }
                  placeholder="Enter benefit"
                />
              </SchemeFormSubBlock>
            </div>
          </SchemeFormSection>

          <SchemeFormSection
            step={3}
            title="Eligibility"
            description="Age limits and any extra criteria shown to applicants."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-5">
              <Input
                defaultName="scheme_eligibility_lower_age_limit"
                register={register}
                name="Minimum age"
                required={true}
                pattern={null}
                errors={errors}
                placeholder="e.g. 18"
                setError={setError}
                clearError={clearErrors}
                autoComplete="off"
                type="number"
                classes="px-3 py-2 text-sm w-full rounded"
                onChangeInput={null}
                defaultValue={defaultValues.scheme_eligibility_lower_age_limit}
                setValue={setValue}
              />
              <Input
                defaultName="scheme_eligibility_upper_age_limit"
                register={register}
                name="Maximum age"
                required={true}
                pattern={null}
                errors={errors}
                placeholder="e.g. 60"
                setError={setError}
                clearError={clearErrors}
                autoComplete="off"
                type="number"
                classes="px-3 py-2 text-sm w-full rounded"
                onChangeInput={null}
                defaultValue={defaultValues.scheme_eligibility_upper_age_limit}
                setValue={setValue}
              />
            </div>
            <SchemeFormSubBlock
              title="Extra eligibility notes"
              hint="Optional bullet points shown on the scheme page (e.g. must have ration card)."
            >
              <ArrayInput
                defaultName="scheme_eligibility_custom_criteria"
                register={register}
                name="Eligibility criteria"
                required={false}
                errors={errors}
                setValue={setValue}
                data={
                  !isEdit
                    ? []
                    : Array.isArray(editSchemeDetails?.scheme_eligibility?.custom_fields)
                      ? editSchemeDetails.scheme_eligibility.custom_fields
                          .map((f) => f.title || f.label || f.field_key || "")
                          .filter(Boolean)
                      : []
                }
                placeholder="e.g. Must have ration card"
              />
            </SchemeFormSubBlock>
          </SchemeFormSection>

          <SchemeFormSection
            step={4}
            title="Required documents"
            description="At least one custom upload or profile pre-fill document is required."
          >
            {isEdit && editSchemeDetails?.uses_legacy_document_format && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                Legacy format detected — re-save to split custom uploads and profile pre-fill.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SchemeFormSubBlock
                title="Custom uploads"
                hint="Applicants upload these for every application."
              >
                <CustomSchemeDocumentsInput
                  documents={requiredDocumentLabels}
                  onChange={setRequiredDocumentLabels}
                  disabled={isFormSubmitting}
                  placeholder="e.g. UDID Certificate"
                />
              </SchemeFormSubBlock>
              <SchemeFormSubBlock
                title="Profile pre-fill"
                hint="Loaded automatically from the applicant's profile."
              >
                <ProfileDocumentTypeMultiSelect
                  documentTypes={profileDocumentTypes}
                  selectedKeys={selectedProfileDocKeys}
                  onChange={setSelectedProfileDocKeys}
                  disabled={isFormSubmitting}
                  loading={loadingProfileDocumentTypes}
                />
              </SchemeFormSubBlock>
            </div>

            {enrichedDocsForEdit?.length > 0 && (
              <div className="mt-4">
                <RequiredDocumentsEnrichedList
                  variant="summary"
                  title="Saved documents on this scheme"
                  documents={enrichedDocsForEdit}
                />
              </div>
            )}
          </SchemeFormSection>

          <SchemeFormSection
            step={5}
            title="Application questions"
            description="Extra fields applicants fill when applying (income, yes/no questions, etc.)."
          >
            <CustomFormFieldsSelector
              fields={customFormFields}
              onChange={setCustomFormFields}
              disabled={isFormSubmitting}
              title=""
              description=""
              emptyHint="Add questions like annual income, disability status, or ration card number."
            />
          </SchemeFormSection>

          <SchemeFormSection
            step={6}
            title="Workflow & advanced"
            description="Approval routing and scheme exclusions."
            optional
          >
            <div className="space-y-5">
              <SchemeFormSubBlock
                title="Excluded schemes"
                hint="Applicants who already receive these schemes may be blocked."
              >
                <ExcludedSchemesSelector
                  selectedSchemeIds={selectedExcludedSchemeIds}
                  onChange={setSelectedExcludedSchemeIds}
                  currentSchemeId={
                    isEdit ? editSchemeDetails?._id || editSchemeDetails?.scheme_id : null
                  }
                />
              </SchemeFormSubBlock>
              <SchemeFormSubBlock
                title="Authorization levels"
                hint="Who must approve applications for this scheme."
              >
                <DynamicAuthLevelsSelector
                  levels={authLevels}
                  options={authLevelOptions}
                  onChange={setAuthLevels}
                  onAddLevel={() => setAuthLevels([...authLevels, { level: null }])}
                  onRemoveLevel={(index) =>
                    setAuthLevels(authLevels.filter((_, i) => i !== index))
                  }
                  onClearAll={() => setAuthLevels([])}
                  onStartWithDefault={() => {
                    const first = authLevelOptions[0];
                    if (first) setAuthLevels([{ level: first.value }]);
                  }}
                  loading={loadingAuthLevels}
                  disabled={isFormSubmitting}
                  showPreview={true}
                />
              </SchemeFormSubBlock>
            </div>
          </SchemeFormSection>

          {showSchemeDz && (
            <GenericModal
              open={showSchemeDz}
              setOpen={setShowSchemeDz}
              title="Upload scheme photo"
              isAdd={true}
            >
              <DocDropzone
                onChange={setDocScheme}
                multiple={false}
                setShowDropzone={setShowSchemeDz}
              />
            </GenericModal>
          )}

          <div className="sticky bottom-0 z-10 -mx-1 px-1 pt-2 pb-1 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent">
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-md">
              <button
                type="button"
                onClick={() => setCurrentPage(!currentPage)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isFormSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#d85a30] text-white text-sm font-semibold hover:bg-[#ffb766] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isFormSubmitting ? (
                  <>
                    <Spinner />
                    {isEdit ? "Updating…" : "Creating…"}
                  </>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Create scheme"
                )}
              </button>
            </div>
          </div>
        </form>
    </section>
  );
};

export default AddSchemeForm;
