# --- Common Build Stage ---
FROM node:18-alpine as base
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
COPY bin/start.sh /app/start.sh
# Ensure the script is executable
RUN chmod +x /app/start.sh
# Expose the Hardhat node RPC port
EXPOSE 8545
# Use the custom startup script as the container command
CMD ["sh", "/app/start.sh"]