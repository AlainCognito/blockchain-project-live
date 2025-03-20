# --- Common Build Stage ---
    FROM node:18-alpine as base
    WORKDIR /app
    # Copy package files and install dependencies
    COPY package*.json ./
    RUN npm install
    # Copy entire repository (includes both "app" and frontend, etc.)
    COPY . .
    
    # --- hardhat-node Target ---
    FROM base as hardhat-node
    # Expose the Hardhat node RPC port
    EXPOSE 8545
    CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
    
    # --- Deployer Target ---
    FROM base as deployer
    # Install git and bash (git is needed for commit/push)
    RUN apk add --no-cache git bash curl
    CMD ["bash", "-c", "\
      set -e && \
      cd app && \
      echo 'Running deploy script...' && \
      npx hardhat run scripts/deploy.js --network localhost && \
      cd .. && \
      echo 'Fetching ngrok tunnel public URL...' && \
      PUBLIC_URL=$(curl -s http://ngrok:4040/api/tunnels | jq -r '.tunnels[0].public_url') && \
      echo $PUBLIC_URL > frontend/config.js && \
      echo 'Artifact created with public URL:' && cat frontend/config.js && \
      echo 'Checking for artifact changes...' && \
      CHANGED_FILES=$(git status --porcelain frontend/config.js frontend/src/contracts/contract-address.json frontend/src/contracts/Token.json frontend/src/contracts/MyNFT.json frontend/src/contracts/NFTMarket.json) && \
      
      if [ -n \"$CHANGED_FILES\" ]; then \
        echo 'Artifact changes detected, committing and pushing to master...' && \
        git add frontend/config.js frontend/src/contracts/contract-address.json frontend/src/contracts/Token.json frontend/src/contracts/MyNFT.json frontend/src/contracts/NFTMarket.json && \
        git commit -m \"chore: update deployed contract addresses\" && \
        git push github master && \
        echo 'Commit and push complete.'; \
      else \
        echo 'No changes in contract artifacts. Nothing to commit.'; \
      fi"]<