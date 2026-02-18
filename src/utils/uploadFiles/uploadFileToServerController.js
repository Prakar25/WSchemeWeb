//Currently there's an issue when the server tries to read the folder name we are sending from here.
//So it is statically coded in the server code to be uploaded in public -> uploads -> admin-uploads folder

import axios from "../../api/axios";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

// Base URL for document/media view links. Use env with no trailing slash, e.g.:
// VITE_MEDIA_ENDPOINT_URL=http://localhost:3000 or VITE_API_URL=http://localhost:3000
const getMediaBaseUrl = () => {
  const url =
    import.meta.env.VITE_NODE_ENV === "development"
      ? import.meta.env.VITE_MEDIA_ENDPOINT_URL ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_ENDPOINT_URL
      : import.meta.env.VITE_MEDIA_ENDPOINT_URL_ONLINE ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_ENDPOINT_URL_ONLINE;
  return (url || "").replace(/\/$/, "");
};

export const uploadFileToServer = async (file, folderName) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folderName", folderName);

  // for (const [key, value] of formData.entries()) {
  //   console.log("formData", `${key}: ${value}`);
  // }

  try {
    const response = await axios.post(
      `${BASE_URL}/upload/filetoserver`,
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

/**
 * Build document/view URL for "View" links.
 * Correct: baseUrl + filePath → e.g. http://localhost:3000/public/uploads/...
 * Wrong: baseUrl with trailing slash + filePath with leading slash → //public/... → "Route not found"
 * Env: set VITE_MEDIA_ENDPOINT_URL or VITE_API_URL with no trailing slash.
 */
export const displayMedia = (filePath) => {
  if (!filePath) return "";
  const baseUrl = getMediaBaseUrl();
  if (!baseUrl) return String(filePath).startsWith("/") ? filePath : `/${filePath}`;
  // documentUrl = baseUrl + filePath (filePath usually has leading slash from backend)
  return baseUrl + (String(filePath).startsWith("/") ? filePath : `/${filePath}`);
};

export const originalFilename = (filePath) => {
  // Returns the original file name that was there before the addition of timestamp in the name to uniquely identify it
  return `${filePath
    .split("/")
    .pop()
    .replace(/-\d+.*?(?=\.\w+$)/, "")}`; // Full URL to the file
};
