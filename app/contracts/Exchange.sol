// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    Token public token;
    address public owner;
    uint256 public price; // Price in wei per token
    event TokensBought(
        address indexed buyer,
        uint256 ethSpent,
        uint256 tokensBought
    );
    event TokensSold(
        address indexed seller,
        uint256 tokensSold,
        uint256 ethReturned
    );

    constructor(address _tokenAddress, uint256 _price) {
        token = Token(_tokenAddress);
        owner = msg.sender;
        price = _price;
    }

    // Owner deposits liquidity: tokens from the owner's balance (via transferFrom)
    // and sends along ETH as liquidity.
    // Before calling this function, the owner must approve the Exchange to spend their tokens.
    function depositLiquidity(uint256 tokenAmount) external payable {
        require(msg.sender == owner, "Only owner can deposit liquidity");
        require(
            token.transferFrom(owner, address(this), tokenAmount),
            "Token transfer failed"
        );
        // ETH is sent along as msg.value.
    }

    // Users send ETH to buy tokens from the exchange.
    function buyTokens() external payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        uint256 tokensToBuy = msg.value / price;
        require(tokensToBuy > 0, "Not enough ETH sent to buy tokens");
        require(
            IERC20(address(token)).balanceOf(address(this)) >= tokensToBuy,
            "Not enough tokens in liquidity"
        );

        // Transfer tokens from Exchange to buyer.
        require(
            token.transfer(msg.sender, tokensToBuy),
            "Token transfer failed"
        );
        emit TokensBought(msg.sender, msg.value, tokensToBuy);
    }

    // Users sell tokens in exchange for ETH.
    // The user must first approve the exchange to transfer the tokens.
    // Tokens received by the exchange can be considered “burned” or held as reserve.
    function sellTokens(uint256 tokensToSell) external {
        require(tokensToSell > 0, "Amount must be greater than 0");
        uint256 ethToReturn = tokensToSell * price;
        require(
            address(this).balance >= ethToReturn,
            "Not enough ETH in liquidity"
        );

        // Transfer tokens from seller to Exchange.
        require(
            token.transferFrom(msg.sender, address(this), tokensToSell),
            "Token transfer failed"
        );

        // Option 1: “Burn” tokens by sending them to address(0)
        // token.transfer(address(0), tokensToSell);
        // Option 2 (shown here): simply keep the tokens within the Exchange (reducing circulating supply)
        // and update any metrics off-chain if desired.

        // Transfer ETH to seller.
        payable(msg.sender).transfer(ethToReturn);
        emit TokensSold(msg.sender, tokensToSell, ethToReturn);
    }

    // Allow the contract to receive ETH
    receive() external payable {}
}
