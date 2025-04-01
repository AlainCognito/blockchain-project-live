// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    Token public token;
    address public owner;
    uint256 public price; // Price in wei per token (base unit)

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
    event PriceUpdated(uint256 newPrice);
    event LiquidityDeposited(uint256 tokensDeposited, uint256 ethDeposited);

    constructor(address _tokenAddress, uint256 _price) {
        token = Token(_tokenAddress);
        owner = msg.sender;
        price = _price;
    }

    function updatePrice(uint256 newPrice) public {
        require(msg.sender == owner, "Only owner can update price");
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    // Owner deposits liquidity: tokens from the owner's balance (via transferFrom)
    // and sends along ETH as liquidity.
    function depositLiquidity(uint256 tokenAmount) external payable {
        require(msg.sender == owner, "Only owner can deposit liquidity");
        require(
            token.transferFrom(owner, address(this), tokenAmount),
            "Token transfer failed"
        );
        emit LiquidityDeposited(tokenAmount, msg.value);
    }

    // Returns the current token and ETH reserves held by this contract.
    function getReserves()
        public
        view
        returns (uint256 tokenReserve, uint256 ethReserve)
    {
        tokenReserve = IERC20(address(token)).balanceOf(address(this));
        ethReserve = address(this).balance;
    }

    // Users send ETH to buy tokens.
    // Calculation takes into account token decimals.
    function buyTokens() external payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        uint256 tokenDecimals = 10 ** token.decimals();
        // Calculate how many tokens to buy in the token's smallest units.
        uint256 tokensToBuy = (msg.value * tokenDecimals) / price;
        require(tokensToBuy > 0, "Not enough ETH sent to buy tokens");
        require(
            IERC20(address(token)).balanceOf(address(this)) >= tokensToBuy,
            "Not enough tokens in liquidity"
        );

        require(
            token.transfer(msg.sender, tokensToBuy),
            "Token transfer failed"
        );
        emit TokensBought(msg.sender, msg.value, tokensToBuy);
    }

    // Users sell tokens (in base units) and receive ETH.
    // Adjust calculation by token decimals.
    function sellTokens(uint256 tokensToSell) external {
        require(tokensToSell > 0, "Amount must be greater than 0");
        uint256 tokenDecimals = 10 ** token.decimals();
        // Calculate the amount of ETH to return.
        uint256 ethToReturn = (tokensToSell * price) / tokenDecimals;
        require(
            address(this).balance >= ethToReturn,
            "Not enough ETH in liquidity"
        );

        require(
            token.transferFrom(msg.sender, address(this), tokensToSell),
            "Token transfer failed"
        );

        payable(msg.sender).transfer(ethToReturn);
        emit TokensSold(msg.sender, tokensToSell, ethToReturn);
    }

    // Allow the contract to receive ETH.
    receive() external payable {}
}
