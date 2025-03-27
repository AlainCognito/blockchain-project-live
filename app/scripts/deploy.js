// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

async function mintAllNFTs(myNFT, deployer, myNFTMarket, token) {
  const fs = require("fs");
  const metadataDir = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "public",
    "metadata"
  );
  const remote_path = "https://blockchain-project-live.vercel.app/metadata/";

  // Read all JSON files in the metadata folder
  const files = fs
    .readdirSync(metadataDir)
    .filter((file) => file.endsWith(".json"));

  console.log("Minting NFTs...");
  for (const file of files) {
    const filePath = path.join(metadataDir, file);
    const remote_file = remote_path + file;

    const fileData = fs.readFileSync(filePath, "utf8");
    const nft = JSON.parse(fileData);

    console.log(`${remote_file}`);
    const tx = await myNFT.mintNFT(deployer.address, myNFT.address);
    const receipt = await tx.wait();
    console.log(`NFT minted successfully.`);

    const tokenId = receipt.events.find((event) => event.event === "Transfer")
      .args.tokenId;

    const approveTx = await myNFT.approve(myNFTMarket.address, tokenId);
    await approveTx.wait();
    console.log(`NFT ${tokenId} approved.`);

    // Set your desired fixed price; adjust units as required.
    const price = ethers.utils.parseUnits("1000", 0);

    const approveTokenTx = await token.approve(myNFTMarket.address, price);
    await approveTokenTx.wait();

    console.log(
      `Creating market listing for NFT ${tokenId} at price ${price}...`
    );
    const listTx = await myNFTMarket.createMarketItem(
      myNFT.address,
      tokenId,
      price
    );
    await listTx.wait();
    console.log(`NFT ${tokenId} listed successfully.`);
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

  console.log("MyNFT deployed to:", myNFT.address);

  const fee = 1;

  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  const myNFTMarket = await NFTMarket.deploy(token.address, fee);
  await myNFTMarket.deployed();
  console.log("NFTMarket deployed to:", myNFTMarket.address);

  await mintAllNFTs(myNFT, deployer, myNFTMarket, token);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(token, myNFT, myNFTMarket);
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
