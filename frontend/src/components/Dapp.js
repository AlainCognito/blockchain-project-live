import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";

import TokenArtifact from "../contracts/Token.json";
import MyNFTArtifact from "../contracts/MyNFT.json";
import ExchangeArtifact from "../contracts/Exchange.json";
import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransferNFT } from "./TransferNFT";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";
import { NFTGallery } from "./NFTGallery";
import { ExchangeTokens } from "./ExchangeTokens";

const HARDHAT_NETWORK_ID = "31337";
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);
    this.initialState = {
      tokenData: undefined,
      selectedAddress: undefined,
      balance: undefined,
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      selectedTokenId: null,
      nftsCount: 0,
    };
    this.state = this.initialState;
  }

  /* Lifecycle Methods */
  async componentDidMount() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", this.handleAccountsChanged);
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        this._initialize(accounts[0]);
      }
    }
  }

  componentWillUnmount() {
    if (window.ethereum && window.ethereum.removeListener) {
      window.ethereum.removeListener("accountsChanged", this.handleAccountsChanged);
    }
    this._stopPollingData();
  }

  /* Render Method */
  render() {
    <SpeedInsights />;
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }
    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    return (
      <>
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
                <div className="wallet-zone-header" style={{ position: "relative", left: "20px" }}>
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
        <div className="container p-4">
          <div className="row mt-4">
            <div className="col">
              <h4 className="display-6 text-warning">
                {this.state.tokenData.name}{" "}
                <small className="text-muted">({this.state.tokenData.symbol})</small>
              </h4>
              <p className="lead">
                Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
                <b>{ethers.utils.formatUnits(this.state.balance, 12)} {this.state.tokenData.symbol}</b>.
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
              {this.state.balance.eq(0) ? (
                <>
                  <NoTokensMessage selectedAddress={this.state.selectedAddress} />
                  {/* <Link to="/exchange-tokens" className="btn btn-success mr-2">
                    Buy JFP Tokens
                  </Link> */}
                  <ExchangeTokens
                    onBuy={(ethAmount) => this._buyTokens(ethAmount)}
                    onlyBuy={true}
                  />
                </>
              ) : (
                <>
                  <ExchangeTokens
                    onBuy={(ethAmount) => this._buyTokens(ethAmount)}
                    onSell={(sellTokenAmount) => this._sellTokens(sellTokenAmount)}
                  />
                  <Transfer
                    className="btn btn-secondary"
                    transferTokens={(to, amount) => this._transferTokens(to, amount)}
                    tokenSymbol={this.state.tokenData.symbol}
                  />

                  {/* <Link to="/exchange-tokens" className="btn btn-success mr-2">
                    Buy JFP Tokens
                  </Link> */}
                </>
              )}
            </div>
          </div>
          <hr />
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
          <p>{this.state.reserves ? this.state.reserves.toString() : ""}</p>
          <p>{this.state.price ? this.state.price.toString() : ""}</p>
        </div>
      </>
    );
  }

  /* Event Handlers */
  handleAccountsChanged = (accounts) => {
    this._stopPollingData();
    if (accounts.length === 0) {
      this._resetState();
    } else {
      this._initialize(accounts[0]);
    }
  };

  /* Initialization Methods */
  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    this._checkNetwork();
    this._initialize(selectedAddress);
  }

  async _initialize(userAddress) {
    this.setState({ selectedAddress: userAddress });
    if (this.props.setAccount) {
      this.props.setAccount(userAddress);
    }
    await this._initializeEthers();
    await this._getTokenData();
    await this._loadReserves();
    await this._loadPrices();
    this._startPollingData();
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    if (this.props.setProvider) {
      this.props.setProvider(this._provider);
    }
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
    this._exchange = new ethers.Contract(
      contractAddress.Exchange,
      ExchangeArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();
    this.setState({ tokenData: { name, symbol } });
  }

  async _loadReserves() {
    try {
      const reserves = await this._exchange.getReserves();
      this.setState({ reserves });
    } catch (error) {
      console.error("Error loading reserves:", error);
    }
  }

  async _loadPrices() {
    try {
      const price = await this._exchange.getEthUsdPrice();
      this.setState({ price });
    } catch (error) {
      console.error("Error loading prices:", error);
    }
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  /* Transaction Methods */
  async _transferTokens(to, amount) {
    try {
      this._dismissTransactionError();
      const parsedAmount = ethers.utils.parseUnits(amount.toString(), 12);
      const tx = await this._token.transfer(to, parsedAmount);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error("Transaction failed");
      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _transferNFT(to, tokenId) {
    try {
      this._dismissTransactionError();
      const tx = await this._myNFT.transferFrom(this.state.selectedAddress, to, tokenId);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error("Transaction failed");
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _buyTokens(ethAmount) {
    try {
      this._dismissTransactionError();
      const value = ethers.utils.parseEther(ethAmount.toString());
      const tx = await this._exchange.buyTokens({ value });
      this.setState({ txBeingSent: tx.hash });
      await tx.wait();
      alert("Tokens purchased successfully!");
      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
      console.error("Error buying tokens:", error);
      this.setState({ transactionError: error, txBeingSent: undefined });
      alert("Error buying tokens. See console for details.");
    }
  }

  async _sellTokens(sellTokenAmount) {
    try {
      this._dismissTransactionError();
      const amountToSell = ethers.utils.parseUnits(sellTokenAmount.toString(), 12);
      const approveTx = await this._token.approve(this._exchange.address, amountToSell);
      await approveTx.wait();
      const tx = await this._exchange.sellTokens(amountToSell);
      this.setState({ txBeingSent: tx.hash });
      await tx.wait();
      alert("Tokens sold successfully!");
      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
      console.error("Error selling tokens:", error);
      this.setState({ transactionError: error, txBeingSent: undefined });
      alert("Error selling tokens. See console for details.");
    }
  }

  /* Utility Methods */
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _getRpcErrorMessage(error) {
    return error.data ? error.data.message : error.message;
  }

  _selectNFT = (tokenId) => {
    this.setState({ selectedTokenId: tokenId });
  };

  _resetState() {
    this.setState(this.initialState);
    if (this.props.setAccount) {
      this.props.setAccount(null);
    }
  }

  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
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
}
