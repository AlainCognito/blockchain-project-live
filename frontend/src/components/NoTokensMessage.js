import React from "react";

export function NoTokensMessage({ selectedAddress }) {
  return (
    <>
      <p>You don't have tokens to transfer</p>
      <p>
        To get some tokens, contact support and ask nicely or buy some with ETH :
        <br />
      </p>
    </>
  );
}
