
// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require("chai");

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage or Hardhat Network's snapshot functionality.
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// `describe` is a Mocha function that allows you to organize your tests.
// Having your tests organized makes debugging them easier. All Mocha
// functions are available in the global scope.
//
// `describe` receives the name of a section of your test suite, and a
// callback. The callback must define the tests of that section. This callback
// can't be an async function.
describe("MyNFT contract", function () {
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  async function deployMyNFTFixture() {
    // Get the ContractFactory and Signers here.
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const [owner, addr1, addr2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    const hardhatNFT = await MyNFT.deploy();

    await hardhatNFT.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { MyNFT, hardhatNFT, owner, addr1, addr2 };
  }

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.
//
    // If the callback function is async, Mocha will `await` it.
    it("Should set the right owner", async function () {
      // We use loadFixture to setup our environment, and then assert that
      // things went well
      const { hardhatNFT, owner } = await loadFixture(deployMyNFTFixture);

      // Expect receives a value and wraps it in an assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be
      // equal to our Signer's owner.
      expect(await hardhatNFT.owner()).to.equal(owner.address);
    });

    it("Should mint a new NFT", async function () {
      const { hardhatNFT, owner } = await loadFixture(deployMyNFTFixture);
      await expect(hardhatNFT.mintNFT(owner.address, "https://token.com"))
        .to.emit(hardhatNFT, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 1);
  });

//   describe("Transactions", function () {
//     it("Should transfer tokens between accounts", async function () {
//       const { hardhatNFT, owner, addr1, addr2 } = await loadFixture(deployNFTFixture);
//       Transfer 50 tokens from owner to addr1
//       await expect(hardhatNFT.transfer(addr1.address, 50))
//         .to.changeTokenBalances(hardhatNFT, [owner, addr1], [-50, 50]);

//       Transfer 50 tokens from addr1 to addr2
//       We use .connect(signer) to send a transaction from another account
//       await expect(hardhatNFT.connect(addr1).transfer(addr2.address, 50))
//         .to.changeTokenBalances(hardhatNFT, [addr1, addr2], [-50, 50]);
//     });

//     it("should emit Transfer events", async function () {
//       const { hardhatNFT, owner, addr1, addr2 } = await loadFixture(deployNFTFixture);

//       Transfer 50 tokens from owner to addr1
//       await expect(hardhatNFT.transfer(addr1.address, 50))
//         .to.emit(hardhatNFT, "Transfer").withArgs(owner.address, addr1.address, 50)

//       Transfer 50 tokens from addr1 to addr2
//       We use .connect(signer) to send a transaction from another account
//       await expect(hardhatNFT.connect(addr1).transfer(addr2.address, 50))
//         .to.emit(hardhatNFT, "Transfer").withArgs(addr1.address, addr2.address, 50)
//     });

//     it("Should fail if sender doesn't have enough tokens", async function () {
//       const { hardhatNFT, owner, addr1 } = await loadFixture(deployNFTFixture);
//       const initialOwnerBalance = await hardhatNFT.balanceOf(
//         owner.address
//       );

//       Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
//       `require` will evaluate false and revert the transaction.
//       await expect(
//         hardhatNFT.connect(addr1).transfer(owner.address, 1)
//       ).to.be.revertedWith("Not enough tokens");

//       Owner balance shouldn't have changed.
//       expect(await hardhatNFT.balanceOf(owner.address)).to.equal(
//         initialOwnerBalance
//       );
//     });
//   });
});
});
