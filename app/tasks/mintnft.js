const fs = require("fs");
const { task } = require("hardhat/config");

task("mintnft", "Mints an NFT to an address")
  .addPositionalParam("receiver", "The address that will receive the NFT")
  // Remove tokenURI default if you want it generated automatically.
  .setAction(async ({ receiver }, { ethers, network }) => {
    if (network.name === "hardhat") {
      console.warn(
        "You are running the task on the Hardhat network, which gets automatically created and destroyed. Use '--network localhost' instead."
      );
    }

    const addressesFile =
      __dirname + "/../../frontend/src/contracts/contract-address.json";
    if (!fs.existsSync(addressesFile)) {
      console.error("You need to deploy your contracts first");
      return;
    }

    const addressesJson = fs.readFileSync(addressesFile);
    const addresses = JSON.parse(addressesJson);

    if ((await ethers.provider.getCode(addresses.MyNFT)) === "0x") {
      console.error("You need to deploy your NFT contract first");
      return;
    }

    // Get the NFT contract instance
    const myNFT = await ethers.getContractAt("MyNFT", addresses.MyNFT);

    // Determine the next token id by counting Transfer events from the zero address (mint events)
    const mintFilter = myNFT.filters.Transfer(
      "0x0000000000000000000000000000000000000000"
    );
    const mintEvents = await myNFT.queryFilter(mintFilter);
    const nextTokenId = mintEvents.length + 1;

    // Create new metadata URI dynamically (adjust the URL as needed)
    const tokenURI = `https://blockchain-project-live.vercel.app/metadata/${nextTokenId}.json`;

    const tx = await myNFT.mintNFT(receiver, tokenURI);
    await tx.wait();

    console.log(`NFT minted to ${receiver} with tokenURI: ${tokenURI}`);
  });
