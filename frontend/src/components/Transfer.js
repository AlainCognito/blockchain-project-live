import React, { useState } from "react";

export function Transfer({ transferTokens, tokenSymbol, className }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const buttonClass = className || "btn btn-secondary";

  return (
    <div>
      <h4
        className="text-secondary"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        Transfer {isExpanded ? "▲" : "▼"}
      </h4>
      {isExpanded && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const to = formData.get("to");
            const amount = formData.get("amount");

            if (to && amount) {
              transferTokens(to, amount);
              event.target.reset();
            }
          }}
        >
          <div className="form-group">
            <label>Amount of {tokenSymbol}</label>
            <input
              className="form-control"
              type="number"
              name="amount"
              placeholder="1"
              required
            />
          </div>
          <div className="form-group">
            <label>Recipient address</label>
            <input className="form-control" type="text" name="to" required />
          </div>
          <div className="form-group">
            <input className={buttonClass} type="submit" value="Transfer" />
          </div>
        </form>
      )}
    </div>
  );
}
