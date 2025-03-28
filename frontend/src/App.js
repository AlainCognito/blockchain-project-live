import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Dapp } from "./components/Dapp";
import { NFTMarketplace } from "./components/NFTMarketplace";
import { Help } from "./components/Help";
import { CreateWallet } from "./components/CreateWallet";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<Dapp />} />
        <Route path="/nft-marketplace" element={<NFTMarketplace />} />
        <Route path="/help" element={<Help />} />
        <Route path="/create-wallet" element={<CreateWallet />} />
      </Routes>
    </Router>
  );
}

export default App;
