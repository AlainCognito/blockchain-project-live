import React, { useState } from "react";
import { ethers } from "ethers";

export function CreateWallet() {
  const [wallet, setWallet] = useState(null);
  const [message, setMessage] = useState("");

  const handleGenerateWallet = async () => {
    // Create a random wallet
    const newWallet = ethers.Wallet.createRandom();
    setWallet(newWallet);
    setMessage("Wallet created. Funding in progress...");
    // If a funding function is provided, call it
    // if (fundWallet) {
    //   try {
    //     await fundWallet(newWallet.address);
    //     setMessage("Funding complete: 1000 ETH and MHT tokens sent!");
    //   } catch (error) {
    //     console.error(error);
    //     setMessage("Error funding wallet");
    //   }
    // }
  };

  return (
    <div className="container p-4">
      <h2>Generate a New Wallet</h2>
      <button className="btn btn-primary" onClick={handleGenerateWallet}>
        Generate Wallet
      </button>
      {wallet && (
        <div className="mt-3">
          <p>
            <strong>Address:</strong> {wallet.address}
          </p>
          <p>
            <strong>Private Key:</strong> {wallet.privateKey}
          </p>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}
