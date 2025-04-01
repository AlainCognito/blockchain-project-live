import React, { useState } from "react";

export function ExchangeTokens({ onBuy, onSell }) {
    const [ethAmount, setEthAmount] = useState("");
    const [sellTokenAmount, setSellTokenAmount] = useState("");

    return (
        <div>
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
            <button
                onClick={() => {
                    onBuy(ethAmount);
                    setEthAmount("");
                }}
                className="btn btn-success"
            >
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
            <button
                onClick={() => {
                    onSell(sellTokenAmount);
                    setSellTokenAmount("");
                }}
                className="btn btn-danger"
            >
                Sell Tokens
            </button>
        </div>
    );
}