import React, { useState, useEffect } from "react";

export function NFTGallery({ myNFTContract, account, onSelectNFT, onNFTCountUpdate }) {
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (myNFTContract && account) {
      loadNFTs();
    }
  }, [myNFTContract, account]);

  async function loadNFTs() {
    setLoading(true);
    try {
      // Query Transfer events where the recipient is the connected account
      const transferEvents = await myNFTContract.queryFilter(
        myNFTContract.filters.Transfer(null, account)
      );

      // Extract unique token IDs from the events
      const tokenIdsSet = new Set();
      transferEvents.forEach((event) => {
        tokenIdsSet.add(event.args.tokenId.toString());
      });
      const tokenIds = Array.from(tokenIdsSet);

      const items = [];
      for (const tokenId of tokenIds) {
        let owner;
        try {
          owner = await myNFTContract.ownerOf(tokenId);
        } catch (err) {
          console.error("Error fetching owner for token", tokenId, err);
          continue;
        }
        if (owner.toLowerCase() !== account.toLowerCase()) continue;

        let tokenURI;
        try {
          tokenURI = await myNFTContract.tokenURI(tokenId);
        } catch (err) {
          console.error("Error fetching tokenURI for token", tokenId, err);
          continue;
        }
        let metadata = {};
        try {
          const res = await fetch(tokenURI);
          metadata = await res.json();
        } catch (err) {
          console.error(`Error fetching metadata for token ${tokenId}:`, err);
        }

        items.push({
          tokenId,
          tokenURI,
          ...metadata,
        });
      }
      setNFTs(items);

      // Pass NFT count back to parent if callback provided
      if (typeof onNFTCountUpdate === "function") {
        onNFTCountUpdate(items.length);
      }
    } catch (error) {
      console.error("Error loading NFTs:", error);
    }
    setLoading(false);
  }

  if (loading) {
    return <div>Loading your NFTs...</div>;
  }

  if (nfts.length === 0) {
    return <div>You don't own any NFTs.</div>;
  }

  return (
    <div>
      <h3>Your NFTs</h3>
      <div
        className="nft-gallery"
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          paddingBottom: "1rem"
        }}
      >
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className="nft-item"
            style={{
              border: "1px solid #ccc",
              padding: "0.5rem",
              flex: "0 0 calc(25% - 1rem)",
              boxSizing: "border-box",
              cursor: "pointer"
            }}
            onClick={() => onSelectNFT(nft.tokenId)}
          >
            <h4 style={{ fontSize: "1rem", textAlign: "center" }}>
              {nft.name || `NFT #${nft.tokenId}`}
            </h4>
            {nft.image && (
              <img
                src={nft.image}
                alt={nft.name || `NFT ${nft.tokenId}`}
                style={{ width: "100%", height: "200px", objectFit: "cover" }}
              />
            )}
            {nft.description && (
              <p style={{ fontSize: "0.8rem", textAlign: "center" }}>{nft.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}