import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import MyNFTArtifact from "../contracts/MyNFT.json";
import NFTMarketArtifact from "../contracts/NFTMarket.json";
import TokenArtifact from "../contracts/Token.json"; // Import Token artifact
import contractAddress from "../contracts/contract-address.json";

export function NFTMarketplace({
  myNFTContract: dappMyNFT,
  account: dappAccount,
}) {
  const location = useLocation();
  const initialAccount =
    dappAccount || (location.state && location.state.account) || null;
  const initialMyNFT =
    dappMyNFT || (location.state && location.state.myNFTContract) || null;
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(initialAccount);
  const [myNFTContract, setMyNFTContract] = useState(initialMyNFT);
  const [nftMarketContract, setNftMarketContract] = useState(null);
  const [bids, setBids] = useState({}); // bid amounts keyed by tokenId or itemId
  const [selectedForListing, setSelectedForListing] = useState(""); // tokenId selected to list

  // Initialize contracts – always initialize NFTMarket; use dApp-provided MyNFT if available.
  async function initializeContracts() {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        let accounts = await provider.send("eth_accounts", []);
        if (accounts.length === 0) {
          accounts = await provider.send("eth_requestAccounts", []);
        }
        setAccount(accounts[0]);
        const signer = provider.getSigner(accounts[0]);
        if (!myNFTContract) {
          const myNFT = new ethers.Contract(
            contractAddress.MyNFT,
            MyNFTArtifact.abi,
            signer
          );
          setMyNFTContract(myNFT);
        }
        const nftMarket = new ethers.Contract(
          contractAddress.NFTMarket,
          NFTMarketArtifact.abi,
          signer
        );
        setNftMarketContract(nftMarket);
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    }
  }

  // Load all minted NFTs using Transfer events (from zero address)
  async function loadAllNFTs() {
    if (!myNFTContract || !nftMarketContract) return;
    setLoading(true);
    try {
      // 1. Get minted NFTs from Transfer events (mint events: from zero address)
      const mintFilter = myNFTContract.filters.Transfer(
        ethers.constants.AddressZero,
        null
      );
      const mintEvents = await myNFTContract.queryFilter(mintFilter);
      const mintedItems = [];
      for (const event of mintEvents) {
        const tokenId = event.args.tokenId.toString();
        let tokenURI = "";
        try {
          tokenURI = await myNFTContract.tokenURI(tokenId);
        } catch (err) {
          console.error(`Error fetching tokenURI for token ${tokenId}:`, err);
        }
        let metadata = {};
        try {
          const res = await fetch(tokenURI);
          metadata = await res.json();
        } catch (err) {
          console.error(
            `Error fetching metadata for token ${tokenId}:`,
            tokenURI
          );
        }
        let owner = "";
        try {
          owner = (await myNFTContract.ownerOf(tokenId)).toLowerCase();
        } catch (err) {
          console.error(`Error fetching owner for token ${tokenId}:`, err);
        }
        mintedItems.push({
          tokenId,
          tokenURI,
          owner,
          ...metadata,
        });
      }

      // 2. Get active marketplace listings using the new fetch function.
      const listingsArray = await nftMarketContract.fetchActiveMarketItems();
      // Build a mapping of tokenId => listing data.
      const listings = {};
      for (const item of listingsArray) {
        const tokenId = item.tokenId.toString();
        listings[tokenId] = {
          seller: item.seller.toLowerCase(),
          // Use 0 decimals conversion instead of "ether"
          price: ethers.utils.formatUnits(item.price, 0),
          itemId: item.itemId.toString(),
        };
      }

      // 3. Merge listings into minted items (if an NFT is listed, add marketplace data)
      const mergedItems = mintedItems.map((nft) => {
        if (listings[nft.tokenId]) {
          return { ...nft, ...listings[nft.tokenId] };
        }
        return nft;
      });
      setNfts(mergedItems);
    } catch (error) {
      console.error("Error loading minted NFTs:", error);
    }
    setLoading(false);
  }

  // List an NFT for sale.
  async function createListingNFT(e) {
    e.preventDefault();
    // Retrieve tokenId from hidden field entered by the inline form.
    const tokenId = e.target.tokenId.value;
    const priceInput = e.target.price.value; // Price in token units
    // Since your Token has 0 decimals, use '0' as the unit.
    const price = ethers.utils.parseUnits(priceInput, 0);

    try {
      // Check if the NFTMarket contract is approved to transfer this token from NFT contract.
      const approvedAddress = await myNFTContract.getApproved(tokenId);
      if (
        approvedAddress.toLowerCase() !==
        nftMarketContract.address.toLowerCase()
      ) {
        console.log("Approving NFT for marketplace...");
        const approvalTx = await myNFTContract.approve(
          nftMarketContract.address,
          tokenId
        );
        await approvalTx.wait();
        console.log("Approval complete.");
      }

      // Now check token allowance for listing fee and approve if needed.
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(
        contractAddress.Token,
        TokenArtifact.abi,
        signer
      );
      // Listing fee is assumed to be 1 token unit (adjust if needed)
      const listingFee = ethers.utils.parseUnits("1", 0);
      const allowance = await tokenContract.allowance(
        account,
        nftMarketContract.address
      );
      if (allowance.lt(listingFee)) {
        console.log("Approving token spending for listing fee...");
        const approveTx = await tokenContract.approve(
          nftMarketContract.address,
          listingFee
        );
        await approveTx.wait();
        console.log("Token spending approved.");
      }

      // Now call createMarketItem without passing any ETH value override.
      const tx = await nftMarketContract.createMarketItem(
        contractAddress.MyNFT,
        tokenId,
        price
      );
      await tx.wait();
      setSelectedForListing("");
      loadAllNFTs();
    } catch (err) {
      console.error("Error listing NFT:", err);
    }
  }

  // Place a bid on a listed item.
  async function placeBid(itemId) {
    const bidAmountEth = bids[itemId];
    if (!bidAmountEth) return;
    const bidAmount = ethers.utils.parseUnits(bidAmountEth, "ether");
    try {
      const tx = await nftMarketContract.bidOnItem(itemId, {
        value: bidAmount,
      });
      await tx.wait();
      loadAllNFTs();
    } catch (err) {
      console.error("Error placing bid:", err);
    }
  }

  // Buy an NFT at the asking price.
  async function buyNFT(itemId, priceInput) {
    // Convert price from token units using 0 decimals (since your token has 0 decimals)
    const price = ethers.utils.parseUnits(priceInput, 0);
    try {
      // Create a token contract instance
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(
        contractAddress.Token,
        TokenArtifact.abi,
        signer
      );
      // Check if the buyer has approved enough tokens for NFTMarket to pull the purchase price.
      const buyerAllowance = await tokenContract.allowance(
        account,
        nftMarketContract.address
      );
      if (buyerAllowance.lt(price)) {
        console.log("Approving token spending for purchase price...");
        const approveTx = await tokenContract.approve(
          nftMarketContract.address,
          price
        );
        await approveTx.wait();
        console.log("Approval for purchase price complete.");
      }
      // Now call purchaseMarketItem without any ETH value override.
      const tx = await nftMarketContract.purchaseMarketItem(itemId);
      await tx.wait();
      loadAllNFTs();
    } catch (err) {
      console.error("Error buying NFT:", err);
    }
  }

  // Seller accepts the current bid.
  async function acceptBid(itemId) {
    try {
      const tx = await nftMarketContract.acceptBid(itemId);
      await tx.wait();
      loadAllNFTs();
    } catch (err) {
      console.error("Error accepting bid:", err);
    }
  }

  async function cancelListing(itemId) {
    try {
      const tx = await nftMarketContract.cancelMarketItem(itemId);
      await tx.wait();
      loadAllNFTs();
    } catch (err) {
      console.error("Error canceling listing:", err);
    }
  }

  // Listen for account changes.
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setNfts([]);
        } else {
          setAccount(accounts[0]);
          initializeContracts();
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
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

  useEffect(() => {
    initializeContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (nftMarketContract && myNFTContract) {
      loadAllNFTs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nftMarketContract, myNFTContract]);

  if (loading) {
    return <div>Loading NFT Marketplace...</div>;
  }

  return (
    <div>
      <h2>NFT Marketplace</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
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
              {nft.owner
                ? nft.owner.slice(0, 6) + "..." + nft.owner.slice(-4)
                : "Unknown"}
            </p>
            {/*
              If there's no marketplace listing (nft.seller undefined) and you own it,
              show the option to list.
            */}
            {nft.owner === account?.toLowerCase() && !nft.seller && (
              <>
                {selectedForListing !== nft.tokenId ? (
                  <button onClick={() => setSelectedForListing(nft.tokenId)}>
                    List NFT for Sale
                  </button>
                ) : (
                  <form onSubmit={createListingNFT}>
                    <input type="hidden" name="tokenId" value={nft.tokenId} />
                    <input
                      name="price"
                      placeholder="Price in MHT"
                      required
                      style={{ marginRight: "0.5rem" }}
                    />
                    <button type="submit">Submit Listing</button>
                    <button
                      type="button"
                      onClick={() => setSelectedForListing("")}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </>
            )}
            {/*
              If the NFT is listed, then show the marketplace info.
              Note: even if you are the owner and have already listed the NFT, don't show the "List" option again.
            */}
            {nft.seller && (
              <div>
                <p>
                  Listed by:{" "}
                  {nft.seller.slice(0, 6) + "..." + nft.seller.slice(-4)}
                </p>
                <p>Price: {nft.price} MHT</p>
                {account &&
                  nft.seller.toLowerCase() !== account.toLowerCase() && (
                    <div>
                      <input
                        type="text"
                        placeholder="Your bid in MHT"
                        value={bids[nft.tokenId] || ""}
                        onChange={(e) =>
                          setBids({ ...bids, [nft.tokenId]: e.target.value })
                        }
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <button onClick={() => placeBid(nft.itemId)}>
                        Place Bid
                      </button>
                      <button onClick={() => buyNFT(nft.itemId, nft.price)}>
                        Buy NFT
                      </button>
                    </div>
                  )}
                {account &&
                  nft.seller.toLowerCase() === account.toLowerCase() && (
                    <div>
                      <p>You listed this NFT</p>
                      <button onClick={() => cancelListing(nft.itemId)}>
                        Cancel Listing
                      </button>
                    </div>
                  )}
              </div>
            )}
            {/*
              For NFTs that are not listed and not owned by the user, just display a message.
            */}
            {!nft.seller && nft.owner !== account?.toLowerCase() && (
              <p>Not listed for sale</p>
            )}
          </div>
        ))}
      </div>
      <br />
      <Link to="/app" state={{ account }} className="btn btn-primary">
        Return Home
      </Link>
    </div>
  );
}
