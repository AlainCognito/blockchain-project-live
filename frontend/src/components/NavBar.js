import React from "react";
import { Link } from "react-router-dom";

export function NavBar({ account }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">Home</Link>
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
              <Link className="nav-link" to="/nft-marketplace">
                Marketplace
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/help">
                Help
              </Link>
            </li>
          </ul>
          <span className="navbar-text">
            {account 
              ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
              : "Not Connected"}
          </span>
        </div>
      </div>
    </nav>
  );
}