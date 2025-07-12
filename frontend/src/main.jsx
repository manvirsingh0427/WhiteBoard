import React from "react";
import ReactDOM from "react-dom/client"; // ← use this for createRoot
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
// import Toastify styles (after fixing toastify setup)
import "react-toastify/dist/ReactToastify.css";

// React 18+ way:
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <App />
  </Router>
);
