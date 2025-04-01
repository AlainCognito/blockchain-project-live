import React, { useState } from "react";
import { ethers } from "ethers";
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";

export function ExchangeTokens({ provider, selectedAddress }) {
    const [ethAmount, setEthAmount] = useState("");
    const [txBeingSent, setTxBeingSent] = useState();
    const [sellTokenAmount, setSellTokenAmount] = useState("");

    // Function to buy tokens
    async function buy() {
        if (!provider || !selectedAddress) return;
        try {
            // Get signer and create token contract instance.
            const signer = provider.getSigner();
            const tokenContract = new ethers.Contract(contractAddress.Token, TokenArtifact.abi, signer);

            // Convert ETH amount to wei.
            const value = ethers.utils.parseEther(ethAmount.toString());
            const tx = await tokenContract.buyTokens({ value });
            setTxBeingSent(tx.hash);
            await tx.wait();
            setTxBeingSent(undefined);
            alert("Tokens purchased successfully!");
        } catch (error) {
            console.error("Error buying tokens:", error);
            alert("Error buying tokens. See console for details.");
        }
    }

    async function sell() {
        if (!provider || !selectedAddress) return;
        try {
            // Get signer and create token contract instance.
            const signer = provider.getSigner();
            const tokenContract = new ethers.Contract(
                contractAddress.Token,
                TokenArtifact.abi,
                signer
            );

            // Convert token amount to sell into the proper units.
            // Adjust the decimals if your token uses a different value.
            const amountToSell = ethers.utils.parseUnits(sellTokenAmount.toString(), 18);

            // Call the sellTokens function on your contract.
            const tx = await tokenContract.sellTokens(amountToSell);
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