# --- Stage 1: Builder ---
    FROM node:18 as builder
    WORKDIR /app
    
    # Copy package.json (and package-lock.json if available) and install dependencies
    COPY app/package*.json ./
    RUN npm install
    
    # Copy the rest of your application
    COPY app/ ./
    
    # --- Stage 2: Runtime ---
    FROM node:18
    WORKDIR /app
    
    # Copy the built app from the builder stage
    COPY --from=builder /app ./
    
    # Expose the Hardhat node RPC port and set the command to just run the node
    EXPOSE 8545
    CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]