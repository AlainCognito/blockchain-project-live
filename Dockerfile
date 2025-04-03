# --- Common Build Stage ---
FROM node:18-alpine as base

WORKDIR /app
# Copy package files and install dependencies
COPY app/package.json app/yarn.lock ./

RUN apk add --no-cache git
RUN yarn install
# --- hardhat-node Target ---
FROM base as hardhat-node

EXPOSE 8545
# Start the Hardhat node
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]



# --- ngrok Target ---  
FROM wernight/ngrok:latest as ngrok 
USER root
RUN apk add jq

# # --- IPFS Target ---
# FROM ipfs/kubo:v0.34.1 as ipfs
# RUN mkdir -p /container-init.d
# # Copy your custom ipfs entrypoint script into container-init.d
# COPY bin/ipfs_entrypoint.sh /container-init.d/ipfs_entrypoint.sh
# RUN chmod +x /container-init.d/ipfs_entrypoint.sh