/* eslint-disable no-unused-vars */
import React from "react";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ToastContainer } from "react-toastify";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastContainer />
      <div className="font-roboto">
        <App />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
