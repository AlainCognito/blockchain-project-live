import React from "react";
import { Link } from "react-router-dom";
import HardhatLogo from "../assets/Hardhat.svg"; // adjust path if needed

export function NavBar({ account }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={HardhatLogo}
            alt="Logo"
            style={{ height: "40px", marginRight: "8px" }}
          />
          Home
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${!account ? "disabled" : ""}`}
                to={account ? "/nft-marketplace" : "#"}
                onClick={(e) => {
                  if (!account) {
                    e.preventDefault();
                  }
                }}
              >
                NFTZone
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/help">
                Help
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/price-chart">
                Dashboard
              </Link>
            </li>
          </ul>
          <span
            className="navbar-text text-dark bg-warning fw-bold"
            style={{
              position: "absolute",
              right: "5px",
              top: "0",
              bottom: "0",
              display: "flex",
              alignItems: "center",
              paddingLeft: "20px",
              paddingRight: "20px",
              borderRadius: "15px"
            }}
          >
            {account
              ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
              : "Not Connected"}
          </span>
        </div>
      </div>
    </nav>
  );
}