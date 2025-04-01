# --- Common Build Stage ---
FROM node:18-alpine as base

WORKDIR /app
# Copy package files and install dependencies
COPY app/package*.json app/yarn.lock ./

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