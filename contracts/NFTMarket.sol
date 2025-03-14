// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;

    // Counters to track total items and items sold
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    // Contract owner gets a listing fee for every NFT listed
    address payable owner;
    uint256 listingPrice = 0.001 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct Marketitem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    struct Bid {
        address payable bidder;
        uint256 bidPrice;
        bool exists;
    }

    mapping(uint256 => Marketitem) private idToMarketItem;
    mapping(uint256 => Bid) public itemBids;

    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    event MarketItemBid(
        uint256 indexed itemId,
        address bidder,
        uint256 bidPrice
    );
    event MarketItemSold(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing fee"
        );

        // Verify that the seller has approved the marketplace.
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace is not approved to manage this token"
        );

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        // Do not transfer NFT; simply record the listing.
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

    // Place a bid on a market item.
    function bidOnItem(uint256 itemId) public payable nonReentrant {
        Marketitem storage item = idToMarketItem[itemId];
        require(item.itemId > 0, "Item does not exist");
        require(item.sold == false, "Item already sold");
        require(
            msg.value > item.price,
            "Bid must be higher than listing price"
        );
        if (itemBids[itemId].exists) {
            require(
                msg.value > itemBids[itemId].bidPrice,
                "Must bid higher than current bid"
            );
            // Refund previous bid.
            itemBids[itemId].bidder.transfer(itemBids[itemId].bidPrice);
        }
        itemBids[itemId] = Bid(payable(msg.sender), msg.value, true);
        emit MarketItemBid(itemId, msg.sender, msg.value);
    }

    // Seller accepts the highest bid.
    function acceptBid(uint256 itemId) public nonReentrant {
        Marketitem storage item = idToMarketItem[itemId];
        require(item.itemId > 0, "Item does not exist");
        require(item.sold == false, "Item already sold");
        require(item.seller == msg.sender, "Only seller can accept bid");
        Bid storage bid = itemBids[itemId];
        require(bid.exists, "No bid exists");

        // Pull NFT from seller.
        IERC721(item.nftContract).transferFrom(
            item.seller,
            bid.bidder,
            item.tokenId
        );
        // Transfer bid amount to seller.
        item.seller.transfer(bid.bidPrice);
        item.owner = bid.bidder;
        item.sold = true;
        _itemsSold.increment();
        emit MarketItemSold(
            itemId,
            item.nftContract,
            item.tokenId,
            item.seller,
            bid.bidder,
            bid.bidPrice
        );
    }

    // Purchase the market item at the asking price.
    function purchaseMarketItem(uint256 itemId) public payable nonReentrant {
        Marketitem storage item = idToMarketItem[itemId];
        require(item.itemId > 0, "Item does not exist");
        require(item.sold == false, "Item already sold");
        require(msg.value == item.price, "Please submit the asking price");

        // Transfer funds to the seller.
        item.seller.transfer(msg.value);
        // Pull NFT from the seller (seller must keep approval active until sale completion).
        IERC721(item.nftContract).transferFrom(
            item.seller,
            msg.sender,
            item.tokenId
        );

        // Mark the item as sold.
        item.owner = payable(msg.sender);
        item.sold = true;
        _itemsSold.increment();

        emit MarketItemSold(
            itemId,
            item.nftContract,
            item.tokenId,
            item.seller,
            msg.sender,
            msg.value
        );

        // Optional: Delete the listing so that subsequent calls to fetchActiveMarketItems won't return it.
        // delete idToMarketItem[itemId];
    }

    // Cancel a market item listing.
    function cancelMarketItem(uint256 itemId) public nonReentrant {
        Marketitem storage item = idToMarketItem[itemId];
        require(item.itemId > 0, "Item does not exist");
        require(item.seller == msg.sender, "Only seller can cancel listing");
        require(item.sold == false, "Item already sold");

        // Refund an outstanding bid, if any.
        if (itemBids[itemId].exists) {
            itemBids[itemId].bidder.transfer(itemBids[itemId].bidPrice);
            delete itemBids[itemId];
        }

        // Remove the listing.
        delete idToMarketItem[itemId];

        // Optionally emit an event for cancellation.
        // emit MarketItemCancelled(itemId, msg.sender);
    }

    function fetchActiveMarketItems()
        public
        view
        returns (Marketitem[] memory)
    {
        uint totalItemCount = _itemIds.current();
        uint activeItemCount = 0;
        // Count active items: those not sold and still listed (i.e. owner is address(0))
        for (uint i = 1; i <= totalItemCount; i++) {
            if (
                idToMarketItem[i].sold == false &&
                idToMarketItem[i].owner == address(0)
            ) {
                activeItemCount += 1;
            }
        }
        Marketitem[] memory items = new Marketitem[](activeItemCount);
        uint currentIndex = 0;
        for (uint i = 1; i <= totalItemCount; i++) {
            if (
                idToMarketItem[i].sold == false &&
                idToMarketItem[i].owner == address(0)
            ) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex += 1;
            }
        }
        return items;
    }
}
