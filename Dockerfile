# --- Common Build Stage ---
FROM node:18-alpine as base
# Install bash on Alpine
RUN apk add --no-cache git
WORKDIR /app
# Copy package files and install dependencies
COPY app/package*.json ./

RUN npm install
# Copy entire repository (includes both "app" and frontend, etc.)

COPY ./app  ./
COPY ./frontend/src/contracts/* ./frontend/src/contracts/

# --- hardhat-node Target ---
FROM base as hardhat-node
# Copy the startup script into the image
COPY bin/deploy-and-commit /app/deploy-and-commit
# Ensure the script is executable
RUN chmod +x /app/deploy-and-commit
# Expose the Hardhat node RPC port
EXPOSE 8545
# Start the Hardhat node
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]