import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

export function NFTMarketplace({
  myNFTContract,
  nftMarketContract,
  tokenContract,
  account,
}) {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState({});
  const [selectedForListing, setSelectedForListing] = useState("");
  const [sortOrder, setSortOrder] = useState("priceAsc");
  const [warningMessage, setWarningMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [displayCountAll, setDisplayCountAll] = useState(8);
  const [displayCountActive, setDisplayCountActive] = useState(8);
  const [displayCountUnlisted, setDisplayCountUnlisted] = useState(8);
  const [selectedNft, setSelectedNft] = useState(null);

  async function loadAllNFTs() {
    if (!myNFTContract || !nftMarketContract) return;
    setLoading(true);
    try {
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
          console.error(`Error fetching metadata for token ${tokenId}:`, err);
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

      const listingsArray = await nftMarketContract.fetchActiveMarketItems();
      const listings = {};
      for (const item of listingsArray) {
        const tokenId = item.tokenId.toString();
        listings[tokenId] = {
          seller: item.seller.toLowerCase(),
          price: ethers.utils.formatUnits(item.price, 12),
          itemId: item.itemId.toString(),
        };
      }

      let mergedItems = mintedItems.map((nft) => {
        if (listings[nft.tokenId]) {
          return { ...nft, ...listings[nft.tokenId] };
        }
        return nft;
      });

      mergedItems.sort((a, b) => {
        if (!a.price || !b.price) return 0;
        return sortOrder === "priceAsc"
          ? parseFloat(a.price) - parseFloat(b.price)
          : parseFloat(b.price) - parseFloat(a.price);
      });
      setNfts(mergedItems);
    } catch (error) {
      console.error("Error loading minted NFTs:", error);
    }
    setLoading(false);
  }

  async function buyNFT(itemId, priceInput) {
    const price = ethers.utils.parseUnits(priceInput, 12);
    try {
      const balance = await tokenContract.balanceOf(account);
      if (balance.lt(price)) {
        setWarningMessage("Insufficient token balance to purchase this NFT.");
        return;
      }
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
      const tx = await nftMarketContract.purchaseMarketItem(itemId);
      await tx.wait();
      loadAllNFTs();
      setWarningMessage("");
    } catch (err) {
      console.error("Error buying NFT:", err);
      setWarningMessage("Error processing purchase. Please try again.");
    }
  }

  async function createListingNFT(e) {
    e.preventDefault();
    const tokenId = e.target.tokenId.value;
    const priceInput = e.target.price.value;
    const price = ethers.utils.parseUnits(priceInput, 12);
    try {
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
      const tx = await nftMarketContract.createMarketItem(
        myNFTContract.address,
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

  async function cancelListing(itemId) {
    try {
      const tx = await nftMarketContract.cancelMarketItem(itemId);
      await tx.wait();
      loadAllNFTs();
    } catch (err) {
      console.error("Error canceling listing:", err);
    }
  }

  // Effects
  useEffect(() => {
    if (nftMarketContract && myNFTContract) {
      loadAllNFTs();
    }
  }, [nftMarketContract, myNFTContract, sortOrder]);

  useEffect(() => {
    function handleScroll() {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        if (selectedTab === "all") {
          setDisplayCountAll((prev) =>
            Math.min(
              prev + 4,
              nfts.filter((n) => n.owner !== account?.toLowerCase()).length
            )
          );
        }
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [selectedTab, nfts, account]);

  // Handlers for modal and sorting
  function handleSortChange(e) {
    setSortOrder(e.target.value);
  }
  const openModal = (nft) => setSelectedNft(nft);
  const closeModal = () => setSelectedNft(null);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <div
          className="spinner-border text-warning"
          role="status"
          style={{ width: "4rem", height: "4rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4">
      <style>{`
        .custom-transparent-btn {
          background-color: transparent !important;
          border: 1px solid transparent !important;
          color: inherit;
        }
        .custom-transparent-btn:hover {
          background-color: transparent !important;
          border: 1px solidrgba(255, 193, 7, 0) !important;
          color: #ffc107 !important;
        }
      `}</style>
      <header className="my-4">
        <h1 className="display-6 text-secondary justify-content-center">NFTZone</h1>
      </header>

      {warningMessage && (
        <div className="alert alert-warning" role="alert">
          {warningMessage}
        </div>
      )}

      <div className="btn-group mb-4">
        <button
          className={
            "btn " +
            (selectedTab === "all"
              ? "btn-warning"
              : "btn-outline-warning")
          }
          onClick={() => setSelectedTab("all")}
        >
          All NFTs
        </button>
        <button
          className={
            "btn " +
            (selectedTab === "my"
              ? "btn-warning"
              : "btn-outline-warning")
          }
          onClick={() => setSelectedTab("my")}
        >
          My NFTs
        </button>
      </div>

      {selectedTab === "all" && (
        <>
          <h3>All NFTs</h3>
          <div
            className="row row-cols-1 row-cols-md-4 g-4"
            style={{ rowGap: "1rem" }}
          >
            {nfts
              .filter((n) => n.owner !== account?.toLowerCase() && n.price)
              .slice(0, displayCountAll)
              .map((nft) => (
                <div key={nft.tokenId} className="col">
                  <div className="card h-100">
                    {nft.image && (
                      <img
                        src={
                          nft.image.startsWith("http")
                            ? nft.image
                            : `https://${nft.image}`
                        }
                        className="card-img-top"
                        alt={nft.name || `NFT ${nft.tokenId}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(nft)}
                      />
                    )}
                    <div className="card-body">
                      <h5 className="card-title">
                        {nft.name || `NFT #${nft.tokenId}`}
                      </h5>
                      <p className="card-text">Price: {nft.price} JFP</p>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => buyNFT(nft.itemId, nft.price)}
                      >
                        Buy NFT
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {nfts.filter(
            (n) => n.owner !== account?.toLowerCase() && n.price
          ).length > displayCountAll && (
              <div className="text-center my-4">
                <button
                  className="btn custom-transparent-btn"
                  onClick={() =>
                    setDisplayCountAll((prev) =>
                      Math.min(
                        prev + 4,
                        nfts.filter((n) => n.owner !== account?.toLowerCase() && n.price)
                          .length
                      )
                    )
                  }
                >
                  ...
                </button>
              </div>
            )}
          {nfts.filter(
            (n) => n.owner !== account?.toLowerCase() && !n.price
          ).length > 0 && (
              <>
                <h3 className="mt-5">Unlisted NFTs</h3>
                <div
                  className="row row-cols-1 row-cols-md-4 g-4"
                  style={{ rowGap: "1rem" }}
                >
                  {nfts
                    .filter((n) => n.owner !== account?.toLowerCase() && !n.price)
                    .map((nft) => (
                      <div key={nft.tokenId} className="col">
                        <div className="card h-100">
                          {nft.image && (
                            <img
                              src={
                                nft.image.startsWith("http")
                                  ? nft.image
                                  : `https://${nft.image}`
                              }
                              className="card-img-top"
                              alt={nft.name || `NFT ${nft.tokenId}`}
                              style={{ cursor: "pointer" }}
                              onClick={() => openModal(nft)}
                            />
                          )}
                          <div className="card-body">
                            <h5 className="card-title">
                              {nft.name || `NFT #${nft.tokenId}`}
                            </h5>
                            <p className="card-text">Not listed for sale</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
        </>
      )}

      {selectedTab === "my" && (
        <>
          <h3>My NFTs</h3>
          {nfts.filter(
            (n) => n.owner === account?.toLowerCase() && n.seller
          ).length > 0 && (
              <div>
                <h4>Active Listings</h4>
                <div className="row row-cols-1 row-cols-md-4 g-4">
                  {nfts
                    .filter(
                      (n) => n.owner === account?.toLowerCase() && n.seller
                    )
                    .slice(0, displayCountActive)
                    .map((nft) => (
                      <div key={nft.tokenId} className="col">
                        <div className="card h-100">
                          {nft.image && (
                            <img
                              src={
                                nft.image.startsWith("http")
                                  ? nft.image
                                  : `https://${nft.image}`
                              }
                              className="card-img-top"
                              alt={
                                nft.name || `NFT ${nft.tokenId}`
                              }
                              style={{ cursor: "pointer" }}
                              onClick={() => openModal(nft)}
                            />
                          )}
                          <div className="card-body">
                            <h5 className="card-title">
                              {nft.name || `NFT #${nft.tokenId}`}
                            </h5>
                            <p className="card-text">
                              Price: {nft.price} MHT
                            </p>
                            <p className="card-text">
                              Listed by:{" "}
                              {nft.seller
                                ? nft.seller.slice(0, 6) +
                                "..." +
                                nft.seller.slice(-4)
                                : "Unknown"}
                            </p>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => cancelListing(nft.itemId)}
                            >
                              Cancel Listing
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          {nfts.filter(
            (n) =>
              n.owner === account?.toLowerCase() && !n.seller
          ).length > 0 && (
              <div className="mt-4">
                <h4>Your Unlisted NFTs</h4>
                <div className="row row-cols-1 row-cols-md-4 g-4">
                  {nfts
                    .filter(
                      (n) =>
                        n.owner === account?.toLowerCase() && !n.seller
                    )
                    .slice(0, displayCountUnlisted)
                    .map((nft) => (
                      <div key={nft.tokenId} className="col">
                        <div className="card h-100">
                          {nft.image && (
                            <img
                              src={
                                nft.image.startsWith("http")
                                  ? nft.image
                                  : `https://${nft.image}`
                              }
                              className="card-img-top"
                              alt={nft.name || `NFT ${nft.tokenId}`}
                              style={{ cursor: "pointer" }}
                              onClick={() => openModal(nft)}
                            />
                          )}
                          <div className="card-body">
                            <h5 className="card-title">
                              {nft.name || `NFT #${nft.tokenId}`}
                            </h5>
                            <p className="card-text">
                              Owner:{" "}
                              {nft.owner
                                ? nft.owner.slice(0, 6) +
                                "..." +
                                nft.owner.slice(-4)
                                : "Unknown"}
                            </p>
                            {selectedForListing !== nft.tokenId ? (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                  setSelectedForListing(nft.tokenId)
                                }
                              >
                                List NFT for Sale
                              </button>
                            ) : (
                              <form onSubmit={createListingNFT}>
                                <input
                                  type="hidden"
                                  name="tokenId"
                                  value={nft.tokenId}
                                />
                                <input
                                  name="price"
                                  placeholder="Price in MHT"
                                  required
                                  className="form-control mb-2"
                                />
                                <div className="d-flex">
                                  <button
                                    type="submit"
                                    className="btn btn-sm btn-success me-2"
                                  >
                                    Submit Listing
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedForListing("")
                                    }
                                    className="btn btn-sm btn-secondary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </>
      )}

      <div className="my-4 d-flex align-items-center justify-content-between flex-wrap">
        <Link
          to="/app"
          state={{ account }}
          className="btn custom-transparent-btn mb-2"
        >
          Return Home
        </Link>
        <div className="d-flex align-items-center">
          <label className="form-label mb-0 me-3">
            Sort by Price:
          </label>
          <select
            className="form-select w-auto"
            value={sortOrder}
            onChange={handleSortChange}
          >
            <option value="priceAsc">Ascending</option>
            <option value="priceDesc">Descending</option>
          </select>
        </div>
      </div>

      {selectedNft && (
        <div
          className="modal show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedNft.name || `NFT #${selectedNft.tokenId}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <img
                  src={
                    selectedNft.image.startsWith("http")
                      ? selectedNft.image
                      : `https://${selectedNft.image}`
                  }
                  className="img-fluid"
                  alt={
                    selectedNft.name ||
                    `NFT ${selectedNft.tokenId}`
                  }
                />
                <p className="mt-3">
                  {selectedNft.description}
                </p>
              </div>
              {selectedNft.price && (
                <div className="modal-footer">
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => {
                      buyNFT(selectedNft.itemId, selectedNft.price);
                      closeModal();
                    }}
                  >
                    Buy NFT
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
