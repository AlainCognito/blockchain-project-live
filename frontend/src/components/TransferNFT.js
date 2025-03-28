import React from "react";

export function TransferNFT({ transferNFT, tokenId }) {
  return (
    <div>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <h4>Transfer NFT</h4>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const to = formData.get("to");
          // tokenId is coming from props, so we use that
          if (to && tokenId) {
            transferNFT(to, tokenId);
          }
        }}
      >
        <div className="form-group">
          <label>Token ID</label>
          <input
            className="form-control"
            type="number"
            name="tokenId"
            value={tokenId || ""}
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Recipient address</label>
          <input className="form-control" type="text" name="to" required />
        </div>
        <div className="form-group">
          <input className="btn btn-secondary" type="submit" value="Transfer" />
        </div>
      </form>
    </div >
  );
}