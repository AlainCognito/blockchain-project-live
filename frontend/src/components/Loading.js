import React from "react";
import { Link } from "react-router-dom";

export const Loading = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <div
        className="spinner-border text-warning"
        role="status"
        style={{ width: "4rem", height: "4rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="mt-3">
        <Link
          to="/help"
          className="text-secondary"
          onMouseEnter={(e) => (e.target.style.color = "blue")}
          onMouseLeave={(e) => (e.target.style.color = "")}
        >
          Need help?
        </Link>
      </div>
    </div>
  );
};
