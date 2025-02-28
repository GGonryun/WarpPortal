#!/bin/bash

set -e  # Exit immediately if a command fails

# Define repo and target directory
REPO_URL="https://github.com/gmjosack/nss_http.git"
TARGET_DIR="/usr/local/src/nss_http"
CA_PUBLIC_KEY=

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
echo "✅ Dependencies installed!"

# Run make and make install
echo "⚙️  Building nss_http..."
make
echo "✅ Build complete!"

echo "🚀 Installing nss_http..."
sudo make install
echo "✅ Installation complete! 🎉"

# insert http into nsswitch.conf
echo "🔧 Updating nsswitch.conf..."
sudo sed -i.bak 's/^passwd:.*/# &\npasswd:         files systemd http/' /etc/nsswitch.conf
sudo sed -i.bak 's/^group:.*/# &\ngroup:          files systemd http/' /etc/nsswitch.conf
sudo sed -i.bak 's/^shadow:.*/# &\nshadow:         files http/' /etc/nsswitch.conf

echo "✅ nsswitch.conf updated!"

# configure sshd_config with trusted ca.
echo "🔧 Updating sshd_config..."
# if there is a line that starts with TrustedUserCAKeys, comment it out 
sudo sed -i.bak 's/^TrustedUserCAKeys/# &/' /etc/ssh/sshd_config
# insert the TrustedUserCAKeys line at the end of the file
echo "TrustedUserCAKeys /etc/ssh/ca.pub" | sudo tee -a /etc/ssh/sshd_config > /dev/null
echo "✅ sshd_config updated!"

# save the public key to /etc/ssh/ca.pub
echo "🔑 Saving public key to /etc/ssh/ca.pub..."
echo "$CA_PUBLIC_KEY" | sudo tee /etc/ssh/ca.pub > /dev/null
sudo chown root:root /etc/ssh/ca.pub
sudo chmod 644 /etc/ssh/ca.pub
echo "✅ Public key saved!"

# modify my pam.d config to allow NSS-based users
echo "🔧 Updating /etc/pam.d/sshd..."
sudo sed -i '/pam_permit.so\|pam_unix.so\|pam_mkhomedir.so/d' /etc/pam.d/sshd
sudo sed -i '1i account     sufficient  pam_permit.so\naccount     required    pam_unix.so\nsession     required    pam_mkhomedir.so' /etc/pam.d/sshd

# restart sshd
echo "🔄 Restarting sshd..."
sudo systemctl restart sshd
echo "✅ sshd restarted!"
