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
    const remote_address = remote_path + file;
    console.log(`${remote_address}`);

    const tx = await myNFT.mintNFT(deployer.address, remote_address);
    const receipt = await tx.wait();
    console.log(`NFT minted successfully.`);

    const tokenId = receipt.events.find((event) => event.event === "Transfer")
      .args.tokenId;

    const approveTx = await myNFT.approve(myNFTMarket.address, tokenId);
    await approveTx.wait();
    console.log(`NFT ${tokenId} approved.`);

    // Set your desired fixed price; adjust units as required.
    const price = ethers.utils.parseUnits("100", 6);

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
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Token contract
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();
  console.log("Token address:", token.address);

  // Deploy MyNFT and NFTMarket contracts (omitted details for brevity)
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy();
  await myNFT.deployed();
  console.log("MyNFT deployed to:", myNFT.address);

  const fee = 1;
  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  const myNFTMarket = await NFTMarket.deploy(token.address, fee);
  await myNFTMarket.deployed();
  console.log("NFTMarket deployed to:", myNFTMarket.address);

  // Set initial price: 1,000,000 tokens for 1 ETH => price = 1e18 / 1e6 = 1e12 wei per token.
  const PRICE = ethers.BigNumber.from("1000000000000"); // 1e12 wei

  // Deploy Exchange contract with token address and initial price
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(token.address, PRICE);
  await exchange.deployed();
  console.log("Exchange deployed to:", exchange.address);

  // Owner approves Exchange to spend tokens for liquidity deposit.
  const tokenDecimals = await token.decimals();
  // For tokens with decimals 0, 1,000,000 tokens is simply "1000000"
  const liquidityTokens = ethers.utils.parseUnits("100000", tokenDecimals);
  await token.approve(exchange.address, liquidityTokens);
  // Deposit liquidity: deposit 1,000,000 tokens and 1 ETH (which at the price gives a rate of 1 ETH per 1M tokens)
  await exchange.depositLiquidity(liquidityTokens, { value: ethers.utils.parseEther("5000") });
  console.log("Liquidity deposited to Exchange");

  // Proceed with minting NFTs and saving frontend files (unchanged)
  await mintAllNFTs(myNFT, deployer, myNFTMarket, token);
  saveFrontendFiles(token, myNFT, myNFTMarket, exchange);
}

function saveFrontendFiles(token, myNFT, nftMarket, exchange) {
  const fs = require("fs");
  const path = require("path");
  const contractsDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");

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
        Exchange: exchange.address,
      },
      undefined,
      2
    )
  );

  const TokenArtifact = artifacts.readArtifactSync("Token");
  fs.writeFileSync(path.join(contractsDir, "Token.json"), JSON.stringify(TokenArtifact, null, 2));

  const MyNFTArtifact = artifacts.readArtifactSync("MyNFT");
  fs.writeFileSync(path.join(contractsDir, "MyNFT.json"), JSON.stringify(MyNFTArtifact, null, 2));

  const NFTMarketArtifact = artifacts.readArtifactSync("NFTMarket");
  fs.writeFileSync(path.join(contractsDir, "NFTMarket.json"), JSON.stringify(NFTMarketArtifact, null, 2));

  const ExchangeArtifact = artifacts.readArtifactSync("Exchange");
  fs.writeFileSync(path.join(contractsDir, "Exchange.json"), JSON.stringify(ExchangeArtifact, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
