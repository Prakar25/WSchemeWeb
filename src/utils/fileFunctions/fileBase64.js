/**
 * Converts a file to a base64-encoded string.
 * @param {File} file - The file to be converted to base64.
 * @param {Function} cb - Callback function that receives the base64 string.
 */
export const getBase64 = (file, cb) => {
  if (!file) {
    console.error("No file provided.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    cb(reader.result);
  };

  reader.onerror = function (error) {
    console.error("Error occurred while reading the file: ", error);
  };

  reader.readAsDataURL(file);
};

/**
 * Converts a base64-encoded string to a File object.
 * @param {string} dataurl - The base64-encoded string.
 * @param {string} filename - The name of the file to be created.
 * @returns {File|null} - Returns a File object if successful, otherwise returns null.
 */
export const dataURLtoFile = (dataurl, filename) => {
  try {
    if (!dataurl) {
      console.error("No data URL provided.");
      return null;
    }

    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    const n = bstr.length;
    let u8arr = new Uint8Array(n);

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error("Error occurred while converting data URL to file: ", error);
    return null;
  }
};

/**
 * Checks if the provided file is a PDF.
 * @param {File} file - The file to be checked.
 * @returns {boolean} - Returns true if the file is a PDF, otherwise returns false.
 */
export const isPdf = (file) => {
  // console.log("file", file);
  if (!file || !file.type) {
    console.error("Invalid file provided.");
    return false;
  }

  return file.type === "application/pdf";
};

export const base64ToImageBlob = (data) => {
  // Extract the base64 data without the prefix
  const base64WithoutPrefix = data.split(",")[1]; // This works for any base64 data with a prefix

  const bytes = atob(base64WithoutPrefix);
  const length = bytes.length;
  const out = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    out[i] = bytes.charCodeAt(i);
  }

  // Extract the image type from the base64 prefix
  const prefix = data.split(",")[0];
  const typeMatch = prefix.match(/:(.*?);/);
  const mimeType = typeMatch ? typeMatch[1] : "image/png"; // Default to "image/png" if type is not found

  return new Blob([out], { type: mimeType });
};
