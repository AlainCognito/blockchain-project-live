import React, { useState } from "react";
import { ethers } from "ethers";
// Use the Exchange artifact instead of Token.
import ExchangeArtifact from "../contracts/Exchange.json";
import contractAddress from "../contracts/contract-address.json";

export function ExchangeTokens({ provider, selectedAddress }) {
    const [ethAmount, setEthAmount] = useState("");
    const [sellTokenAmount, setSellTokenAmount] = useState("");
    const [txBeingSent, setTxBeingSent] = useState("");

    // Function to buy tokens from the exchange.
    async function buy() {
        if (!provider || !selectedAddress) return;
        try {
            const signer = provider.getSigner();
            const exchangeContract = new ethers.Contract(
                contractAddress.Exchange,
                ExchangeArtifact.abi,
                signer
            );
            // Convert ETH amount to wei.
            const value = ethers.utils.parseEther(ethAmount.toString());
            const tx = await exchangeContract.buyTokens({ value });
            setTxBeingSent(tx.hash);
            await tx.wait();
            setTxBeingSent("");
            alert("Tokens purchased successfully!");
        } catch (error) {
            console.error("Error buying tokens:", error);
            alert("Error buying tokens. See console for details.");
        }
    }

    // Function to sell tokens via the exchange.
    async function sell() {
        if (!provider || !selectedAddress) return;
        try {
            const signer = provider.getSigner();
            const exchangeContract = new ethers.Contract(
                contractAddress.Exchange,
                ExchangeArtifact.abi,
                signer
            );
            // Note: Since Token decimails are 0 (integer amounts), we use parseUnits without decimals.
            const amountToSell = ethers.utils.parseUnits(sellTokenAmount.toString(), 0);
            const tx = await exchangeContract.sellTokens(amountToSell);
            setTxBeingSent(tx.hash);
            await tx.wait();
            setTxBeingSent("");
            alert("Tokens sold successfully!");
        } catch (error) {
            console.error("Error selling tokens:", error);
            alert("Error selling tokens. See console for details.");
        }
    }

    return (
        <div className="container p-4">
            <h3>Buy JFP Tokens</h3>
            <div className="mb-3">
                <input
                    type="number"
                    placeholder="ETH amount"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    className="form-control"
                />
            </div>
            <button onClick={buy} className="btn btn-primary">
                Buy Tokens
            </button>
            <hr />

            <h3>Sell JFP Tokens</h3>
            <div className="mb-3">
                <input
                    type="number"
                    placeholder="Token amount to sell"
                    value={sellTokenAmount}
                    onChange={(e) => setSellTokenAmount(e.target.value)}
                    className="form-control"
                />
            </div>
            <button onClick={sell} className="btn btn-warning">
                Sell Tokens
            </button>

            {txBeingSent && (
                <p>
                    Transaction sent:{" "}
                    <a
                        href={`https://etherscan.io/tx/${txBeingSent}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {txBeingSent}
                    </a>
                </p>
            )}
        </div>
    );
}