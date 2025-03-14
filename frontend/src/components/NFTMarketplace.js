import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import MyNFTArtifact from "../contracts/MyNFT.json";
import contractAddress from "../contracts/contract-address.json";

export function NFTMarketplace() {
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [myNFTContract, setMyNFTContract] = useState(null);

  // Helper to initialize the contract and get the account
  async function initializeContract() {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        // First check if an account is already connected
        let accounts = await provider.send("eth_accounts", []);
        if (accounts.length === 0) {
          // If not, request connection
          accounts = await provider.send("eth_requestAccounts", []);
        }
        setAccount(accounts[0]);

        const contract = new ethers.Contract(
          contractAddress.MyNFT, // contract address for MyNFT
          MyNFTArtifact.abi, // contract ABI
          provider.getSigner(0)
        );
        setMyNFTContract(contract);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    }
  }

  // Initial load on mount
  useEffect(() => {
    initializeContract();
  }, []);

  // Reload NFTs when the contract (and thereby account) changes
  useEffect(() => {
    if (myNFTContract) {
      loadAllNFTs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myNFTContract]);

  // Listen for account changes and auto-reload the page accordingly
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User has disconnected their account
          setAccount(null);
          setNFTs([]);
        } else {
          // Update account and reinitialize the contract
          setAccount(accounts[0]);
          initializeContract();
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      // Cleanup on unmount
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
        }
      };
    }
  }, []);

  async function loadAllNFTs() {
    setLoading(true);
    try {
      // Query all mint events (Transfer from the zero address)
      const mintFilter = myNFTContract.filters.Transfer(
        "0x0000000000000000000000000000000000000000"
      );
      const mintEvents = await myNFTContract.queryFilter(mintFilter);

      // Extract unique token IDs from these events
      const tokenIdsSet = new Set();
      mintEvents.forEach((event) => {
        tokenIdsSet.add(event.args.tokenId.toString());
      });
      const tokenIds = Array.from(tokenIdsSet);

      const items = [];
      for (const tokenId of tokenIds) {
        try {
          const owner = await myNFTContract.ownerOf(tokenId);
          const tokenURI = await myNFTContract.tokenURI(tokenId);
          let metadata = {};
          try {
            const res = await fetch(tokenURI);
            metadata = await res.json();
          } catch (err) {
            console.error(`Error fetching metadata for token ${tokenId}:`, err);
          }
          items.push({
            tokenId,
            owner,
            tokenURI,
            ...metadata,
          });
        } catch (error) {
          console.error(`Error fetching details for token ${tokenId}:`, error);
        }
      }
      setNFTs(items);
    } catch (error) {
      console.error("Error loading marketplace NFTs:", error);
    }
    setLoading(false);
  }

  if (loading) {
    return <div>Loading NFT Marketplace...</div>;
  }

  if (nfts.length === 0) {
    return (
      <div>
        <div>No NFTs have been minted.</div>
        <Link to="/" className="btn btn-primary">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2>NFT Marketplace</h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              width: "300px",
              boxSizing: "border-box",
            }}
          >
            <h4>{nft.name || `NFT #${nft.tokenId}`}</h4>
            {nft.image && (
              <img
                src={nft.image}
                alt={nft.name || `NFT ${nft.tokenId}`}
                style={{ width: "100%", height: "auto" }}
              />
            )}
            <p>
              Owner:{" "}
              {nft.owner.slice(0, 6) +
                "..." +
                nft.owner.slice(nft.owner.length - 4)}
            </p>
            {account && nft.owner.toLowerCase() !== account.toLowerCase() && (
              <div>
                <button onClick={() => console.log("Bid for", nft.tokenId)}>
                  Place Bid
                </button>
                <button onClick={() => console.log("Buy", nft.tokenId)}>
                  Buy NFT
                </button>
              </div>
            )}
            {account && nft.owner.toLowerCase() === account.toLowerCase() && (
              <p>You own this NFT</p>
            )}
          </div>
        ))}
      </div>
      <br />
      <Link
        to="/"
        state={{
          account: account,
        }}
        className="btn btn-primary"
      >
        Return Home
      </Link>
    </div>
  );
}
