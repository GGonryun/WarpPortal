#!/bin/bash

set -e  # Exit immediately if a command fails

# Define repo and target directory
REPO_URL="https://github.com/gmjosack/nss_http.git"
TARGET_DIR="/usr/local/src/nss_http"

# Ensure the target directory exists
sudo mkdir -p "$TARGET_DIR"

# Clone the repository
if [ -d "$TARGET_DIR/.git" ]; then
    echo "🔄 Repository already exists in $TARGET_DIR. Pulling latest changes..."
    cd "$TARGET_DIR"
    sudo git pull
else
    echo "🌱 Cloning repository into $TARGET_DIR..."
    sudo git clone "$REPO_URL" "$TARGET_DIR"
    cd "$TARGET_DIR"
fi

# Change ownership to the current user (so we can build without sudo)
sudo chown -R "$USER":"$USER" "$TARGET_DIR"
cd libnss_http

# Install dependencies
echo "📦 Installing required dependencies..."
sudo apt update
sudo apt install -y build-essential libcurl4-openssl-dev libjansson-dev

# Run make and make install
echo "⚙️  Building nss_http..."
make -j$(nproc)

echo "🚀 Installing nss_http..."
sudo make install

echo "✅ Installation complete! 🎉"
