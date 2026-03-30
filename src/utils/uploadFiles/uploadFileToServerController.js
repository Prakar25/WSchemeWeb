//Currently there's an issue when the server tries to read the folder name we are sending from here.
//So it is statically coded in the server code to be uploaded in public -> uploads -> admin-uploads folder

import axios from "../../api/axios";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

const stripTrailingSlash = (s) => String(s || "").replace(/\/$/, "");

/** Static uploads live on the API host root (e.g. /public/uploads), not under /api. */
const stripApiSuffix = (s) => stripTrailingSlash(s).replace(/\/api$/i, "");

// Base URL for document/media view links (no trailing slash). Prefer explicit media env; otherwise
// fall through to API URL and strip a trailing `/api` so static paths are /public/uploads/… not /api/public/…
const getMediaBaseUrl = () => {
  const isDev = import.meta.env.VITE_NODE_ENV === "development";
  const base =
    (isDev
      ? import.meta.env.VITE_MEDIA_ENDPOINT_URL ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_ENDPOINT_URL
      : import.meta.env.VITE_MEDIA_ENDPOINT_URL_ONLINE ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_ENDPOINT_URL_ONLINE) || "";
  return stripApiSuffix(stripTrailingSlash(base));
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
 * DB often stores filesystem-relative paths like "public/uploads/...".
 * With express.static("public"), those files are served at "/uploads/..." (no "public" in URL).
 * If we keep "public" in the URL, production returns 404. Optional override: VITE_MEDIA_KEEP_PUBLIC_PREFIX=true
 */
const pathForStaticUrl = (filePath) => {
  const raw = String(filePath).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const keepPublic = import.meta.env.VITE_MEDIA_KEEP_PUBLIC_PREFIX === "true";
  let p = raw.replace(/^\/+/, "");
  if (!keepPublic && /^public\//i.test(p)) {
    p = p.replace(/^public\//i, "");
  }
  return p.startsWith("/") ? p : `/${p}`;
};

/**
 * Build document/view URL for "View" links.
 * Env: VITE_MEDIA_ENDPOINT_URL(_ONLINE) = origin only, no trailing slash (e.g. https://welfareconnect.in).
 */
export const displayMedia = (filePath) => {
  if (!filePath) return "";
  const raw = String(filePath).trim();
  if (/^https?:\/\//i.test(raw)) return raw;

  const baseUrl = getMediaBaseUrl();
  const pathPart = pathForStaticUrl(raw);
  if (!baseUrl) return pathPart;
  return baseUrl.replace(/\/$/, "") + pathPart;
};

export const originalFilename = (filePath) => {
  // Returns the original file name that was there before the addition of timestamp in the name to uniquely identify it
  return `${filePath
    .split("/")
    .pop()
    .replace(/-\d+.*?(?=\.\w+$)/, "")}`; // Full URL to the file
};
