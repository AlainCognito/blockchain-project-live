// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");
const fs = require("fs");

async function mintAllNFTs(myNFT, deployer, myNFTMarket, token) {
  // Base URL and extension for the remote metadata files.
  // If your metadata files are stored in a subfolder, add it here (e.g., "ipfs://.../metadata/")
  const base_url = "ipfs://bafybeigl6tkcla3dqzwqfgvcatw4lyj5p64xwknnmcf5vpuichrttwcq3q/";
  const base_extension = ".json";

  // Read and split names.txt (adjust path as needed)
  const namesFilePath = require("path").join(__dirname, "..", "names.txt");
  const namesContent = require("fs").readFileSync(namesFilePath, "utf8");
  const names = namesContent.split(/\r?\n/).filter((line) => line.trim() !== "");

  // Iterate over each line from names.txt
  for (const name of names) {
    // Trim extra whitespace. Then remove all spaces to match your metadata naming convention.
    const trimmedName = name.trim();
    const sanitizedName = trimmedName.replace(/\s/g, "");
    // Construct the remote_address: e.g. "ipfs://.../DALL·E2024-12-1010.41.49-Ayellowrubberduck...Th.jpg.json"
    const remote_address = base_url + sanitizedName + base_extension;

    console.log(`Minting NFT with metadata URL: ${remote_address}`);

    // Mint the NFT using the remote_address
    const tx = await myNFT.mintNFT(deployer.address, remote_address);
    const receipt = await tx.wait();
    console.log(`NFT minted successfully for ${remote_address}.`);

    // Retrieve tokenId from Transfer event
    const tokenId = receipt.events.find((event) => event.event === "Transfer").args.tokenId;

    // Approve marketplace transfers
    const approveTx = await myNFT.approve(myNFTMarket.address, tokenId);
    await approveTx.wait();
    console.log(`NFT ${tokenId} approved.`);

    // Set your desired fixed price (adjust unit if needed)
    const price = ethers.utils.parseUnits("10000", 12);
    const approveTokenTx = await token.approve(myNFTMarket.address, price);
    await approveTokenTx.wait();
    console.log(`Creating market listing for NFT ${tokenId} at price ${price}...`);

    const listTx = await myNFTMarket.createMarketItem(myNFT.address, tokenId, price);
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

  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  // 8 decimals, initial answer = 3000 * 10^8 = 3000e8
  const decimals = 8;
  const initialAnswer = ethers.BigNumber.from("300000000000"); // 3000 * 10^8
  const mockAggregator = await MockV3Aggregator.deploy(decimals, initialAnswer);
  await mockAggregator.deployed();
  console.log("MockAggregator deployed at:", mockAggregator.address);

  const priceFeedAddress = mockAggregator.address;


  const PRICE = ethers.BigNumber.from("1000000000000000"); // 1,000,000,000,000 wei (0.001 ETH)

  // Deploy Exchange contract with token address and initial price
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(token.address, PRICE, priceFeedAddress);
  await exchange.deployed();
  console.log("Exchange deployed to:", exchange.address);

  // Owner approves Exchange to spend tokens for liquidity deposit.
  const tokenDecimals = await token.decimals();

  const liquidityTokens = ethers.utils.parseUnits("1000001", tokenDecimals);
  await token.approve(exchange.address, liquidityTokens);
  // Deposit liquidity: deposit 1,000,000 tokens and 1 ETH(which at the price gives a rate of 1 ETH per 1M tokens)
  await exchange.depositLiquidity(liquidityTokens, { value: ethers.utils.parseEther("9000") });
  console.log("Liquidity deposited to Exchange");

  // Proceed with minting NFTs and saving frontend files (unchanged)
  await mintAllNFTs(myNFT, deployer, myNFTMarket, token);
  saveFrontendFiles(token, myNFT, myNFTMarket, exchange, mockAggregator);
}

function saveFrontendFiles(token, myNFT, nftMarket, exchange, mockAggregator) {
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
        MockV3Aggregator: mockAggregator.address,
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

  const MockV3AggregatorArtifact = artifacts.readArtifactSync("MockV3Aggregator");
  fs.writeFileSync(path.join(contractsDir, "MockV3Aggregator.json"), JSON.stringify(MockV3AggregatorArtifact, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
