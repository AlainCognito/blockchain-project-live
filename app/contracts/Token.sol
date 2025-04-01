// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 public price; // Price in wei per token
    address public owner; // Deployer address (token reserve holder)
    event PriceUpdated(uint256 newPrice);

    constructor() ERC20("Jeff Pesos", "JFP") {
        owner = msg.sender;
        // Mint 1,000,000 tokens to the owner (reserve)
        _mint(owner, 1000000 * 10 ** decimals());
        // Set an initial token price (e.g., 10^-6 ETH per token in wei)
        price = 10 ** 12; // 0.000001 ETH = 1e12 wei, since ETH = 1e18 wei
    }

    // Allows the owner to update price manually (or you can build an algorithm)
    function updatePrice(uint256 newPrice) public {
        require(msg.sender == owner, "Only owner can update price");
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6; // Set the number of decimals to 6
    }
}
