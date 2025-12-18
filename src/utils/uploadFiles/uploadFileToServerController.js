//Currently there's an issue when the server tries to read the folder name we are sending from here.
//So it is statically coded in the server code to be uploaded in public -> uploads -> admin-uploads folder

import axios from "../../api/axios";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

export const uploadFileToServer = async (file, folderName) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folderName", folderName);

  // for (const [key, value] of formData.entries()) {
  //   console.log("formData", `${key}: ${value}`);
  // }

  try {
    const response = await axios.post(
      `${BASE_URL}upload/filetoserver`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // This tells Axios to send the form data correctly
        },
        withCredentials: true, // Include cookies for authentication if needed
      }
    );

    return response?.data?.filePath; // Access the file path from the response
  } catch (error) {
    console.error(
      "Error uploading file to server:",
      error.response?.data || error.message
    );
    return null;
  }
};

export const displayMedia = (filePath) => {
  // Construct the full URL using the BASE_URL environment variable
  return `${BASE_URL}${filePath}`; // Full URL to the file
};

export const originalFilename = (filePath) => {
  // Returns the original file name that was there before the addition of timestamp in the name to uniquely identify it
  return `${filePath
    .split("/")
    .pop()
    .replace(/-\d+.*?(?=\.\w+$)/, "")}`; // Full URL to the file
};
