import React from "react";
import { Link } from "react-router-dom";

export function NoWalletDetected() {
  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-6 p-4 text-center">
          <p>
            No Ethereum wallet was detected. <br />
            Please install{" "}
            <a
              href="https://www.coinbase.com/wallet"
              target="_blank"
              rel="noopener noreferrer"
            >
              Coinbase Wallet
            </a>
            or{" "}
            <a href="http://metamask.io" target="_blank" rel="noopener noreferrer">
              MetaMask
            </a>
            .
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Link to="/help" className="btn btn-link">
          Need help?
        </Link>
      </div>
    </div>
  );
}
