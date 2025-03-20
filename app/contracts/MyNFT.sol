// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "hardhat/console.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    event MintNFT(address indexed recipient, uint256 indexed tokenId);

    constructor() ERC721("MyNFT", "NFT") Ownable(msg.sender) {}

    function mintNFT(address recipient, string memory tokenURI)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds += 1;
        uint256 newItemId = _tokenIds;
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

}
