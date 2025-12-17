import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_ENDPOINT_URL
    : import.meta.env.VITE_ENDPOINT_URL_ONLINE;

// console.log("BASE_URL", BASE_URL);

export default axios.create({
  baseURL: BASE_URL,
});
