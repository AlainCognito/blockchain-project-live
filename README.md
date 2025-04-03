# Hardhat Boilerplate

This repository contains a sample project that you can use as the starting point
for your Ethereum project. It's also a great fit for learning the basics of
smart contract development.

This project is intended to be used with the
[Hardhat Beginners Tutorial](https://hardhat.org/tutorial), but you should be
able to follow it by yourself by reading the README and exploring its
`contracts`, `tests`, `scripts` and `frontend` directories.

This Project relies on : -For the backend- Docker to contenairize (?) both running the local node and ngrok to produce a valid RPC url for it without having to mind about port forwarding, and -For the frontend - vercel to host and deploy the static frontend. The contracts addresses are updated by a wrapper after every deployment.

## Quick start

The first things you need to do are cloning this repository, and installing docker-compose and dependencies

```sh
git clone https://gitlab.telecomnancy.univ-lorraine.fr/projets/2425/darkduck25/groupe08
cd groupe08
```

Then you need to run a local node, I provided and dockerfile to do it inside a container :

```sh
docker-compose up --build #-d to do it in detached mode (background)
```

To stop the docker services run :

```sh
docker-compose down
```

Open [Vercel app](https://blockchain-project-live.vercel.app/). You will
need to have [Coinbase Wallet](https://www.coinbase.com/wallet) or [Metamask](https://metamask.io) installed and listening to
`ngrok address`.

## User Guide

You can find detailed instructions on using this repository and many tips in [its documentation](https://hardhat.org/tutorial).

- [Writing and compiling contracts](https://hardhat.org/tutorial/writing-and-compiling-contracts/)
- [Setting up the environment](https://hardhat.org/tutorial/setting-up-the-environment/)
- [Testing Contracts](https://hardhat.org/tutorial/testing-contracts/)
- [Setting up your wallet](https://hardhat.org/tutorial/boilerplate-project#how-to-use-it)
- [Hardhat's full documentation](https://hardhat.org/docs/)

For a complete introduction to Hardhat, refer to [this guide](https://hardhat.org/getting-started/#overview).

## What's Included?

This repository uses our recommended hardhat setup, by using our [`@nomicfoundation/hardhat-toolbox`](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox). When you use this plugin, you'll be able to:

- Deploy and interact with your contracts using [ethers.js](https://docs.ethers.io/v5/) and the [`hardhat-ethers`](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-ethers) plugin.
- Test your contracts with [Mocha](https://mochajs.org/), [Chai](https://chaijs.com/) and our own [Hardhat Chai Matchers](https://hardhat.org/hardhat-chai-matchers) plugin.
- Interact with Hardhat Network with our [Hardhat Network Helpers](https://hardhat.org/hardhat-network-helpers).
- Verify the source code of your contracts with the [hardhat-etherscan](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan) plugin.
- Get metrics on the gas used by your contracts with the [hardhat-gas-reporter](https://github.com/cgewecke/hardhat-gas-reporter) plugin.
- Measure your tests coverage with [solidity-coverage](https://github.com/sc-forks/solidity-coverage).

This project also includes [a sample frontend/Dapp](./frontend), which uses [Create React App](https://github.com/facebook/create-react-app).

## Troubleshooting

- `Invalid nonce` errors: if you are seeing this error on the `npx hardhat node`
  console, try resetting your Metamask account. This will reset the account's
  transaction history and also the nonce. Open Metamask, click on your account
  followed by `Settings > Advanced > Clear activity tab data`.

**Happy _building_!**

## TODO LIST

-[x] Figure out a way to host private blockchain node, and link metamask wallet to it\
-- I will be running both\
**The App works great with multiple clients** -[x] Next step is building correct logic behind nft minting, giving some MHT to first connexions, making bids and auctions work...\
**Not sure about auctions** -[x] Improved UX\
-[~] Need to add a pipeline to push artifacts automatically when gitlab is fixed | gitlab autorunner doesn't work (cant pull docker images) \
-[~] ~Maybe add mail logins ? | kinda irrelevant~\
-[] What I do want is a recap of nfts valuation over the past x days/weeks | + add value randomizer for on sale NFTs / maybe token :\
Step 1 : --[x] Related -> I need to set up a trade functionnality : accounts can trade ETH and JFP, in the end the value simulation of JFP will be a basic supply and demand law against the real value of ETH\
Step 2 : --[x] Fetching tokens value against ETH (node) value, can do the same for NFTs\
Step + : --[] Need to implement token ETH change rate algorithm + can adapt ETH usd value with MockAggregator\
(?)-[] Still havent implemented auctions and bidding

\
UX Tweaks :\
-[x] Need to update App account on account change, need to reset it on page reload (will maybe need to change whole logic)\
--[] Related -> need to actually load NFTMarket on page reload\
-[] Need to find a way to display USD value of stuff when relevant
