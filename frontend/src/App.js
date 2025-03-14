import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Dapp } from "./components/Dapp";
import { NFTMarketplace } from "./components/NFTMarketplace";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dapp />} />
        <Route path="/nft-marketplace" element={<NFTMarketplace />} />
      </Routes>
    </Router>
  );
}

export default App;
