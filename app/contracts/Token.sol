// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 public price; // Price in wei per token
    address public owner; // Deployer address (token reserve holder)

    constructor() ERC20("Jeff Pesos", "JFP") {
        owner = msg.sender;
        // Mint 1,000,000 tokens to the owner (reserve)
        _mint(owner, 10000000000000 * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 12; // Set the number of decimals to 6
    }
}
