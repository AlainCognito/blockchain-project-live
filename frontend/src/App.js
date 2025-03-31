import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Dapp } from "./components/Dapp";
import { NFTMarketplace } from "./components/NFTMarketplace";
import { Help } from "./components/Help";
import { CreateWallet } from "./components/CreateWallet";
import { NavBar } from "./components/NavBar";
import { PriceChart } from "./components/PriceChart";

function App() {

  const [account, setAccount] = useState(null);

  return (
    <Router>
      <NavBar account={account} />
      <Routes>
        <Route path="*" element={<Dapp account={account} setAccount={setAccount} />} />
        <Route path="/nft-marketplace" element={<NFTMarketplace />} />
        <Route path="/help" element={<Help />} />
        <Route path="/create-wallet" element={<CreateWallet />} />
        <Route path="/charting" element={<PriceChart />} />
      </Routes>
    </Router>
  );
}

export default App;
