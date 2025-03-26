import React from "react";
import { Link } from "react-router-dom";
import urlData from "../contracts/url.json";

export const Help = () => {
  return (
    <div className="container p-4">
      <h1>How to Configure Your MetaMask wallet</h1>
      <p>
        To interact with our decentralized application, you must connect your
        MetaMask wallet to our custom network.
      </p>
      <h2>Steps to Set Up MetaMask</h2>
      <ol>
        <li>
          <strong>Install MetaMask:</strong> If you haven&apos;t already,
          install the MetaMask extension in your browser.
          <br /> See:{" "}
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            metamask.io
          </a>
        </li>
        <li>
          <strong>Add a new network:</strong>
          <ol>
            <li>Open MetaMask and click on the network dropdown at the top.</li>
            <li>
              Select <em>Add Network</em> or <em>Custom RPC</em>.
            </li>
            <li>
              In the <em>New Network</em> form, enter the following RPC URL:
              <br />
              <code>{urlData.public_url}</code>
            </li>
            <li>
              Fill in any additional required fields (Chain ID{" "}
              <code>31337</code>, Symbol, etc.) if provided by your network
              administrator.
            </li>
            <li>Save the network.</li>
          </ol>
        </li>
        <li>
          <strong>Connect your wallet:</strong> After adding the network, click
          on the "<em>Connect Wallet</em>" button on homepage.
        </li>
      </ol>
      <p>
        If you need further help, please consult the documentation or contact
        support.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Home
      </Link>
    </div>
  );
};
