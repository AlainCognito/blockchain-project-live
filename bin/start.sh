#!/bin/sh
# filepath: /home/alexis/Documents/Blockchain/groupe08/start.sh
# Change to the work directory
cd /app

# Start hardhat node in the background
npx hardhat node --hostname 0.0.0.0 &
# Wait for the hardhat node to be available on port 8545
npx wait-on http://127.0.0.1:8545

# Deploy contracts to the dockerized node
npx hardhat run scripts/deploy.js --network localhost

# Prevent the container from exiting
tail -f /dev/null