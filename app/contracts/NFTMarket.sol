// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "./utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;

    // Counters for the items and items sold
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    // The marketplace owner receives the listing fee in tokens
    address payable public owner;
    // Listing fee (expressed in token base units—for example, if token uses 18 decimals, 1 token = 1e18)
    uint256 public listingFee;

    // The ERC20 token used for payments
    IERC20 public paymentToken;

    struct Marketitem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner; // becomes buyer after purchase
        uint256 price; // Price denominated in your ERC20 token units
        bool sold;
    }

    mapping(uint256 => Marketitem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    event MarketItemSold(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    event MarketItemCancelled(uint256 indexed itemId, address indexed seller);

    constructor(address tokenAddress, uint256 _listingFee) {
        owner = payable(msg.sender);
        paymentToken = IERC20(tokenAddress);
        listingFee = _listingFee;
    }

    /// @notice List an NFT for sale. The seller must have approved NFTMarket to spend at least listingFee tokens.
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public nonReentrant {
        require(price > 0, "Price must be greater than zero");

        // Pull the listing fee from the seller.
        // Seller must call Token.approve(nftMarketAddress, listingFee) beforehand.
        require(
            paymentToken.transferFrom(msg.sender, owner, listingFee),
            "Listing fee transfer failed"
        );

        // Require NFT approval on the NFT contract.
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace is not approved to manage this NFT"
        );

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        // Record the new market item (no transfer of NFT until sale)
        idToMarketItem[itemId] = Marketitem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    /// @notice Purchase an NFT by paying the sale price in tokens.
    /// Buyer must call Token.approve(nftMarketAddress, itemPrice) before purchasing.
    function purchaseMarketItem(uint256 itemId) public nonReentrant {
        Marketitem storage item = idToMarketItem[itemId];
        require(item.itemId > 0, "Item does not exist");
        require(!item.sold, "Item already sold");

        // Pull payment from buyer to seller.
        require(
            paymentToken.transferFrom(msg.sender, item.seller, item.price),
            "Payment failed"
        );

        // Transfer the NFT from seller to buyer.
        IERC721(item.nftContract).transferFrom(
            item.seller,
            msg.sender,
            item.tokenId
        );

        // Update the market item record.
        item.owner = payable(msg.sender);
        item.sold = true;
        _itemsSold.increment();

        emit MarketItemSold(
            item.itemId,
            item.nftContract,
            item.tokenId,
            item.seller,
            msg.sender,
            item.price
        );
    }

    /// @notice Cancel a market item listing.
    function cancelMarketItem(uint256 itemId) public nonReentrant {
        Marketitem storage item = idToMarketItem[itemId];
        require(item.itemId > 0, "Item does not exist");
        require(!item.sold, "Item already sold");
        require(item.seller == msg.sender, "Only seller can cancel listing");

        // Mark the item as cancelled by setting owner back to seller and marking as sold
        item.owner = payable(msg.sender);
        item.sold = true;
        _itemsSold.increment();

        emit MarketItemCancelled(itemId, msg.sender);
    }

    /// @notice Fetch all active (unsold) market items.
    function fetchActiveMarketItems()
        public
        view
        returns (Marketitem[] memory)
    {
        uint256 totalItemCount = _itemIds.current();
        uint256 activeItemCount = 0;

        for (uint i = 1; i <= totalItemCount; i++) {
            if (
                !idToMarketItem[i].sold && idToMarketItem[i].owner == address(0)
            ) {
                activeItemCount++;
            }
        }

        Marketitem[] memory items = new Marketitem[](activeItemCount);
        uint256 currentIndex = 0;
        for (uint i = 1; i <= totalItemCount; i++) {
            if (
                !idToMarketItem[i].sold && idToMarketItem[i].owner == address(0)
            ) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        return items;
    }
}
