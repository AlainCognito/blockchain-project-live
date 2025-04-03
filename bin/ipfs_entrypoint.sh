#!/bin/sh
# Initialize IPFS repository (if not already initialized)
ipfs init

# Start the IPFS daemon in the background
ipfs daemon &
echo "Waiting for IPFS daemon to start..."
until ipfs id > /dev/null 2>&1; do
    sleep 1
done
echo "IPFS daemon is ready."

# Remove any old MFS folder at /export (ignore errors)
ipfs files rm -r /export || true
# Create a new MFS directory at /export
ipfs files mkdir /export

# Add the contents of /export from the container’s filesystem (the mounted volume)
# and retrieve the directory hash (-Q returns only the root hash)
ROOT_HASH=$(ipfs add -r --quiet -Q /export)
echo "Importing files to MFS with hash: $ROOT_HASH"

# Copy the files from the IPFS path into MFS at /export
ipfs files cp /ipfs/$ROOT_HASH /export

echo "MFS sync complete."

# Keep the container running
wait