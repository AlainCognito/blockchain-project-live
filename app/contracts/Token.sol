// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 public price;
    event PriceUpdated(uint256 newPrice);

    constructor() ERC20("Jeff Pesos", "JFP") {
        // Mint 1,000,000 tokens (adjust decimals as needed)
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    function updatePrice(uint256 newPrice) public {
        price = newPrice;
        emit PriceUpdated(newPrice);
    }
}
