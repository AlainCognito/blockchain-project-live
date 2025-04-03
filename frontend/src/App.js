import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Dapp } from "./components/Dapp";
import { NavBar } from "./components/NavBar";
import { NFTMarketplace } from "./components/NFTMarketplace";
import { Help } from "./components/Help";
import { CreateWallet } from "./components/CreateWallet";
import { PriceChart } from "./components/PriceChart";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [tokenContractAddress, setTokenContractAddress] = useState(null);
  // New states for contract instances
  const [myNFTContract, setMyNFTContract] = useState(null);
  const [nftMarketContract, setNftMarketContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [USDperToken, setUSDperToken] = useState(null);

  useEffect(() => {
    // Load account from localStorage on mount
    const savedAccount = localStorage.getItem("account");
    if (savedAccount) {
      setAccount(savedAccount);
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        // Update account using the same logic as handleSetAccount
        handleSetAccount(accounts.length > 0 ? accounts[0] : null);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const handleSetAccount = (acc) => {
    setAccount(acc);
    // Save the account state to localStorage so it persists
    if (acc) {
      localStorage.setItem("account", acc);
    } else {
      localStorage.removeItem("account");
    }
  };

  return (
    <Router>
      <NavBar account={account} />
      <Routes>
        <Route path="*" element={
          <Dapp
            account={account}
            setAccount={handleSetAccount}
            setProvider={setProvider}
            setTokenContractAddress={setTokenContractAddress}
            setMyNFTContract={setMyNFTContract}       // pass setter props
            setNftMarketContract={setNftMarketContract}
            setTokenContract={setTokenContract}
            setUSDperToken={setUSDperToken}
          />
        } />
        <Route
          path="/nft-marketplace"
          element={
            <NFTMarketplace
              account={account}
              myNFTContract={myNFTContract}
              nftMarketContract={nftMarketContract}
              tokenContract={tokenContract}
              USDperToken={USDperToken}
            />
          }
        />
        <Route path="/help" element={<Help />} />
        <Route path="/create-wallet" element={<CreateWallet />} />
        <Route path="/price-chart" element={<PriceChart provider={provider} tokenContractAddress={tokenContractAddress} />} />
      </Routes>
    </Router>
  );
}

export default App;
