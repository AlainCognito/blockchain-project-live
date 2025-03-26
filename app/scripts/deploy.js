// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

async function mintAllNFTs(myNFT, deployer) {
  const metadataPath = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "public",
    "metadata",
    "nfts.json"
  );

  // Read and parse the metadata file
  const fileData = fs.readFileSync(metadataPath, "utf8");
  const nfts = JSON.parse(fileData);

  console.log("Minting NFTs...");
  // Loop over each NFT metadata and mint the NFT to the deployer address
  for (const nft of nfts) {
    console.log(`Minting NFT ${nft.id} - ${nft.name}`);
    const tx = await myNFT.mint(deployer.address, nft.image);
    await tx.wait();
    console.log(`NFT ${nft.id} minted successfully.`);
  }
}

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();

  console.log("Token address:", token.address);

  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy();
  await myNFT.deployed();

  mintAllNFTs(myNFT, deployer);

  console.log("MyNFT deployed to:", myNFT.address);

  const fee = 1;

  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy(token.address, fee);
  await nftMarket.deployed();
  console.log("NFTMarket deployed to:", nftMarket.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(token, myNFT, nftMarket);
}

function saveFrontendFiles(token, myNFT, nftMarket) {
  const fs = require("fs");
  const contractsDir = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "contracts"
  );

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify(
      {
        Token: token.address,
        MyNFT: myNFT.address,
        NFTMarket: nftMarket.address,
      },
      undefined,
      2
    )
  );

  const TokenArtifact = artifacts.readArtifactSync("Token");

  fs.writeFileSync(
    path.join(contractsDir, "Token.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );

  const MyNFTArtifact = artifacts.readArtifactSync("MyNFT");

  fs.writeFileSync(
    path.join(contractsDir, "MyNFT.json"),
    JSON.stringify(MyNFTArtifact, null, 2)
  );

  const NFTMarketArtifact = artifacts.readArtifactSync("NFTMarket");

  fs.writeFileSync(
    path.join(contractsDir, "NFTMarket.json"),
    JSON.stringify(NFTMarketArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
