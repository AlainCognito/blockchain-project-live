import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/react"

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";
import { Link } from "react-router-dom";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TokenArtifact from "../contracts/Token.json";
import MyNFTArtifact from "../contracts/MyNFT.json";
import contractAddress from "../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransferNFT } from "./TransferNFT";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";
import { NFTGallery } from "./NFTGallery";

// This is the default id used by the Hardhat Network
const HARDHAT_NETWORK_ID = "31337";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      selectedTokenId: null,
      // Add a state attribute for NFT count
      nftsCount: 0,
    };

    this.state = this.initialState;
  }

  async componentDidMount() {
    if (window.ethereum) {
      // Add a listener for account changes
      window.ethereum.on("accountsChanged", this.handleAccountsChanged);

      // Check if an account is already connected
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        // Initialize the app with the connected account.
        this._initialize(accounts[0]);
      }
    }
  }

  componentWillUnmount() {
    // Remove the accountsChanged listener
    if (window.ethereum && window.ethereum.removeListener) {
      window.ethereum.removeListener(
        "accountsChanged",
        this.handleAccountsChanged
      );
    }
    this._stopPollingData();
  }

  render() {
    <SpeedInsights />
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install a wallet.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <>
        {/* Full-width Wallet Zone Header */}
        <div className="wallet-zone-container">
          <div className="container-fluid">
            <div className="row">
              <div className="col text-start">
                <style>{`
                  .wallet-zone-header {
                    display: flex;
                    align-items: baseline;

                    
                  }
                  .wallet-zone-header h2 {
                    margin: 0;
                  
                    }
                `}</style>
                <div className="wallet-zone-header" style={{ position: "relative", left: "20px", top: "0px" }}>
                  <h1 className="display-6 text-warning">Wallet</h1>
                  <h1 className="display-6 text-secondary ml-2">Zone</h1>
                </div>
                <p className="lead text-left text-secondary mt-2" style={{ position: "relative", left: "20px" }}>
                  This is a simple app that allows you to transfer tokens and NFTs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed-width content */}
        <div className="container p-4">
          {/* Token Data Header */}
          <div className="row mt-4">
            <div className="col">
              <h4 className="display-6 text-warning">
                {this.state.tokenData.name}{" "}
                <small className="text-muted">({this.state.tokenData.symbol})</small>
              </h4>
              <p className="lead">
                Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
                <b>
                  {this.state.balance.toString()} {this.state.tokenData.symbol}
                </b>.
              </p>
            </div>
          </div>

          <hr />

          <div className="row">
            <div className="col-12">
              {this.state.txBeingSent && (
                <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
              )}
              {this.state.transactionError && (
                <TransactionErrorMessage
                  message={this._getRpcErrorMessage(this.state.transactionError)}
                  dismiss={() => this._dismissTransactionError()}
                />
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              {this.state.balance.eq(0) && (
                <>
                  <NoTokensMessage selectedAddress={this.state.selectedAddress} />
                  <Link to="/exchange-tokens" className="btn btn-success mr-2">
                    Buy JFP Tokens
                  </Link>
                </>
              )}
              {this.state.balance.gt(0) && (
                <Transfer
                  className="btn btn-secondary"
                  transferTokens={(to, amount) => this._transferTokens(to, amount)}
                  tokenSymbol={this.state.tokenData.symbol}
                />
              )}
            </div>
          </div>
          <hr />

          {/* NFT Gallery and NFT Transfer arranged side by side */}
          <div className="row">
            <div className="col-md-8">
              <NFTGallery
                myNFTContract={this._myNFT}
                account={this.state.selectedAddress}
                onSelectNFT={this._selectNFT}
                onNFTCountUpdate={(count) => this.setState({ nftsCount: count })}
              />
            </div>
            {this.state.nftsCount > 0 && (
              <div className="col-md-4">
                <TransferNFT
                  transferNFT={(to, tokenId) => this._transferNFT(to, tokenId)}
                  tokenId={this.state.selectedTokenId}
                />
              </div>
            )}
          </div>

          {/* Existing navigation links */}
          <Link
            to="/nft-marketplace"
            state={{ account: this.state.selectedAddress }}
            className="btn btn-warning mr-2"
          >
            Visit NFT Marketplace
          </Link>
          <Link to="/help" className="btn custom-transparent-btn">
            Help
          </Link>
        </div>
      </>
    );
  }

  // New method to handle account changes
  handleAccountsChanged = (accounts) => {
    this._stopPollingData();
    if (accounts.length === 0) {
      // No account connected, reset the state
      this._resetState();
    } else {
      // Reinitialize with the new account
      this._initialize(accounts[0]);
    }
  };

  async _connectWallet() {
    // When user clicks Connect, request accounts and let the listener do the rest
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    this._checkNetwork();
    this._initialize(selectedAddress);
  }

  _initialize(userAddress) {
    // Store the user's address in the component state.
    this.setState({
      selectedAddress: userAddress,
    });

    // Propagate the account to the parent so that the NavBar updates.
    if (this.props.setAccount) {
      this.props.setAccount(userAddress);
    }

    // Then initialize ethers, fetch token data, and start polling.
    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    if (this.props.setProvider) {
      this.props.setProvider(this._provider);
    }

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._token = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      this._provider.getSigner(0)
    );

    if (this.props.setTokenContractAddress) {
      this.props.setTokenContractAddress(this._token.address);
    }

    this._myNFT = new ethers.Contract(
      contractAddress.MyNFT,
      MyNFTArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  // This method sends an ethereum transaction to transfer tokens.
  // While this action is specific to this application, it illustrates how to
  // send a transaction.
  async _transferTokens(to, amount) {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    //
    // This method handles all of those things, so keep reading to learn how to
    // do it.

    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      this._dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await this._token.transfer(to, amount);
      this.setState({ txBeingSent: tx.hash });

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._updateBalance();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  async _transferNFT(to, tokenId) {
    try {
      this._dismissTransactionError();

      const tx = await this._myNFT.transferFrom(
        this.state.selectedAddress,
        to,
        tokenId
      );
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _selectNFT = (tokenId) => {
    this.setState({ selectedTokenId: tokenId });
  };

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    // Reset the Dapp's state.
    this.setState(this.initialState);

    // Clear the account in the parent as well.
    if (this.props.setAccount) {
      this.props.setAccount(null);
    }
  }

  async _switchChain() {
    const chainIdHex = `0x${HARDHAT_NETWORK_ID.toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  // This method checks if the selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }
}
