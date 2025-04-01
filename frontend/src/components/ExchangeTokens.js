import React, { useState } from "react";

export function ExchangeTokens({ onBuy, onSell, onlyBuy }) {
    const [ethAmount, setEthAmount] = useState("");
    const [sellTokenAmount, setSellTokenAmount] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div>
            <h4
                className="text-secondary"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: "pointer" }}
            >
                Exchange JFP Tokens {isExpanded ? "▲" : "▼"}
            </h4>
            {isExpanded && (
                <>
                    <div className="mb-3">
                        <input
                            type="number"
                            placeholder="ETH amount"
                            value={ethAmount}
                            onChange={(e) => setEthAmount(e.target.value)}
                            className="form-control"
                            required
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
                    {!onlyBuy && (
                        <>
                            <hr />
                            <div className="mb-3">
                                <input
                                    type="number"
                                    placeholder="Token amount to sell"
                                    value={sellTokenAmount}
                                    onChange={(e) => setSellTokenAmount(e.target.value)}
                                    className="form-control"
                                    required
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
                        </>
                    )}
                </>
            )}
        </div>
    );
}
