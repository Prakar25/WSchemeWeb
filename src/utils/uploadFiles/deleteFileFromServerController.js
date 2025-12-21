import axios from "../../api/axios";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

export const deleteFileFromServer = async (filePath) => {
  try {
    const response = await axios.post(`${BASE_URL}/deleteFile`, { filePath });
    return response?.data?.message; // Optional: Handle server response message
  } catch (error) {
    console.error(
      "Error deleting file from server:",
      error.response?.data || error.message
    );
    return null;
  }
};
