// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 public price; // Price in wei per token
    address public owner; // Deployer address (token reserve holder)
    event PriceUpdated(uint256 newPrice);
    event TokensPurchased(
        address buyer,
        uint256 ethSpent,
        uint256 tokensBought
    );
    event TokensSold(address seller, uint256 ethReceived, uint256 tokensSold);

    constructor() ERC20("Jeff Pesos", "JFP") {
        owner = msg.sender;
        // Mint 1,000,000 tokens to the owner (reserve)
        _mint(owner, 1000000);
        // Set an initial token price (e.g., 10^-6 ETH per token in wei)
        price = 10 ** 12; // 0.000001 ETH = 1e12 wei, since ETH = 1e18 wei
    }

    // Allows the owner to update price manually (or you can build an algorithm)
    function updatePrice(uint256 newPrice) public {
        require(msg.sender == owner, "Only owner can update price");
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    // Buy tokens: buyer sends ETH, and receives tokens from the owner's reserve
    function buyTokens() public payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        require(price > 0, "Token price is not set");

        uint256 tokensToBuy = msg.value / price;
        require(tokensToBuy > 0, "Not enough ETH sent to buy any tokens");

        // Make sure the owner has enough tokens available.
        require(
            balanceOf(owner) >= tokensToBuy,
            "Not enough tokens in reserve"
        );

        // Transfer tokens from owner (reserve) to buyer.
        _transfer(owner, msg.sender, tokensToBuy);

        payable(owner).transfer(msg.value); // Transfer ETH to the owner

        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    }

    function sellTokens(uint256 amount) public {
        require(amount > 0, "Amount must be > 0");
        uint256 ethToSend = amount * price;
        require(
            address(this).balance >= ethToSend,
            "Not enough ETH in contract"
        );

        // Transfer tokens from seller back to owner (reserve)
        _transfer(msg.sender, owner, amount);

        // Send ETH to the seller
        payable(msg.sender).transfer(ethToSend);

        emit TokensSold(msg.sender, ethToSend, amount);
    }
}
