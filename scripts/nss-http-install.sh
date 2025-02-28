#!/bin/bash

set -e  # Exit immediately if a command fails

REPO_URL="https://github.com/gmjosack/nss_http.git"
TARGET_DIR="/usr/local/src/nss_http"
KAFRA_PATH=/usr/local/bin/kafra-linux-amd64
CA_PUBLIC_KEY=

echo "🌱 Cloning repository into $TARGET_DIR..."
# Ensure the target directory exists
sudo mkdir -p "$TARGET_DIR"
sudo git clone "$REPO_URL" "$TARGET_DIR"
cd "$TARGET_DIR"
echo "✅ Repository cloned!"

echo "🔑 Changing ownership of $TARGET_DIR to $USER..."
sudo chown -R "$USER":"$USER" "$TARGET_DIR"
cd libnss_http
echo "✅ Ownership changed!"

echo "📦 Installing required dependencies..."
sudo apt update
sudo apt install -y build-essential libcurl4-openssl-dev libjansson-dev
echo "✅ Dependencies installed!"

echo "⚙️ Building nss_http..."
make
echo "✅ Build complete!"

echo "🚀 Installing nss_http..."
sudo make install
echo "✅ Installation complete! 🎉"

cd ~

echo "🔧 Updating nsswitch.conf for custom module..."
sudo sed -i.bak 's/^passwd:.*/# &\npasswd:         files systemd http/' /etc/nsswitch.conf
sudo sed -i.bak 's/^group:.*/# &\ngroup:          files systemd http/' /etc/nsswitch.conf
sudo sed -i.bak 's/^shadow:.*/# &\nshadow:         files http/' /etc/nsswitch.conf
echo "✅ nsswitch.conf updated!"

echo "🔧 Updating sshd_config..."
# Remove existing occurrences of the settings to avoid duplicates
sudo sed -i '/^AllowUsers /d' /etc/ssh/sshd_config
sudo sed -i '/^PasswordAuthentication /d' /etc/ssh/sshd_config
sudo sed -i '/^AuthenticationMethods /d' /etc/ssh/sshd_config
sudo sed -i '/^ChallengeResponseAuthentication /d' /etc/ssh/sshd_config
sudo sed -i '/^TrustedUserCAKeys /d' /etc/ssh/sshd_config
# Append new settings at the end of the file
echo -e "AllowUsers *\nPasswordAuthentication no\nAuthenticationMethods publickey\nChallengeResponseAuthentication no\nTrustedUserCAKeys /etc/ssh/ca.pub" | sudo tee -a /etc/ssh/sshd_config
echo "✅ sshd_config updated!"

echo "🔑 Saving public key to /etc/ssh/ca.pub..."
echo "$CA_PUBLIC_KEY" | sudo tee /etc/ssh/ca.pub > /dev/null
sudo chown root:root /etc/ssh/ca.pub
sudo chmod 644 /etc/ssh/ca.pub
echo "✅ Public key saved!"

echo "🔧 Updating /etc/pam.d/sshd..."
# Adds support for finding users through custom NSS module
sudo sed -i '/pam_permit.so\|pam_unix.so\|pam_mkhomedir.so/d' /etc/pam.d/sshd
sudo sed -i '1i account     sufficient  pam_permit.so\naccount     required    pam_unix.so\nsession     required    pam_mkhomedir.so' /etc/pam.d/sshd
# Set up session processor
if ! grep -q 'pam_exec.so.*kafra' /etc/pam.d/sshd; then
    echo "session     required    pam_exec.so seteuid $KAFRA_PATH session process" | sudo tee -a /etc/pam.d/sshd
else
    echo "⚪ Session processor already exists in /etc/pam.d/sshd"
fi
echo "✅ /etc/pam.d/sshd updated!"

echo "🔄 Restarting sshd..."
sudo systemctl restart sshd
echo "✅ sshd restarted!"
