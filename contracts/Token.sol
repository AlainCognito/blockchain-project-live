// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor() ERC20("My Hardhat Token", "MHT") {
        // Mint 1,000,000 tokens (adjust decimals as needed)
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    function decimals() public view virtual override returns (uint8) {
        return 0;
    }
}
