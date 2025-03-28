import React from "react";
import { Link } from "react-router-dom";
import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="row justify-content-md-center w-100">
        <div className="col-12 text-center">
          {networkError && (
            <NetworkErrorMessage message={networkError} dismiss={dismiss} />
          )}
        </div>
        <div className="col-6 p-4 text-center">
          <p>Please connect to your wallet.</p>
          <button
            className="btn btn-warning"
            type="button"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
          <div className="mt-3">
            <Link to="/help" className="btn btn-link-warning">
              Need help?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
