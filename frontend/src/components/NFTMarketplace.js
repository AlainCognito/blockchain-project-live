import React, { useState, useEffect } from "react";

export function NFTMarketplace({ myNFTContract, account }) {
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (myNFTContract) {
      loadAllNFTs();
    }
  }, [myNFTContract]);

  async function loadAllNFTs() {
    setLoading(true);
    try {
      // Query all mint events (Transfer from the zero address)
      const mintFilter = myNFTContract.filters.Transfer("0x0000000000000000000000000000000000000000");
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
          // Fetch the current owner and tokenURI
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

  function handleBid(tokenId) {
    // Placeholder for a bid action
    console.log("Place bid for token", tokenId);
  }

  function handleBuy(tokenId) {
    // Placeholder for a buy action
    console.log("Buy NFT token", tokenId);
  }

  if (loading) {
    return <div>Loading NFT Marketplace...</div>;
  }

  if (nfts.length === 0) {
    return <div>No NFTs have been minted.</div>;
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
            {/* If the connected user doesn't own this NFT, show bid/buy options */}
            {account &&
              nft.owner.toLowerCase() !== account.toLowerCase() && (
                <div>
                  <button onClick={() => handleBid(nft.tokenId)}>
                    Place Bid
                  </button>
                  <button onClick={() => handleBuy(nft.tokenId)}>Buy NFT</button>
                </div>
              )}
            {/* Optionally, if the connected user owns the NFT, mark it */}
            {account &&
              nft.owner.toLowerCase() === account.toLowerCase() && (
                <p>You own this NFT</p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}