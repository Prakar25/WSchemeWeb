import { toast } from "react-toastify";

const showToast = (message, type) => {
  const options = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
  };
  if (type === "error") {
    toast.error(message, options);
  } else if (type === "success") {
    toast.success(message, options);
  } else if (type === "info") {
    toast.info(message, options);
  } else {
    toast.warn(message, options);
  }
};

export default showToast;
